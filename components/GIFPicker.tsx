'use client'

import { useState, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface GIFPickerProps {
  onSelect: (gifUrl: string) => void
  onClose: () => void
}

export function GIFPicker({ onSelect, onClose }: GIFPickerProps) {
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load trending GIFs on mount
    loadTrending()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadTrending = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/search-gifs?q=trending&limit=20')
      if (!response.ok) throw new Error('Failed to load GIFs')
      const data = await response.json()
      setGifs(data.gifs || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const searchGIFs = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      loadTrending()
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/search-gifs?q=${encodeURIComponent(searchQuery)}&limit=20`)
      if (!response.ok) throw new Error('Failed to search GIFs')
      const data = await response.json()
      setGifs(data.gifs || [])
    } catch (err: any) {
      setError(err.message)
      setGifs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.trim()) {
        searchGIFs(query)
      } else {
        loadTrending()
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [query])

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-white font-bold text-lg">Select a GIF</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search GIFs..."
              className="input-field w-full pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-400">{error}</p>
              <p className="text-gray-500 text-sm mt-2">Make sure GIPHY_API_KEY is set in .env.local</p>
            </div>
          )}

          {!loading && !error && gifs.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => {
                    onSelect(gif.url)
                    onClose()
                  }}
                  className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 ring-primary transition-all group"
                >
                  <Image
                    src={gif.preview || gif.url}
                    alt={gif.title || 'GIF'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </button>
              ))}
            </div>
          )}

          {!loading && !error && gifs.length === 0 && query && (
            <div className="text-center py-12">
              <p className="text-gray-400">No GIFs found for &quot;{query}&quot;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

