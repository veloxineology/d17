"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Pause, Square, Upload, Volume2, Settings, TestTube } from "lucide-react"
import PianoKeyboard from "@/components/piano-keyboard"
import MidiPlayer from "@/components/midi-player"
import SampleMidis from "@/components/sample-midis"
import { usePiano } from "@/hooks/use-piano"

export default function PianoApp() {
  const {
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
  } = usePiano()

  const [selectedOctave, setSelectedOctave] = useState(4)
  const [currentMidiName, setCurrentMidiName] = useState<string>()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && (file.name.endsWith(".mid") || file.name.endsWith(".midi"))) {
      loadMidiFile(file)
      setCurrentMidiName(file.name)
    }
  }

  const handleSampleLoad = (file: File) => {
    loadMidiFile(file)
    setCurrentMidiName(file.name)
  }

  const testSound = () => {
    console.log("Testing sound...")
    pressNote("C4", 0.8)
    setTimeout(() => {
      releaseNote("C4")
      pressNote("E4", 0.8)
      setTimeout(() => {
        releaseNote("E4")
        pressNote("G4", 0.8)
        setTimeout(() => releaseNote("G4"), 500)
      }, 300)
    }, 300)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading piano samples...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 flex flex-col">
      <div className="max-w-7xl mx-auto space-y-6 flex-1">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">D17</h1>
          <p className="text-slate-300">Where Notes Fall in Love</p>
          <div className="text-sm text-slate-400 bg-slate-800/50 rounded-lg p-3 max-w-2xl mx-auto">
            <strong>Audio Setup:</strong> Place your Salamander Grand Piano samples in{" "}
            <code className="bg-slate-700 px-2 py-1 rounded text-slate-200">public/audio/salamander/</code>
            <br />
            Files should be named like: A0.mp3, A0.ogg, C4.mp3, C4.ogg, Ds4.mp3, Fs4.ogg, etc.
            <br />
            <span className="text-xs text-slate-500">
              Note: Sharp notes use 's' (Ds = D#, Fs = F#). Both .mp3 and .ogg formats supported.
            </span>
          </div>
        </div>

        {/* Main Controls */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Volume Control */}
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Volume
                </Label>
                <Slider
                  value={[volume * 100]}
                  onValueChange={(value) => setVolume(value[0] / 100)}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Octave Selection */}
              <div className="space-y-2">
                <Label className="text-white">Base Octave</Label>
                <div className="flex gap-1">
                  {[2, 3, 4, 5, 6].map((octave) => (
                    <Button
                      key={octave}
                      variant={selectedOctave === octave ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedOctave(octave)}
                      className="bg-slate-700 text-white border-slate-600"
                    >
                      {octave}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Sustain Pedal */}
              <div className="space-y-2">
                <Label className="text-white">Sustain Pedal</Label>
                <Button
                  variant={sustainPedal ? "default" : "outline"}
                  onClick={() => setSustainPedal(!sustainPedal)}
                  className="w-full bg-slate-700 text-white border-slate-600"
                >
                  {sustainPedal ? "ON" : "OFF"}
                </Button>
              </div>

              {/* Test Sound */}
              <div className="space-y-2">
                <Label className="text-white">Test Audio</Label>
                <Button onClick={testSound} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  <TestTube className="w-4 h-4 mr-2" />
                  Test
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Piano Keyboard */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <PianoKeyboard
              activeNotes={activeNotes}
              onNotePress={pressNote}
              onNoteRelease={releaseNote}
              baseOctave={selectedOctave}
            />
          </CardContent>
        </Card>

        {/* Sample MIDIs by Kaushik */}
        <SampleMidis onLoadMidi={handleSampleLoad} isCurrentlyPlaying={isPlaying} currentMidiName={currentMidiName} />

        {/* MIDI Player */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">MIDI Player</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label className="text-white">Upload Your Own MIDI File</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".mid,.midi"
                  onChange={handleFileUpload}
                  className="bg-slate-700 text-white border-slate-600"
                />
                <Button variant="outline" className="bg-slate-700 text-white border-slate-600">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Playback Controls */}
            {midiFile && (
              <div className="space-y-4">
                <div className="flex gap-2 items-center">
                  <Button onClick={playMidi} disabled={isPlaying} className="bg-green-600 hover:bg-green-700">
                    <Play className="w-4 h-4 mr-2" />
                    Play
                  </Button>
                  <Button onClick={pauseMidi} disabled={!isPlaying} className="bg-yellow-600 hover:bg-yellow-700">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                  <Button onClick={stopMidi} className="bg-red-600 hover:bg-red-700">
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                  {currentMidiName && (
                    <div className="text-slate-300 text-sm ml-4">
                      <strong>Now Playing:</strong> {currentMidiName.replace(/\.(mid|midi)$/i, "")}
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-300">
                    <span>
                      {Math.floor(currentTime / 60)}:
                      {Math.floor(currentTime % 60)
                        .toString()
                        .padStart(2, "0")}
                    </span>
                    <span>
                      {Math.floor(duration / 60)}:
                      {Math.floor(duration % 60)
                        .toString()
                        .padStart(2, "0")}
                    </span>
                  </div>
                  {/* Debug info */}
                  <div className="text-xs text-slate-500">
                    Debug: currentTime={currentTime.toFixed(2)}s, duration={duration.toFixed(2)}s, progress=
                    {duration > 0 ? ((currentTime / duration) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 relative overflow-hidden">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-100 relative"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    >
                      {/* Add a glowing effect */}
                      <div className="absolute inset-0 bg-blue-400 opacity-50 rounded-full"></div>
                    </div>
                    {/* Add tick marks */}
                    <div className="absolute inset-0 flex justify-between items-center px-1">
                      {Array.from({ length: 11 }, (_, i) => (
                        <div key={i} className="w-px h-2 bg-slate-500 opacity-50"></div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* MIDI Visualizer */}
                <MidiPlayer
                  midiFile={midiFile}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  activeNotes={activeNotes}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">How to Play</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-2">
            <p>
              <strong>Mouse/Touch:</strong> Click or tap piano keys to play notes
            </p>
            <p>
              <strong>Keyboard:</strong> Use QWERTY keys (A-L for white keys, W-P for black keys)
            </p>
            <p>
              <strong>Sustain:</strong> Hold Space bar or toggle sustain pedal
            </p>
            <p>
              <strong>MIDI:</strong> Upload .mid files or try the sample pieces below
            </p>
            <p>
              <strong>Scroll:</strong> Use mouse wheel or drag to scroll through octaves
            </p>
            <p>
              <strong>Test Audio:</strong> Click the Test button to verify sound is working
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="mt-8 py-6 border-t border-slate-700">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-400 text-sm">
            Made with love by{" "}
            <a
              href="https://instagram.com/kaushikieee"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white transition-colors duration-200 underline decoration-slate-500 hover:decoration-white"
            >
              Kaushik
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
