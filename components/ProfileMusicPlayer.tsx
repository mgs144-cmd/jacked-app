'use client'

import { useEffect, useRef, useState } from 'react'
import { Music, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import Image from 'next/image'

interface ProfileMusicPlayerProps {
  songTitle: string
  songArtist: string
  songUrl?: string
  spotifyId?: string
  albumArt?: string
}

export function ProfileMusicPlayer({ songTitle, songArtist, songUrl, spotifyId, albumArt }: ProfileMusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Only use preview URLs for in-app playback
    if (songUrl) {
      // Spotify preview URLs (p.scdn.co) are direct MP3s that can be played
      const isSpotifyPreview = songUrl.includes('p.scdn.co') || 
                               songUrl.includes('preview') ||
                               (songUrl.includes('spotify') && songUrl.endsWith('.mp3'))
      
      // Direct audio file URLs
      const audioExtensions = ['.mp3', '.m4a', '.wav', '.ogg', '.aac', '.flac', '.webm']
      const isDirectAudio = audioExtensions.some(ext => songUrl.toLowerCase().endsWith(ext))
      
      // Supabase storage URLs
      const isSupabaseStorage = songUrl.includes('supabase.co') || songUrl.includes('storage')
      
      // Only set audio URL if it's a playable preview/audio file
      if (isSpotifyPreview || isDirectAudio || isSupabaseStorage) {
        setAudioUrl(songUrl)
      } else {
        // Not a playable URL - don't set audioUrl
        setAudioUrl(null)
      }
    } else if (spotifyId) {
      // Try to construct preview URL from spotifyId
      setAudioUrl(`https://p.scdn.co/mp3-preview/${spotifyId}`)
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

  const togglePlay = async () => {
    // Only play preview URLs in-app - no opening external links
    if (!audioUrl) {
      alert('No playable audio available. This song may not have a preview clip.')
      return
    }

    try {
      // If already playing, pause it
      if (isPlaying && audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
        return
      }

      setLoading(true)

      // Create new audio element if needed
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl)
        audioRef.current.volume = 0.7
        audioRef.current.crossOrigin = 'anonymous'
        
        audioRef.current.onended = () => {
          setIsPlaying(false)
          setLoading(false)
        }
        
        audioRef.current.onerror = (e) => {
          console.error('Audio playback error:', e)
          setIsPlaying(false)
          setLoading(false)
          alert(`Failed to play audio. The URL might not be accessible or might be blocked by CORS.\n\nURL: ${audioUrl}`)
        }
        
        audioRef.current.oncanplay = () => {
          setLoading(false)
        }
      }

      await audioRef.current.play()
      setIsPlaying(true)
      setLoading(false)
    } catch (error: any) {
      console.error('Audio playback error:', error)
      setIsPlaying(false)
      setLoading(false)
      alert(`Failed to play audio: ${error.message || 'Unknown error'}\n\nURL: ${audioUrl}`)
    }
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    audioRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  return (
    <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-800/60 p-2.5">
      <div className="flex items-center space-x-3">
        {/* Album Art - Smaller */}
        {albumArt ? (
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-gray-700">
            <img
              src={albumArt}
              alt={`${songTitle} album art`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
            <Music className="w-5 h-5 text-white" />
          </div>
        )}
        
        {/* Song Info - Smaller */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-xs truncate">{songTitle}</p>
          <p className="text-gray-400 text-[10px] truncate">{songArtist}</p>
        </div>

        {/* Controls - Only show if we have a playable audio URL */}
        {audioUrl ? (
          <div className="flex items-center space-x-1.5">
            <button
              onClick={togglePlay}
              disabled={loading}
              className="w-7 h-7 rounded-lg bg-primary hover:bg-primary-dark flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-50"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {loading ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-3.5 h-3.5 text-white fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 text-white fill-current" />
              )}
            </button>

            {audioUrl && (
              <button
                onClick={toggleMute}
                className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all flex-shrink-0"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-gray-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="w-7 h-7 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0" title="No playable audio">
            <Music className="w-3.5 h-3.5 text-gray-500" />
          </div>
        )}
      </div>
      <audio ref={audioRef} src={audioUrl || undefined} style={{ display: 'none' }} />
    </div>
  )
}

