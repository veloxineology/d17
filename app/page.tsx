"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Pause, Square, Upload, Volume2, TestTube } from "lucide-react"
import PianoKeyboard from "@/components/piano-keyboard"
import MidiPlayer from "@/components/midi-player"
import SampleMidis from "@/components/sample-midis"
import LoadingScreen from "@/components/loading-screen"
import ThemeToggle from "@/components/theme-toggle"
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
  const [showLoadingScreen, setShowLoadingScreen] = useState(true)

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

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!midiFile || duration === 0) return

    const rect = event.currentTarget.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * duration

    // For now, just update the visual - you could implement seeking here
    console.log(`Clicked at ${(percentage * 100).toFixed(1)}% - ${newTime.toFixed(2)}s`)
  }

  // Show loading screen first
  if (showLoadingScreen) {
    return <LoadingScreen onComplete={() => setShowLoadingScreen(false)} />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-gray-900/90 dark:via-blue-900/50 dark:to-purple-900/50 backdrop-blur-3xl flex items-center justify-center p-4">
        <div className="glass-card p-8 rounded-3xl">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500/60 border-t-transparent rounded-full animate-spin backdrop-blur-sm"></div>
            <div className="text-gray-900 dark:text-white text-xl font-black">Loading piano samples...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-gray-900/90 dark:via-blue-900/50 dark:to-purple-900/50 backdrop-blur-3xl transition-all duration-300">
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-pink-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header - Left Aligned with Theme Toggle */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="text-left space-y-2">
            <h1
              className="text-5xl sm:text-6xl font-black tracking-tight bg-gradient-to-br from-gray-900 via-blue-800 to-purple-900 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent"
              style={{
                textShadow: "0 0 40px rgba(59, 130, 246, 0.3)",
                filter: "drop-shadow(0 0 20px rgba(59, 130, 246, 0.2))",
              }}
            >
              D17
            </h1>
            <p className="text-xl font-bold bg-gradient-to-r from-gray-600 to-gray-800 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent">
              Where Notes Fall in Love
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Main Controls - Fixed Button Visibility */}
        <div className="glass-card rounded-3xl shadow-2xl transition-all duration-300 hover:shadow-3xl">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white text-left">Controls</h2>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500/80 rounded-full backdrop-blur-sm"></div>
                <div className="w-3 h-3 bg-yellow-500/80 rounded-full backdrop-blur-sm"></div>
                <div className="w-3 h-3 bg-green-500/80 rounded-full backdrop-blur-sm"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Volume Control */}
              <div className="space-y-3">
                <Label className="text-gray-900 dark:text-white flex items-center gap-2 font-black">
                  <Volume2 className="w-4 h-4" />
                  Volume
                </Label>
                <div className="relative">
                  <Slider
                    value={[volume * 100]}
                    onValueChange={(value) => setVolume(value[0] / 100)}
                    max={100}
                    step={1}
                    className="w-full [&_[role=slider]]:bg-blue-500 [&_[role=slider]]:border-blue-500 [&_[role=slider]]:shadow-lg [&_[role=slider]]:transition-all [&_[role=slider]]:hover:scale-110"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center font-bold">
                    {Math.round(volume * 100)}%
                  </div>
                </div>
              </div>

              {/* Octave Selection */}
              <div className="space-y-3">
                <Label className="text-gray-900 dark:text-white font-black">Base Octave</Label>
                <div className="flex gap-1">
                  {[2, 3, 4, 5, 6].map((octave) => (
                    <Button
                      key={octave}
                      variant={selectedOctave === octave ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedOctave(octave)}
                      className={`flex-1 transition-all duration-200 font-bold ${
                        selectedOctave === octave
                          ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg scale-105"
                          : "bg-white/60 dark:bg-gray-700/60 hover:bg-white/80 dark:hover:bg-gray-600/80 border-white/70 dark:border-gray-600/70 text-gray-900 dark:text-white"
                      }`}
                    >
                      {octave}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Sustain Pedal */}
              <div className="space-y-3">
                <Label className="text-gray-900 dark:text-white font-black">Sustain Pedal</Label>
                <Button
                  variant={sustainPedal ? "default" : "outline"}
                  onClick={() => setSustainPedal(!sustainPedal)}
                  className={`w-full transition-all duration-200 font-bold ${
                    sustainPedal
                      ? "bg-green-500 hover:bg-green-600 text-white shadow-lg"
                      : "bg-white/60 dark:bg-gray-700/60 hover:bg-white/80 dark:hover:bg-gray-600/80 border-white/70 dark:border-gray-600/70 text-gray-900 dark:text-white"
                  }`}
                >
                  {sustainPedal ? "ON" : "OFF"}
                </Button>
              </div>

              {/* Test Sound */}
              <div className="space-y-3">
                <Label className="text-gray-900 dark:text-white font-black">Test Audio</Label>
                <Button
                  onClick={testSound}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white transition-all duration-200 hover:shadow-lg hover:scale-105 font-bold"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Test
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Piano Keyboard */}
        <div className="glass-card rounded-3xl shadow-2xl transition-all duration-300 hover:shadow-3xl">
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white text-left mb-6">Piano Keyboard</h2>
            <PianoKeyboard
              activeNotes={activeNotes}
              onNotePress={pressNote}
              onNoteRelease={releaseNote}
              baseOctave={selectedOctave}
            />
          </div>
        </div>

        {/* Sample MIDIs */}
        <SampleMidis onLoadMidi={handleSampleLoad} isCurrentlyPlaying={isPlaying} currentMidiName={currentMidiName} />

        {/* MIDI Player */}
        <div className="glass-card rounded-3xl shadow-2xl transition-all duration-300 hover:shadow-3xl">
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white text-left mb-6">MIDI Player</h2>

            {/* File Upload */}
            <div className="space-y-4 mb-6">
              <Label className="text-gray-900 dark:text-white font-black">Upload Your Own MIDI File</Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="file"
                  accept=".mid,.midi"
                  onChange={handleFileUpload}
                  className="bg-white/60 dark:bg-gray-700/60 border-white/70 dark:border-gray-600/70 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/50 font-semibold text-gray-900 dark:text-white"
                />
                <Button
                  variant="outline"
                  className="bg-white/60 dark:bg-gray-700/60 hover:bg-white/80 dark:hover:bg-gray-600/80 border-white/70 dark:border-gray-600/70 rounded-xl transition-all duration-200 sm:w-auto font-bold text-gray-900 dark:text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  <span className="sm:hidden">Upload</span>
                </Button>
              </div>
            </div>

            {/* Playback Controls */}
            {midiFile && (
              <div className="space-y-6 animate-fade-in">
                {/* Control Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <div className="flex gap-3">
                    <Button
                      onClick={playMidi}
                      disabled={isPlaying}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:text-gray-600 text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 flex-1 sm:flex-none font-bold"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Play
                    </Button>
                    <Button
                      onClick={pauseMidi}
                      disabled={!isPlaying}
                      className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 disabled:text-gray-600 text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 flex-1 sm:flex-none font-bold"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                    <Button
                      onClick={stopMidi}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 flex-1 sm:flex-none font-bold"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  </div>
                  {currentMidiName && (
                    <div className="text-gray-600 dark:text-gray-300 text-sm mt-2 sm:mt-0 sm:ml-4 truncate font-bold">
                      <span className="text-gray-500 dark:text-gray-400">Now Playing:</span>{" "}
                      {currentMidiName.replace(/\.(mid|midi)$/i, "")}
                    </div>
                  )}
                </div>

                {/* Fixed Scrollable Progress Bar */}
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 font-bold font-mono">
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

                  {/* Fixed Scrollable Progress Container */}
                  <div className="w-full overflow-x-auto">
                    <div style={{ width: "max(100%, 800px)" }}>
                      <div
                        className="relative w-full h-3 bg-white/30 dark:bg-gray-700/40 rounded-full cursor-pointer transition-all duration-200 hover:h-4 group border border-white/40 dark:border-gray-600/40"
                        onClick={handleProgressClick}
                      >
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-100 shadow-lg"
                          style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                        >
                          {/* Playhead */}
                          <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-blue-500 opacity-0 group-hover:opacity-100 transition-all duration-200"></div>
                        </div>

                        {/* Progress indicators */}
                        <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none">
                          {Array.from({ length: 21 }, (_, i) => (
                            <div key={i} className="w-px h-2 bg-white/50 dark:bg-gray-500/50 opacity-40"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fixed Scrollable MIDI Visualizer */}
                <div className="rounded-2xl overflow-hidden shadow-inner bg-gray-900/90 border border-white/20">
                  <div className="w-full overflow-x-auto">
                    <div style={{ width: "max(100%, 1200px)", height: "192px" }}>
                      <MidiPlayer
                        midiFile={midiFile}
                        currentTime={currentTime}
                        isPlaying={isPlaying}
                        activeNotes={activeNotes}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* How to Play - Left Aligned */}
        <div className="space-y-6 animate-fade-in">
          <h2 className="text-3xl font-black text-left bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            How to Play
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "🖱️",
                title: "Touch & Mouse",
                description: "Tap or click piano keys to play notes",
              },
              {
                icon: "⌨️",
                title: "Keyboard",
                description: "Use QWERTY keys (A-L for white keys, W-P for black keys)",
              },
              {
                icon: "🎵",
                title: "Sustain",
                description: "Hold Space bar or toggle sustain pedal",
              },
              {
                icon: "🎼",
                title: "MIDI",
                description: "Upload .mid files or try the sample pieces",
              },
              {
                icon: "📱",
                title: "Scroll",
                description: "Swipe or drag to scroll through octaves",
              },
              {
                icon: "🔊",
                title: "Test Audio",
                description: "Click the Test button to verify sound is working",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="glass-card rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <div className="text-3xl mb-3" style={{ filter: "drop-shadow(0 2px 8px rgba(59, 130, 246, 0.3))" }}>
                  {item.icon}
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 text-left">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed font-semibold text-left">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-white/20 dark:border-gray-700/30 backdrop-blur-sm">
          <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">
            Made with ❤️ by{" "}
            <a
              href="https://instagram.com/kaushikieee"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 font-black"
            >
              Kaushik
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
