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
    <div className="card group/card transition-all hover:shadow-lg hover:border-red-600/20">
      <div className="p-5">
        {/* Flex column layout for consistent spacing */}
        <div className="flex flex-col space-y-4">
          {/* Top section: Avatar + Name + Bio */}
          <div className="flex items-start space-x-3">
            {/* Avatar */}
            <Link href={`/user/${user.id}`} className="flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-surface-hover overflow-hidden border border-default">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.username}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-surface-hover text-primary text-xl font-semibold">
                    {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </Link>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <Link href={`/user/${user.id}`} className="group/link">
                <h3 className="font-semibold text-primary text-lg truncate group-hover/link:text-red-600 transition-colors">
                  {user.username || user.full_name || 'Unknown User'}
                </h3>
              </Link>
              
              {user.bio && (
                <p className="text-secondary text-sm mt-1.5 line-clamp-2 leading-snug">
                  {user.bio}
                </p>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center space-x-4 text-sm px-0.5">
            <div>
              <span className="font-semibold text-primary">{user.followers_count || 0}</span>
              <span className="text-tertiary ml-1.5">followers</span>
            </div>
            <div>
              <span className="font-semibold text-primary">{user.following_count || 0}</span>
              <span className="text-tertiary ml-1.5">following</span>
            </div>
          </div>

          {/* Follow Button - aligned left with content */}
          <div className="flex pt-1">
            <div className="min-w-[120px]">
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


