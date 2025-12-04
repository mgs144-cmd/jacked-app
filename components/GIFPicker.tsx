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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadTrending = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/search-gifs?q=trending&limit=50')
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
      const response = await fetch(`/api/search-gifs?q=${encodeURIComponent(searchQuery)}&limit=50`)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-gray-900 rounded-t-3xl md:rounded-2xl border-t md:border border-gray-800 w-full md:max-w-4xl h-[90vh] md:max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-800 flex-shrink-0">
          <h3 className="text-white font-bold text-lg md:text-xl">Choose a GIF</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 -mr-2 active:scale-95"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar - More Prominent */}
        <div className="p-4 md:p-5 border-b border-gray-800 flex-shrink-0 bg-gray-900/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search GIFs (e.g., 'funny', 'celebration', 'workout')..."
              className="w-full pl-12 pr-4 py-3 md:py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base md:text-lg transition-all"
              autoComplete="off"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white p-1 active:scale-95"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {!query && (
            <p className="text-gray-500 text-xs md:text-sm mt-2 ml-1">
              Showing trending GIFs
            </p>
          )}
        </div>

        {/* GIF Grid - Larger viewing area */}
        <div className="flex-1 overflow-y-auto p-3 md:p-5 overscroll-contain">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Loading GIFs...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-16">
              <p className="text-red-400 text-lg mb-2">Failed to load GIFs</p>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && gifs.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => {
                    onSelect(gif.url)
                    onClose()
                  }}
                  type="button"
                  className="relative aspect-square rounded-lg overflow-hidden active:scale-95 md:hover:ring-2 ring-primary transition-all group touch-manipulation bg-gray-800"
                >
                  <Image
                    src={gif.preview || gif.url}
                    alt={gif.title || 'GIF'}
                    fill
                    className="object-cover group-active:scale-95 md:group-hover:scale-105 transition-transform"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}

          {!loading && !error && gifs.length === 0 && query && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg mb-2">No GIFs found for &quot;{query}&quot;</p>
              <p className="text-gray-500 text-sm">Try a different search term</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

