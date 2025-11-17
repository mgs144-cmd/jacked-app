'use client'

import { useState } from 'react'
import { Music, Search, Loader2, Play } from 'lucide-react'

interface Track {
  id: string
  name: string
  artist: string
  album?: string
  preview_url?: string
  external_urls: {
    spotify?: string
    youtube?: string
  }
  album_image?: string
  source?: 'spotify' | 'youtube'
}

interface MusicSearchProps {
  onSelect: (song: { title: string; artist: string; url?: string; spotifyId?: string }) => void
  selectedSong?: { title: string; artist: string; url?: string; spotifyId?: string } | null
}

export function MusicSearch({ onSelect, selectedSong }: MusicSearchProps) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [tracks, setTracks] = useState<Track[]>([])
  const [error, setError] = useState<string | null>(null)

  const [searchSource, setSearchSource] = useState<'spotify' | 'youtube'>('spotify')

  const searchSongs = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setSearching(true)
    setError(null)

    try {
      // Try Spotify first, fallback to YouTube if it fails
      let response = await fetch(`/api/search-music?q=${encodeURIComponent(searchQuery)}`)
      let data = await response.json()

      // If Spotify fails or no results, try YouTube
      if (data.error || !data.tracks || data.tracks.length === 0) {
        setSearchSource('youtube')
        response = await fetch(`/api/search-youtube?q=${encodeURIComponent(searchQuery)}`)
        data = await response.json()
      } else {
        setSearchSource('spotify')
      }
      
      if (!response.ok) {
        throw new Error('Failed to search songs')
      }

      if (data.error && !data.fallback) {
        throw new Error(data.error)
      }

      // If YouTube fallback (no API key), show message
      if (data.fallback) {
        setError('YouTube API not configured. Using Spotify only.')
        // Still try to get Spotify results
        const spotifyResponse = await fetch(`/api/search-music?q=${encodeURIComponent(searchQuery)}`)
        const spotifyData = await spotifyResponse.json()
        setTracks(spotifyData.tracks || [])
      } else {
        setTracks(data.tracks || [])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search songs')
      setTracks([])
    } finally {
      setSearching(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      searchSongs(query)
    }
  }

  const handleSelect = (track: Track) => {
    onSelect({
      title: track.name,
      artist: track.artist,
      url: track.preview_url || track.external_urls.spotify || track.external_urls.youtube,
      spotifyId: track.source === 'spotify' ? track.id : undefined,
    })
    setTracks([])
    setQuery('')
  }

  // Don't show selected song here - MusicSelector handles that

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/60 p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-primary" />
          <h3 className="text-white font-bold">Search for a Song</h3>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-gray-500">Source:</span>
          <span className={`px-2 py-1 rounded ${searchSource === 'spotify' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-400'}`}>
            {searchSource === 'spotify' ? 'Spotify' : 'YouTube'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex space-x-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists..."
          className="input-field flex-1"
        />
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="btn-primary px-6 py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {searching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </form>

      {error && (
        <div className="bg-red-950/50 border border-red-600/50 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {tracks.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tracks.map((track) => (
            <button
              key={track.id}
              onClick={() => handleSelect(track)}
              className="w-full bg-gray-800/60 hover:bg-gray-800 rounded-lg p-3 flex items-center space-x-3 transition-all text-left"
            >
              {track.album_image ? (
                <img
                  src={track.album_image}
                  alt={track.album}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <Music className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{track.name}</p>
                <p className="text-gray-400 text-xs truncate">{track.artist}</p>
              </div>
              {track.preview_url && (
                <Play className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}

      {query && tracks.length === 0 && !searching && !error && (
        <p className="text-gray-500 text-sm text-center py-4">No results found</p>
      )}
    </div>
  )
}

