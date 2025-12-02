'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { YouTubePlayer } from './YouTubePlayer'
import { useMusic } from '@/app/providers/MusicProvider'

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
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { currentPlayingId, playSong, stopCurrentSong } = useMusic()
  const songId = `profile-${songUrl || spotifyId || 'unknown'}`

  // Extract YouTube video ID from URL
  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/.*[?&]v=([^&\n?#]+)/,
      /(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/,
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) return match[1]
    }
    return null
  }

  useEffect(() => {
    if (songUrl) {
      const youtubeId = extractYouTubeId(songUrl)
      if (youtubeId) {
        setYoutubeVideoId(youtubeId)
        setAudioUrl(null)
        return
      }
      
      if (songUrl.includes('youtube.com') || songUrl.includes('youtu.be')) {
        const simpleMatch = songUrl.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)
        if (simpleMatch && simpleMatch[1]) {
          setYoutubeVideoId(simpleMatch[1])
          setAudioUrl(null)
          return
        }
      }

      const audioExtensions = ['.mp3', '.m4a', '.wav', '.ogg', '.aac', '.flac', '.webm']
      const isDirectAudio = audioExtensions.some(ext => songUrl.toLowerCase().endsWith(ext))
      const isSpotifyPreview = songUrl.includes('p.scdn.co') || songUrl.includes('preview')
      const isSupabaseStorage = songUrl.includes('supabase.co') || songUrl.includes('storage')
      
      if (isSpotifyPreview || isDirectAudio || isSupabaseStorage) {
        setAudioUrl(songUrl)
        setYoutubeVideoId(null)
      } else {
        setAudioUrl(null)
        setYoutubeVideoId(null)
      }
    } else if (spotifyId) {
      setAudioUrl(`https://p.scdn.co/mp3-preview/${spotifyId}`)
      setYoutubeVideoId(null)
    } else {
      setAudioUrl(null)
      setYoutubeVideoId(null)
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [songUrl, spotifyId])

  const startPlayback = useCallback(async () => {
    if (youtubeVideoId) {
      // For YouTube, just set playing state - the YouTubePlayer component will handle actual playback
      // But add a small delay to ensure player is ready
      setLoading(true)
      setTimeout(() => {
        setIsPlaying(true)
        setLoading(false)
      }, 100)
      return
    }

    if (!audioUrl) return

    try {
      setLoading(true)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      audioRef.current = new Audio(audioUrl || undefined)
      audioRef.current.volume = 0.7
      audioRef.current.crossOrigin = 'anonymous'
      
      audioRef.current.onended = () => {
        setIsPlaying(false)
        setLoading(false)
        stopCurrentSong()
      }
      
      audioRef.current.onerror = () => {
        setIsPlaying(false)
        setLoading(false)
        stopCurrentSong()
      }
      
      audioRef.current.oncanplay = () => {
        setLoading(false)
      }

      await audioRef.current.play()
      setIsPlaying(true)
      setLoading(false)
    } catch (error: any) {
      console.error('Audio playback error:', error)
      setIsPlaying(false)
      setLoading(false)
      stopCurrentSong()
    }
  }, [youtubeVideoId, audioUrl, stopCurrentSong])

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(false)
    setLoading(false)
  }, [])

  // Auto-play when profile opens (if song is available)
  useEffect(() => {
    // Only auto-play once when component mounts with a valid song
    if ((youtubeVideoId || audioUrl) && currentPlayingId !== songId) {
      // Delay to ensure page and player are loaded
      const timer = setTimeout(() => {
        if (currentPlayingId !== songId) { // Double check it hasn't changed
          console.log('Auto-playing profile song:', songId)
          playSong(songId, startPlayback, stopPlayback)
        }
      }, 1500) // Delay to ensure YouTube player is ready
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeVideoId, audioUrl]) // Re-run when song URL changes

  // Sync with music context - prevent rapid toggling
  useEffect(() => {
    // Only sync if there's an actual change
    if (currentPlayingId === songId && !isPlaying) {
      // This song should be playing but isn't
      startPlayback()
    } else if (currentPlayingId !== songId && isPlaying) {
      // A different song is playing, stop this one
      stopPlayback()
    }
    // Don't do anything if state is already correct
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayingId, songId]) // Removed isPlaying, startPlayback, stopPlayback to prevent loops

  const togglePlay = () => {
    console.log('Profile play button clicked', { currentPlayingId, songId, isPlaying, youtubeVideoId, audioUrl })
    if (currentPlayingId === songId) {
      stopCurrentSong()
    } else {
      // Force play immediately on click
      playSong(songId, startPlayback, stopPlayback)
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
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-xs truncate">{songTitle}</p>
          <p className="text-gray-400 text-[10px] truncate">{songArtist}</p>
        </div>

        {(audioUrl || youtubeVideoId) ? (
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

            {audioUrl && !youtubeVideoId && (
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
        ) : null}
      </div>
      <audio ref={audioRef} src={audioUrl || undefined} style={{ display: 'none' }} />
      {youtubeVideoId && (
        <YouTubePlayer
          videoId={youtubeVideoId}
          isPlaying={isPlaying}
          onPlay={() => {
            // Only update if not already playing to prevent loops
            if (!isPlaying) {
              setIsPlaying(true)
            }
          }}
          onPause={() => {
            // Only update if not already paused to prevent loops
            if (isPlaying) {
              setIsPlaying(false)
            }
          }}
          onError={(error) => {
            console.error('YouTube player error:', error)
            setLoading(false)
            setIsPlaying(false)
            stopCurrentSong()
          }}
        />
      )}
    </div>
  )
}
