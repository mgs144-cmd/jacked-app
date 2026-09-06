'use client'

import { useState } from 'react'
import { UserPlus, UserCheck, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
  userId: string
  currentUserId: string
  initialIsFollowing: boolean
  isPrivateAccount?: boolean
  initialRequestStatus?: 'none' | 'pending' | 'accepted' | 'rejected'
  size?: 'default' | 'sm'
  /** Icon by default; expands to show label on hover/focus (community compact cards). */
  expandOnHover?: boolean
}

export function FollowButton({
  userId,
  currentUserId,
  initialIsFollowing,
  isPrivateAccount = false,
  initialRequestStatus = 'none',
  size = 'default',
  expandOnHover = false,
}: FollowButtonProps) {
  const btnClass = size === 'sm' ? 'btn btn-sm rounded-full' : 'btn rounded-full'
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [requestStatus, setRequestStatus] = useState(initialRequestStatus)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleToggleFollow = async () => {
    setLoading(true)

    try {
      if (isFollowing) {
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
        const { error } = await (supabase.from('follow_requests') as any)
          .delete()
          .match({
            requester_id: currentUserId,
            target_id: userId,
          })

        if (error) throw error

        setRequestStatus('none')
      } else {
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
          setIsFollowing(true)
          setRequestStatus('accepted')
        } else {
          setRequestStatus('pending')
        }
      }
      router.refresh()
    } catch (error: any) {
      console.error('Error toggling follow:', error)
    } finally {
      setLoading(false)
    }
  }

  const iconClass = size === 'sm' ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0'
  const label =
    isFollowing
      ? 'Following'
      : requestStatus === 'pending'
        ? 'Requested'
        : isPrivateAccount
          ? 'Request'
          : 'Follow'

  const Icon = isFollowing ? UserCheck : requestStatus === 'pending' ? Clock : UserPlus

  const toneClass = isFollowing
    ? 'btn-secondary text-white/80'
    : requestStatus === 'pending'
      ? 'btn-secondary text-white/45'
      : 'btn-primary'

  if (expandOnHover) {
    const colorClass = isFollowing
      ? 'border-white/15 bg-white/[0.06] text-white/80 hover:bg-white/10'
      : requestStatus === 'pending'
        ? 'border-white/10 bg-white/[0.04] text-white/45 hover:bg-white/[0.07]'
        : 'border-transparent bg-white text-black hover:bg-white/90'

    return (
      <button
        type="button"
        onClick={handleToggleFollow}
        disabled={loading}
        aria-label={label}
        title={label}
        className={`group/follow inline-flex h-8 shrink-0 items-center justify-center rounded-full border px-2 disabled:opacity-50 ${colorClass}`}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="inline-block max-w-0 overflow-hidden whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider opacity-0 transition-all duration-200 ease-out group-hover/follow:ml-1.5 group-hover/follow:max-w-[5.5rem] group-hover/follow:opacity-100 group-focus-visible/follow:ml-1.5 group-focus-visible/follow:max-w-[5.5rem] group-focus-visible/follow:opacity-100">
          {label}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleToggleFollow}
      disabled={loading}
      className={`${btnClass} ${toneClass} disabled:opacity-50`}
    >
      <Icon className={iconClass} />
      <span>{label}</span>
    </button>
  )
}
