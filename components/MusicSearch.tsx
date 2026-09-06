'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Music, Search, Loader2, Play } from 'lucide-react'

interface Track {
  id: string
  name: string
  artist: string
  album?: string
  preview_url?: string
  stream_url?: string
  permalink_url?: string
  artwork_url?: string
  external_urls: {
    spotify?: string
    youtube?: string
  }
  album_image?: string
  source?: 'spotify' | 'youtube'
}

interface MusicSearchProps {
  onSelect: (song: { title: string; artist: string; url?: string; spotifyId?: string; albumArt?: string }) => void
  selectedSong?: { title: string; artist: string; url?: string; spotifyId?: string; albumArt?: string } | null
  onSelectComplete?: () => void // Callback when selection is complete
}

export function MusicSearch({ onSelect, selectedSong, onSelectComplete }: MusicSearchProps) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [tracks, setTracks] = useState<Track[]>([])
  const [error, setError] = useState<string | null>(null)

  const [searchSource, setSearchSource] = useState<'spotify' | 'youtube'>('youtube')

  const searchSongs = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setSearching(true)
    setError(null)
    setTracks([])

    try {
      // Try YouTube first (best for in-app playback via iframe)
      const youtubeResponse = await fetch(`/api/search-youtube?q=${encodeURIComponent(searchQuery)}`)
      const youtubeData = await youtubeResponse.json()

      if (youtubeData.tracks && youtubeData.tracks.length > 0) {
        setSearchSource('youtube')
        setTracks(youtubeData.tracks)
        setError(null)
        setSearching(false)
        return
      }

      // Fallback to Spotify for discovery
      const spotifyResponse = await fetch(`/api/search-music?q=${encodeURIComponent(searchQuery)}`)
      const spotifyData = await spotifyResponse.json()

      console.log('Spotify API response:', {
        status: spotifyResponse.status,
        ok: spotifyResponse.ok,
        hasError: !!spotifyData.error,
        error: spotifyData.error,
        tracksCount: spotifyData.tracks?.length || 0,
        debug: spotifyData.debug,
      })

      // Check if Spotify credentials are missing
      if (spotifyData.error && spotifyData.error.includes('not configured')) {
        setError('⚠️ Spotify API not configured.\n\nPlease add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to Vercel environment variables.\n\nOnly Spotify tracks with preview clips can be played in-app.')
        setTracks([])
        setSearching(false)
        return
      }

      // Check for other Spotify errors - no YouTube fallback for in-app playback only
      if (spotifyData.error && !spotifyData.error.includes('not configured')) {
        console.error('Spotify API error:', spotifyData.error)
        setError(`Spotify error: ${spotifyData.error}\n\nOnly Spotify tracks with preview clips can be played in-app.`)
        setTracks([])
        setSearching(false)
        return
      }

      // Spotify deprecated preview_url - show tracks anyway with note
      if (spotifyData.tracks && spotifyData.tracks.length > 0) {
        setSearchSource('spotify')
        setTracks(spotifyData.tracks)
        if (spotifyData.note) {
          setError(`⚠️ ${spotifyData.note}\n\n💡 Best for in-app playback: Use the "Upload" tab to upload MP3 files directly!`)
        } else {
          setError(null)
        }
        setSearching(false)
        return
      }

      // No tracks returned from Spotify
      if (!spotifyData.tracks || spotifyData.tracks.length === 0) {
        console.log('Spotify returned no tracks with previews')
        setError(spotifyData.error || `No songs with preview clips found for "${searchQuery}".\n\nTry:\n• A different song or artist\n• Some songs don't have preview clips available`)
        setTracks([])
        setSearching(false)
        return
      }
    } catch (err: any) {
      console.error('Search error:', err)
      setError(`Failed to search Spotify: ${err.message || 'Unknown error'}\n\nOnly Spotify tracks with preview clips can be played in-app.`)
      setTracks([])
      setSearching(false)
    }
  }

  const tryYouTubeFallback = async (searchQuery: string) => {
    try {
      setSearchSource('youtube')
      const youtubeResponse = await fetch(`/api/search-youtube?q=${encodeURIComponent(searchQuery)}`)
      const youtubeData = await youtubeResponse.json()
      
      console.log('YouTube response:', youtubeData)

      if (!youtubeResponse.ok) {
        throw new Error(youtubeData.error || 'Failed to search YouTube')
      }

      if (youtubeData.tracks && youtubeData.tracks.length > 0) {
        setTracks(youtubeData.tracks)
        setError(null)
      } else {
        // No results from either source
        const errorMsg = youtubeData.error 
          ? `YouTube search failed: ${youtubeData.error}\n\nPlease configure Spotify API (SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET) for better results.`
          : 'No songs found from any source.\n\nPossible reasons:\n• Spotify API not configured\n• YouTube API not configured\n• No songs match your search\n\nTry:\n• A different search term\n• Adding Spotify API credentials in Vercel'
        setError(errorMsg)
        setTracks([])
      }
    } catch (err: any) {
      console.error('YouTube fallback error:', err)
      setError('Failed to search songs. Please configure Spotify API credentials (SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET) for the best experience.')
      setTracks([])
    } finally {
      setSearching(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation() // Prevent bubbling to parent form
    if (query.trim()) {
      searchSongs(query)
    }
  }

  const handleSearchClick = () => {
    if (query.trim()) {
      searchSongs(query)
    }
  }

  const handleSelect = (track: Track) => {
    console.log('Track selected:', track)
    
    // YouTube URLs work great for in-app playback via iframe
    // Spotify deprecated preview_url - use external Spotify link
    const selectedSong = {
      title: track.name,
      artist: track.artist,
      url: track.stream_url || track.preview_url || track.external_urls?.youtube || track.external_urls?.spotify || track.permalink_url || undefined,
      spotifyId: track.source === 'spotify' ? track.id : undefined,
      albumArt: track.album_image || track.artwork_url || undefined,
    }
    
    console.log('Calling onSelect with:', selectedSong)
    onSelect(selectedSong)
    setTracks([])
    setQuery('')
    // Call completion callback if provided
    if (onSelectComplete) {
      setTimeout(() => {
        onSelectComplete()
      }, 100)
    }
  }

  // Don't show selected song here - MusicSelector handles that

  return (
    <div className="bg-white/[0.02] backdrop-blur-sm rounded-xl border border-white/10 p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-white/70" />
          <h3 className="text-white font-bold">Search for a Song</h3>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-white/40">Source:</span>
          <span className={`px-2 py-1 rounded font-bold ${
            searchSource === 'spotify' ? 'bg-white text-black' : 'bg-white/10 text-white/60'
          }`}>
            {searchSource === 'spotify' ? 'Spotify' : 'YouTube'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              handleSearchClick()
            }
          }}
          placeholder="Search songs, artists..."
          className="input-field flex-1"
        />
        <button
          type="button"
          onClick={handleSearchClick}
          disabled={searching || !query.trim()}
          className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {searching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </form>

      {error && (
        <div className="bg-white/5 border border-white/15 text-white/70 px-4 py-3 rounded-lg text-sm font-medium">
          <div className="flex items-start space-x-2">
            <span className="text-white/60 font-bold text-lg">⚠️</span>
            <div className="flex-1">
              <p className="font-bold mb-2 text-base">Search Error:</p>
              <div className="whitespace-pre-line text-sm leading-relaxed">{error}</div>
              {(error.includes('not configured') || error.includes('Spotify API')) && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-white/60 font-semibold mb-1">Quick Fix:</p>
                  <ol className="text-xs text-white/50 list-decimal list-inside space-y-1">
                    <li>Get Client ID & Secret from <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Spotify Dashboard</a></li>
                    <li>Add to Vercel → Settings → Environment Variables</li>
                    <li>Redeploy your app</li>
                  </ol>
                  <p className="text-xs text-white/40 mt-2 italic">
                    See <code className="bg-white/10 px-1 rounded">ADD_SPOTIFY_TO_VERCEL.md</code> for detailed steps
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tracks.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tracks.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                e.nativeEvent.stopImmediatePropagation()
                console.log('Track button clicked:', track)
                setTimeout(() => {
                  handleSelect(track)
                }, 0)
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              className="w-full bg-white/[0.02] hover:bg-white/5 border border-white/10 rounded-lg p-3 flex items-center space-x-3 transition-all text-left cursor-pointer"
            >
              {track.album_image ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
                  <Image
                    src={track.album_image}
                    alt={track.album || 'Album cover'}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Music className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{track.name}</p>
                <p className="text-white/45 text-xs truncate">{track.artist}</p>
              </div>
              <Play className="w-4 h-4 text-white/40 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {query && tracks.length === 0 && !searching && !error && (
        <p className="text-white/40 text-sm text-center py-4">No results found</p>
      )}
    </div>
  )
}

