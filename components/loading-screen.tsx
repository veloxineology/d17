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
    }, 2000)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Background with glass effect */}
      <div
        className={`absolute inset-0 transition-all duration-2000 ease-in-out ${
          isAnimating ? "scale-150 opacity-0" : "scale-100 opacity-100"
        }`}
        style={{
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
        }}
      />

      {/* Content Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-8 max-w-md mx-auto px-6 z-10">
          {/* D17 Logo with proper masking */}
          <div className="relative">
            <div
              className={`transition-all duration-2000 ease-in-out ${
                isAnimating ? "scale-[25] opacity-0" : "scale-100 opacity-100"
              }`}
              style={{
                transformOrigin: "center center",
              }}
            >
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
            </div>

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
                className="bg-gradient-to-r from-blue-500/90 to-purple-500/90 hover:from-blue-600/90 hover:to-purple-600/90 text-white font-black px-12 py-4 rounded-2xl text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 backdrop-blur-sm border border-white/20"
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
  )
}
