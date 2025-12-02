'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause } from 'lucide-react'
import { YouTubePlayer } from './YouTubePlayer'

interface SongPreviewPlayerProps {
  songUrl?: string
  spotifyId?: string
  startTime: number | null
  onPreviewEnd?: () => void
}

export function SongPreviewPlayer({ songUrl, spotifyId, startTime, onPreviewEnd }: SongPreviewPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current)
      }
    }
  }, [songUrl, spotifyId])

  const playAudioPreview = useCallback(async (): Promise<void> => {
    if (!audioUrl || startTime === null) return

    try {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      audioRef.current = new Audio(audioUrl)
      audioRef.current.volume = 0.7
      audioRef.current.crossOrigin = 'anonymous'
      
      // Set start time
      audioRef.current.addEventListener('loadedmetadata', () => {
        if (audioRef.current && startTime !== null) {
          audioRef.current.currentTime = startTime
        }
      }, { once: true })

      audioRef.current.oncanplay = () => {
        if (audioRef.current && startTime !== null) {
          audioRef.current.currentTime = startTime
        }
      }

      await audioRef.current.play()
      setIsPlaying(true)

      // Play for 5 seconds
      previewTimeoutRef.current = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current = null
        }
        setIsPlaying(false)
        onPreviewEnd?.()
      }, 5000)
    } catch (error) {
      console.error('Preview playback error:', error)
      setIsPlaying(false)
    }
  }, [audioUrl, startTime, onPreviewEnd])

  // Auto-play preview when startTime changes
  useEffect(() => {
    if (startTime === null || startTime === undefined || startTime < 0) return
    if (!youtubeVideoId && !audioUrl) return

    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(false)

    // Start preview after a short delay
    const timer = setTimeout(() => {
      if (youtubeVideoId) {
        setIsPlaying(true)
        // Preview will play for 5 seconds
        previewTimeoutRef.current = setTimeout(() => {
          setIsPlaying(false)
          onPreviewEnd?.()
        }, 5000)
      } else if (audioUrl) {
        playAudioPreview()
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current)
      }
    }
  }, [startTime, youtubeVideoId, audioUrl, onPreviewEnd, playAudioPreview])

  // Don't render anything visible - this is just for audio preview
  return (
    <div style={{ display: 'none' }}>
      <audio ref={audioRef} src={audioUrl || undefined} />
      {youtubeVideoId && startTime !== null && startTime >= 0 && (
        <YouTubePlayer
          videoId={youtubeVideoId}
          isPlaying={isPlaying}
          startTime={startTime}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={(error) => {
            console.error('Preview YouTube player error:', error)
            setIsPlaying(false)
          }}
        />
      )}
    </div>
  )
}

