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
  compact?: boolean
}

export function UserCard({
  user,
  currentUserId,
  isFollowing,
  isPrivateAccount = false,
  requestStatus = 'none',
  compact = false,
}: UserCardProps) {
  if (compact) {
    return (
      <div className="group/card flex min-w-0 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] p-2 overflow-hidden">
        <Link href={`/user/${user.id}`} className="shrink-0 active:opacity-80">
          <div className="h-9 w-9 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.username}
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/10 text-sm font-semibold text-white">
                {user.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
        </Link>
        <div className="min-w-0 flex-1 overflow-hidden">
          <Link
            href={`/user/${user.id}`}
            className="block text-xs font-semibold text-white hover:underline truncate"
            title={user.username || user.full_name || 'User'}
          >
            {user.username || user.full_name || 'User'}
          </Link>
        </div>
        <FollowButton
          userId={user.id}
          currentUserId={currentUserId}
          initialIsFollowing={isFollowing}
          isPrivateAccount={isPrivateAccount}
          initialRequestStatus={requestStatus}
          size="sm"
          expandOnHover
        />
      </div>
    )
  }

  return (
    <div
      className="rounded-[12px] border border-white/10 p-6 transition-all duration-200 hover:border-white/20 bg-white/[0.02] group/card"
    >
      <div>
        {/* Flex column layout for consistent spacing */}
        <div className="flex flex-col space-y-4">
          {/* Top section: Avatar + Name (centered), Bio below */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <Link href={`/user/${user.id}`} className="flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-white/5 overflow-hidden ring-1 ring-white/10">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.username}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/10 text-white text-xl font-semibold">
                    {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </Link>

            {/* User Info: username is main focus, vertically centered with avatar */}
            <div className="flex-1 min-w-0">
              <Link href={`/user/${user.id}`} className="group/link block">
                <h3 className="ui-heading text-lg md:text-xl text-white truncate group-hover/link:text-white/90 transition-colors duration-150">
                  {user.username || user.full_name || 'Unknown User'}
                </h3>
              </Link>
              {user.bio && (
                <p className="text-white/60 text-sm mt-1 line-clamp-2 leading-snug">
                  {user.bio}
                </p>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center space-x-4 text-[13px] px-0.5">
            <div>
              <span className="font-semibold text-white">{user.followers_count || 0}</span>
              <span className="text-secondary/70 ml-1.5">followers</span>
            </div>
            <div>
              <span className="font-semibold text-white">{user.following_count || 0}</span>
              <span className="text-secondary/70 ml-1.5">following</span>
            </div>
          </div>

          {/* Follow Button - aligned left with content */}
          <div className="flex pt-1">
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
  )
}


