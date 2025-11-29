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
}

export function CommentForm({ postId, userId }: CommentFormProps) {
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
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to post comment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mb-6">
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

      <div className="flex space-x-3">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={selectedGIF ? "Add a caption (optional)..." : "Add a comment..."}
          className="input-field flex-1 py-3"
          disabled={loading || !!selectedGIF}
        />
        <button
          type="button"
          onClick={() => setShowGIFPicker(true)}
          className="btn-secondary px-4 py-3 flex items-center justify-center"
          disabled={loading || !!selectedGIF}
        >
          <ImageIcon className="w-5 h-5" />
        </button>
        <button
          type="submit"
          disabled={loading || (!content.trim() && !selectedGIF)}
          className="btn-primary px-6 py-3 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5" />
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
