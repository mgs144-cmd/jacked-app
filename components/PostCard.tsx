'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageCircle, MoreVertical } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PostCardProps {
  post: {
    id: string
    user_id: string
    content: string | null
    media_url: string | null
    media_type: 'image' | 'video' | null
    created_at: string
    profile?: {
      username: string
      avatar_url: string | null
      full_name: string | null
    }
  }
  currentUserId?: string
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchEngagement() {
      // Fetch likes
      const { data: likesData } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', post.id)

      setLikeCount(likesData?.length || 0)

      if (currentUserId) {
        const userLiked = likesData?.some((like) => like.user_id === currentUserId)
        setLiked(userLiked || false)
      }

      // Fetch comments count
      const { data: commentsData } = await supabase
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('post_id', post.id)

      setCommentCount(commentsData?.length || 0)
      setLoading(false)
    }

    fetchEngagement()
  }, [post.id, currentUserId, supabase])

  const handleLike = async () => {
    if (!currentUserId) return

    if (liked) {
      // Unlike
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', currentUserId)
      setLiked(false)
      setLikeCount((prev) => prev - 1)
    } else {
      // Like
      await supabase.from('likes').insert({
        post_id: post.id,
        user_id: currentUserId,
      })
      setLiked(true)
      setLikeCount((prev) => prev + 1)
    }
  }

  const profile = post.profile || {
    username: 'unknown',
    avatar_url: null,
    full_name: null,
  }

  return (
    <article className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link
          href={`/profile/${post.user_id}`}
          className="flex items-center space-x-3"
        >
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.username}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 font-semibold">
                {profile.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {profile.username || 'Unknown'}
            </p>
            <p className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </Link>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Media */}
      {post.media_url && (
        <div className="relative w-full aspect-square bg-gray-100">
          {post.media_type === 'video' ? (
            <video
              src={post.media_url}
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={post.media_url}
              alt={post.content || 'Post image'}
              fill
              className="object-cover"
            />
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Engagement */}
        <div className="flex items-center space-x-4 mb-3">
          <button
            onClick={handleLike}
            disabled={!currentUserId || loading}
            className={`flex items-center space-x-2 transition-colors ${
              liked ? 'text-primary' : 'text-gray-600 hover:text-primary'
            }`}
          >
            <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
            <span className="font-semibold">{likeCount}</span>
          </button>
          <Link
            href={`/post/${post.id}`}
            className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="font-semibold">{commentCount}</span>
          </Link>
        </div>

        {/* Caption */}
        {post.content && (
          <div className="text-gray-900">
            <Link
              href={`/profile/${post.user_id}`}
              className="font-semibold mr-2"
            >
              {profile.username}
            </Link>
            <span>{post.content}</span>
          </div>
        )}
      </div>
    </article>
  )
}

