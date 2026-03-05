'use client'

import { useState } from 'react'
import { PostCard } from '@/components/PostCard'
import { FeedToggle } from '@/components/FeedToggle'
import { PullToRefresh } from '@/components/PullToRefresh'
import { RestTimer } from '@/components/RestTimer'

interface FeedClientProps {
  allPosts: any[]
  followingPosts: any[]
  publicPosts: any[]
}

export function FeedClient({ allPosts, followingPosts, publicPosts }: FeedClientProps) {
  const [view, setView] = useState<'friends' | 'community'>('community')

  const displayedPosts = view === 'friends' ? followingPosts : allPosts

  return (
    <PullToRefresh>
      <div className="w-full max-w-[640px] mx-auto px-4 md:px-5 pt-3 pb-5 md:py-6 min-w-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-medium text-white tracking-tight">
            Feed
          </h1>
          <FeedToggle view={view} onViewChange={setView} />
        </div>

        {!displayedPosts || displayedPosts.length === 0 ? (
          <div className="py-12 text-center border-t border-white/5">
            <p className="text-white/60 text-sm mb-0.5">
              {view === 'friends' ? 'No posts from friends yet' : 'No posts yet'}
            </p>
            <p className="text-white/40 text-sm">
              {view === 'friends' 
                ? 'Follow people to see their posts here' 
                : 'Be the first to share your progress'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-white/5">
            {displayedPosts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Load more indicator */}
        {displayedPosts && displayedPosts.length >= 50 && (
          <div className="mt-8 text-center">
            <button className="btn-secondary px-8 py-3">
              <span className="font-bold">LOAD MORE</span>
            </button>
          </div>
        )}
      </div>

      {/* Rest Timer - floating button */}
      <RestTimer />
    </PullToRefresh>
  )
}
