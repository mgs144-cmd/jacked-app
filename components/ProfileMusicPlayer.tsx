'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, AlertCircle, RefreshCw } from 'lucide-react'
import { YouTubePlayer } from './YouTubePlayer'
import { useMusic } from '@/app/providers/MusicProvider'

interface ProfileMusicPlayerProps {
  songTitle: string
  songArtist: string
  songUrl?: string
  spotifyId?: string
  albumArt?: string
  startTime?: number // Start time in seconds (e.g., 30 to start at 30 seconds)
}

export function ProfileMusicPlayer({ songTitle, songArtist, songUrl, spotifyId, albumArt, startTime }: ProfileMusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  // Start unmuted - user can mute if needed
  const [isMuted, setIsMuted] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [youtubeLoading, setYoutubeLoading] = useState(false)
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { currentPlayingId, playSong, stopCurrentSong } = useMusic()
  const songId = `profile-${songUrl || spotifyId || 'unknown'}`
  const hasAutoPlayedRef = useRef(false) // Track if we've attempted auto-play
  const youtubePlayerReadyRef = useRef(false) // Track if YouTube player is ready

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
    // Reset auto-play flag and YouTube ready flag when song changes
    hasAutoPlayedRef.current = false
    youtubePlayerReadyRef.current = false
    
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
    setError(null) // Clear any previous errors
    if (youtubeVideoId) {
      console.log('Profile: Starting YouTube playback', { songId, youtubeVideoId, startTime, isMuted })
      setLoading(true)
      setYoutubeLoading(true)
      // For YouTube, set isPlaying to true - YouTube player will handle actual playback via isPlaying prop
      // Wait a bit to ensure player is ready (especially on mobile)
      setTimeout(() => {
        setIsPlaying(true)
        console.log('Profile: Set isPlaying to true for YouTube')
      }, 300)
      return
    }

    if (!audioUrl) return

    try {
      setLoading(true)
      
      // Clean up previous audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      // Create new audio element
      const audio = new Audio(audioUrl)
      audio.volume = isMuted ? 0 : 0.7
      audio.muted = isMuted
      audio.setAttribute('playsinline', 'true')
      audio.setAttribute('webkit-playsinline', 'true')
      
      // Set start time if provided
      if (startTime && startTime > 0) {
        audio.addEventListener('loadedmetadata', () => {
          if (audio) {
            audio.currentTime = startTime
          }
        }, { once: true })
      }
      
      // Event handlers
      audio.onplay = () => {
        setIsPlaying(true)
        setLoading(false)
      }
      
      audio.onpause = () => {
        setIsPlaying(false)
      }
      
      audio.onended = () => {
        setIsPlaying(false)
        setLoading(false)
        stopCurrentSong()
      }
      
      audio.onerror = () => {
        console.error('Profile: Audio error')
        setIsPlaying(false)
        setLoading(false)
        setError('Failed to load audio. Please try again.')
        stopCurrentSong()
      }
      
      // Store reference and play
      audioRef.current = audio
      
      // Wait for audio to be ready, then play
      audio.addEventListener('canplay', () => {
        if (startTime && startTime > 0 && audio) {
          audio.currentTime = startTime
        }
        audio.play().catch((err) => {
          console.error('Profile: Play failed:', err)
          setLoading(false)
          setError('Playback failed. Please tap play again.')
        })
      }, { once: true })
      
      audio.addEventListener('error', () => {
        setError('Failed to load audio. Please check your connection.')
        setLoading(false)
      }, { once: true })
      
      // Also try to load immediately
      audio.load()
      
    } catch (error: any) {
      console.error('Profile: Audio playback error:', error)
      setIsPlaying(false)
      setLoading(false)
      stopCurrentSong()
    }
  }, [youtubeVideoId, audioUrl, stopCurrentSong, isMuted, startTime, songId])

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
    // Only auto-play once when we have a valid song
    if ((audioUrl || youtubeVideoId) && !hasAutoPlayedRef.current) {
      console.log('Profile auto-play effect triggered', { audioUrl, youtubeVideoId, songId })
      hasAutoPlayedRef.current = true
      
      // Wait for player to be ready (YouTube needs more time)
      const delay = youtubeVideoId ? 2000 : 1000
      
      const timer = setTimeout(() => {
        console.log('Profile: Triggering auto-play for', songId, 'youtubeVideoId:', youtubeVideoId, 'audioUrl:', audioUrl)
        playSong(songId, startPlayback, stopPlayback)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [audioUrl, youtubeVideoId, songId, playSong, startPlayback, stopPlayback])

  // Sync with music context - actually start/stop playback
  useEffect(() => {
    if (currentPlayingId === songId && !isPlaying) {
      // Global context says this should be playing but local state disagrees
      console.log('Profile sync: starting playback for', songId, 'youtubeVideoId:', youtubeVideoId, 'audioUrl:', audioUrl)
      startPlayback()
    } else if (currentPlayingId !== songId && isPlaying) {
      // A different song is playing globally, stop this one
      console.log('Profile sync: stopping playback for', songId)
      stopPlayback()
    }
  }, [currentPlayingId, songId, isPlaying, startPlayback, stopPlayback, youtubeVideoId, audioUrl])

  // Handle mute changes for audio files while playing
  useEffect(() => {
    if (audioRef.current && !youtubeVideoId) {
      audioRef.current.muted = isMuted
      audioRef.current.volume = isMuted ? 0 : 0.7
    }
  }, [isMuted, youtubeVideoId])

  const togglePlay = async () => {
    console.log('Profile play button clicked', { currentPlayingId, songId, isPlaying, youtubeVideoId, audioUrl })
    
    // Reset auto-play flag to allow manual play
    hasAutoPlayedRef.current = false
    
    if (currentPlayingId === songId && isPlaying) {
      // Currently playing, so stop it
      console.log('Profile: Manual stop')
      stopCurrentSong()
    } else {
      // Not playing, so start it
      console.log('Profile: Manual play - calling playSong')
      setLoading(true)
      playSong(songId, startPlayback, stopPlayback)
      
      // Force playback to start immediately if it doesn't
      setTimeout(() => {
        if (currentPlayingId === songId && !isPlaying) {
          console.log('Profile: Force starting playback after manual play')
          startPlayback()
        }
      }, 200)
    }
  }

  const toggleMute = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    
    // Handle audio files
    if (audioRef.current) {
      audioRef.current.muted = newMutedState
      audioRef.current.volume = newMutedState ? 0 : 0.7
    }
    // Note: YouTube mute is handled by the YouTubePlayer component via isMuted prop
  }

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    if (youtubeVideoId) {
      setIsPlaying(true)
    } else if (audioUrl) {
      startPlayback()
    }
  }

  const isLoading = loading || youtubeLoading

  return (
    <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-800/60 p-2.5">
      <div className="flex items-center space-x-3">
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-xs truncate">{songTitle}</p>
          <p className="text-gray-400 text-[10px] truncate">{songArtist}</p>
          {error && (
            <div className="mt-1 flex items-center space-x-1.5 text-red-400 text-[10px]">
              <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">{error}</span>
            </div>
          )}
          {isLoading && !error && (
            <p className="mt-1 text-gray-500 text-[10px]">Loading...</p>
          )}
        </div>

        {(audioUrl || youtubeVideoId) ? (
          <div className="flex items-center space-x-1.5">
            {error ? (
              <button
                onClick={handleRetry}
                className="w-7 h-7 rounded-lg bg-primary hover:bg-primary-dark flex items-center justify-center transition-all flex-shrink-0 active:scale-95"
                title="Retry playback"
                aria-label="Retry playback"
              >
                <RefreshCw className="w-3 h-3 text-white" />
              </button>
            ) : (
              <button
                onClick={togglePlay}
                disabled={isLoading}
                className="w-7 h-7 rounded-lg bg-primary hover:bg-primary-dark flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-md shadow-primary/20"
                aria-label={isPlaying ? 'Pause' : isLoading ? 'Loading...' : 'Play'}
                title={isPlaying ? 'Pause' : isLoading ? 'Loading...' : 'Play'}
              >
                {isLoading ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-3.5 h-3.5 text-white fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-white fill-current ml-0.5" />
                )}
              </button>
            )}

            <button
              onClick={toggleMute}
              disabled={!!error}
              className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all flex-shrink-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-gray-400" />
              )}
            </button>
          </div>
        ) : null}
      </div>
      <audio 
        ref={audioRef} 
        src={audioUrl || undefined} 
        style={{ display: 'none' }}
        playsInline
        webkit-playsinline="true"
      />
      {youtubeVideoId && (
        <YouTubePlayer
          videoId={youtubeVideoId}
          isPlaying={isPlaying}
          startTime={startTime}
          isMuted={isMuted}
          onLoadingChange={(isLoading) => {
            setYoutubeLoading(isLoading)
            if (!isLoading) {
              setLoading(false)
            }
          }}
          onReady={() => {
            // YouTube player is ready
            console.log('Profile: YouTube player ready for:', songId)
            youtubePlayerReadyRef.current = true
            setLoading(false)
            setYoutubeLoading(false)
            setError(null)
            // If we should be playing, trigger it now
            if (currentPlayingId === songId && !isPlaying) {
              console.log('Profile: Player ready and should be playing, starting playback')
              setTimeout(() => {
                startPlayback()
              }, 200)
            }
          }}
          onPlay={() => {
            console.log('Profile: YouTube onPlay event')
            setIsPlaying(true)
            setLoading(false)
            setYoutubeLoading(false)
            setError(null)
          }}
          onPause={() => {
            console.log('Profile: YouTube onPause event')
            setIsPlaying(false)
          }}
          onError={(errorMsg) => {
            console.error('YouTube player error:', errorMsg)
            setLoading(false)
            setYoutubeLoading(false)
            setIsPlaying(false)
            setError(errorMsg || 'Failed to play video. Please try again.')
            stopCurrentSong()
          }}
        />
      )}
    </div>
  )
}
