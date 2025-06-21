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
  const playbackOffset = useRef<number>(0) // For pause/resume
  const animationFrameRef = useRef<number>()
  const scheduledEvents = useRef<Array<{ timeout: NodeJS.Timeout; type: string; note: string; time: number }>>([])

  // Helper function to fix note format
  const fixNoteFormat = useCallback((noteName: string, octave: number): string => {
    // Handle cases where note name might have extra characters
    let cleanNoteName = noteName.replace(/[^A-G#b]/g, "") // Remove any non-note characters

    // Ensure we have a valid note name
    if (!cleanNoteName || cleanNoteName.length === 0) {
      console.warn("Invalid note name:", noteName, "using C as fallback")
      cleanNoteName = "C"
    }

    // Ensure octave is a single digit
    const cleanOctave = Math.max(0, Math.min(8, Math.floor(octave)))

    const result = `${cleanNoteName}${cleanOctave}`
    return result
  }, [])

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
      playbackOffset.current = 0
      console.log("MIDI file loaded:", midi)
      console.log("Tracks:", midi.tracks.length)
      console.log("Duration:", midi.duration)

      // Log track info with note details
      midi.tracks.forEach((track, index) => {
        console.log(`Track ${index}:`, track.notes?.length || 0, "notes")
        if (track.notes && track.notes.length > 0) {
          console.log(
            "First few notes:",
            track.notes.slice(0, 3).map((n) => ({
              name: n.name,
              octave: n.octave,
              time: n.time,
              duration: n.duration,
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

  // Update current time during playback - FIXED VERSION
  const updateCurrentTime = useCallback(() => {
    if (isPlaying && playbackStartTime.current > 0) {
      const elapsed = (Date.now() - playbackStartTime.current) / 1000
      const totalTime = playbackOffset.current + elapsed

      // Force update the current time state
      setCurrentTime(totalTime)

      if (totalTime < duration) {
        animationFrameRef.current = requestAnimationFrame(updateCurrentTime)
      } else {
        // Playback finished
        console.log("Playback finished")
        setIsPlaying(false)
        setCurrentTime(duration) // Set to end
        playbackOffset.current = 0
        clearScheduledEvents()
      }
    }
  }, [isPlaying, duration, clearScheduledEvents])

  // Play MIDI - FIXED VERSION
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

      console.log("Starting MIDI playback from time:", playbackOffset.current)

      // Clear any existing scheduled events
      clearScheduledEvents()

      // Collect all notes from all tracks
      const allNotes: Array<{
        time: number
        duration: number
        note: string
        velocity: number
        originalNote: string
      }> = []

      midiFile.tracks.forEach((track, trackIndex) => {
        if (track.notes && track.notes.length > 0) {
          track.notes.forEach((note) => {
            // Only include notes that haven't been played yet
            if (note.time >= playbackOffset.current) {
              const originalNoteName = `${note.name}${note.octave}`
              const fixedNoteName = fixNoteFormat(note.name, note.octave)

              allNotes.push({
                time: note.time,
                duration: note.duration,
                note: fixedNoteName,
                velocity: note.velocity,
                originalNote: originalNoteName,
              })
            }
          })
        }
      })

      console.log("Notes to play from current position:", allNotes.length)
      if (allNotes.length === 0) {
        console.warn("No more notes to play!")
        return
      }

      // Sort notes by time
      allNotes.sort((a, b) => a.time - b.time)

      // CRITICAL: Start playback timing BEFORE setting isPlaying
      playbackStartTime.current = Date.now()
      setIsPlaying(true)

      // Immediately start the time update loop
      animationFrameRef.current = requestAnimationFrame(updateCurrentTime)

      // Schedule all note events relative to current playback position
      let scheduledCount = 0
      allNotes.forEach((noteEvent, index) => {
        const startDelay = (noteEvent.time - playbackOffset.current) * 1000 // Convert to milliseconds
        const endDelay = (noteEvent.time + noteEvent.duration - playbackOffset.current) * 1000

        if (startDelay >= 0) {
          // Schedule note on
          const noteOnTimeout = setTimeout(() => {
            console.log(`🎵 Playing: ${noteEvent.note} at ${noteEvent.time.toFixed(2)}s`)
            pressNote(noteEvent.note, noteEvent.velocity)
          }, startDelay)

          // Schedule note off
          const noteOffTimeout = setTimeout(
            () => {
              releaseNote(noteEvent.note)
            },
            Math.max(endDelay, startDelay + 100),
          ) // Minimum 100ms note duration

          // Store scheduled events
          scheduledEvents.current.push(
            { timeout: noteOnTimeout, type: "noteOn", note: noteEvent.note, time: noteEvent.time },
            {
              timeout: noteOffTimeout,
              type: "noteOff",
              note: noteEvent.note,
              time: noteEvent.time + noteEvent.duration,
            },
          )
          scheduledCount += 2
        }
      })

      console.log(`✅ Scheduled ${scheduledCount} events for ${allNotes.length} notes`)
      console.log("Playback started at:", new Date(playbackStartTime.current).toISOString())
    } catch (error) {
      console.error("Error playing MIDI:", error)
      setIsPlaying(false)
    }
  }, [midiFile, soundEngine, isPlaying, pressNote, releaseNote, clearScheduledEvents, fixNoteFormat, updateCurrentTime])

  // Pause MIDI
  const pauseMidi = useCallback(() => {
    if (isPlaying) {
      console.log("Pausing MIDI playback at time:", currentTime)

      // Store current playback position
      playbackOffset.current = currentTime

      clearScheduledEvents()
      setIsPlaying(false)
      playbackStartTime.current = 0
    }
  }, [isPlaying, currentTime, clearScheduledEvents])

  // Stop MIDI
  const stopMidi = useCallback(() => {
    console.log("Stopping MIDI playback")
    clearScheduledEvents()
    setIsPlaying(false)
    setCurrentTime(0)
    playbackOffset.current = 0
    playbackStartTime.current = 0
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
