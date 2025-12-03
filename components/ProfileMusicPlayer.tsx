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
  startTime?: number // Start time in seconds (e.g., 30 to start at 30 seconds)
}

export function ProfileMusicPlayer({ songTitle, songArtist, songUrl, spotifyId, albumArt, startTime }: ProfileMusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  // Start muted on mobile for autoplay to work
  const [isMuted, setIsMuted] = useState(typeof window !== 'undefined' && window.innerWidth < 768)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
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
    if (youtubeVideoId) {
      console.log('Profile: Starting YouTube playback', { songId, youtubeVideoId, startTime })
      setIsPlaying(true)
      setLoading(false)
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
        })
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
      
      // For YouTube, wait a bit longer for player to initialize
      const delay = youtubeVideoId ? 1500 : 800
      
      const timer = setTimeout(() => {
        console.log('Profile: Triggering auto-play for', songId)
        playSong(songId, startPlayback, stopPlayback)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [audioUrl, youtubeVideoId, songId, playSong, startPlayback, stopPlayback])

  // Sync with music context - actually start/stop playback
  useEffect(() => {
    if (currentPlayingId === songId && !isPlaying) {
      // Global context says this should be playing but local state disagrees
      console.log('Profile sync: starting playback for', songId)
      startPlayback()
    } else if (currentPlayingId !== songId && isPlaying) {
      // A different song is playing globally, stop this one
      console.log('Profile sync: stopping playback for', songId)
      stopPlayback()
    }
  }, [currentPlayingId, songId, isPlaying, startPlayback, stopPlayback])

  // Handle mute changes for audio files while playing
  useEffect(() => {
    if (audioRef.current && !youtubeVideoId) {
      audioRef.current.muted = isMuted
      audioRef.current.volume = isMuted ? 0 : 0.7
    }
  }, [isMuted, youtubeVideoId])

  const togglePlay = async () => {
    console.log('Profile play button clicked', { currentPlayingId, songId, isPlaying, youtubeVideoId, audioUrl })
    if (currentPlayingId === songId && isPlaying) {
      // Currently playing, so stop it
      console.log('Profile: Stopping playback')
      stopCurrentSong()
    } else {
      // Not playing, so start it
      console.log('Profile: Starting playback via playSong')
      // For immediate feedback, set loading state
      setLoading(true)
      playSong(songId, startPlayback, stopPlayback)
      // startPlayback will handle setting loading to false
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
          onReady={() => {
            // YouTube player is ready
            console.log('Profile: YouTube player ready for:', songId)
            youtubePlayerReadyRef.current = true
            // Don't trigger auto-play here - let the auto-play effect handle it
          }}
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
