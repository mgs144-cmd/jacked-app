'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { formatDistanceToNow } from 'date-fns'
import { Trash2, MessageCircle } from 'lucide-react'

interface CommentListProps {
  comments: any[]
}

// Check if content is a GIF URL
const isGIF = (content: string) => {
  return content.startsWith('http') && (content.includes('giphy.com') || content.includes('.gif'))
}

export function CommentList({ comments }: CommentListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuth()

  const handleDelete = async (commentId: string) => {
    if (!user || !confirm('Delete this comment?')) return

    setDeleting(commentId)
    try {
      const { error } = await (supabase.from('comments') as any)
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment')
    } finally {
      setDeleting(null)
    }
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-800/60 rounded-full flex items-center justify-center">
          <MessageCircle className="w-8 h-8 text-gray-600" />
        </div>
        <p className="text-gray-400 font-semibold">No comments yet</p>
        <p className="text-gray-600 text-sm mt-1">Be the first to comment!</p>
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
          <div key={comment.id} className="flex items-start space-x-3 group">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden shadow-md flex-shrink-0">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-gray-300 text-sm font-bold">
                  {profile.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>

            {/* Comment Content */}
            <div className="flex-1 min-w-0">
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-800/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-white">
                    {profile.username}
                  </span>
                  {user?.id === comment.user_id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={deleting === comment.id}
                      className="text-gray-500 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {isGIF(comment.content) ? (
                  <div className="relative w-full max-w-xs aspect-square rounded-lg overflow-hidden">
                    <Image
                      src={comment.content}
                      alt="GIF comment"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <p className="text-gray-200 text-sm leading-relaxed">{comment.content}</p>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-2 ml-4 font-medium">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
