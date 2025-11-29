'use client'

import { useState } from 'react'
import { Music, Search, X, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { MusicSearch } from './MusicSearch'

interface MusicSelectorProps {
  onSelect: (song: { title: string; artist: string; url?: string; spotifyId?: string; albumArt?: string }) => void
  selectedSong?: { title: string; artist: string; url?: string; spotifyId?: string; albumArt?: string } | null
  onClear?: () => void
  uploadMode?: 'post' | 'profile' // Different buckets for posts vs profiles
}

type Mode = 'search' | 'upload' | 'link'

export function MusicSelector({ onSelect, selectedSong, onClear, uploadMode = 'post' }: MusicSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('search') // Default to search (like Instagram)
  const [songTitle, setSongTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [songUrl, setSongUrl] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()
  const { user } = useAuth()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        alert('Please select an audio file (MP3, WAV, etc.)')
        return
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }
      setAudioFile(file)
    }
  }

  const handleUpload = async () => {
    if (!user || !audioFile) return

    setUploading(true)
    try {
      const fileExt = audioFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const bucket = uploadMode === 'profile' ? 'profile-songs' : 'post-songs'

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, audioFile)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(fileName)

      onSelect({
        title: songTitle.trim() || audioFile.name.replace(/\.[^/.]+$/, ''),
        artist: artist.trim() || 'Unknown Artist',
        url: publicUrl,
      })
      
      setSongTitle('')
      setArtist('')
      setAudioFile(null)
      setIsOpen(false)
    } catch (error: any) {
      alert(error.message || 'Failed to upload audio file')
    } finally {
      setUploading(false)
    }
  }

  const handleAdd = () => {
    if (mode === 'upload' && audioFile) {
      handleUpload()
    } else if (mode === 'link' && songTitle.trim() && artist.trim()) {
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

  // If song is selected, show it
  if (selectedSong && !isOpen) {
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

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/60 p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Music className="w-5 h-5 text-primary" />
          <h3 className="text-white font-bold">Add a Song</h3>
        </div>
        <button
          onClick={() => {
            setIsOpen(false)
            setAudioFile(null)
            setSongTitle('')
            setArtist('')
            setSongUrl('')
          }}
          className="text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-gray-800/40 rounded-lg">
        <button
          type="button"
          onClick={() => setMode('search')}
          className={`py-2 px-3 rounded-lg font-bold text-xs transition-all ${
            mode === 'search'
              ? 'bg-primary text-white'
              : 'bg-gray-700 text-gray-400 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4 inline mr-1" />
          Search
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`py-2 px-3 rounded-lg font-bold text-xs transition-all ${
            mode === 'upload'
              ? 'bg-primary text-white'
              : 'bg-gray-700 text-gray-400 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4 inline mr-1" />
          Upload
        </button>
        <button
          type="button"
          onClick={() => setMode('link')}
          className={`py-2 px-3 rounded-lg font-bold text-xs transition-all ${
            mode === 'link'
              ? 'bg-primary text-white'
              : 'bg-gray-700 text-gray-400 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4 inline mr-1" />
          Link
        </button>
      </div>

      {/* Search Mode */}
      {mode === 'search' && (
        <MusicSearch
          onSelect={(song) => {
            onSelect(song)
            setIsOpen(false)
          }}
          selectedSong={selectedSong}
        />
      )}

      {/* Upload Mode */}
      {mode === 'upload' && (
        <>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 tracking-wide">
              UPLOAD AUDIO FILE
            </label>
            <label className="btn-secondary w-full py-3 cursor-pointer flex items-center justify-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>{audioFile ? audioFile.name : 'Choose Audio File'}</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-600 mt-2">MP3, WAV, M4A, etc. (Max 10MB)</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 tracking-wide">
              SONG TITLE (OPTIONAL)
            </label>
            <input
              type="text"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="Auto-filled from filename if empty"
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 tracking-wide">
              ARTIST (OPTIONAL)
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Auto-filled if empty"
              className="input-field w-full"
            />
          </div>
        </>
      )}

      {/* Link Mode */}
      {mode === 'link' && (
        <>
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
              SONG URL
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
        </>
      )}

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={() => {
            setIsOpen(false)
            setAudioFile(null)
            setSongTitle('')
            setArtist('')
            setSongUrl('')
          }}
          className="flex-1 btn-secondary py-3 font-bold"
        >
          CANCEL
        </button>
        {mode !== 'search' && (
          <button
            type="button"
            onClick={handleAdd}
            disabled={
              uploading ||
              (mode === 'upload' ? !audioFile : (!songTitle.trim() || !artist.trim()))
            }
            className="flex-1 btn-primary py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'UPLOADING...' : mode === 'upload' ? 'UPLOAD & ADD' : 'ADD SONG'}
          </button>
        )}
      </div>
    </div>
  )
}


