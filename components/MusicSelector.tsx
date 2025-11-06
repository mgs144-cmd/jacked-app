'use client'

import { useState } from 'react'
import { Music, Search, X } from 'lucide-react'

interface MusicSelectorProps {
  onSelect: (song: { title: string; artist: string; url?: string }) => void
  selectedSong?: { title: string; artist: string; url?: string } | null
  onClear?: () => void
}

export function MusicSelector({ onSelect, selectedSong, onClear }: MusicSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [songTitle, setSongTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [songUrl, setSongUrl] = useState('')

  const handleAdd = () => {
    if (songTitle.trim() && artist.trim()) {
      onSelect({
        title: songTitle.trim(),
        artist: artist.trim(),
        url: songUrl.trim() || undefined,
      })
      setSongTitle('')
      setArtist('')
      setSongUrl('')
      setIsOpen(false)
    }
  }

  if (selectedSong) {
    return (
      <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-800/60 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">{selectedSong.title}</p>
            <p className="text-gray-400 text-xs truncate">{selectedSong.artist}</p>
          </div>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="text-gray-500 hover:text-red-400 transition-colors p-2"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    )
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full bg-gray-800/60 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-800/60 p-6 hover:border-primary/30 transition-all flex items-center justify-center space-x-3"
      >
        <Music className="w-6 h-6 text-gray-500" />
        <span className="text-gray-400 font-semibold">Add Song (Optional)</span>
      </button>
    )
  }

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/60 p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Music className="w-5 h-5 text-primary" />
          <h3 className="text-white font-bold">Add a Song</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-300 mb-2 tracking-wide">
          SONG TITLE
        </label>
        <input
          type="text"
          value={songTitle}
          onChange={(e) => setSongTitle(e.target.value)}
          placeholder="e.g., Eye of the Tiger"
          className="input-field w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-300 mb-2 tracking-wide">
          ARTIST
        </label>
        <input
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="e.g., Survivor"
          className="input-field w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-300 mb-2 tracking-wide">
          SONG URL (OPTIONAL)
        </label>
        <input
          type="url"
          value={songUrl}
          onChange={(e) => setSongUrl(e.target.value)}
          placeholder="e.g., https://spotify.com/..."
          className="input-field w-full"
        />
        <p className="text-xs text-gray-600 mt-1">Spotify, Apple Music, YouTube, etc.</p>
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="flex-1 btn-secondary py-3 font-bold"
        >
          CANCEL
        </button>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!songTitle.trim() || !artist.trim()}
          className="flex-1 btn-primary py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ADD SONG
        </button>
      </div>
    </div>
  )
}


