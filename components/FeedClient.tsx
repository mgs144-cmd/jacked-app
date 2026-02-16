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
      <div className="w-full max-w-[640px] mx-auto px-4 md:px-5 pt-4 pb-5 sm:pb-6 md:py-8 min-w-0">
        <div className="text-left mb-5">
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Feed
          </h1>
          <p className="text-[#a1a1a1] text-sm mt-1">
            {view === 'friends' ? 'Posts from people you follow' : 'Community posts'}
          </p>
        </div>

        <div className="mb-5 md:mb-6">
          <FeedToggle view={view} onViewChange={setView} />
        </div>

        {!displayedPosts || displayedPosts.length === 0 ? (
          <div className="rounded-lg md:rounded-xl border border-white/5 bg-[#1a1a1a] p-8 sm:p-12 text-center" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <p className="text-[#a1a1a1] font-medium mb-1">
              {view === 'friends' ? 'No posts from friends yet' : 'No posts yet'}
            </p>
            <p className="text-[#6b6b6b] text-sm">
              {view === 'friends' 
                ? 'Follow people to see their posts here' 
                : 'Be the first to share your progress'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
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
