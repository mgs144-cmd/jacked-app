'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, Loader2 } from 'lucide-react'

interface YouTubePlayerProps {
  videoId: string
  isPlaying: boolean
  startTime?: number // Start time in seconds
  isMuted?: boolean // Mute state
  onReady?: () => void // Callback when player is ready
  onPlay: () => void
  onPause: () => void
  onError?: (error: string) => void
}

export function YouTubePlayer({ videoId, isPlaying, startTime, isMuted = false, onReady, onPlay, onPause, onError }: YouTubePlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null)
  const youtubePlayerRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const isControllingRef = useRef(false) // Track if we're programmatically controlling the player

  const initializePlayer = useCallback(() => {
    if (!playerRef.current) {
      console.log('Player ref not available')
      return
    }
    
    if (!window.YT) {
      console.log('YouTube API not loaded yet')
      return
    }

    // Don't re-initialize if player already exists with the same video ID
    if (youtubePlayerRef.current) {
      try {
        const currentVideoId = youtubePlayerRef.current.getVideoData?.()?.video_id
        if (currentVideoId === videoId && isReady) {
          console.log('YouTube player already initialized with same video ID, skipping re-initialization')
          return
        }
        // Video ID changed or player not ready, destroy and recreate
        youtubePlayerRef.current.destroy()
      } catch (e) {
        // Ignore cleanup errors, continue with initialization
      }
      youtubePlayerRef.current = null
    }

    // Reset ready state when video changes
    setIsReady(false)
    setLoading(true)

    try {
      console.log('Initializing YouTube player with video ID:', videoId)
      youtubePlayerRef.current = new window.YT.Player(playerRef.current, {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
          ...(startTime && startTime > 0 ? { start: startTime } : {}), // Add start time if provided
        },
        events: {
          onReady: (event: any) => {
            console.log('YouTube player ready event fired')
            // Wait a bit for the player methods to actually be available
            setTimeout(() => {
              if (youtubePlayerRef.current && 
                  typeof youtubePlayerRef.current.playVideo === 'function' &&
                  typeof youtubePlayerRef.current.pauseVideo === 'function') {
                console.log('YouTube player methods confirmed available')
                setLoading(false)
                setError(null)
                setIsReady(true)
                setLoading(false) // Player is ready, stop loading
                isControllingRef.current = false // Reset control flag
                // Notify parent that player is ready
                onReady?.()
                // If we should be playing, trigger it now that we're ready
                // This helps with profile auto-play
                if (isPlaying) {
                  console.log('Player ready and should be playing, triggering playVideo', { startTime })
                  // Small delay to ensure everything is set up
                  setTimeout(() => {
                    try {
                      isControllingRef.current = true
                      // If start time is set, seek to that position first
                      if (startTime && startTime > 0) {
                        youtubePlayerRef.current.seekTo(startTime, true)
                      }
                      youtubePlayerRef.current.playVideo()
                    } catch (err) {
                      console.error('Error playing on ready:', err)
                    }
                  }, 100)
                }
              } else {
                console.warn('YouTube player ready but methods not available yet, retrying...')
                // Retry after another short delay
                setTimeout(() => {
                  if (youtubePlayerRef.current && 
                      typeof youtubePlayerRef.current.playVideo === 'function' &&
                      typeof youtubePlayerRef.current.pauseVideo === 'function') {
                    console.log('YouTube player methods now available')
                    setLoading(false)
                    setError(null)
                    setIsReady(true)
                    setLoading(false) // Player is ready, stop loading
                    isControllingRef.current = false
                    // Notify parent that player is ready
                    onReady?.()
                    // If we should be playing, trigger it now
                    if (isPlaying) {
                      console.log('Player ready (retry) and should be playing, triggering playVideo', { startTime })
                      // Small delay to ensure everything is set up
                      setTimeout(() => {
                        try {
                          isControllingRef.current = true
                          // If start time is set, seek to that position first
                          if (startTime && startTime > 0) {
                            youtubePlayerRef.current.seekTo(startTime, true)
                          }
                          youtubePlayerRef.current.playVideo()
                        } catch (err) {
                          console.error('Error playing on ready (retry):', err)
                        }
                      }, 100)
                    }
                  } else {
                    console.error('YouTube player methods still not available')
                    setError('YouTube player initialization incomplete')
                  }
                }, 500)
              }
            }, 200)
          },
          onError: (event: any) => {
            console.error('YouTube player error:', event.data)
            setLoading(false)
            const errorMsg = 'Failed to load video. The video may be unavailable or restricted.'
            setError(errorMsg)
            onError?.(errorMsg)
            isControllingRef.current = false
          },
          onStateChange: (event: any) => {
            // Only update state if we're not programmatically controlling
            if (isControllingRef.current) {
              console.log('Ignoring state change - we are controlling the player')
              isControllingRef.current = false // Reset after handling
              return
            }

            console.log('YouTube player state changed:', event.data)
            // YT.PlayerState.PLAYING = 1
            // YT.PlayerState.PAUSED = 2
            // YT.PlayerState.ENDED = 0
            // YT.PlayerState.CUED = 5
            if (event.data === window.YT.PlayerState.PLAYING) {
              console.log('YouTube video is playing')
              onPlay()
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              console.log('YouTube video is paused')
              onPause()
            } else if (event.data === window.YT.PlayerState.ENDED) {
              console.log('YouTube video ended')
              onPause()
            }
          },
        },
      })
    } catch (err: any) {
      console.error('Error initializing YouTube player:', err)
      setLoading(false)
      const errorMsg = err.message || 'Failed to initialize YouTube player'
      setError(errorMsg)
      onError?.(errorMsg)
    }
  }, [videoId, isReady, onReady, onPlay, onPause, onError])

  useEffect(() => {
    // Load YouTube iframe API script
    if (!window.YT) {
      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
      if (!existingScript) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
      }

      // Wait for API to load (use existing callback or create new one)
      const originalCallback = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        if (originalCallback) originalCallback()
        initializePlayer()
      }
      
      // If API is already loaded, initialize immediately
      if (window.YT && window.YT.Player) {
        initializePlayer()
      }
    } else {
      // API is already loaded, initialize immediately
      initializePlayer()
    }

    return () => {
      if (youtubePlayerRef.current) {
        try {
          youtubePlayerRef.current.destroy()
        } catch (e) {
          // Ignore cleanup errors
        }
        youtubePlayerRef.current = null
      }
      setIsReady(false)
    }
  }, [videoId, initializePlayer])

  useEffect(() => {
    if (!youtubePlayerRef.current || !isReady) {
      console.log('YouTube player not ready yet', { hasPlayer: !!youtubePlayerRef.current, isReady })
      return
    }

    // Check if player has the methods we need
    if (typeof youtubePlayerRef.current.playVideo !== 'function' || 
        typeof youtubePlayerRef.current.pauseVideo !== 'function') {
      console.error('YouTube player methods not available', {
        hasPlayVideo: typeof youtubePlayerRef.current.playVideo,
        hasPauseVideo: typeof youtubePlayerRef.current.pauseVideo,
        playerState: youtubePlayerRef.current.getPlayerState?.()
      })
      onError?.('YouTube player not properly initialized')
      return
    }

    // Get current player state to avoid unnecessary calls
    try {
      const currentState = youtubePlayerRef.current.getPlayerState()
      const shouldBePlaying = isPlaying
      const isCurrentlyPlaying = currentState === window.YT.PlayerState.PLAYING

      // Only control if state doesn't match
      if (shouldBePlaying && !isCurrentlyPlaying) {
        console.log('Playing YouTube video:', videoId, 'with start time:', startTime)
        isControllingRef.current = true // Set flag before controlling
        // If start time is set, seek to that position first
        if (startTime && startTime > 0) {
          youtubePlayerRef.current.seekTo(startTime, true)
        }
        youtubePlayerRef.current.playVideo()
      } else if (!shouldBePlaying && isCurrentlyPlaying) {
        console.log('Pausing YouTube video:', videoId)
        isControllingRef.current = true // Set flag before controlling
        youtubePlayerRef.current.pauseVideo()
      } else {
        console.log('Player state already matches desired state', { shouldBePlaying, isCurrentlyPlaying })
      }
    } catch (err) {
      console.error('Error controlling YouTube player:', err)
      isControllingRef.current = false
      onError?.(`Failed to control playback: ${err}`)
    }
  }, [isPlaying, videoId, onError, isReady, startTime])

  // Handle mute changes
  useEffect(() => {
    if (!youtubePlayerRef.current || !isReady) return

    try {
      if (isMuted) {
        youtubePlayerRef.current.mute()
      } else {
        youtubePlayerRef.current.unMute()
      }
    } catch (err) {
      console.error('Error muting/unmuting YouTube player:', err)
    }
  }, [isMuted, isReady])

  return (
    <div 
      className="relative" 
      style={{ 
        position: 'absolute',
        width: '1px',
        height: '1px',
        opacity: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      <div ref={playerRef} style={{ width: '100%', height: '100%' }} />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/50 text-red-400 text-sm p-2 text-center">
          {error}
        </div>
      )}
    </div>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

