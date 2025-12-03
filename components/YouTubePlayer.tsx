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
      if (!playerRef.current || !window.YT) return

      // Destroy existing player
      if (youtubePlayerRef.current) {
        try {
          youtubePlayerRef.current.destroy()
        } catch (e) {
          // Ignore
        }
      }

      // Reset ready states
      setIsReady(false)
      methodsReadyRef.current = false

      try {
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
            ...(startTime && startTime > 0 ? { start: startTime } : {}),
          },
          events: {
            onReady: () => {
              console.log('YouTube player onReady fired:', videoId)
              
              // Wait a bit, then verify methods are available
              setTimeout(() => {
                if (!youtubePlayerRef.current) {
                  console.error('Player ref lost after onReady')
                  return
                }

                // Verify methods exist
                if (typeof youtubePlayerRef.current.playVideo === 'function' &&
                    typeof youtubePlayerRef.current.pauseVideo === 'function') {
                  console.log('YouTube player methods confirmed available:', videoId)
                  methodsReadyRef.current = true
                  setIsReady(true)
                  onReady?.()
                } else {
                  console.warn('Methods not available immediately, retrying...')
                  // Retry after longer delay
                  setTimeout(() => {
                    if (youtubePlayerRef.current &&
                        typeof youtubePlayerRef.current.playVideo === 'function' &&
                        typeof youtubePlayerRef.current.pauseVideo === 'function') {
                      console.log('YouTube player methods now available (retry):', videoId)
                      methodsReadyRef.current = true
                      setIsReady(true)
                      onReady?.()
                    } else {
                      console.error('YouTube player methods never became available')
                      onError?.('Player methods not available')
                    }
                  }, 1000)
                }
              }, 500) // Wait 500ms after onReady before checking methods
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
      if (youtubePlayerRef.current) {
        try {
          youtubePlayerRef.current.destroy()
        } catch (e) {
          // Ignore
        }
        youtubePlayerRef.current = null
      }
      setIsReady(false)
      methodsReadyRef.current = false
    }
  }, [videoId, startTime, onReady, onPlay, onPause, onError])

  // Control playback - ONLY after methods are confirmed ready
  useEffect(() => {
    if (!isReady || !methodsReadyRef.current || !youtubePlayerRef.current) {
      return
    }

    const player = youtubePlayerRef.current

    // Verify methods still exist before using them
    if (typeof player.playVideo !== 'function' || typeof player.pauseVideo !== 'function') {
      console.error('YouTube methods not available when trying to control playback')
      methodsReadyRef.current = false
      return
    }

    const timeout = setTimeout(() => {
      try {
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
  }, [isPlaying, isReady, startTime, videoId, isMuted])

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
