'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Music } from 'lucide-react'
import Image from 'next/image'

interface PostMusicPlayerProps {
  songTitle: string
  songArtist: string
  songUrl?: string
  spotifyId?: string
  albumArt?: string
}

export function PostMusicPlayer({ songTitle, songArtist, songUrl, spotifyId, albumArt }: PostMusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Determine audio URL for in-app playback
    if (songUrl) {
      // Check if it's a direct audio file URL (common audio extensions)
      const audioExtensions = ['.mp3', '.m4a', '.wav', '.ogg', '.aac', '.flac', '.webm']
      const isDirectAudio = audioExtensions.some(ext => songUrl.toLowerCase().endsWith(ext))
      
      // Spotify preview URLs are typically from p.scdn.co or contain "preview" or are direct MP3s
      // Also check for ec-media.soundcloud.com which Spotify sometimes uses
      const isSpotifyPreview = songUrl.includes('p.scdn.co') || 
                               songUrl.includes('ec-media.soundcloud.com') ||
                               songUrl.includes('preview') ||
                               (songUrl.includes('spotify') && songUrl.endsWith('.mp3')) ||
                               (songUrl.includes('spotify') && songUrl.includes('preview'))
      
      // Supabase storage URLs
      const isSupabaseStorage = songUrl.includes('supabase.co') || songUrl.includes('storage')
      
      if (isDirectAudio) {
        console.log('Direct audio file detected:', songUrl)
        setAudioUrl(songUrl)
      } else if (isSpotifyPreview) {
        // Spotify preview URL - these are direct MP3 URLs that can be played
        console.log('Spotify preview URL detected:', songUrl)
        setAudioUrl(songUrl)
      } else if (isSupabaseStorage) {
        // Supabase storage URL - try to play it
        console.log('Supabase storage URL detected:', songUrl)
        setAudioUrl(songUrl)
      } else if (songUrl.startsWith('http') && !songUrl.includes('youtube.com') && !songUrl.includes('youtu.be')) {
        // Try other HTTP URLs (might be direct audio links)
        console.log('Trying to use URL as audio:', songUrl)
        setAudioUrl(songUrl)
      } else {
        // YouTube links or other non-playable URLs
        console.log('URL not playable in-app:', songUrl)
        setAudioUrl(null)
      }
    } else {
      console.log('No songUrl provided')
      setAudioUrl(null)
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [songUrl, spotifyId])

  const handlePlayPause = async () => {
    // Handle YouTube URLs - open in new tab
    if (songUrl && (songUrl.includes('youtube.com') || songUrl.includes('youtu.be'))) {
      window.open(songUrl, '_blank')
      return
    }

    // Handle Spotify URLs without previews - open in Spotify
    if (songUrl && songUrl.includes('open.spotify.com') && !audioUrl) {
      window.open(songUrl, '_blank')
      return
    }

    // If no audio URL available, show helpful message
    if (!audioUrl) {
      console.log('No audio URL available for playback. songUrl:', songUrl)
      if (songUrl) {
        // If it's a Spotify link, open it
        if (songUrl.includes('open.spotify.com')) {
          window.open(songUrl, '_blank')
          return
        }
        // If it's a YouTube link, open it
        if (songUrl.includes('youtube.com') || songUrl.includes('youtu.be')) {
          window.open(songUrl, '_blank')
          return
        }
        alert(`Audio URL detected but not playable: ${songUrl}\n\nThis song doesn't have a preview clip. It will open in Spotify when played.`)
      } else {
        alert('No audio URL available. Please upload an audio file or provide a direct audio link.')
      }
      return
    }

    try {
      // If already playing, pause it
      if (isPlaying && audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
        return
      }

      setLoading(true)

      // Create new audio element
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      console.log('Creating audio element with URL:', audioUrl)
      audioRef.current = new Audio(audioUrl)
      audioRef.current.volume = 0.7
      audioRef.current.crossOrigin = 'anonymous' // Help with CORS issues
      
      audioRef.current.onended = () => {
        console.log('Audio playback ended')
        setIsPlaying(false)
        setLoading(false)
        if (audioRef.current) {
          audioRef.current = null
        }
      }
      
      audioRef.current.onerror = (e) => {
        console.error('Audio playback error:', e, 'URL:', audioUrl)
        setIsPlaying(false)
        setLoading(false)
        alert(`Failed to play audio. The URL might not be accessible or might be blocked by CORS.\n\nURL: ${audioUrl}\n\nTry uploading an audio file directly instead of using a link.`)
        if (audioRef.current) {
          audioRef.current = null
        }
      }
      
      audioRef.current.onloadstart = () => {
        console.log('Audio loading started')
      }
      
      audioRef.current.oncanplay = () => {
        console.log('Audio can play')
        setLoading(false)
      }
      
      audioRef.current.onloadeddata = () => {
        console.log('Audio data loaded')
      }

      console.log('Attempting to play audio')
      await audioRef.current.play()
      setIsPlaying(true)
      setLoading(false)
      console.log('Audio playing successfully')
    } catch (error: any) {
      console.error('Audio playback error:', error)
      setIsPlaying(false)
      setLoading(false)
      const errorMsg = error.message || 'Unknown error'
      alert(`Failed to play audio: ${errorMsg}\n\nURL: ${audioUrl}\n\nMake sure:\n1. The URL is a direct link to an audio file\n2. The file is accessible (not blocked by CORS)\n3. Try uploading an audio file directly instead.`)
      if (audioRef.current) {
        audioRef.current = null
      }
    }
  }

  // Don't render if no song info
  if (!songTitle && !songArtist) {
    return null
  }

  return (
    <div className="px-5 py-3 bg-gray-800/40 border-b border-gray-800/40 flex items-center space-x-3">
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
        {songUrl && (
          <p className="text-gray-500 text-xs truncate mt-1" title={songUrl}>
            {songUrl.length > 40 ? `${songUrl.substring(0, 40)}...` : songUrl}
          </p>
        )}
      </div>
      {audioUrl || (songUrl && (songUrl.includes('youtube.com') || songUrl.includes('youtu.be'))) ? (
        <button
          onClick={handlePlayPause}
          disabled={loading}
          className="p-2 rounded-full bg-primary hover:bg-primary-dark text-white transition-all flex-shrink-0 hover:scale-110 disabled:opacity-50"
          title={songUrl && (songUrl.includes('youtube.com') || songUrl.includes('youtu.be')) ? 'Open in YouTube' : 'Play audio'}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : songUrl && (songUrl.includes('youtube.com') || songUrl.includes('youtu.be')) ? (
            <Play className="w-4 h-4" />
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
    </div>
  )
}
