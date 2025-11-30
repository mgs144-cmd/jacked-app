'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Music } from 'lucide-react'
import Image from 'next/image'

interface PostMusicPlayerProps {
  songTitle: string
  songArtist: string
  songUrl?: string
  spotifyId?: string
  albumArt?: string
}

export function PostMusicPlayer({ songTitle, songArtist, songUrl, spotifyId, albumArt }: PostMusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Determine audio URL - prioritize preview URLs
    if (songUrl) {
      // Check if it's a preview URL (usually from Spotify)
      if (songUrl.includes('spotify.com') || songUrl.includes('preview')) {
        setAudioUrl(songUrl)
      } else if (songUrl.startsWith('http') && (songUrl.endsWith('.mp3') || songUrl.endsWith('.m4a') || songUrl.includes('audio'))) {
        // Direct audio file URL
        setAudioUrl(songUrl)
      } else {
        // External link - no preview available
        setAudioUrl(null)
      }
    } else {
      setAudioUrl(null)
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [songUrl, spotifyId])

  const handlePlayPause = async () => {
    if (!audioUrl) {
      // If no preview URL, open external link
      if (songUrl) {
        window.open(songUrl, '_blank')
      } else if (spotifyId) {
        window.open(`https://open.spotify.com/track/${spotifyId}`, '_blank')
      }
      return
    }

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl)
        audioRef.current.volume = 0.7
        audioRef.current.onended = () => setIsPlaying(false)
        audioRef.current.onerror = () => {
          setIsPlaying(false)
          setAudioUrl(null)
          // Fallback to external link if preview fails
          if (songUrl) {
            window.open(songUrl, '_blank')
          } else if (spotifyId) {
            window.open(`https://open.spotify.com/track/${spotifyId}`, '_blank')
          }
        }
      }

      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Audio playback error:', error)
      setIsPlaying(false)
      // Fallback to external link
      if (songUrl) {
        window.open(songUrl, '_blank')
      } else if (spotifyId) {
        window.open(`https://open.spotify.com/track/${spotifyId}`, '_blank')
      }
    }
  }

  return (
    <div className="px-5 py-3 bg-gray-800/40 border-b border-gray-800/40 flex items-center space-x-3">
      {albumArt ? (
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ring-2 ring-gray-700">
          <Image
            src={albumArt}
            alt={`${songTitle} album art`}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
          <Music className="w-6 h-6 text-white" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm truncate">{songTitle}</p>
        <p className="text-gray-400 text-xs truncate">{songArtist}</p>
      </div>
      <button
        onClick={handlePlayPause}
        className="p-2 rounded-full bg-primary hover:bg-primary-dark text-white transition-all flex-shrink-0 hover:scale-110"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </button>
      <audio ref={audioRef} src={audioUrl || undefined} style={{ display: 'none' }} />
    </div>
  )
}

