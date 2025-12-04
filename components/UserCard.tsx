'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Crown } from 'lucide-react'
import { FollowButton } from './FollowButton'

interface UserCardProps {
  user: any
  currentUserId: string
  isFollowing: boolean
  isPrivateAccount?: boolean
  requestStatus?: 'none' | 'pending' | 'accepted' | 'rejected'
}

export function UserCard({ 
  user, 
  currentUserId, 
  isFollowing,
  isPrivateAccount = false,
  requestStatus = 'none'
}: UserCardProps) {

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 overflow-hidden card-elevated hover:border-gray-700 transition-all">
      <div className="p-6">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <Link href={`/user/${user.id}`} className="flex-shrink-0">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden shadow-md">
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
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center shadow-md">
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
            <div className="w-full">
              <FollowButton
                userId={user.id}
                currentUserId={currentUserId}
                initialIsFollowing={isFollowing}
                isPrivateAccount={isPrivateAccount}
                initialRequestStatus={requestStatus}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


