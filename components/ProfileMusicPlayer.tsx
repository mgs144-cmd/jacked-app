'use client'

import { useEffect, useRef, useState } from 'react'
import { Music, Play, Pause, Volume2, VolumeX } from 'lucide-react'

interface ProfileMusicPlayerProps {
  songTitle: string
  songArtist: string
  songUrl?: string
  spotifyId?: string
}

export function ProfileMusicPlayer({ songTitle, songArtist, songUrl, spotifyId }: ProfileMusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Use songUrl (which should contain Spotify preview_url if from search)
    // or fallback to constructed preview URL if we only have spotifyId
    const audioUrl = songUrl || (spotifyId ? `https://p.scdn.co/mp3-preview/${spotifyId}` : null)

    if (!audioUrl) return

    // Create audio element
    const audio = new Audio(audioUrl)
    audio.loop = true
    audioRef.current = audio

    // Try to auto-play (may be blocked by browser)
    const playPromise = audio.play()
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true)
          setHasStarted(true)
        })
        .catch(() => {
          // Auto-play was blocked, user will need to click play
          setIsPlaying(false)
        })
    }

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [songUrl, spotifyId])

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
      setHasStarted(true)
    }
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    audioRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  if (!songUrl) {
    // If no URL, just show the song info
    return (
      <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-800/60 p-4 flex items-center space-x-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
          <Music className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{songTitle}</p>
          <p className="text-gray-400 text-xs truncate">{songArtist}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-800/60 p-4">
      <div className="flex items-center space-x-4">
        <div className="w-14 h-14 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
          <Music className="w-7 h-7 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{songTitle}</p>
          <p className="text-gray-400 text-xs truncate">{songArtist}</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-lg bg-primary hover:bg-primary-dark flex items-center justify-center transition-all glow-red-sm"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white fill-current" />
            ) : (
              <Play className="w-5 h-5 text-white fill-current" />
            )}
          </button>

          <button
            onClick={toggleMute}
            className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-gray-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

