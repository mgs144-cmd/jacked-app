'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Crown, UserPlus, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface UserCardProps {
  user: any
  currentUserId: string
  isFollowing: boolean
}

export function UserCard({ user, currentUserId, isFollowing: initialIsFollowing }: UserCardProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isFollowing) {
        // Unfollow
        await (supabase.from('follows') as any)
          .delete()
          .match({
            follower_id: currentUserId,
            following_id: user.id,
          })
        setIsFollowing(false)
      } else {
        // Follow
        await (supabase.from('follows') as any)
          .insert({
            follower_id: currentUserId,
            following_id: user.id,
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
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 overflow-hidden card-elevated hover:border-gray-700 transition-all">
      <div className="p-6">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <Link href={`/user/${user.id}`} className="flex-shrink-0">
            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden ring-2 ring-gray-800">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.username}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-white text-2xl font-black">
                    {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              {user.is_premium && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-primary rounded-lg flex items-center justify-center ring-2 ring-gray-900">
                  <Crown className="w-3.5 h-3.5 text-white fill-current" />
                </div>
              )}
            </div>
          </Link>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/user/${user.id}`} className="group">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-black text-white text-lg truncate group-hover:text-primary transition-colors">
                  {user.username || user.full_name || 'Unknown User'}
                </h3>
                {user.is_premium && (
                  <span className="badge-premium text-[10px] px-2 py-0.5">JACKED+</span>
                )}
              </div>
            </Link>
            
            {user.bio && (
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                {user.bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center space-x-4 text-sm mb-4">
              <div>
                <span className="font-black text-white">{user.followers_count || 0}</span>
                <span className="text-gray-500 ml-1">followers</span>
              </div>
              <div>
                <span className="font-black text-white">{user.following_count || 0}</span>
                <span className="text-gray-500 ml-1">following</span>
              </div>
            </div>

            {/* Follow Button */}
            <button
              onClick={handleFollow}
              disabled={loading}
              className={`w-full py-2 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center space-x-2 ${
                isFollowing
                  ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
                  : 'bg-gradient-primary text-white hover:brightness-110 shadow-lg shadow-primary/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>FOLLOWING</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>FOLLOW</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


