"use client"

import { useEffect, useRef } from "react"

interface MidiPlayerProps {
  midiFile: any
  currentTime: number
  isPlaying: boolean
  activeNotes: Set<string>
}

// Helper function to convert MIDI note number to note name
function midiToNoteName(midiNumber: number): string {
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
  const octave = Math.floor(midiNumber / 12) - 1
  const noteIndex = midiNumber % 12
  return `${noteNames[noteIndex]}${octave}`
}

export default function MidiPlayer({ midiFile, currentTime, isPlaying, activeNotes }: MidiPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !midiFile) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const width = rect.width
    const height = rect.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw background
    ctx.fillStyle = "#1e293b"
    ctx.fillRect(0, 0, width, height)

    // Configuration for better visualization
    const noteHeight = 4
    const pixelsPerSecond = 80 // Slower scroll for better visibility
    const viewportTime = width / pixelsPerSecond
    const startTime = Math.max(0, currentTime - viewportTime * 0.2) // Show more future context
    const endTime = startTime + viewportTime

    // Draw grid lines
    ctx.strokeStyle = "#334155"
    ctx.lineWidth = 0.5

    // Vertical lines (time) - every 2 seconds
    for (let t = Math.floor(startTime); t <= Math.ceil(endTime); t += 2) {
      const x = (t - startTime) * pixelsPerSecond
      if (x >= 0 && x <= width) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
    }

    // Horizontal lines (note ranges)
    const noteRanges = [21, 36, 48, 60, 72, 84, 96, 108] // Piano ranges (A0 to C8)
    noteRanges.forEach((midiNote) => {
      const y = height - ((midiNote - 21) / (108 - 21)) * height
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    })

    // Collect all notes from all tracks
    const allNotes: Array<{
      time: number
      duration: number
      midi: number
      name: string
      octave: number
      velocity: number
    }> = []

    if (midiFile.tracks) {
      midiFile.tracks.forEach((track: any) => {
        if (track.notes) {
          track.notes.forEach((note: any) => {
            allNotes.push({
              time: note.time,
              duration: note.duration,
              midi: note.midi,
              name: note.name,
              octave: note.octave,
              velocity: note.velocity,
            })
          })
        }
      })
    }

    // Draw notes
    allNotes.forEach((note) => {
      const noteStartTime = note.time
      const noteEndTime = note.time + note.duration

      // Only draw notes that are visible in the current viewport
      if (noteEndTime >= startTime && noteStartTime <= endTime) {
        const startX = (noteStartTime - startTime) * pixelsPerSecond
        const endX = (noteEndTime - startTime) * pixelsPerSecond
        const y = height - ((note.midi - 21) / (108 - 21)) * height // Map MIDI note to Y position
        const noteWidth = Math.max(3, endX - startX)

        // Fix note name format for comparison
        const noteName = `${note.name.replace(/[^A-G#b]/g, "")}${note.octave}`
        const isActive = activeNotes.has(noteName)
        const isCurrentlyPlaying = currentTime >= noteStartTime && currentTime <= noteEndTime && isPlaying

        // Choose color based on state
        let color = "#64748b" // Default gray
        if (isCurrentlyPlaying) {
          color = "#ef4444" // Red for currently playing
        } else if (isActive) {
          color = "#3b82f6" // Blue for active
        } else if (note.velocity > 0.7) {
          color = "#10b981" // Green for loud notes
        } else if (note.velocity > 0.4) {
          color = "#f59e0b" // Yellow for medium notes
        }

        // Draw note with rounded corners
        ctx.fillStyle = color
        ctx.fillRect(
          Math.max(0, startX),
          y - noteHeight,
          Math.min(noteWidth, width - Math.max(0, startX)),
          noteHeight * 2,
        )

        // Draw note border for better visibility
        ctx.strokeStyle = isCurrentlyPlaying ? "#ffffff" : "#1e293b"
        ctx.lineWidth = isCurrentlyPlaying ? 1 : 0.5
        ctx.strokeRect(
          Math.max(0, startX),
          y - noteHeight,
          Math.min(noteWidth, width - Math.max(0, startX)),
          noteHeight * 2,
        )
      }
    })

    // Draw current time line (playback needle)
    const currentX = (currentTime - startTime) * pixelsPerSecond
    if (currentX >= 0 && currentX <= width) {
      // Draw a more prominent playback line
      ctx.strokeStyle = "#ef4444"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(currentX, 0)
      ctx.lineTo(currentX, height)
      ctx.stroke()

      // Add a small triangle at the top
      ctx.fillStyle = "#ef4444"
      ctx.beginPath()
      ctx.moveTo(currentX - 5, 0)
      ctx.lineTo(currentX + 5, 0)
      ctx.lineTo(currentX, 10)
      ctx.closePath()
      ctx.fill()
    }

    // Draw time labels
    ctx.fillStyle = "#e2e8f0"
    ctx.font = "12px monospace"
    ctx.textAlign = "center"

    for (let t = Math.floor(startTime); t <= Math.ceil(endTime); t += 5) {
      const x = (t - startTime) * pixelsPerSecond
      if (x >= 30 && x <= width - 30) {
        const minutes = Math.floor(t / 60)
        const seconds = Math.floor(t % 60)
        ctx.fillText(`${minutes}:${seconds.toString().padStart(2, "0")}`, x, 20)
      }
    }

    // Draw current time indicator
    ctx.fillStyle = "#ef4444"
    ctx.font = "14px monospace"
    ctx.textAlign = "left"
    const currentMinutes = Math.floor(currentTime / 60)
    const currentSeconds = Math.floor(currentTime % 60)
    ctx.fillText(`${currentMinutes}:${currentSeconds.toString().padStart(2, "0")}`, 10, height - 10)

    // Draw note range labels using our helper function
    ctx.textAlign = "left"
    ctx.font = "10px monospace"
    ctx.fillStyle = "#94a3b8"
    noteRanges.forEach((midiNote) => {
      const y = height - ((midiNote - 21) / (108 - 21)) * height
      const noteName = midiToNoteName(midiNote)
      ctx.fillText(noteName, 5, y - 5)
    })
  }, [midiFile, currentTime, activeNotes, isPlaying])

  if (!midiFile) {
    return (
      <div className="w-full h-48 bg-slate-700 rounded-lg flex items-center justify-center">
        <p className="text-slate-400">Load a MIDI file to see visualization</p>
      </div>
    )
  }

  return (
    <div className="w-full h-48 bg-slate-700 rounded-lg overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" style={{ width: "100%", height: "100%" }} />
    </div>
  )
}
