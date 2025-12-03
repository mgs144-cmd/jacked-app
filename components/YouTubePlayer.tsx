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
            origin: window.location.origin,
            ...(startTime && startTime > 0 ? { start: startTime } : {}),
          },
          events: {
            onReady: () => {
              console.log('YouTube player ready:', videoId)
              setIsReady(true)
              onReady?.()
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
    }
  }, [videoId, startTime, onReady, onPlay, onPause, onError])

  // Control playback
  useEffect(() => {
    if (!isReady || !youtubePlayerRef.current) return

    const player = youtubePlayerRef.current

    // Wait a moment to ensure player is fully ready
    const timeout = setTimeout(() => {
      try {
        if (isPlaying) {
          if (startTime && startTime > 0 && typeof player.seekTo === 'function') {
            player.seekTo(startTime, true)
          }
          if (typeof player.playVideo === 'function') {
            player.playVideo()
          }
        } else {
          if (typeof player.pauseVideo === 'function') {
            player.pauseVideo()
          }
        }
      } catch (err) {
        console.error('Error controlling player:', err)
      }
    }, 100)

    return () => clearTimeout(timeout)
  }, [isPlaying, isReady, startTime])

  // Handle mute
  useEffect(() => {
    if (!isReady || !youtubePlayerRef.current) return

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
  }, [isMuted, isReady])

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
