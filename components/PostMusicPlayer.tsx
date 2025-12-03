'use client'

import { useState, useRef, useEffect, useCallback, useRef as useRefAlias } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { YouTubePlayer } from './YouTubePlayer'
import { useMusic } from '@/app/providers/MusicProvider'

interface PostMusicPlayerProps {
  songTitle: string
  songArtist: string
  songUrl?: string
  spotifyId?: string
  albumArt?: string
  postId?: string // Unique ID for this post's song
  startTime?: number // Start time in seconds
}

export function PostMusicPlayer({ songTitle, songArtist, songUrl, spotifyId, albumArt, postId, startTime }: PostMusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  // Start muted on mobile for autoplay to work
  const [isMuted, setIsMuted] = useState(typeof window !== 'undefined' && window.innerWidth < 768)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isPlayingRef = useRef(false) // Track if we've triggered playback to prevent flashing
  const { currentPlayingId, playSong, stopCurrentSong } = useMusic()
  
  // Generate unique song ID for this post
  const songId = postId || `song-${songUrl || spotifyId || 'unknown'}`

  // Extract YouTube video ID from URL
  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/.*[?&]v=([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
      /(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/,
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    return null
  }

  useEffect(() => {
    // Determine audio URL for in-app playback
    if (songUrl) {
      // Check if it's a YouTube URL - use iframe player for in-app playback
      const youtubeId = extractYouTubeId(songUrl)
      if (youtubeId) {
        setYoutubeVideoId(youtubeId)
        setAudioUrl(null)
        return
      }
      
      // Check if URL contains youtube.com or youtu.be
      if (songUrl.includes('youtube.com') || songUrl.includes('youtu.be')) {
        const simpleMatch = songUrl.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)
        if (simpleMatch && simpleMatch[1]) {
          setYoutubeVideoId(simpleMatch[1])
          setAudioUrl(null)
          return
        }
      }

      // Check if it's a direct audio file URL
      const audioExtensions = ['.mp3', '.m4a', '.wav', '.ogg', '.aac', '.flac', '.webm']
      const isDirectAudio = audioExtensions.some(ext => songUrl.toLowerCase().endsWith(ext))
      
      // Spotify preview URLs
      const isSpotifyPreview = songUrl.includes('p.scdn.co') || 
                               songUrl.includes('preview') ||
                               (songUrl.includes('spotify') && songUrl.endsWith('.mp3'))
      
      // Supabase storage URLs
      const isSupabaseStorage = songUrl.includes('supabase.co') || songUrl.includes('storage')
      
      if (isDirectAudio || isSpotifyPreview || isSupabaseStorage) {
        setAudioUrl(songUrl)
        setYoutubeVideoId(null)
      } else if (songUrl.startsWith('http') && !songUrl.includes('open.spotify.com')) {
        setAudioUrl(songUrl)
        setYoutubeVideoId(null)
      } else {
        setAudioUrl(null)
        setYoutubeVideoId(null)
      }
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

  // Play function
  const startPlayback = useCallback(async () => {
    if (youtubeVideoId) {
      setIsPlaying(true)
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
      audioRef.current.volume = isMuted ? 0 : 0.7
      audioRef.current.muted = isMuted
      audioRef.current.crossOrigin = 'anonymous'
      // Ensure audio plays on mobile
      audioRef.current.setAttribute('playsinline', 'true')
      audioRef.current.setAttribute('webkit-playsinline', 'true')
      
      // Set start time if provided
      if (startTime && startTime > 0) {
        audioRef.current.addEventListener('loadedmetadata', () => {
          if (audioRef.current) {
            audioRef.current.currentTime = startTime
          }
        }, { once: true })
      }
      
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
        // Set start time after metadata is loaded
        if (startTime && startTime > 0 && audioRef.current) {
          audioRef.current.currentTime = startTime
        }
        // Actually play the audio - this is the reliable way on mobile
        if (audioRef.current) {
          audioRef.current.play().then(() => {
            console.log('Post: Audio play() succeeded in oncanplay')
            setIsPlaying(true)
          }).catch((err) => {
            console.error('Post: Failed to play audio after canplay:', err)
            setLoading(false)
          })
        }
      }

      // Try to play immediately (works on desktop)
      audioRef.current.play().then(() => {
        console.log('Post: Audio play() succeeded immediately')
        setIsPlaying(true)
        setLoading(false)
      }).catch((err) => {
        console.log('Post: Immediate play() failed (may need user interaction), will retry in oncanplay:', err)
        // Don't set error here - oncanplay will handle it
      })
    } catch (error: any) {
      console.error('Audio playback error:', error)
      setIsPlaying(false)
      setLoading(false)
      stopCurrentSong()
    }
  }, [youtubeVideoId, audioUrl, stopCurrentSong])

  // Stop function
  const stopPlayback = useCallback(() => {
    isControllingRef.current = true // Mark that we're controlling
    
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(false)
    setLoading(false)
    
    setTimeout(() => { isControllingRef.current = false }, 100) // Reset after state update
  }, [])

  // Intersection observer with debouncing to prevent rapid switching
  useEffect(() => {
    if (!containerRef.current || (!youtubeVideoId && !audioUrl)) return

    let debounceTimer: NodeJS.Timeout | null = null

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Clear any pending actions
        if (debounceTimer) {
          clearTimeout(debounceTimer)
          debounceTimer = null
        }

        // Only act after user stops scrolling (800ms delay)
        debounceTimer = setTimeout(() => {
          // Play if post is 80%+ visible and nothing else is playing
          if (entry.isIntersecting && entry.intersectionRatio >= 0.8 && currentPlayingId !== songId) {
            console.log('Post auto-playing (stable):', songId, 'ratio:', entry.intersectionRatio)
            playSong(songId, startPlayback, stopPlayback)
          } 
          // Stop if post is <30% visible and this is the current song
          else if (entry.intersectionRatio < 0.3 && currentPlayingId === songId) {
            console.log('Post stopping (not visible):', songId, 'ratio:', entry.intersectionRatio)
            stopCurrentSong()
          }
        }, 800) // Long delay to ensure user has stopped scrolling
      },
      {
        threshold: [0, 0.3, 0.8, 1], // Very strict thresholds
        rootMargin: '-15% 0px -15% 0px', // Only play when in center 70% of viewport
      }
    )

    observer.observe(containerRef.current)

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      observer.disconnect()
    }
  }, [youtubeVideoId, audioUrl, songId, currentPlayingId, playSong, stopCurrentSong, startPlayback, stopPlayback])

  // Sync with music context - actually start/stop playback
  useEffect(() => {
    // If global says this song should play but we're not playing, start
    if (currentPlayingId === songId && !isPlaying) {
      console.log('Post sync: Global says play, calling startPlayback', songId)
      startPlayback()
    } 
    // If global says something else is playing and we are playing, stop
    else if (currentPlayingId !== songId && isPlaying) {
      console.log('Post sync: Global says stop, calling stopPlayback', songId)
      stopPlayback()
    }
    // If states already match, do nothing
  }, [currentPlayingId, songId, isPlaying, startPlayback, stopPlayback])

  const handlePlayPause = () => {
    // Manual play should work independently of intersection observer
    if (currentPlayingId === songId && isPlaying) {
      console.log('Post: Manual stop')
      stopCurrentSong()
    } else {
      console.log('Post: Manual play')
      // Reset intersection observer flag to allow manual play
      isPlayingRef.current = true
      playSong(songId, startPlayback, stopPlayback)
    }
  }

  const toggleMute = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    
    if (audioRef.current) {
      audioRef.current.muted = newMutedState
      audioRef.current.volume = newMutedState ? 0 : 0.7
    }
    // Note: YouTube player mute is handled by the YouTubePlayer component via isMuted prop
  }

  // Don't render if no song info
  if (!songTitle && !songArtist) {
    return null
  }

  return (
    <div ref={containerRef} className="px-5 py-3 bg-gray-800/40 border-b border-gray-800/40 flex items-center space-x-3">
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm truncate">{songTitle || 'Unknown'}</p>
        <p className="text-gray-400 text-xs truncate">{songArtist || 'Unknown'}</p>
      </div>
      {(audioUrl || youtubeVideoId || songUrl) ? (
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePlayPause}
            disabled={loading}
            className="p-2 rounded-full bg-primary hover:bg-primary-dark text-white transition-all flex-shrink-0 hover:scale-110 disabled:opacity-50"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
          
          <button
            onClick={toggleMute}
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all flex-shrink-0 hover:scale-110"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>
      ) : null}
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
