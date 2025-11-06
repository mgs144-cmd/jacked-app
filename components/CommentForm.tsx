'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Send } from 'lucide-react'

interface CommentFormProps {
  postId: string
  userId: string
}

export function CommentForm({ postId, userId }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setError('')
    setLoading(true)

    try {
      const { error: insertError } = await (supabase.from('comments') as any).insert({
        post_id: postId,
        user_id: userId,
        content: content.trim(),
      })

      if (insertError) throw insertError

      setContent('')
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

      <div className="flex space-x-3">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          className="input-field flex-1 py-3"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
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
    </form>
  )
}
