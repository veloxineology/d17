"use client"

import { useState, useEffect } from "react"
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
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl transition-all duration-300">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
              <Music className="w-6 h-6" />
              Sample MIDIs by Kaushik
            </h2>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-gray-600 dark:text-gray-300 text-sm">Scanning for MIDI files...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl transition-all duration-300 hover:shadow-2xl">
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            <Music className="w-6 h-6" />
            Sample MIDIs by Kaushik
          </h2>
          <Button
            onClick={discoverMidiFiles}
            variant="outline"
            size="sm"
            className="bg-white/50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 rounded-xl transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {samples.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-600 dark:text-gray-300 mb-6 text-lg">No sample MIDIs found</div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 max-w-2xl mx-auto">
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="font-semibold text-gray-900 dark:text-white">Setup Instructions:</div>
                <div className="space-y-2 text-left">
                  <div>
                    1. Create folder:{" "}
                    <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-xs">public/midi-samples/</code>
                  </div>
                  <div>2. Add your MIDI files there</div>
                  <div>
                    3. Create a{" "}
                    <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-xs">manifest.json</code> file:
                  </div>
                  <div className="bg-gray-800 dark:bg-gray-900 p-4 rounded-xl text-xs font-mono text-green-400 overflow-x-auto">
                    {`{
  "files": [
    "your-song.mid"
  ]
}`}
                  </div>
                  <div>4. Click Refresh</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="text-sm text-gray-600 dark:text-gray-300 text-center">
              Found {samples.length} MIDI file{samples.length !== 1 ? "s" : ""}. Tap any sample to load and play:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {samples.map((sample) => {
                const isCurrentSample = currentMidiName === sample.name
                const isPlaying = isCurrentSample && isCurrentlyPlaying

                return (
                  <Button
                    key={sample.name}
                    onClick={() => loadSample(sample)}
                    variant="outline"
                    className={`
                      h-auto p-6 flex flex-col items-start gap-3 text-left rounded-2xl transition-all duration-300 border-2
                      ${
                        isCurrentSample
                          ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-500 shadow-lg scale-105"
                          : "bg-white/50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 hover:shadow-lg hover:scale-105"
                      }
                      ${isPlaying ? "animate-pulse" : ""}
                    `}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Play className={`w-5 h-5 ${isPlaying ? "text-green-300" : ""}`} />
                      <span className="font-semibold truncate flex-1">{sample.displayName}</span>
                    </div>
                    <div className="text-xs opacity-75 truncate w-full">{sample.name}</div>
                    {isCurrentSample && (
                      <div className="text-xs font-medium">{isPlaying ? "♪ Playing" : "● Loaded"}</div>
                    )}
                  </Button>
                )
              })}
            </div>

            {error && (
              <div className="text-red-500 text-sm mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <div className="text-xs text-gray-500 dark:text-gray-400 mt-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl text-center">
              <strong>Tip:</strong> Add more MIDI files to the folder, update manifest.json, and tap Refresh.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
