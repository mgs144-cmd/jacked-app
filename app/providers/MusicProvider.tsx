'use client'

import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react'

interface MusicContextType {
  currentPlayingId: string | null
  isPlaying: boolean
  playSong: (songId: string, playCallback: () => void, stopCallback: () => void) => void
  stopCurrentSong: () => void
}

const MusicContext = createContext<MusicContextType | undefined>(undefined)

export function MusicProvider({ children }: { children: ReactNode }) {
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const playCallbackRef = useRef<(() => void) | null>(null)
  const stopCallbackRef = useRef<(() => void) | null>(null)

  const playSong = (songId: string, playCallback: () => void, stopCallback: () => void) => {
    // Stop current song if different
    if (currentPlayingId && currentPlayingId !== songId) {
      stopCurrentSong()
    }

    // Set new song
    setCurrentPlayingId(songId)
    setIsPlaying(true)
    playCallbackRef.current = playCallback
    stopCallbackRef.current = stopCallback
    
    // Call play callback
    playCallback()
  }

  const stopCurrentSong = () => {
    if (stopCallbackRef.current) {
      stopCallbackRef.current()
    }
    setCurrentPlayingId(null)
    setIsPlaying(false)
    playCallbackRef.current = null
    stopCallbackRef.current = null
  }

  return (
    <MusicContext.Provider value={{ currentPlayingId, isPlaying, playSong, stopCurrentSong }}>
      {children}
    </MusicContext.Provider>
  )
}

export function useMusic() {
  const context = useContext(MusicContext)
  if (!context) {
    throw new Error('useMusic must be used within MusicProvider')
  }
  return context
}

