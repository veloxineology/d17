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

  const playbackStartTime = useRef<number>(0)
  const playbackPauseTime = useRef<number>(0)
  const animationFrameRef = useRef<number>()
  const scheduledNotes = useRef<Map<string, NodeJS.Timeout>>(new Map())

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
      if (!soundEngine) return

      soundEngine.pressNote(note, velocity)
      setActiveNotes((prev) => new Set(prev).add(note))
    },
    [soundEngine],
  )

  // Release note
  const releaseNote = useCallback(
    (note: string) => {
      if (!soundEngine) return

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

  // Clear all scheduled notes
  const clearScheduledNotes = useCallback(() => {
    scheduledNotes.current.forEach((timeout) => {
      clearTimeout(timeout)
    })
    scheduledNotes.current.clear()
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    setActiveNotes(new Set()) // Clear all active notes
  }, [])

  // Update current time during playback
  const updateCurrentTime = useCallback(() => {
    if (isPlaying) {
      const elapsed = (performance.now() - playbackStartTime.current) / 1000
      const totalTime = playbackPauseTime.current + elapsed
      setCurrentTime(totalTime)

      if (totalTime < duration) {
        animationFrameRef.current = requestAnimationFrame(updateCurrentTime)
      } else {
        // Playback finished
        setIsPlaying(false)
        setCurrentTime(0)
        playbackPauseTime.current = 0
        clearScheduledNotes()
      }
    }
  }, [isPlaying, duration, clearScheduledNotes])

  // Play MIDI
  const playMidi = useCallback(async () => {
    if (!midiFile || !soundEngine || isPlaying) return

    try {
      // Ensure Tone.js context is started
      if (Tone.context.state !== "running") {
        await Tone.start()
        console.log("Tone.js context started")
      }

      console.log("Starting MIDI playback...")

      // Clear any existing scheduled notes
      clearScheduledNotes()

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

      // Start playback
      playbackStartTime.current = performance.now()
      setIsPlaying(true)

      // Schedule all note events
      let scheduledCount = 0
      allNotes.forEach((noteEvent, index) => {
        const startDelay = (noteEvent.time - playbackPauseTime.current) * 1000
        const endDelay = (noteEvent.time + noteEvent.duration - playbackPauseTime.current) * 1000

        if (startDelay >= 0) {
          // Schedule note on
          const noteOnTimeout = setTimeout(() => {
            console.log(`Playing note: ${noteEvent.note} at time ${noteEvent.time}`)
            pressNote(noteEvent.note, noteEvent.velocity)
          }, startDelay)

          // Schedule note off
          const noteOffTimeout = setTimeout(
            () => {
              console.log(`Releasing note: ${noteEvent.note}`)
              releaseNote(noteEvent.note)
            },
            Math.max(endDelay, startDelay + 100),
          ) // Minimum 100ms note duration

          // Store scheduled timeouts
          scheduledNotes.current.set(`on-${index}`, noteOnTimeout)
          scheduledNotes.current.set(`off-${index}`, noteOffTimeout)
          scheduledCount += 2
        }
      })

      // Start time update loop
      updateCurrentTime()

      console.log(`Scheduled ${scheduledCount} events for ${allNotes.length} notes`)
    } catch (error) {
      console.error("Error playing MIDI:", error)
      setIsPlaying(false)
    }
  }, [midiFile, soundEngine, isPlaying, duration, pressNote, releaseNote, clearScheduledNotes, updateCurrentTime])

  // Pause MIDI
  const pauseMidi = useCallback(() => {
    if (isPlaying) {
      console.log("Pausing MIDI playback")
      playbackPauseTime.current += (performance.now() - playbackStartTime.current) / 1000
      clearScheduledNotes()
      setIsPlaying(false)
    }
  }, [isPlaying, clearScheduledNotes])

  // Stop MIDI
  const stopMidi = useCallback(() => {
    console.log("Stopping MIDI playback")
    clearScheduledNotes()
    setIsPlaying(false)
    setCurrentTime(0)
    playbackPauseTime.current = 0
  }, [clearScheduledNotes])

  // Cleanup
  useEffect(() => {
    return () => {
      clearScheduledNotes()
    }
  }, [clearScheduledNotes])

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
