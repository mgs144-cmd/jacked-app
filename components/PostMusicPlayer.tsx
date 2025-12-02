'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Music } from 'lucide-react'
import Image from 'next/image'
import { YouTubePlayer } from './YouTubePlayer'
import { useMusic } from '@/app/providers/MusicProvider'

interface PostMusicPlayerProps {
  songTitle: string
  songArtist: string
  songUrl?: string
  spotifyId?: string
  albumArt?: string
  postId?: string // Unique ID for this post's song
}

export function PostMusicPlayer({ songTitle, songArtist, songUrl, spotifyId, albumArt, postId }: PostMusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
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
  const startPlayback = async () => {
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
      audioRef.current.volume = 0.7
      audioRef.current.crossOrigin = 'anonymous'
      
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
  }

  // Stop function
  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(false)
    setLoading(false)
  }

  // Intersection Observer for auto-play (Instagram style)
  useEffect(() => {
    if (!containerRef.current || (!youtubeVideoId && !audioUrl)) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            // Post is visible - auto-play if not already playing
            if (currentPlayingId !== songId) {
              playSong(songId, startPlayback, stopPlayback)
            }
          } else {
            // Post is not visible - stop if this is the current song
            if (currentPlayingId === songId) {
              stopCurrentSong()
            }
          }
        })
      },
      {
        threshold: [0, 0.5, 1],
        rootMargin: '-20% 0px -20% 0px', // Only play when in center 60% of viewport
      }
    )

    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [youtubeVideoId, audioUrl, songId, currentPlayingId, playSong, stopCurrentSong])

  // Sync with music context
  useEffect(() => {
    if (currentPlayingId === songId) {
      if (!isPlaying) {
        startPlayback()
      }
    } else {
      if (isPlaying) {
        stopPlayback()
      }
    }
  }, [currentPlayingId, songId])

  const handlePlayPause = () => {
    if (currentPlayingId === songId) {
      stopCurrentSong()
    } else {
      playSong(songId, startPlayback, stopPlayback)
    }
  }

  // Don't render if no song info
  if (!songTitle && !songArtist) {
    return null
  }

  return (
    <div ref={containerRef} className="px-5 py-3 bg-gray-800/40 border-b border-gray-800/40 flex items-center space-x-3">
      {albumArt ? (
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ring-2 ring-gray-700">
          <Image
            src={albumArt}
            alt={`${songTitle} album art`}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
          <Music className="w-6 h-6 text-white" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm truncate">{songTitle || 'Unknown'}</p>
        <p className="text-gray-400 text-xs truncate">{songArtist || 'Unknown'}</p>
      </div>
      {(audioUrl || youtubeVideoId || songUrl) ? (
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
      ) : (
        <div className="p-2 rounded-full bg-gray-700 text-gray-500 flex-shrink-0" title="No playable audio URL">
          <Music className="w-4 h-4" />
        </div>
      )}
      <audio ref={audioRef} src={audioUrl || undefined} style={{ display: 'none' }} />
      {youtubeVideoId && (
        <YouTubePlayer
          videoId={youtubeVideoId}
          isPlaying={isPlaying}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={(error) => {
            console.error('YouTube player error:', error)
            setLoading(false)
            stopCurrentSong()
          }}
        />
      )}
    </div>
  )
}
