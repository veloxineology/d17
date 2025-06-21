"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { SoundEngine } from "@/lib/sound-engine"
import { Midi } from "@tonejs/midi"
import * as Tone from "tone"

export function usePiano() {
  const [soundEngine, setSoundEngine] = useState<SoundEngine | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [volume, setVolumeState] = useState(0.7)
  const [sustainPedal, setSustainPedalState] = useState(false)
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set())
  const [midiFile, setMidiFile] = useState<Midi | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const startTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number>()
  const scheduledEvents = useRef<Array<{ timeout: NodeJS.Timeout; type: string; note: string }>>([])

  // Initialize sound engine
  useEffect(() => {
    const engine = new SoundEngine({ volume })
    setSoundEngine(engine)

    engine.waitForLoad().then(() => {
      setIsLoading(false)
    })

    return () => {
      engine.dispose()
    }
  }, [])

  // Update volume
  const setVolume = useCallback(
    (newVolume: number) => {
      setVolumeState(newVolume)
      soundEngine?.setVolume(newVolume)
    },
    [soundEngine],
  )

  // Update sustain pedal
  const setSustainPedal = useCallback(
    (enabled: boolean) => {
      setSustainPedalState(enabled)
      soundEngine?.setSustainPedal(enabled)
    },
    [soundEngine],
  )

  // Press note
  const pressNote = useCallback(
    (note: string, velocity = 0.8) => {
      if (!soundEngine) {
        console.warn("Sound engine not available for note:", note)
        return
      }

      console.log("Pressing note:", note, "velocity:", velocity)
      soundEngine.pressNote(note, velocity)
      setActiveNotes((prev) => new Set(prev).add(note))
    },
    [soundEngine],
  )

  // Release note
  const releaseNote = useCallback(
    (note: string) => {
      if (!soundEngine) {
        console.warn("Sound engine not available for releasing note:", note)
        return
      }

      console.log("Releasing note:", note)
      soundEngine.releaseNote(note)
      setActiveNotes((prev) => {
        const newSet = new Set(prev)
        newSet.delete(note)
        return newSet
      })
    },
    [soundEngine],
  )

  // Load MIDI file
  const loadMidiFile = useCallback(async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const midi = new Midi(arrayBuffer)
      setMidiFile(midi)
      setDuration(midi.duration)
      setCurrentTime(0)
      console.log("MIDI file loaded:", midi)
      console.log("Tracks:", midi.tracks.length)
      console.log("Duration:", midi.duration)

      // Log track info with note details
      midi.tracks.forEach((track, index) => {
        console.log(`Track ${index}:`, track.notes?.length || 0, "notes")
        if (track.notes && track.notes.length > 0) {
          console.log(
            "First few notes:",
            track.notes.slice(0, 5).map((n) => ({
              name: n.name,
              octave: n.octave,
              time: n.time,
              duration: n.duration,
              velocity: n.velocity,
            })),
          )
        }
      })
    } catch (error) {
      console.error("Error loading MIDI file:", error)
    }
  }, [])

  // Clear all scheduled events
  const clearScheduledEvents = useCallback(() => {
    console.log("Clearing", scheduledEvents.current.length, "scheduled events")
    scheduledEvents.current.forEach(({ timeout, note, type }) => {
      clearTimeout(timeout)
      if (type === "noteOn") {
        // Release any notes that were scheduled to play
        releaseNote(note)
      }
    })
    scheduledEvents.current = []

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    setActiveNotes(new Set()) // Clear all active notes
  }, [releaseNote])

  // Update current time during playback
  const updateCurrentTime = useCallback(() => {
    if (isPlaying && startTimeRef.current > 0) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      setCurrentTime(elapsed)

      if (elapsed < duration) {
        animationFrameRef.current = requestAnimationFrame(updateCurrentTime)
      } else {
        // Playback finished
        console.log("Playback finished")
        setIsPlaying(false)
        setCurrentTime(0)
        clearScheduledEvents()
      }
    }
  }, [isPlaying, duration, clearScheduledEvents])

  // Play MIDI
  const playMidi = useCallback(async () => {
    if (!midiFile || !soundEngine || isPlaying) {
      console.warn("Cannot start playback:", { midiFile: !!midiFile, soundEngine: !!soundEngine, isPlaying })
      return
    }

    try {
      // Ensure Tone.js context is started
      if (Tone.context.state !== "running") {
        await Tone.start()
        console.log("Tone.js context started")
      }

      console.log("Starting MIDI playback...")

      // Clear any existing scheduled events
      clearScheduledEvents()

      // Collect all notes from all tracks
      const allNotes: Array<{
        time: number
        duration: number
        note: string
        velocity: number
      }> = []

      midiFile.tracks.forEach((track, trackIndex) => {
        if (track.notes && track.notes.length > 0) {
          console.log(`Processing track ${trackIndex} with ${track.notes.length} notes`)
          track.notes.forEach((note) => {
            // Convert MIDI note to our format
            const noteName = `${note.name}${note.octave}`
            allNotes.push({
              time: note.time,
              duration: note.duration,
              note: noteName,
              velocity: note.velocity,
            })
          })
        }
      })

      console.log("Total notes to play:", allNotes.length)
      if (allNotes.length === 0) {
        console.warn("No notes found in MIDI file!")
        return
      }

      // Sort notes by time
      allNotes.sort((a, b) => a.time - b.time)

      // Start playback timing
      startTimeRef.current = Date.now()
      setIsPlaying(true)
      setCurrentTime(0)

      // Schedule all note events
      let scheduledCount = 0
      allNotes.forEach((noteEvent, index) => {
        const startDelay = noteEvent.time * 1000 // Convert to milliseconds
        const endDelay = (noteEvent.time + noteEvent.duration) * 1000

        // Schedule note on
        const noteOnTimeout = setTimeout(() => {
          console.log(`🎵 Playing note: ${noteEvent.note} at time ${noteEvent.time}s (velocity: ${noteEvent.velocity})`)
          pressNote(noteEvent.note, noteEvent.velocity)
        }, startDelay)

        // Schedule note off
        const noteOffTimeout = setTimeout(
          () => {
            console.log(`🎵 Releasing note: ${noteEvent.note} after ${noteEvent.duration}s`)
            releaseNote(noteEvent.note)
          },
          Math.max(endDelay, startDelay + 100),
        ) // Minimum 100ms note duration

        // Store scheduled events
        scheduledEvents.current.push(
          { timeout: noteOnTimeout, type: "noteOn", note: noteEvent.note },
          { timeout: noteOffTimeout, type: "noteOff", note: noteEvent.note },
        )
        scheduledCount += 2
      })

      // Start time update loop
      updateCurrentTime()

      console.log(`✅ Scheduled ${scheduledCount} events for ${allNotes.length} notes`)
      console.log("First note should play at:", allNotes[0]?.time, "seconds")

      // Test the sound engine immediately
      console.log("🔊 Testing sound engine...")
      setTimeout(() => {
        pressNote("C4", 0.8)
        setTimeout(() => releaseNote("C4"), 500)
      }, 100)
    } catch (error) {
      console.error("Error playing MIDI:", error)
      setIsPlaying(false)
    }
  }, [midiFile, soundEngine, isPlaying, duration, pressNote, releaseNote, clearScheduledEvents, updateCurrentTime])

  // Pause MIDI
  const pauseMidi = useCallback(() => {
    if (isPlaying) {
      console.log("Pausing MIDI playback")
      clearScheduledEvents()
      setIsPlaying(false)
      startTimeRef.current = 0
    }
  }, [isPlaying, clearScheduledEvents])

  // Stop MIDI
  const stopMidi = useCallback(() => {
    console.log("Stopping MIDI playback")
    clearScheduledEvents()
    setIsPlaying(false)
    setCurrentTime(0)
    startTimeRef.current = 0
  }, [clearScheduledEvents])

  // Cleanup
  useEffect(() => {
    return () => {
      clearScheduledEvents()
    }
  }, [clearScheduledEvents])

  return {
    soundEngine,
    isLoading,
    volume,
    setVolume,
    sustainPedal,
    setSustainPedal,
    activeNotes,
    pressNote,
    releaseNote,
    loadMidiFile,
    playMidi,
    pauseMidi,
    stopMidi,
    midiFile,
    isPlaying,
    currentTime,
    duration,
  }
}
