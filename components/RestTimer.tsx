'use client'

import { useState, useEffect, useRef } from 'react'
import { Clock, X, Play, Pause } from 'lucide-react'

export function RestTimer() {
  const [timeLeft, setTimeLeft] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()

  // Quick timer presets (in seconds)
  const PRESETS = [60, 90, 120, 180, 300]

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            // Timer finished
            setIsActive(false)
            playFinishSound()
            vibrate()
            return 0
          }
          return time - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, timeLeft])

  const startTimer = (seconds: number) => {
    setTimeLeft(seconds)
    setIsActive(true)
    setIsExpanded(false)
    vibrate()

    // Request wake lock to keep screen on
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').catch((err: Error) => {
        console.log('Wake lock error:', err)
      })
    }
  }

  const togglePause = () => {
    setIsActive(!isActive)
    vibrate()
  }

  const resetTimer = () => {
    setIsActive(false)
    setTimeLeft(0)
    setIsExpanded(false)
    vibrate()
  }

  const vibrate = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20)
    }
  }

  const playFinishSound = () => {
    // Play a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)

    // Vibrate pattern for finish
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // If timer is running, show full display
  if (timeLeft > 0) {
    const progress = (timeLeft / PRESETS.find(p => p >= timeLeft) || 180) * 100

    return (
      <div className="fixed bottom-24 md:bottom-8 right-4 z-40">
        <div className="bg-gradient-to-br from-primary to-red-700 text-white p-6 rounded-2xl shadow-2xl min-w-[160px] border-2 border-red-400/30">
          <button
            onClick={resetTimer}
            className="absolute top-2 right-2 text-white/60 hover:text-white transition-colors"
            aria-label="Close timer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center mb-4">
            <div className="text-5xl font-black mb-1">
              {formatTime(timeLeft)}
            </div>
            <p className="text-xs text-white/80 font-semibold tracking-wide">
              REST TIME
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-white/90 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex space-x-2">
            <button
              onClick={togglePause}
              className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 px-3 rounded-lg transition-all flex items-center justify-center space-x-1 active:scale-95"
            >
              {isActive ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span className="text-xs font-bold">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span className="text-xs font-bold">Resume</span>
                </>
              )}
            </button>
            <button
              onClick={resetTimer}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 px-3 rounded-lg transition-all active:scale-95"
            >
              <span className="text-xs font-bold">Reset</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // If expanded, show preset buttons
  if (isExpanded) {
    return (
      <div className="fixed bottom-24 md:bottom-8 right-4 z-40">
        <div className="bg-gray-900 border-2 border-gray-800 rounded-2xl shadow-2xl p-4 min-w-[200px]">
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <p className="text-white font-bold text-sm mb-3">Rest Timer</p>

          <div className="space-y-2">
            {PRESETS.map((seconds) => (
              <button
                key={seconds}
                onClick={() => startTimer(seconds)}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-all active:scale-95 flex items-center justify-between px-4"
              >
                <span>{formatTime(seconds)}</span>
                <Clock className="w-4 h-4 text-primary" />
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Default: Show timer button
  return (
    <button
      onClick={() => setIsExpanded(true)}
      className="fixed bottom-24 md:bottom-8 right-4 z-40 bg-gradient-to-br from-primary to-red-700 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all active:scale-95 border-2 border-red-400/30"
      aria-label="Open rest timer"
    >
      <Clock className="w-6 h-6" />
    </button>
  )
}
