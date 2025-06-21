"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Music } from "lucide-react"

interface SampleMidiProps {
  onLoadMidi: (file: File) => void
  isCurrentlyPlaying: boolean
  currentMidiName?: string
}

interface MidiSample {
  name: string
  displayName: string
  path: string
}

export default function SampleMidis({ onLoadMidi, isCurrentlyPlaying, currentMidiName }: SampleMidiProps) {
  const [samples, setSamples] = useState<MidiSample[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Function to convert filename to display name
  const formatDisplayName = (filename: string): string => {
    return filename
      .replace(/\.(mid|midi)$/i, "") // Remove extension
      .replace(/[-_]/g, " ") // Replace hyphens and underscores with spaces
      .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize first letter of each word
  }

  // Load available MIDI samples
  useEffect(() => {
    const loadSamples = async () => {
      try {
        setLoading(true)

        // List of MIDI files you'll upload to the samples folder
        // You can expand this list as you add more files
        const sampleFiles = [
          "canon-in-d.mid",
          "fur-elise.mid",
          "moonlight-sonata.mid",
          "claire-de-lune.mid",
          "turkish-march.mid",
          "minute-waltz.mid",
          "prelude-in-c.mid",
          "gymnopédie-no1.mid",
        ]

        const availableSamples: MidiSample[] = []

        // Check which files actually exist
        for (const filename of sampleFiles) {
          try {
            const response = await fetch(`/midi-samples/${filename}`, { method: "HEAD" })
            if (response.ok) {
              availableSamples.push({
                name: filename,
                displayName: formatDisplayName(filename),
                path: `/midi-samples/${filename}`,
              })
            }
          } catch (err) {
            // File doesn't exist, skip it
            console.log(`Sample ${filename} not found, skipping`)
          }
        }

        setSamples(availableSamples)
        setError(null)
      } catch (err) {
        console.error("Error loading MIDI samples:", err)
        setError("Failed to load MIDI samples")
      } finally {
        setLoading(false)
      }
    }

    loadSamples()
  }, [])

  // Load a sample MIDI file
  const loadSample = async (sample: MidiSample) => {
    try {
      const response = await fetch(sample.path)
      if (!response.ok) {
        throw new Error(`Failed to load ${sample.name}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const file = new File([arrayBuffer], sample.name, { type: "audio/midi" })

      onLoadMidi(file)
    } catch (err) {
      console.error("Error loading sample:", err)
      setError(`Failed to load ${sample.displayName}`)
    }
  }

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Music className="w-5 h-5" />
            Sample MIDIs by Kaushik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-slate-400">Loading sample MIDIs...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && samples.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Music className="w-5 h-5" />
            Sample MIDIs by Kaushik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-slate-400 mb-4">No sample MIDIs found</div>
            <div className="text-sm text-slate-500 bg-slate-700/50 rounded-lg p-4 max-w-md mx-auto">
              <strong>Setup Instructions:</strong>
              <br />
              Create a folder called{" "}
              <code className="bg-slate-600 px-2 py-1 rounded text-slate-200">public/midi-samples/</code>
              <br />
              Add your MIDI files there (e.g., canon-in-d.mid, fur-elise.mid, etc.)
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Music className="w-5 h-5" />
          Sample MIDIs by Kaushik
        </CardTitle>
      </CardHeader>
      <CardContent>
        {samples.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-slate-400 mb-4">No sample MIDIs available</div>
            <div className="text-sm text-slate-500">
              Add MIDI files to the <code className="bg-slate-700 px-2 py-1 rounded">public/midi-samples/</code> folder
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-slate-400 mb-4">Click any sample below to load and play it:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {samples.map((sample) => {
                const isCurrentSample = currentMidiName === sample.name
                const isPlaying = isCurrentSample && isCurrentlyPlaying

                return (
                  <Button
                    key={sample.name}
                    onClick={() => loadSample(sample)}
                    variant={isCurrentSample ? "default" : "outline"}
                    className={`
                      h-auto p-4 flex flex-col items-start gap-2 text-left
                      ${
                        isCurrentSample
                          ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
                          : "bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600"
                      }
                      ${isPlaying ? "animate-pulse" : ""}
                    `}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Play className={`w-4 h-4 ${isPlaying ? "text-green-400" : ""}`} />
                      <span className="font-medium truncate flex-1">{sample.displayName}</span>
                    </div>
                    <div className="text-xs opacity-75 truncate w-full">{sample.name}</div>
                    {isCurrentSample && (
                      <div className="text-xs text-blue-200 font-medium">{isPlaying ? "♪ Playing" : "● Loaded"}</div>
                    )}
                  </Button>
                )
              })}
            </div>

            {error && (
              <div className="text-red-400 text-sm mt-4 p-3 bg-red-900/20 rounded-lg border border-red-800">
                {error}
              </div>
            )}

            <div className="text-xs text-slate-500 mt-4 p-3 bg-slate-700/30 rounded-lg">
              <strong>Note:</strong> These are curated classical pieces perfect for testing the piano app. Each file is
              optimized for the best audio experience with your Salamander Grand Piano samples.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
