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

      // Try to fetch a directory listing or manifest file
      // Since we can't directly list directory contents in the browser,
      // we'll try a different approach - attempt to fetch common file extensions
      const availableSamples: MidiSample[] = []

      // We'll try to fetch files and see which ones exist
      // This is a workaround since we can't list directory contents directly

      // First, try to fetch a manifest file if you create one
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

      // If no manifest, we can't automatically discover files
      // The user will need to create a manifest.json file
      if (availableSamples.length === 0) {
        console.log("No manifest.json found or no files listed in manifest")
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
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Music className="w-5 h-5" />
            Sample MIDIs by Kaushik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-slate-400">Scanning for MIDI files...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Sample MIDIs by Kaushik
          </div>
          <Button
            onClick={discoverMidiFiles}
            variant="outline"
            size="sm"
            className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {samples.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-slate-400 mb-4">No sample MIDIs found</div>
            <div className="text-sm text-slate-500 bg-slate-700/50 rounded-lg p-4 max-w-2xl mx-auto space-y-3">
              <div>
                <strong>Setup Instructions:</strong>
              </div>
              <div>
                1. Create folder:{" "}
                <code className="bg-slate-600 px-2 py-1 rounded text-slate-200">public/midi-samples/</code>
              </div>
              <div>2. Add your MIDI files there (e.g., song1.mid, piece2.midi, etc.)</div>
              <div>
                3. Create a <code className="bg-slate-600 px-2 py-1 rounded text-slate-200">manifest.json</code> file:
              </div>
              <div className="bg-slate-800 p-3 rounded text-xs font-mono text-left">
                {`{
  "files": [
    "your-song-1.mid",
    "your-song-2.midi",
    "another-piece.mid"
  ]
}`}
              </div>
              <div>
                4. Click the <strong>Refresh</strong> button above
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-slate-400 mb-4">
              Found {samples.length} MIDI file{samples.length !== 1 ? "s" : ""}. Click any sample below to load and play
              it:
            </div>
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
              <strong>Tip:</strong> Add more MIDI files to the <code>public/midi-samples/</code> folder, update the
              manifest.json, and click Refresh to see them here.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
