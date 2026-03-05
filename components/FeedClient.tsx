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
      <div className="w-full max-w-[640px] mx-auto px-4 md:px-6 pt-6 pb-8 md:pt-8 md:pb-12 min-w-0">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-white tracking-tight">
            Feed
          </h1>
          <FeedToggle view={view} onViewChange={setView} />
        </header>

        {!displayedPosts || displayedPosts.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] py-16 px-6 text-center">
            <p className="text-white/60 text-[15px] font-medium mb-1">
              {view === 'friends' ? 'No posts from friends yet' : 'No posts yet'}
            </p>
            <p className="text-white/40 text-sm">
              {view === 'friends' 
                ? 'Follow people to see their posts here' 
                : 'Be the first to share your progress'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {displayedPosts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {displayedPosts && displayedPosts.length >= 50 && (
          <div className="mt-8 text-center">
            <button className="rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors">
              Load more
            </button>
          </div>
        )}
      </div>

      {/* Rest Timer - floating button */}
      <RestTimer />
    </PullToRefresh>
  )
}
