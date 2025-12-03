'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface MusicContextType {
  currentPlayingId: string | null
  playSong: (songId: string, startPlayback: () => void, stopPlayback: () => void) => void
  stopCurrentSong: () => void
}

const MusicContext = createContext<MusicContextType>({
  currentPlayingId: null,
  playSong: () => {},
  stopCurrentSong: () => {},
})

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null)
  const [stopPlaybackFn, setStopPlaybackFn] = useState<(() => void) | null>(null)

  const playSong = useCallback((songId: string, startPlayback: () => void, stopPlayback: () => void) => {
    // Stop current song if playing
    if (currentPlayingId && currentPlayingId !== songId && stopPlaybackFn) {
      stopPlaybackFn()
    }
    
    setCurrentPlayingId(songId)
    setStopPlaybackFn(() => stopPlayback)
    startPlayback()
  }, [currentPlayingId, stopPlaybackFn])

  const stopCurrentSong = useCallback(() => {
    if (stopPlaybackFn) {
      stopPlaybackFn()
    }
    setCurrentPlayingId(null)
    setStopPlaybackFn(null)
  }, [stopPlaybackFn])

  return (
    <MusicContext.Provider value={{ currentPlayingId, playSong, stopCurrentSong }}>
      {children}
    </MusicContext.Provider>
  )
}

export const useMusic = () => useContext(MusicContext)

