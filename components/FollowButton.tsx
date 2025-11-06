'use client'

import { useState } from 'react'
import { UserPlus, UserCheck, Clock, UserX } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
  userId: string
  currentUserId: string
  initialIsFollowing: boolean
  isPrivateAccount?: boolean
  initialRequestStatus?: 'none' | 'pending' | 'accepted' | 'rejected'
}

export function FollowButton({ 
  userId, 
  currentUserId, 
  initialIsFollowing,
  isPrivateAccount = false,
  initialRequestStatus = 'none'
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [requestStatus, setRequestStatus] = useState(initialRequestStatus)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleToggleFollow = async () => {
    setLoading(true)

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await (supabase.from('follows') as any)
          .delete()
          .match({
            follower_id: currentUserId,
            following_id: userId,
          })
        
        if (error) throw error
        
        setIsFollowing(false)
        setRequestStatus('none')
      } else if (requestStatus === 'pending') {
        // Cancel request
        const { error } = await (supabase.from('follow_requests') as any)
          .delete()
          .match({
            requester_id: currentUserId,
            target_id: userId,
          })
        
        if (error) throw error
        
        setRequestStatus('none')
      } else {
        // Send follow request (will auto-follow if public account)
        const { data, error } = await (supabase.from('follow_requests') as any)
          .insert({
            requester_id: currentUserId,
            target_id: userId,
          })
          .select()
          .single()

        if (error) {
          console.error('Follow request error:', error)
          alert(`Failed to follow: ${error.message}\n\nHave you run UPGRADE_SOCIAL_FEATURES.sql?`)
          throw error
        }

        if (data.status === 'accepted') {
          // Public account - immediately followed
          setIsFollowing(true)
          setRequestStatus('accepted')
        } else {
          // Private account - request pending
          setRequestStatus('pending')
        }
      }
      router.refresh()
    } catch (error: any) {
      console.error('Error toggling follow:', error)
      // Don't update UI on error
    } finally {
      setLoading(false)
    }
  }

  // Different button states
  if (isFollowing) {
    return (
      <button
        onClick={handleToggleFollow}
        disabled={loading}
        className="w-full px-8 py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center space-x-2 bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <UserCheck className="w-5 h-5" />
        <span>FOLLOWING</span>
      </button>
    )
  }

  if (requestStatus === 'pending') {
    return (
      <button
        onClick={handleToggleFollow}
        disabled={loading}
        className="w-full px-8 py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center space-x-2 bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Clock className="w-5 h-5" />
        <span>REQUESTED</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading}
      className="w-full px-8 py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center space-x-2 bg-gradient-primary text-white hover:brightness-110 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <UserPlus className="w-5 h-5" />
      <span>{isPrivateAccount ? 'REQUEST' : 'FOLLOW'}</span>
    </button>
  )
}
