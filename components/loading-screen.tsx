"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface LoadingScreenProps {
  onComplete: () => void
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [showEnterButton, setShowEnterButton] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Simulate loading progress over 7 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setShowEnterButton(true)
          return 100
        }
        return prev + 100 / 70 // 100% over 7 seconds (70 intervals of 100ms)
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const handleEnter = () => {
    setIsAnimating(true)
    // Wait for animation to complete before calling onComplete
    setTimeout(() => {
      onComplete()
    }, 2000) // Increased duration for the zoom effect
  }

  return (
    <>
      {/* Main App Preview (hidden behind mask initially) */}
      <div className="fixed inset-0 z-40 bg-gradient-to-br from-gray-50/95 to-gray-100/95 dark:from-gray-900/95 dark:to-gray-800/95 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 opacity-50">
          {/* Preview of the main UI */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl sm:text-6xl font-black text-gray-900 dark:text-white tracking-tight opacity-60">
              D17
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 font-bold opacity-60">Where Notes Fall in Love</p>
          </div>

          {/* Glass cards preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card h-32 rounded-3xl"></div>
            <div className="glass-card h-32 rounded-3xl"></div>
          </div>
          <div className="glass-card h-48 rounded-3xl"></div>
        </div>
      </div>

      {/* Loading Screen with Mask */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-2000 ease-in-out ${
          isAnimating ? "scale-[20] opacity-0" : "scale-100 opacity-100"
        }`}
        style={{
          background: isAnimating
            ? "transparent"
            : "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))",
          backdropFilter: isAnimating ? "none" : "blur(40px)",
          WebkitBackdropFilter: isAnimating ? "none" : "blur(40px)",
        }}
      >
        {/* Mask Container */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-2000 ease-in-out ${
            isAnimating ? "scale-[20]" : "scale-100"
          }`}
          style={{
            maskImage: isAnimating ? "radial-gradient(circle, transparent 30%, black 31%)" : "none",
            WebkitMaskImage: isAnimating ? "radial-gradient(circle, transparent 30%, black 31%)" : "none",
          }}
        >
          {/* Glass Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 dark:from-black/20 dark:to-black/5 backdrop-blur-3xl"></div>

          {/* Content */}
          <div className="relative text-center space-y-8 max-w-md mx-auto px-6 z-10">
            {/* D17 Logo with Glass Effect */}
            <div className="relative">
              <h1
                className={`text-8xl sm:text-9xl font-black tracking-tight transition-all duration-1000 bg-gradient-to-br from-gray-900 via-blue-800 to-purple-900 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent ${
                  progress > 50 ? "scale-100 opacity-100" : "scale-75 opacity-60"
                }`}
                style={{
                  textShadow: "0 0 40px rgba(59, 130, 246, 0.3)",
                  filter: "drop-shadow(0 0 20px rgba(59, 130, 246, 0.2))",
                }}
              >
                D17
              </h1>

              {/* Animated underline with glass effect */}
              <div
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-2 bg-gradient-to-r from-blue-500/80 to-purple-500/80 rounded-full transition-all duration-1000 backdrop-blur-sm"
                style={{
                  width: `${progress}%`,
                  boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
                }}
              ></div>
            </div>

            {/* Tagline with glass effect */}
            <p
              className={`text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-200 transition-all duration-1000 delay-500 ${
                progress > 30 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{
                textShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              }}
            >
              Where Notes Fall in Love
            </p>

            {/* Glass Loading Progress */}
            <div className="space-y-4">
              <div className="w-full bg-white/20 dark:bg-black/20 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-white/30 dark:border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-blue-500/90 to-purple-500/90 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                >
                  {/* Glass shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                </div>
              </div>

              <div className="text-sm font-bold text-gray-600 dark:text-gray-300">
                {progress < 100 ? `Loading... ${Math.round(progress)}%` : "Ready to Play!"}
              </div>
            </div>

            {/* Glass Enter Button */}
            {showEnterButton && (
              <div
                className={`transition-all duration-500 ${
                  showEnterButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                <Button
                  onClick={handleEnter}
                  size="lg"
                  className="glass-button bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-600/80 hover:to-purple-600/80 text-white font-black px-12 py-4 rounded-2xl text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 backdrop-blur-sm border border-white/20"
                  style={{
                    boxShadow: "0 8px 32px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                  }}
                >
                  Enter D17
                </Button>
              </div>
            )}

            {/* Floating musical notes with glass effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute text-4xl transition-all duration-1000 delay-${i * 200} ${
                    progress > 70 ? "opacity-30" : "opacity-0"
                  }`}
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${30 + (i % 2) * 40}%`,
                    animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                    animationDelay: `${i * 0.5}s`,
                    filter: "drop-shadow(0 2px 8px rgba(59, 130, 246, 0.3))",
                    textShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
                  }}
                >
                  {["🎵", "🎶", "🎼", "🎹", "🎤", "🎧"][i]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
