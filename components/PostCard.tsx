'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Heart, MessageCircle, MoreVertical, Crown, Trash2, Trophy, Globe, Lock, Edit } from 'lucide-react'
import { PostMusicPlayer } from './PostMusicPlayer'
import { WorkoutDetails } from './WorkoutDetails'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'

interface PostCardProps {
  post: any
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.like_count || 0)
  const [isLiking, setIsLiking] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPrivate, setIsPrivate] = useState(post.is_private || false)
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false)

  // Handle profile data - could be object, array, or null
  // Check both post.profile (normalized) and post.profiles (raw)
  let profileData = post.profile || post.profiles
  if (Array.isArray(profileData)) {
    profileData = profileData[0] || null
  }
  
  const profile = profileData || {
    username: 'unknown',
    avatar_url: null,
    full_name: null,
    is_premium: false,
  }

  const isOwner = user?.id === post.user_id
  const profileLink = isOwner ? '/profile' : `/user/${post.user_id}`

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user || isLiking) return

    setIsLiking(true)
    try {
      if (liked) {
        await (supabase.from('likes') as any).delete().match({
          user_id: user.id,
          post_id: post.id,
        })
        setLiked(false)
        setLikeCount((prev: number) => prev - 1)
      } else {
        await (supabase.from('likes') as any).insert({
          user_id: user.id,
          post_id: post.id,
        })
        setLiked(true)
        setLikeCount((prev: number) => prev + 1)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setIsLiking(false)
    }
  }

  const handleDelete = async () => {
    if (!isOwner || !user || !confirm('Delete this post? This cannot be undone.')) return

    setIsDeleting(true)
    try {
      // Delete associated media from storage if exists
      if (post.media_url) {
        const bucket = post.media_type === 'video' ? 'videos' : 'images'
        const fileName = post.media_url.split('/').pop()
        if (fileName) {
          await supabase.storage.from(bucket).remove([fileName])
        }
      }

      // Delete the post (this will cascade delete likes, comments, workout_exercises, and personal_records due to foreign keys)
      const { error } = await (supabase.from('posts') as any)
        .delete()
        .eq('id', post.id)
        .eq('user_id', user.id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
    } finally {
      setIsDeleting(false)
      setShowMenu(false)
    }
  }

  const handleTogglePrivacy = async () => {
    if (!isOwner || !user || isUpdatingPrivacy) return

    setIsUpdatingPrivacy(true)
    const newPrivacy = !isPrivate

    try {
      const { error } = await (supabase.from('posts') as any)
        .update({ is_private: newPrivacy })
        .eq('id', post.id)
        .eq('user_id', user.id)

      if (error) throw error

      setIsPrivate(newPrivacy)
      setShowMenu(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating privacy:', error)
      alert('Failed to update privacy setting')
    } finally {
      setIsUpdatingPrivacy(false)
    }
  }

  const isPRPost = post.is_pr_post
  const isDeadcemberPost = post.is_deadcember_post

  return (
    <article className={`bg-gray-900/60 rounded-2xl border overflow-hidden card-elevated card-hover backdrop-blur-sm min-h-[400px] ${
      isDeadcemberPost
        ? 'border-primary/80 glow-red-lg bg-gradient-to-br from-red-950/20 via-gray-900/60 to-gray-900/60'
        : isPRPost 
        ? 'border-primary/50 glow-red-sm' 
        : 'border-gray-800/60'
    }`}>
      {/* Deadcember Badge */}
      {isDeadcemberPost && (
        <div className="bg-gradient-to-r from-primary via-red-700 to-primary px-5 py-3 flex items-center justify-center space-x-2">
          <span className="text-2xl">💀</span>
          <span className="text-white font-black text-base tracking-wider">DEADCEMBER</span>
        </div>
      )}

      {/* PR Badge */}
      {isPRPost && !isDeadcemberPost && (
        <div className="bg-gradient-primary px-5 py-2 flex items-center space-x-2">
          <Trophy className="w-4 h-4 text-white" />
          <span className="text-white font-bold text-sm">PERSONAL RECORD</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-800/40">
        <Link href={profileLink} className="flex items-center space-x-3 group">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden ring-2 ring-gray-800 group-hover:ring-primary transition-all duration-300">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-gray-300 font-bold text-lg">
                  {profile.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            {profile.is_premium && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-primary rounded-full flex items-center justify-center ring-2 ring-gray-900">
                <Crown className="w-3 h-3 text-white fill-current" />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white group-hover:text-primary transition-colors">
                {profile.username || profile.full_name || 'Unknown'}
              </span>
              {profile.is_premium && (
                <span className="badge-premium text-[10px] px-2 py-0.5">JACKED+</span>
              )}
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
        </Link>
        
        {isOwner && (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-500 hover:text-white hover:bg-gray-800/60 p-2 rounded-lg transition-all duration-300"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-10 overflow-hidden">
                <Link
                  href={`/post/${post.id}/edit`}
                  className="w-full px-4 py-3 text-left text-white hover:bg-gray-800/60 transition-colors flex items-center space-x-2"
                  onClick={() => setShowMenu(false)}
                >
                  <Edit className="w-4 h-4" />
                  <span className="font-semibold">Edit Post</span>
                </Link>
                <div className="h-px bg-gray-800"></div>
                <button
                  onClick={handleTogglePrivacy}
                  disabled={isUpdatingPrivacy}
                  className="w-full px-4 py-3 text-left text-white hover:bg-gray-800/60 transition-colors flex items-center justify-between disabled:opacity-50"
                >
                  <div className="flex items-center space-x-2">
                    {isPrivate ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span className="font-semibold">Followers Only</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        <span className="font-semibold">Public</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {isUpdatingPrivacy ? 'Updating...' : 'Change'}
                  </span>
                </button>
                <div className="h-px bg-gray-800"></div>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-950/30 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="font-semibold">{isDeleting ? 'Deleting...' : 'Delete Post'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PR Stats - Prominent Display */}
      {isPRPost && (post.pr_exercise || post.pr_weight || post.pr_reps) && (
        <div className="px-5 py-6 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-b border-primary/30">
          <div className="text-center space-y-4">
            {/* Exercise Name */}
            {post.pr_exercise && (
              <div>
                <p className="text-gray-400 text-xs font-bold tracking-wider uppercase mb-1">Exercise</p>
                <h3 className="text-2xl md:text-3xl font-black text-white">{post.pr_exercise}</h3>
              </div>
            )}
            
            {/* Weight and Reps - Large Display */}
            <div className="flex items-center justify-center space-x-8 md:space-x-12">
              {post.pr_weight && (
                <div className="text-center">
                  <p className="text-gray-400 text-xs font-bold tracking-wider uppercase mb-2">Weight</p>
                  <div className="flex items-baseline justify-center space-x-1">
                    <span className="text-4xl md:text-5xl font-black text-primary">{post.pr_weight}</span>
                    <span className="text-xl md:text-2xl font-bold text-gray-400">lbs</span>
                  </div>
                </div>
              )}
              
              {post.pr_reps && (
                <div className="text-center">
                  <p className="text-gray-400 text-xs font-bold tracking-wider uppercase mb-2">Reps</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl md:text-5xl font-black text-primary">{post.pr_reps}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Song/Music Info */}
      {(post.song_title || post.song_artist) && (
        <PostMusicPlayer
          songTitle={post.song_title}
          songArtist={post.song_artist}
          songUrl={post.song_url}
          spotifyId={post.song_spotify_id}
          albumArt={post.song_album_art_url}
          postId={post.id}
          startTime={post.song_start_time || undefined}
        />
      )}

      {/* Media */}
      {post.media_url && (
        <div className="relative w-full aspect-square bg-black">
          {post.media_type === 'video' ? (
            <video
              src={post.media_url}
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={post.media_url}
              alt="Post media"
              fill
              className="object-cover"
            />
          )}
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
        </div>
      )}

      {/* Deadcember Stats */}
      {isDeadcemberPost && (post.deadcember_volume || post.deadcember_personal_total) && (
        <div className="px-5 py-6 bg-gradient-to-br from-red-950/30 via-gray-900/60 to-gray-900/60 border-b border-primary/30">
          <div className="space-y-4">
            {post.deadcember_volume && (
              <div className="text-center">
                <p className="text-gray-400 text-xs font-bold tracking-wider uppercase mb-2">This Workout</p>
                <p className="text-3xl md:text-4xl font-black text-primary">
                  {post.deadcember_volume.toLocaleString()} lbs
                </p>
              </div>
            )}
            {post.deadcember_personal_total && (
              <div className="text-center pt-4 border-t border-primary/20">
                <p className="text-gray-400 text-xs font-bold tracking-wider uppercase mb-2">Personal Total</p>
                <p className="text-2xl md:text-3xl font-black text-white">
                  {post.deadcember_personal_total.toLocaleString()} lbs
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {post.content && (
        <div className="px-5 py-4 border-b border-gray-800/40">
          <p className="text-gray-100 leading-relaxed">
            <span className="font-bold text-primary mr-2">{profile.username}</span>
            {post.content}
          </p>
        </div>
      )}

      {/* Workout Details */}
      {post.workout_exercises && post.workout_exercises.length > 0 && (
        <WorkoutDetails exercises={post.workout_exercises} postId={post.id} />
      )}

      {/* Engagement Bar */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center space-x-2 group transition-all duration-300 ${
              liked
                ? 'text-primary'
                : 'text-gray-400 hover:text-primary'
            }`}
          >
            <Heart 
              className={`w-6 h-6 transition-all duration-300 group-hover:scale-110 ${
                liked ? 'fill-current' : ''
              }`}
              strokeWidth={2.5}
            />
            {likeCount > 0 && (
              <span className="font-bold text-sm">{likeCount}</span>
            )}
          </button>
          <Link
            href={`/post/${post.id}`}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all duration-300 group"
          >
            <MessageCircle 
              className="w-6 h-6 group-hover:scale-110 transition-all duration-300" 
              strokeWidth={2.5}
            />
            {post.comment_count > 0 && (
              <span className="font-bold text-sm">{post.comment_count}</span>
            )}
          </Link>
        </div>
        {post.comment_count > 0 && (
          <Link
            href={`/post/${post.id}`}
            className="text-sm text-gray-500 hover:text-gray-300 font-medium transition-colors"
          >
            View all comments
          </Link>
        )}
      </div>
    </article>
  )
}
