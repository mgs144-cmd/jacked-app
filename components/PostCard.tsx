'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Heart, MessageCircle, MoreVertical, Trash2, Trophy, Globe, Lock, Edit, Archive, ArchiveRestore } from 'lucide-react'
import { PostMusicPlayer } from './PostMusicPlayer'
import { WorkoutDetails } from './WorkoutDetails'
import { LikesModal } from './LikesModal'
import { CommentForm } from './CommentForm'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import { calculateOneRepMax, calculateOneRepMaxWithRPE } from '@/utils/oneRepMax'

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
  const [isArchived, setIsArchived] = useState(post.is_archived || false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [showLikesModal, setShowLikesModal] = useState(false)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [commentCount, setCommentCount] = useState(post.comment_count || 0)

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

  const handleToggleArchive = async () => {
    if (!isOwner || !user || isArchiving) return

    setIsArchiving(true)
    const newArchiveState = !isArchived

    try {
      const { error } = await (supabase.from('posts') as any)
        .update({ is_archived: newArchiveState })
        .eq('id', post.id)
        .eq('user_id', user.id)

      if (error) throw error

      setIsArchived(newArchiveState)
      setShowMenu(false)
      router.refresh()
    } catch (error) {
      console.error('Error archiving post:', error)
      alert('Failed to archive post')
    } finally {
      setIsArchiving(false)
    }
  }

  const isPRPost = post.is_pr_post
  const isDeadcemberPost = post.is_deadcember_post

  return (
    <article 
      className="relative overflow-hidden w-full max-w-[640px] py-4 md:py-5"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      {isDeadcemberPost && (
        <div className="flex items-center gap-1.5 mb-3 text-white/80">
          <Trophy className="w-3.5 h-3.5" />
          <span className="text-xs font-medium tracking-wide">Deadcember</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link href={profileLink} className="flex items-center group min-w-0">
            <div className="w-9 h-9 rounded-full bg-white/5 overflow-hidden flex-shrink-0">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.username}
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/10 text-white/60 font-medium text-xs">
                {profile.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className={`ml-2.5 flex items-center gap-1.5 min-w-0 flex-1 ${isPRPost && (post.pr_exercise || post.pr_weight || post.pr_reps) ? 'pr-16' : ''}`}>
            <span className="text-sm font-medium text-white truncate">
              {profile.username || profile.full_name || 'Unknown'}
            </span>
            <span className="text-white/40 text-xs flex-shrink-0">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
        </Link>
        
        <div className={`flex items-center gap-1 ${isPRPost && (post.pr_exercise || post.pr_weight || post.pr_reps) ? 'mr-16' : ''}`}>
        {isOwner && (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-white/50 hover:text-white p-1.5 rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-black border border-white/10 rounded-xl shadow-2xl z-10 overflow-hidden">
                <Link
                  href={`/post/${post.id}/edit`}
                  className="w-full px-4 py-3 text-left text-white hover:bg-white/5 transition-colors flex items-center space-x-2"
                  onClick={() => setShowMenu(false)}
                >
                  <Edit className="w-4 h-4" />
                  <span className="font-semibold">Edit Post</span>
                </Link>
                <div className="h-px bg-white/10"></div>
                <button
                  onClick={handleTogglePrivacy}
                  disabled={isUpdatingPrivacy}
                  className="w-full px-4 py-3 text-left text-white hover:bg-white/5 transition-colors flex items-center justify-between disabled:opacity-50"
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
                  <span className="text-xs text-white/50">
                    {isUpdatingPrivacy ? 'Updating...' : 'Change'}
                  </span>
                </button>
                <div className="h-px bg-white/10"></div>
                <button
                  onClick={handleToggleArchive}
                  disabled={isArchiving}
                  className="w-full px-4 py-3 text-left text-white hover:bg-white/5 transition-colors flex items-center justify-between disabled:opacity-50"
                >
                  <div className="flex items-center space-x-2">
                    {isArchived ? (
                      <>
                        <ArchiveRestore className="w-4 h-4" />
                        <span className="font-semibold">Unarchive</span>
                      </>
                    ) : (
                      <>
                        <Archive className="w-4 h-4" />
                        <span className="font-semibold">Archive</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-white/50">
                    {isArchiving ? 'Updating...' : ''}
                  </span>
                </button>
                <div className="h-px bg-white/10"></div>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="font-semibold">{isDeleting ? 'Deleting...' : 'Delete Post'}</span>
                </button>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {isPRPost && (post.pr_exercise || post.pr_weight || post.pr_reps) && (
        <div className="absolute top-0 right-0 flex items-center gap-1.5 rounded px-2 py-0.5 bg-white/5">
          <Trophy className="w-3 h-3 text-white/80" />
          <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">PR</span>
        </div>
      )}

      {isPRPost && (post.pr_exercise || post.pr_weight || post.pr_reps) && (
        <div className="flex flex-col items-center mt-3">
          {post.pr_exercise && (
            <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
              {post.pr_exercise}
            </span>
          )}
          {(post.pr_weight || post.pr_reps) && (
            <div className="flex justify-center items-baseline gap-6 mt-2">
              {post.pr_weight && (
                <div className="flex flex-col items-center">
                  <span className="text-white tabular-nums text-4xl md:text-5xl font-bold leading-none">
                    {post.pr_weight}
                  </span>
                  <span className="text-[10px] text-white/50 uppercase tracking-wider mt-1">lbs</span>
                </div>
              )}
              {post.pr_reps && (
                <div className="flex flex-col items-center">
                  <span className="text-white tabular-nums text-4xl md:text-5xl font-bold leading-none">
                    {post.pr_reps}
                  </span>
                  <span className="text-[10px] text-white/50 uppercase tracking-wider mt-1">reps</span>
                </div>
              )}
            </div>
          )}
          {post.pr_weight && post.pr_reps && post.pr_reps > 1 && (
            <div className="text-xs text-white/50 mt-1.5 tabular-nums">
              Est. 1RM: <span className="font-medium text-white/70">{calculateOneRepMaxWithRPE(post.pr_weight, post.pr_reps, post.pr_rpe)} lbs</span>
            </div>
          )}
        </div>
      )}

      {post.song_title && post.song_artist && (
        <div className="mt-3">
        <PostMusicPlayer
          songTitle={post.song_title}
          songArtist={post.song_artist}
          songUrl={post.song_url}
          spotifyId={post.song_spotify_id}
          albumArt={post.song_album_art_url}
          postId={post.id}
          startTime={post.song_start_time || undefined}
        />
        </div>
      )}

      {/* Media */}
        {post.media_url && (
        <div className="relative w-full aspect-square bg-black mt-3">
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
        </div>
      )}

      {isDeadcemberPost && (post.deadcember_volume || post.deadcember_personal_total) && (
        <div className="mt-3 py-3 flex items-center justify-center gap-6 text-sm">
          {post.deadcember_volume && (
            <span className="text-white/80"><span className="font-semibold text-white">{post.deadcember_volume.toLocaleString()}</span> lbs</span>
          )}
          {post.deadcember_personal_total && (
            <span className="text-white/80"><span className="font-semibold text-white">{post.deadcember_personal_total.toLocaleString()}</span> total</span>
          )}
        </div>
      )}

      {post.content && (
        <p className="mt-3 text-sm leading-relaxed text-white/90">
          {post.content}
        </p>
      )}

      {/* Workout Details */}
      {post.workout_exercises && post.workout_exercises.length > 0 && (
        <WorkoutDetails exercises={post.workout_exercises} postId={post.id} />
      )}

      <div className="flex items-center gap-4 pt-3 mt-3 border-t border-white/5">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-1.5 py-1 group transition-colors ${
            liked ? 'text-white' : 'text-white/70 hover:text-white'
          }`}
        >
          <Heart 
            className={`w-4 h-4 ${liked ? 'fill-current' : ''}`}
            strokeWidth={2}
          />
          {likeCount > 0 ? (
            <span
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowLikesModal(true)
              }}
              className="text-xs tabular-nums hover:underline cursor-pointer"
            >
              {likeCount}
            </span>
          ) : (
            <span className="text-xs tabular-nums">{likeCount}</span>
          )}
        </button>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowCommentForm(!showCommentForm)
          }}
          className={`flex items-center gap-1.5 py-1 group transition-colors ${
            showCommentForm ? 'text-white' : 'text-white/70 hover:text-white'
          }`}
        >
          <MessageCircle className="w-4 h-4" strokeWidth={2} />
          <span className="text-xs tabular-nums">{commentCount}</span>
        </button>
      </div>

      {/* Inline Comment Form */}
      {showCommentForm && user && (
        <div className="pt-3 mt-3 border-t border-white/5">
          <CommentForm 
            postId={post.id} 
            userId={user.id}
            onCommentAdded={() => {
              setCommentCount((prev: number) => prev + 1)
              router.refresh()
            }}
          />
        </div>
      )}

      {/* Top 3 Comments */}
      {post.top_comments && post.top_comments.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {post.top_comments.map((comment: any) => {
            const commentProfile = comment.profile || { username: 'unknown', avatar_url: null }
            const isGIF = comment.content && comment.content.startsWith('http') && (comment.content.includes('giphy.com') || comment.content.includes('.gif'))
            
            return (
              <div key={comment.id} className="flex items-start gap-1.5 text-sm">
                <span className="font-medium text-white/90 shrink-0">{commentProfile.username}</span>
                {isGIF ? (
                  <div className="relative w-16 h-16 rounded overflow-hidden shrink-0">
                    <Image
                      src={comment.content}
                      alt="GIF"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <span className="text-white/80">{comment.content}</span>
                )}
              </div>
            )
          })}
          {commentCount > 3 && (
            <Link
              href={`/post/${post.id}`}
              className="text-xs text-white/50 hover:text-white/70 block mt-1"
            >
              View all {commentCount} comments
            </Link>
          )}
        </div>
      )}

      {/* Likes Modal */}
      <LikesModal
        postId={post.id}
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
      />
    </article>
  )
}

