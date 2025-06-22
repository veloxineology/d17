"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { SoundEngine } from "@/lib/sound-engine"
import { Midi } from "@tonejs/midi"
import * as Tone from "tone"

export function usePiano() {
  const [soundEngine, setSoundEngine] = useState<SoundEngine | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [volume, setVolumeState] = useState(0.85) // Increased default volume to 85%
  const [sustainPedal, setSustainPedalState] = useState(false)
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set())
  const [midiFile, setMidiFile] = useState<Midi | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const playbackStartTime = useRef<number>(0)
  const playbackOffset = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout>()
  const scheduledEvents = useRef<Array<{ timeout: NodeJS.Timeout; type: string; note: string; time: number }>>([])

  // Helper function to fix note format
  const fixNoteFormat = useCallback((noteName: string, octave: number): string => {
    let cleanNoteName = noteName.replace(/[^A-G#b]/g, "")
    if (!cleanNoteName || cleanNoteName.length === 0) {
      console.warn("Invalid note name:", noteName, "using C as fallback")
      cleanNoteName = "C"
    }
    const cleanOctave = Math.max(0, Math.min(8, Math.floor(octave)))
    return `${cleanNoteName}${cleanOctave}`
  }, [])

  // Initialize sound engine with higher default volume
  useEffect(() => {
    const engine = new SoundEngine({ volume: 0.85 }) // Start with 85% volume
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

  // Press note with higher default velocity
  const pressNote = useCallback(
    (note: string, velocity = 0.9) => {
      // Increased default velocity from 0.8 to 0.9
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
      playbackOffset.current = 0
      console.log("MIDI file loaded:", midi)
      console.log("Duration:", midi.duration)
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
        releaseNote(note)
      }
    })
    scheduledEvents.current = []

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }

    setActiveNotes(new Set())
  }, [releaseNote])

  // Time tracking with setInterval
  const startTimeTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      if (playbackStartTime.current > 0) {
        const elapsed = (Date.now() - playbackStartTime.current) / 1000
        const totalTime = playbackOffset.current + elapsed

        console.log(
          `Time update: elapsed=${elapsed.toFixed(2)}, totalTime=${totalTime.toFixed(2)}, duration=${duration.toFixed(2)}`,
        )

        setCurrentTime(totalTime)

        if (totalTime >= duration) {
          console.log("Playback finished")
          setIsPlaying(false)
          setCurrentTime(duration)
          playbackOffset.current = 0
          clearScheduledEvents()
        }
      }
    }, 50)
  }, [duration, clearScheduledEvents])

  // Play MIDI with boosted velocity
  const playMidi = useCallback(async () => {
    if (!midiFile || !soundEngine || isPlaying) {
      console.warn("Cannot start playback:", { midiFile: !!midiFile, soundEngine: !!soundEngine, isPlaying })
      return
    }

    try {
      if (Tone.context.state !== "running") {
        await Tone.start()
        console.log("Tone.js context started")
      }

      console.log("🎵 Starting MIDI playback from time:", playbackOffset.current)

      clearScheduledEvents()

      const allNotes: Array<{
        time: number
        duration: number
        note: string
        velocity: number
      }> = []

      midiFile.tracks.forEach((track) => {
        if (track.notes && track.notes.length > 0) {
          track.notes.forEach((note) => {
            if (note.time >= playbackOffset.current) {
              const fixedNoteName = fixNoteFormat(note.name, note.octave)
              allNotes.push({
                time: note.time,
                duration: note.duration,
                note: fixedNoteName,
                velocity: Math.max(0.7, note.velocity * 1.2), // Boost MIDI velocity by 20% with minimum of 0.7
              })
            }
          })
        }
      })

      console.log("Notes to play:", allNotes.length)
      if (allNotes.length === 0) {
        console.warn("No more notes to play!")
        return
      }

      allNotes.sort((a, b) => a.time - b.time)

      playbackStartTime.current = Date.now()
      setIsPlaying(true)
      startTimeTracking()

      console.log("✅ Playback started with boosted velocities")

      // Schedule note events with boosted velocity
      let scheduledCount = 0
      allNotes.forEach((noteEvent) => {
        const startDelay = (noteEvent.time - playbackOffset.current) * 1000
        const endDelay = (noteEvent.time + noteEvent.duration - playbackOffset.current) * 1000

        if (startDelay >= 0) {
          const noteOnTimeout = setTimeout(() => {
            console.log(
              `🎵 Playing: ${noteEvent.note} at ${noteEvent.time.toFixed(2)}s with velocity ${noteEvent.velocity.toFixed(2)}`,
            )
            pressNote(noteEvent.note, noteEvent.velocity)
          }, startDelay)

          const noteOffTimeout = setTimeout(
            () => {
              releaseNote(noteEvent.note)
            },
            Math.max(endDelay, startDelay + 100),
          )

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

      console.log(`✅ Scheduled ${scheduledCount} events`)
    } catch (error) {
      console.error("Error playing MIDI:", error)
      setIsPlaying(false)
    }
  }, [
    midiFile,
    soundEngine,
    isPlaying,
    duration,
    pressNote,
    releaseNote,
    clearScheduledEvents,
    fixNoteFormat,
    startTimeTracking,
  ])

  // Pause MIDI
  const pauseMidi = useCallback(() => {
    if (isPlaying) {
      console.log("⏸️ Pausing MIDI playback at time:", currentTime)
      playbackOffset.current = currentTime
      clearScheduledEvents()
      setIsPlaying(false)
      playbackStartTime.current = 0
    }
  }, [isPlaying, currentTime, clearScheduledEvents])

  // Stop MIDI
  const stopMidi = useCallback(() => {
    console.log("⏹️ Stopping MIDI playback")
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
