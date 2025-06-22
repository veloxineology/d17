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
    }, 1000)
  }

  return (
    <div
      className={`fixed inset-0 z-50 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-all duration-1000 ${
        isAnimating ? "opacity-0 scale-110" : "opacity-100 scale-100"
      }`}
    >
      <div className="text-center space-y-8 max-w-md mx-auto px-6">
        {/* D17 Logo with Animation */}
        <div className="relative">
          <h1
            className={`text-8xl sm:text-9xl font-black text-gray-900 dark:text-white tracking-tight transition-all duration-1000 ${
              progress > 50 ? "scale-100 opacity-100" : "scale-75 opacity-60"
            }`}
          >
            D17
          </h1>

          {/* Animated underline */}
          <div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Tagline */}
        <p
          className={`text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-300 transition-all duration-1000 delay-500 ${
            progress > 30 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Where Notes Fall in Love
        </p>

        {/* Loading Progress */}
        <div className="space-y-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="h-full bg-white/30 animate-pulse"></div>
            </div>
          </div>

          <div className="text-sm font-bold text-gray-500 dark:text-gray-400">
            {progress < 100 ? `Loading... ${Math.round(progress)}%` : "Ready to Play!"}
          </div>
        </div>

        {/* Enter Button */}
        {showEnterButton && (
          <div
            className={`transition-all duration-500 ${
              showEnterButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Button
              onClick={handleEnter}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold px-12 py-4 rounded-2xl text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
            >
              Enter D17
            </Button>
          </div>
        )}

        {/* Floating musical notes animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`absolute text-4xl opacity-20 animate-bounce transition-all duration-1000 delay-${i * 200} ${
                progress > 70 ? "opacity-20" : "opacity-0"
              }`}
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 40}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + i * 0.5}s`,
              }}
            >
              {["🎵", "🎶", "🎼", "🎹", "🎤", "🎧"][i]}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
