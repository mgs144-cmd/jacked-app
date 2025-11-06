'use client'

import { useState } from 'react'
import { UserPlus, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
  userId: string
  currentUserId: string
  initialIsFollowing: boolean
}

export function FollowButton({ userId, currentUserId, initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleToggleFollow = async () => {
    setLoading(true)

    try {
      if (isFollowing) {
        // Unfollow
        await (supabase.from('follows') as any)
          .delete()
          .match({
            follower_id: currentUserId,
            following_id: userId,
          })
        setIsFollowing(false)
      } else {
        // Follow
        await (supabase.from('follows') as any)
          .insert({
            follower_id: currentUserId,
            following_id: userId,
          })
        setIsFollowing(true)
      }
      router.refresh()
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading}
      className={`px-8 py-3 rounded-xl font-bold text-base transition-all flex items-center space-x-2 ${
        isFollowing
          ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
          : 'bg-gradient-primary text-white hover:brightness-110 shadow-lg shadow-primary/20'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isFollowing ? (
        <>
          <UserCheck className="w-5 h-5" />
          <span>FOLLOWING</span>
        </>
      ) : (
        <>
          <UserPlus className="w-5 h-5" />
          <span>FOLLOW</span>
        </>
      )}
    </button>
  )
}


