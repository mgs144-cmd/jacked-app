'use client'

import { useState } from 'react'
import { PostCard } from '@/components/PostCard'
import { FeedToggle } from '@/components/FeedToggle'
import { PullToRefresh } from '@/components/PullToRefresh'
import { RestTimer } from '@/components/RestTimer'
import { FeedPostSeenTracker } from '@/components/FeedPostSeenTracker'
import { BrandHeading } from '@/components/BrandHeading'

interface FeedClientProps {
  currentUserId: string
  communityPosts: any[]
  friendsPosts: any[]
  feedRecentDays: number
}

export function FeedClient({
  currentUserId,
  communityPosts,
  friendsPosts,
  feedRecentDays,
}: FeedClientProps) {
  const [view, setView] = useState<'friends' | 'community'>('community')

  const displayedPosts = view === 'friends' ? friendsPosts : communityPosts

  return (
    <PullToRefresh>
      <div className="w-full max-w-[640px] mx-auto px-0 sm:px-4 md:px-6 pt-3 pb-6 md:pt-6 md:pb-10 min-w-0">
        <header className="flex items-center justify-between mb-3 px-3 sm:px-0 md:mb-4">
          <div>
            <BrandHeading variant="page">Feed</BrandHeading>
            <p className="ui-subtitle mt-2">New from the last {feedRecentDays} days</p>
          </div>
          <FeedToggle view={view} onViewChange={setView} />
        </header>

        {!displayedPosts || displayedPosts.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] py-16 px-6 text-center">
            <p className="ui-body-medium text-white/60 mb-1">You&apos;re all caught up</p>
            <p className="ui-subtitle">
              {view === 'friends'
                ? `No new followers-only posts from the last ${feedRecentDays} days. Pull down to refresh when friends post.`
                : `No new public posts from the last ${feedRecentDays} days. Pull down to refresh for new activity.`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-0 sm:gap-5 md:gap-6">
            {displayedPosts.map((post: any) => (
              <FeedPostSeenTracker key={post.id} postId={post.id} userId={currentUserId}>
                <PostCard post={post} />
              </FeedPostSeenTracker>
            ))}
          </div>
        )}

      </div>

      <RestTimer />
    </PullToRefresh>
  )
}
