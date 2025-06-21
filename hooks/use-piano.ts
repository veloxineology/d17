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
  const playbackTimeouts = useRef<NodeJS.Timeout[]>([])
  const animationFrameRef = useRef<number>()

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

      // Log track info
      midi.tracks.forEach((track, index) => {
        console.log(`Track ${index}:`, track.notes?.length || 0, "notes")
      })
    } catch (error) {
      console.error("Error loading MIDI file:", error)
    }
  }, [])

  // Clear all timeouts
  const clearPlaybackTimeouts = useCallback(() => {
    playbackTimeouts.current.forEach((timeout) => clearTimeout(timeout))
    playbackTimeouts.current = []
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  // Update current time during playback
  const updateCurrentTime = useCallback(() => {
    if (isPlaying) {
      const elapsed = (Date.now() - playbackStartTime.current) / 1000
      setCurrentTime(elapsed)

      if (elapsed < duration) {
        animationFrameRef.current = requestAnimationFrame(updateCurrentTime)
      } else {
        // Playback finished
        setIsPlaying(false)
        setCurrentTime(0)
        setActiveNotes(new Set())
      }
    }
  }, [isPlaying, duration])

  // Play MIDI
  const playMidi = useCallback(() => {
    if (!midiFile || !soundEngine || isPlaying) return

    try {
      // Ensure Tone.js context is started
      if (Tone.context.state !== "running") {
        Tone.start()
      }

      // Clear any existing timeouts
      clearPlaybackTimeouts()

      // Collect all notes from all tracks
      const allNotes: Array<{
        time: number
        duration: number
        note: string
        velocity: number
      }> = []

      midiFile.tracks.forEach((track) => {
        if (track.notes) {
          track.notes.forEach((note) => {
            allNotes.push({
              time: note.time,
              duration: note.duration,
              note: `${note.name}${note.octave}`,
              velocity: note.velocity,
            })
          })
        }
      })

      console.log("Total notes to play:", allNotes.length)

      // Sort notes by time
      allNotes.sort((a, b) => a.time - b.time)

      // Schedule all note events
      playbackStartTime.current = Date.now()
      setIsPlaying(true)

      allNotes.forEach((noteEvent) => {
        // Schedule note on
        const noteOnTimeout = setTimeout(() => {
          pressNote(noteEvent.note, noteEvent.velocity)
        }, noteEvent.time * 1000)

        // Schedule note off
        const noteOffTimeout = setTimeout(
          () => {
            releaseNote(noteEvent.note)
          },
          (noteEvent.time + noteEvent.duration) * 1000,
        )

        playbackTimeouts.current.push(noteOnTimeout, noteOffTimeout)
      })

      // Start time update loop
      updateCurrentTime()

      // Auto-stop when finished
      const stopTimeout = setTimeout(
        () => {
          stopMidi()
        },
        duration * 1000 + 100,
      ) // Add small buffer

      playbackTimeouts.current.push(stopTimeout)
    } catch (error) {
      console.error("Error playing MIDI:", error)
      setIsPlaying(false)
    }
  }, [midiFile, soundEngine, isPlaying, duration, pressNote, releaseNote, clearPlaybackTimeouts, updateCurrentTime])

  // Pause MIDI
  const pauseMidi = useCallback(() => {
    if (isPlaying) {
      clearPlaybackTimeouts()
      setIsPlaying(false)
      setActiveNotes(new Set()) // Clear all active notes
    }
  }, [isPlaying, clearPlaybackTimeouts])

  // Stop MIDI
  const stopMidi = useCallback(() => {
    clearPlaybackTimeouts()
    setIsPlaying(false)
    setCurrentTime(0)
    setActiveNotes(new Set())
  }, [clearPlaybackTimeouts])

  // Cleanup
  useEffect(() => {
    return () => {
      clearPlaybackTimeouts()
    }
  }, [clearPlaybackTimeouts])

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
