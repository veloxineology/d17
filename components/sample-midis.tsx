"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Music, RefreshCw } from "lucide-react"

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

  // Discover MIDI files in the samples folder
  const discoverMidiFiles = async () => {
    try {
      setLoading(true)
      setError(null)

      const availableSamples: MidiSample[] = []

      // Try to fetch a manifest file
      try {
        const manifestResponse = await fetch("/midi-samples/manifest.json")
        if (manifestResponse.ok) {
          const manifest = await manifestResponse.json()
          if (Array.isArray(manifest.files)) {
            for (const filename of manifest.files) {
              if (filename.match(/\.(mid|midi)$/i)) {
                try {
                  const testResponse = await fetch(`/midi-samples/${filename}`, { method: "HEAD" })
                  if (testResponse.ok) {
                    availableSamples.push({
                      name: filename,
                      displayName: formatDisplayName(filename),
                      path: `/midi-samples/${filename}`,
                    })
                  }
                } catch {
                  // File doesn't exist, skip
                }
              }
            }
          }
        }
      } catch {
        // No manifest file, that's okay
      }

      setSamples(availableSamples)
    } catch (err) {
      console.error("Error discovering MIDI files:", err)
      setError("Failed to load MIDI samples")
    } finally {
      setLoading(false)
    }
  }

  // Load samples on component mount
  useEffect(() => {
    discoverMidiFiles()
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
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Music className="w-5 h-5" />
            Sample MIDIs by Kaushik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <div className="text-slate-400 text-sm">Scanning for MIDI files...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2 justify-between text-lg">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Sample MIDIs by Kaushik
          </div>
          <Button
            onClick={discoverMidiFiles}
            variant="outline"
            size="sm"
            className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600 text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {samples.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-slate-400 mb-4 text-sm">No sample MIDIs found</div>
            <details className="text-xs sm:text-sm text-slate-500 bg-slate-700/50 rounded-lg p-4 max-w-2xl mx-auto">
              <summary className="cursor-pointer font-medium mb-3">Setup Instructions</summary>
              <div className="space-y-2 text-left">
                <div>
                  1. Create folder:{" "}
                  <code className="bg-slate-600 px-2 py-1 rounded text-slate-200 text-xs">public/midi-samples/</code>
                </div>
                <div>2. Add your MIDI files there</div>
                <div>
                  3. Create a{" "}
                  <code className="bg-slate-600 px-2 py-1 rounded text-slate-200 text-xs">manifest.json</code> file:
                </div>
                <div className="bg-slate-800 p-3 rounded text-xs font-mono text-left overflow-x-auto">
                  {`{
  "files": [
    "your-song.mid"
  ]
}`}
                </div>
                <div>4. Click Refresh</div>
              </div>
            </details>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs sm:text-sm text-slate-400 mb-4">
              Found {samples.length} MIDI file{samples.length !== 1 ? "s" : ""}. Tap any sample to load and play:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {samples.map((sample) => {
                const isCurrentSample = currentMidiName === sample.name
                const isPlaying = isCurrentSample && isCurrentlyPlaying

                return (
                  <Button
                    key={sample.name}
                    onClick={() => loadSample(sample)}
                    variant={isCurrentSample ? "default" : "outline"}
                    className={`
                      h-auto p-3 sm:p-4 flex flex-col items-start gap-2 text-left
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
                      <span className="font-medium truncate flex-1 text-sm">{sample.displayName}</span>
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
              <strong>Tip:</strong> Add more MIDI files to the folder, update manifest.json, and tap Refresh.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
