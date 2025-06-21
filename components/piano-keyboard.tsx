"use client"

import type React from "react"

import { useEffect, useCallback, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface PianoKeyboardProps {
  activeNotes: Set<string>
  onNotePress: (note: string, velocity?: number) => void
  onNoteRelease: (note: string) => void
  baseOctave?: number
}

const WHITE_KEYS = ["C", "D", "E", "F", "G", "A", "B"]
// Update the BLACK_KEYS array to use 's' instead of '#'
const BLACK_KEYS = ["Cs", "Ds", null, "Fs", "Gs", "As", null] // null for gaps

// Update the KEYBOARD_MAP to use 's' format
const KEYBOARD_MAP: { [key: string]: string } = {
  // White keys (bottom row)
  a: "C",
  s: "D",
  d: "E",
  f: "F",
  g: "G",
  h: "A",
  j: "B",
  k: "C",
  l: "D",
  ";": "E",
  // Black keys (top row) - using 's' format to match your samples
  w: "Cs",
  e: "Ds",
  t: "Fs",
  y: "Gs",
  u: "As",
  o: "Cs",
  p: "Ds",
}

export default function PianoKeyboard({ activeNotes, onNotePress, onNoteRelease, baseOctave = 4 }: PianoKeyboardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)

  const getNoteName = (key: string, octave: number) => `${key}${octave}`

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.repeat) return

      const key = event.key.toLowerCase()
      if (key === " ") {
        event.preventDefault()
        return
      }

      const noteKey = KEYBOARD_MAP[key]
      if (noteKey) {
        event.preventDefault()
        const octave = key.charCodeAt(0) > 106 ? baseOctave + 1 : baseOctave // j, k, l, ; are higher octave
        const noteName = getNoteName(noteKey, octave)
        onNotePress(noteName, 0.8)
      }
    },
    [baseOctave, onNotePress],
  )

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const noteKey = KEYBOARD_MAP[key]
      if (noteKey) {
        event.preventDefault()
        const octave = key.charCodeAt(0) > 106 ? baseOctave + 1 : baseOctave
        const noteName = getNoteName(noteKey, octave)
        onNoteRelease(noteName)
      }
    },
    [baseOctave, onNoteRelease],
  )

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (containerRef.current) {
        event.preventDefault()
        const newScrollPosition = Math.max(
          0,
          Math.min(scrollPosition + event.deltaX, containerRef.current.scrollWidth - containerRef.current.clientWidth),
        )
        setScrollPosition(newScrollPosition)
        containerRef.current.scrollLeft = newScrollPosition
      }
    },
    [scrollPosition],
  )

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === containerRef.current) {
        setIsDragging(true)
        setDragStart(event.clientX + scrollPosition)
      }
    },
    [scrollPosition],
  )

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (isDragging && containerRef.current) {
        const newScrollPosition = Math.max(
          0,
          Math.min(dragStart - event.clientX, containerRef.current.scrollWidth - containerRef.current.clientWidth),
        )
        setScrollPosition(newScrollPosition)
        containerRef.current.scrollLeft = newScrollPosition
      }
    },
    [isDragging, dragStart],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    const container = containerRef.current
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false })
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      if (container) {
        container.removeEventListener("wheel", handleWheel)
      }
    }
  }, [handleKeyDown, handleKeyUp, handleWheel])

  const renderOctave = (octave: number) => (
    <div key={octave} className="relative flex flex-shrink-0">
      {/* White Keys */}
      {WHITE_KEYS.map((key, index) => {
        const noteName = getNoteName(key, octave)
        const isActive = activeNotes.has(noteName)

        return (
          <button
            key={`${key}-${octave}`}
            className={cn(
              "relative w-12 h-48 bg-white border border-gray-300 rounded-b-lg shadow-lg transition-all duration-75",
              "hover:bg-gray-50 active:bg-gray-200",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              isActive && "bg-blue-200 shadow-inner",
            )}
            onMouseDown={() => onNotePress(noteName, 0.8)}
            onMouseUp={() => onNoteRelease(noteName)}
            onMouseLeave={() => onNoteRelease(noteName)}
            onTouchStart={(e) => {
              e.preventDefault()
              onNotePress(noteName, 0.8)
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              onNoteRelease(noteName)
            }}
          >
            <span className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 font-medium">
              {key}
              {octave}
            </span>
          </button>
        )
      })}

      {/* Black Keys */}
      <div className="absolute top-0 flex">
        {BLACK_KEYS.map((key, index) => {
          if (!key) {
            return <div key={`gap-${index}`} className="w-12" />
          }

          const noteName = getNoteName(key, octave)
          const isActive = activeNotes.has(noteName)

          return (
            <button
              key={`${key}-${octave}`}
              className={cn(
                "relative w-8 h-32 bg-gray-900 rounded-b-lg shadow-lg transition-all duration-75 -ml-4 -mr-4 z-10",
                "hover:bg-gray-800 active:bg-gray-700",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                isActive && "bg-blue-600 shadow-inner",
              )}
              style={{ marginLeft: index === 0 ? "16px" : "-16px", marginRight: "-16px" }}
              onMouseDown={() => onNotePress(noteName, 0.8)}
              onMouseUp={() => onNoteRelease(noteName)}
              onMouseLeave={() => onNoteRelease(noteName)}
              onTouchStart={(e) => {
                e.preventDefault()
                onNotePress(noteName, 0.8)
              }}
              onTouchEnd={(e) => {
                e.preventDefault()
                onNoteRelease(noteName)
              }}
            >
              <span className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-white font-medium">
                {key}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="text-center text-sm text-gray-600">
        Scroll horizontally to see more octaves • Drag to pan • Mouse wheel to scroll
      </div>
      <div
        ref={containerRef}
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 p-4 bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg shadow-inner cursor-grab"
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="flex space-x-1 min-w-max">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((octave) => renderOctave(octave))}
        </div>
      </div>
    </div>
  )
}
