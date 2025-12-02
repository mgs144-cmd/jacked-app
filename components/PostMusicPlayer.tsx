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
  const [isMuted, setIsMuted] = useState(false)
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

  // Stop function
  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(false)
    setLoading(false)
  }, [])

  // Intersection Observer for auto-play (Instagram style)
  // Improved to handle scrolling between posts better, especially on mobile
  useEffect(() => {
    if (!containerRef.current || (!youtubeVideoId && !audioUrl)) return

    let timeoutId: NodeJS.Timeout | null = null
    let lastVisibleRatio = 0
    let mostVisiblePost: { songId: string; ratio: number } | null = null

    // Detect if we're on mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const currentRatio = entry.intersectionRatio
          
          // Clear any pending timeouts
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }

          // On mobile, use different logic - only play if post is clearly most visible
          if (isMobile) {
            // Only play if post is 50%+ visible and more visible than before
            if (entry.isIntersecting && currentRatio >= 0.5 && currentRatio > lastVisibleRatio && currentPlayingId !== songId && !isPlayingRef.current) {
              isPlayingRef.current = true
              lastVisibleRatio = currentRatio
              timeoutId = setTimeout(() => {
                if (currentPlayingId !== songId && entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                  console.log('Post auto-playing (mobile):', songId, 'ratio:', entry.intersectionRatio)
                  playSong(songId, startPlayback, stopPlayback)
                } else {
                  isPlayingRef.current = false
                }
              }, 600) // Longer delay on mobile to prevent rapid switching
            } else if ((!entry.isIntersecting || currentRatio < 0.2) && currentPlayingId === songId) {
              isPlayingRef.current = false
              lastVisibleRatio = 0
              timeoutId = setTimeout(() => {
                if (currentPlayingId === songId) {
                  console.log('Post stopping (mobile, not visible):', songId)
                  stopCurrentSong()
                }
              }, 600)
            } else if (entry.isIntersecting) {
              lastVisibleRatio = currentRatio
            }
          } else {
          // Desktop logic - more strict
          entries.forEach((entry) => {
            const currentRatio = entry.intersectionRatio
            
            // Clear any pending timeouts
            if (timeoutId) {
              clearTimeout(timeoutId)
              timeoutId = null
            }

            // Only play if post is in the center of viewport (70%+ visible) and more visible than before
            if (entry.isIntersecting && currentRatio >= 0.7 && currentRatio > lastVisibleRatio && currentPlayingId !== songId && !isPlayingRef.current) {
              isPlayingRef.current = true
              lastVisibleRatio = currentRatio
              timeoutId = setTimeout(() => {
                if (currentPlayingId !== songId && entry.isIntersecting && entry.intersectionRatio >= 0.7) {
                  console.log('Post auto-playing (desktop):', songId, 'ratio:', entry.intersectionRatio)
                  playSong(songId, startPlayback, stopPlayback)
                } else {
                  isPlayingRef.current = false
                }
              }, 400)
            } else if ((!entry.isIntersecting || currentRatio < 0.2) && currentPlayingId === songId) {
              isPlayingRef.current = false
              lastVisibleRatio = 0
              timeoutId = setTimeout(() => {
                if (currentPlayingId === songId) {
                  console.log('Post stopping (desktop, not visible):', songId)
                  stopCurrentSong()
                }
              }, 400)
            } else if (entry.isIntersecting) {
              lastVisibleRatio = currentRatio
            }
          })
        }
      },
      {
        threshold: isMobile ? [0, 0.2, 0.5, 0.8, 1] : [0, 0.2, 0.5, 0.7, 1], // Different thresholds for mobile
        rootMargin: isMobile ? '-20% 0px -20% 0px' : '-30% 0px -30% 0px', // Less strict on mobile
      }
    )

    observer.observe(containerRef.current)

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      observer.disconnect()
      isPlayingRef.current = false
      lastVisibleRatio = 0
      mostVisiblePost = null
    }
  }, [youtubeVideoId, audioUrl, songId, currentPlayingId, playSong, stopCurrentSong, startPlayback, stopPlayback])

  // Sync with music context - prevent rapid toggling
  useEffect(() => {
    // Only sync if there's an actual change
    if (currentPlayingId === songId && !isPlaying) {
      // This song should be playing but isn't
      isPlayingRef.current = true // Set flag to prevent intersection observer from triggering again
      startPlayback()
    } else if (currentPlayingId !== songId && isPlaying) {
      // A different song is playing, stop this one
      isPlayingRef.current = false // Reset flag
      stopPlayback()
    } else if (currentPlayingId === songId && isPlaying) {
      // Song is playing correctly - ensure flag is set
      isPlayingRef.current = true
    } else {
      // Song is not playing and shouldn't be - reset flag
      isPlayingRef.current = false
    }
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
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      audioRef.current.volume = !isMuted ? 0.7 : 0
      setIsMuted(!isMuted)
    }
    // Note: YouTube player mute is handled by the YouTubePlayer component
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
          
          {isPlaying && (
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
          )}
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
