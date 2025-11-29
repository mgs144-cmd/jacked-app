'use client'

import { useState } from 'react'
import { PostCard } from '@/components/PostCard'
import { FeedToggle } from '@/components/FeedToggle'
import { Flame } from 'lucide-react'

interface FeedClientProps {
  allPosts: any[]
  followingPosts: any[]
  publicPosts: any[]
}

export function FeedClient({ allPosts, followingPosts, publicPosts }: FeedClientProps) {
  const [view, setView] = useState<'friends' | 'community'>('community')

  const displayedPosts = view === 'friends' ? followingPosts : allPosts

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
              Your Feed
            </h1>
            <p className="text-gray-400 font-medium">
              See what the community is lifting
            </p>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-primary rounded-xl glow-red-sm">
            <Flame className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-sm">LIVE</span>
          </div>
        </div>
      </div>

      {/* Feed Toggle */}
      <FeedToggle view={view} onViewChange={setView} />

      {/* Posts */}
      {!displayedPosts || displayedPosts.length === 0 ? (
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-12 text-center card-elevated">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
            <Flame className="w-10 h-10 text-gray-600" />
          </div>
          <p className="text-gray-400 text-lg font-semibold mb-2">
            {view === 'friends' ? 'No posts from friends yet' : 'No posts yet'}
          </p>
          <p className="text-gray-600 text-sm">
            {view === 'friends' 
              ? 'Follow some users to see their posts here!' 
              : 'Be the first to share your progress!'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
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
  )
}

