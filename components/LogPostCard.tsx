'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import { MoreVertical, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface LogPostCardProps {
  post: any
}

export function LogPostCard({ post }: LogPostCardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwner = user?.id === post.user_id
  const exercises = post.workout_exercises || []
  const sortedExercises = [...exercises].sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))

  // Group by exercise_name for compact display
  const byExercise = sortedExercises.reduce((acc: Record<string, any[]>, ex: any) => {
    const name = ex.exercise_name || 'Unknown'
    if (!acc[name]) acc[name] = []
    acc[name].push(ex)
    return acc
  }, {})

  const handleDelete = async () => {
    if (!isOwner || !user || !confirm('Delete this log entry?')) return

    setIsDeleting(true)
    try {
      if (post.media_url) {
        const bucket = post.media_type === 'video' ? 'videos' : 'images'
        const fileName = post.media_url.split('/').pop()
        if (fileName) {
          await supabase.storage.from(bucket).remove([fileName])
        }
      }
      const { error } = await (supabase.from('posts') as any)
        .delete()
        .eq('id', post.id)
        .eq('user_id', user.id)
      if (error) throw error
      setShowMenu(false)
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Failed to delete')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <article
      className="relative rounded-lg md:rounded-xl p-5 md:p-6 border border-white/5 bg-[#1a1a1a]"
      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm text-[#a1a1a1]" style={{ opacity: 0.8 }}>
          {format(new Date(post.created_at), 'MMM d, yyyy')}
        </span>
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-[#a1a1a1] hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-10 overflow-hidden">
                <Link
                  href={`/post/${post.id}/edit`}
                  className="flex items-center gap-2 px-4 py-3 text-white hover:bg-white/5 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  <Edit className="w-4 h-4" />
                  <span className="font-medium text-sm">Edit</span>
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-[#ff5555] hover:bg-[#ff5555]/10 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="font-medium text-sm">{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {Object.keys(byExercise).length > 0 && (
        <div className="mt-4 space-y-3">
          {Object.entries(byExercise).map(([name, sets]) => (
            <div key={name} className="border-b border-white/5 last:border-0 pb-2 last:pb-0">
              <span className="font-medium text-white">{name}</span>
              <div className="text-[#a1a1a1] text-sm mt-1 tabular-nums">
                {sets
                  .map((s: any) => {
                    if (s.weight != null && s.reps != null) return `${s.weight}×${s.reps}`
                    if (s.weight != null) return `${s.weight} lbs`
                    if (s.reps != null) return `${s.reps} reps`
                    if (s.sets != null) return `${s.sets} sets`
                    return ''
                  })
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </div>
          ))}
        </div>
      )}

      {post.content && (
        <p
          className="mt-4 text-[15px] leading-relaxed"
          style={{ color: 'rgba(255, 255, 255, 0.85)' }}
        >
          {post.content}
        </p>
      )}
    </article>
  )
}
