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
  // Start unmuted - user can mute if needed
  const [isMuted, setIsMuted] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isPlayingRef = useRef(false) // Track if we've triggered playback to prevent flashing
  const isControllingRef = useRef(false) // Track if we're programmatically controlling playback
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

  // Play function - simplified for reliability
  const startPlayback = useCallback(async () => {
    if (youtubeVideoId) {
      console.log('Post: Starting YouTube playback', { songId, youtubeVideoId, startTime })
      setIsPlaying(true)
      setLoading(false)
      // YouTube player will handle actual playback via isPlaying prop
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
        if (!isControllingRef.current) {
          setIsPlaying(false)
        }
      }
      
      audio.onended = () => {
        setIsPlaying(false)
        setLoading(false)
        stopCurrentSong()
      }
      
      audio.onerror = () => {
        console.error('Post: Audio error')
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
          console.error('Post: Play failed:', err)
          setLoading(false)
        })
      }, { once: true })
      
      // Also try to load immediately
      audio.load()
      
    } catch (error: any) {
      console.error('Post: Audio playback error:', error)
      setIsPlaying(false)
      setLoading(false)
      stopCurrentSong()
    }
  }, [youtubeVideoId, audioUrl, stopCurrentSong, isMuted, startTime])

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

  // Detect mobile device
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  // Intersection observer for auto-play (Instagram style)
  // DISABLED on mobile - requires user interaction
  useEffect(() => {
    // Don't autoplay on mobile - requires user interaction
    if (isMobile) return
    
    if (!containerRef.current || (!youtubeVideoId && !audioUrl)) return

    let debounceTimer: NodeJS.Timeout | null = null
    let lastRatio = 0
    let isStable = false // Track if post has been stable for a while

    const observer = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry.intersectionRatio
        const isVisible = entry.isIntersecting
        
        // Clear any pending actions
        if (debounceTimer) {
          clearTimeout(debounceTimer)
          debounceTimer = null
        }

        // Only act if ratio is stable (not changing rapidly)
        const ratioChanged = Math.abs(ratio - lastRatio) > 0.1
        if (ratioChanged) {
          isStable = false
          lastRatio = ratio
        }

        // Act after user stops scrolling AND ratio is stable (1500ms delay)
        debounceTimer = setTimeout(() => {
          // Mark as stable after delay
          isStable = true
          
          // Only play if post is 80%+ visible, nothing else is playing, and it's been stable
          if (isVisible && ratio >= 0.8 && currentPlayingId !== songId && isStable) {
            console.log('Post auto-playing (stable):', songId, 'ratio:', ratio)
            playSong(songId, startPlayback, stopPlayback)
          } 
          // Stop if post is <20% visible and this is the current song
          else if (ratio < 0.2 && currentPlayingId === songId) {
            console.log('Post stopping (not visible):', songId, 'ratio:', ratio)
            stopCurrentSong()
          }
        }, 1500) // Long delay to ensure user has stopped scrolling
      },
      {
        threshold: [0, 0.2, 0.8, 1], // Very strict thresholds
        rootMargin: '-25% 0px -25% 0px', // Only play when in center 50% of viewport
      }
    )

    observer.observe(containerRef.current)

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      observer.disconnect()
      lastRatio = 0
      isStable = false
    }
  }, [youtubeVideoId, audioUrl, songId, currentPlayingId, playSong, stopCurrentSong, startPlayback, stopPlayback, isMobile])

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
      console.log('Post: Manual play - calling playSong', { songId, youtubeVideoId, audioUrl })
      // Reset intersection observer flag to allow manual play
      isPlayingRef.current = true
      playSong(songId, startPlayback, stopPlayback)
      
      // Force playback to start immediately if it doesn't
      setTimeout(() => {
        if (currentPlayingId === songId && !isPlaying) {
          console.log('Post: Force starting playback after manual play')
          startPlayback()
        }
      }, 200)
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
