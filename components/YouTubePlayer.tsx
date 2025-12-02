'use client'

import { useEffect, useRef, useState } from 'react'
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
  }, [videoId])

  const initializePlayer = () => {
    if (!playerRef.current || !window.YT) return

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
          showinfo: 0,
        },
        events: {
          onReady: (event: any) => {
            setLoading(false)
            setError(null)
          },
          onError: (event: any) => {
            setLoading(false)
            const errorMsg = 'Failed to load video. The video may be unavailable or restricted.'
            setError(errorMsg)
            onError?.(errorMsg)
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.PLAYING = 1
            // YT.PlayerState.PAUSED = 2
            if (event.data === window.YT.PlayerState.PLAYING) {
              onPlay()
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              onPause()
            }
          },
        },
      })
    } catch (err: any) {
      setLoading(false)
      const errorMsg = err.message || 'Failed to initialize YouTube player'
      setError(errorMsg)
      onError?.(errorMsg)
    }
  }

  useEffect(() => {
    if (!youtubePlayerRef.current) return

    try {
      if (isPlaying) {
        youtubePlayerRef.current.playVideo()
      } else {
        youtubePlayerRef.current.pauseVideo()
      }
    } catch (err) {
      console.error('Error controlling YouTube player:', err)
    }
  }, [isPlaying])

  return (
    <div className="relative w-full" style={{ display: 'none' }}>
      <div ref={playerRef} className="w-full h-full" />
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

