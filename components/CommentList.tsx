'use client'

import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  profile?: {
    username: string
    avatar_url: string | null
    full_name: string | null
  }
}

interface CommentListProps {
  comments: Comment[]
}

export function CommentList({ comments }: CommentListProps) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (commentId: string) => {
    if (!user) return
    if (!confirm('Are you sure you want to delete this comment?')) return

    setDeleting(commentId)
    try {
      const { error } = await (supabase
        .from('comments') as any)
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error('Error deleting comment:', error)
    } finally {
      setDeleting(null)
    }
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No comments yet. Be the first to comment!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const profile = (comment as any).profiles || {
          username: 'unknown',
          avatar_url: null,
          full_name: null,
        }

        return (
          <div key={comment.id} className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-xs font-semibold">
                  {profile.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="bg-gray-50 rounded-lg px-4 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-gray-900">
                    {profile.username}
                  </span>
                  {user?.id === comment.user_id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={deleting === comment.id}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-gray-900 text-sm">{comment.content}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-4">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

