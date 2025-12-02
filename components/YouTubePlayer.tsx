'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, Loader2 } from 'lucide-react'

interface YouTubePlayerProps {
  videoId: string
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onError?: (error: string) => void
}

export function YouTubePlayer({ videoId, isPlaying, onPlay, onPause, onError }: YouTubePlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null)
  const youtubePlayerRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  const initializePlayer = useCallback(() => {
    if (!playerRef.current) {
      console.log('Player ref not available')
      return
    }
    
    if (!window.YT) {
      console.log('YouTube API not loaded yet')
      return
    }

    // Destroy existing player if it exists
    if (youtubePlayerRef.current) {
      try {
        youtubePlayerRef.current.destroy()
      } catch (e) {
        // Ignore cleanup errors
      }
      youtubePlayerRef.current = null
    }

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
        },
        events: {
          onReady: (event: any) => {
            console.log('YouTube player ready')
            setLoading(false)
            setError(null)
            setIsReady(true)
          },
          onError: (event: any) => {
            console.error('YouTube player error:', event.data)
            setLoading(false)
            const errorMsg = 'Failed to load video. The video may be unavailable or restricted.'
            setError(errorMsg)
            onError?.(errorMsg)
          },
          onStateChange: (event: any) => {
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
  }, [videoId, onPlay, onPause, onError])

  useEffect(() => {
    // Load YouTube iframe API script
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      // Wait for API to load
      window.onYouTubeIframeAPIReady = () => {
        initializePlayer()
      }
    } else {
      initializePlayer()
    }

    return () => {
      if (youtubePlayerRef.current) {
        try {
          youtubePlayerRef.current.destroy()
        } catch (e) {
          // Ignore cleanup errors
        }
      }
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
      console.error('YouTube player methods not available')
      onError?.('YouTube player not properly initialized')
      return
    }

    try {
      if (isPlaying) {
        console.log('Playing YouTube video:', videoId)
        youtubePlayerRef.current.playVideo()
      } else {
        console.log('Pausing YouTube video:', videoId)
        youtubePlayerRef.current.pauseVideo()
      }
    } catch (err) {
      console.error('Error controlling YouTube player:', err)
      onError?.(`Failed to control playback: ${err}`)
    }
  }, [isPlaying, videoId, onError, isReady])

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

