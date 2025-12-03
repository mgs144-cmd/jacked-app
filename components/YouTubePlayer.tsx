'use client'

import { useEffect, useRef, useState } from 'react'

interface YouTubePlayerProps {
  videoId: string
  isPlaying: boolean
  startTime?: number
  isMuted?: boolean
  onReady?: () => void
  onPlay: () => void
  onPause: () => void
  onError?: (error: string) => void
}

export function YouTubePlayer({ videoId, isPlaying, startTime, isMuted = false, onReady, onPlay, onPause, onError }: YouTubePlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null)
  const youtubePlayerRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const methodsReadyRef = useRef(false) // Track if methods are actually available

  useEffect(() => {
    // Capture ref value at the start of the effect for cleanup
    const containerElement = playerRef.current
    let capturedContainer = containerElement
    
    // Load YouTube iframe API
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer()
      }
    } else if (window.YT.Player) {
      initializePlayer()
    }

    function initializePlayer() {
      if (!containerElement || !window.YT) return

      // Destroy existing player
      if (youtubePlayerRef.current) {
        try {
          // Check if container still exists before destroying
          if (containerElement && containerElement.parentNode) {
            // Clear container first
            if (containerElement.firstChild) {
              containerElement.innerHTML = ''
            }
            // Try destroy
            try {
              youtubePlayerRef.current.destroy()
            } catch (destroyError) {
              // Ignore destroy errors
            }
          }
        } catch (e) {
          // Ignore all errors
        }
        youtubePlayerRef.current = null
      }

      // Reset ready states
      setIsReady(false)
      methodsReadyRef.current = false

      try {
        youtubePlayerRef.current = new window.YT.Player(containerElement, {
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
            ...(startTime && startTime > 0 ? { start: startTime } : {}),
          },
          events: {
            onReady: () => {
              console.log('YouTube player onReady fired:', videoId)
              
              // Mark as ready immediately - methods should be available
              // Use multiple retries with increasing delays
              const checkMethods = (attempt: number = 0) => {
                if (!youtubePlayerRef.current) {
                  if (attempt < 5) {
                    setTimeout(() => checkMethods(attempt + 1), 200 * (attempt + 1))
                  } else {
                    console.error('Player ref lost after onReady')
                    onError?.('Player initialization failed')
                  }
                  return
                }

                const player = youtubePlayerRef.current
                // Check if methods exist
                if (typeof player.playVideo === 'function' && typeof player.pauseVideo === 'function') {
                  console.log('YouTube player methods confirmed available:', videoId)
                  methodsReadyRef.current = true
                  setIsReady(true)
                  onReady?.()
                } else if (attempt < 10) {
                  // Retry up to 10 times with increasing delays
                  setTimeout(() => checkMethods(attempt + 1), 300 * (attempt + 1))
                } else {
                  // After many retries, mark as ready anyway and let it fail gracefully
                  console.warn('Methods check timed out, marking as ready anyway:', videoId)
                  methodsReadyRef.current = true
                  setIsReady(true)
                  onReady?.()
                }
              }
              
              // Start checking after a short delay
              setTimeout(() => checkMethods(), 100)
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                onPlay()
              } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
                onPause()
              }
            },
            onError: (event: any) => {
              console.error('YouTube error:', event.data)
              onError?.('Failed to load video')
            },
          },
        })
      } catch (err) {
        console.error('Error creating player:', err)
        onError?.('Failed to initialize player')
      }
    }

    return () => {
      // Use captured ref value from start of effect
      if (youtubePlayerRef.current) {
        try {
          // Check if the container still exists in the DOM before destroying
          if (capturedContainer && capturedContainer.parentNode) {
            // Clear the container's innerHTML instead of destroy() to avoid DOM errors
            if (capturedContainer.firstChild) {
              capturedContainer.innerHTML = ''
            }
            // Try destroy, but don't fail if it errors
            try {
              youtubePlayerRef.current.destroy()
            } catch (destroyError) {
              // Ignore destroy errors - container may already be removed
            }
          }
        } catch (e) {
          // Ignore all cleanup errors
        }
        youtubePlayerRef.current = null
      }
      setIsReady(false)
      methodsReadyRef.current = false
    }
  }, [videoId, startTime, onReady, onPlay, onPause, onError])

  // Control playback - Try even if methods check hasn't completed
  useEffect(() => {
    if (!youtubePlayerRef.current) {
      return
    }

    const player = youtubePlayerRef.current

    const timeout = setTimeout(() => {
      try {
        // Check if methods exist, if not wait a bit more
        if (typeof player.playVideo !== 'function' || typeof player.pauseVideo !== 'function') {
          // Methods not ready yet, retry after a delay
          setTimeout(() => {
            if (!youtubePlayerRef.current) return
            const retryPlayer = youtubePlayerRef.current
            if (typeof retryPlayer.playVideo === 'function') {
              if (isPlaying) {
                retryPlayer.playVideo()
              } else {
                retryPlayer.pauseVideo()
              }
            }
          }, 500)
          return
        }

        if (isPlaying) {
          console.log('YouTube: Playing', videoId, 'isMuted:', isMuted)
          
          // Unmute first if needed
          if (!isMuted && typeof player.unMute === 'function') {
            player.unMute()
          } else if (isMuted && typeof player.mute === 'function') {
            player.mute()
          }
          
          // Seek if needed
          if (startTime && startTime > 0 && typeof player.seekTo === 'function') {
            player.seekTo(startTime, true)
          }
          
          // Play
          player.playVideo()
          console.log('YouTube: playVideo() called')
        } else {
          console.log('YouTube: Pausing', videoId)
          player.pauseVideo()
        }
      } catch (err) {
        console.error('Error controlling player:', err)
      }
    }, 100)

    return () => clearTimeout(timeout)
  }, [isPlaying, startTime, videoId, isMuted])

  // Handle mute changes separately
  useEffect(() => {
    if (!isReady || !methodsReadyRef.current || !youtubePlayerRef.current || !isPlaying) return

    const player = youtubePlayerRef.current
    const timeout = setTimeout(() => {
      try {
        if (isMuted && typeof player.mute === 'function') {
          player.mute()
        } else if (!isMuted && typeof player.unMute === 'function') {
          player.unMute()
        }
      } catch (err) {
        // Ignore mute errors
      }
    }, 100)

    return () => clearTimeout(timeout)
  }, [isMuted, isReady, isPlaying, videoId])

  return (
    <div 
      ref={playerRef}
      style={{ 
        position: 'absolute',
        width: '1px',
        height: '1px',
        opacity: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    />
  )
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}
