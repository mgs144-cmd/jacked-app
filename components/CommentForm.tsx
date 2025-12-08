'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Send, Image as ImageIcon, X } from 'lucide-react'
import { GIFPicker } from './GIFPicker'
import Image from 'next/image'

interface CommentFormProps {
  postId: string
  userId: string
  onCommentAdded?: () => void
}

export function CommentForm({ postId, userId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [selectedGIF, setSelectedGIF] = useState<string | null>(null)
  const [showGIFPicker, setShowGIFPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !selectedGIF) return

    setError('')
    setLoading(true)

    try {
      // If GIF is selected, use it as content (store URL)
      const commentContent = selectedGIF || content.trim()

      const { error: insertError } = await (supabase.from('comments') as any).insert({
        post_id: postId,
        user_id: userId,
        content: commentContent,
      })

      if (insertError) throw insertError

      setContent('')
      setSelectedGIF(null)
      
      // Call the callback if provided (for inline updates)
      if (onCommentAdded) {
        onCommentAdded()
      } else {
        // Otherwise, refresh the page (for post detail page)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to post comment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-red-950/50 border border-primary/50 text-red-400 px-4 py-3 rounded-xl text-sm font-medium backdrop-blur-sm">
          {error}
        </div>
      )}

      {selectedGIF && (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden mb-3 border border-gray-700">
          <Image
            src={selectedGIF}
            alt="Selected GIF"
            fill
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => setSelectedGIF(null)}
            className="absolute top-1 right-1 w-6 h-6 bg-black/80 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={selectedGIF ? "Add a caption..." : "Add a comment..."}
          className="input-field flex-1 py-2 text-sm min-w-0"
          disabled={loading || !!selectedGIF}
        />
        <button
          type="button"
          onClick={() => setShowGIFPicker(true)}
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 w-12 h-12 flex items-center justify-center shrink-0 rounded-xl transition-colors"
          disabled={loading || !!selectedGIF}
          aria-label="Add GIF"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
        </button>
        <button
          type="submit"
          disabled={loading || (!content.trim() && !selectedGIF)}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 w-12 md:w-auto md:px-6 h-12 flex items-center justify-center md:space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 rounded-xl transition-all text-white"
          aria-label="Post comment"
        >
          {loading ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <line x1="22" x2="11" y1="2" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              <span className="hidden md:inline font-bold">POST</span>
            </>
          )}
        </button>
      </div>

      {showGIFPicker && (
        <GIFPicker
          onSelect={(gifUrl) => {
            setSelectedGIF(gifUrl)
            setShowGIFPicker(false)
          }}
          onClose={() => setShowGIFPicker(false)}
        />
      )}
    </form>
  )
}
