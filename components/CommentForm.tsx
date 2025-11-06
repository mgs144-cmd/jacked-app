'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface CommentFormProps {
  postId: string
  userId: string
}

export function CommentForm({ postId, userId }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setError(null)

    try {
      const { error: commentError } = await (supabase
        .from('comments') as any)
        .insert({
          post_id: postId,
          user_id: userId,
          content: content.trim(),
        })

      if (commentError) throw commentError

      setContent('')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to post comment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex space-x-3">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="px-6 py-2 border border-transparent rounded-lg text-white font-semibold bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Post'
          )}
        </button>
      </div>
    </form>
  )
}

