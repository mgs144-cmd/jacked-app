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
import { calculateOneRepMaxWithRPE } from '@/utils/oneRepMax'

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
  const hasPRStats = isPRPost && (post.pr_exercise || post.pr_weight || post.pr_reps)

  return (
    <article 
      className="relative w-full max-w-[640px] rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif" }}
    >
      {/* Card padding container */}
      <div className="p-5 md:p-6">
        {/* Header: avatar, name, time, menu */}
        <div className="flex items-center justify-between gap-3">
          <Link href={profileLink} className="flex items-center min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-white/5 overflow-hidden flex-shrink-0 ring-1 ring-white/5">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/10 text-white/50 font-semibold text-sm">
                  {profile.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-white truncate">
                {profile.username || profile.full_name || 'Unknown'}
              </p>
              <p className="text-[13px] text-white/45 truncate">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </Link>
          {isOwner && (
            <div className="relative flex-shrink-0">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-xl z-10 overflow-hidden">
                  <Link href={`/post/${post.id}/edit`} className="flex items-center gap-2 w-full px-4 py-3 text-left text-white hover:bg-white/5 text-sm" onClick={() => setShowMenu(false)}>
                    <Edit className="w-4 h-4" /> Edit Post
                  </Link>
                  <div className="h-px bg-white/10" />
                  <button onClick={handleTogglePrivacy} disabled={isUpdatingPrivacy} className="w-full px-4 py-3 text-left text-white hover:bg-white/5 text-sm flex items-center justify-between disabled:opacity-50">
                    <span className="flex items-center gap-2">{isPrivate ? <><Lock className="w-4 h-4" /> Followers</> : <><Globe className="w-4 h-4" /> Public</>}</span>
                    {isUpdatingPrivacy && <span className="text-xs text-white/50">Updating...</span>}
                  </button>
                  <div className="h-px bg-white/10" />
                  <button onClick={handleToggleArchive} disabled={isArchiving} className="w-full px-4 py-3 text-left text-white hover:bg-white/5 text-sm flex items-center justify-between disabled:opacity-50">
                    <span className="flex items-center gap-2">{isArchived ? <><ArchiveRestore className="w-4 h-4" /> Unarchive</> : <><Archive className="w-4 h-4" /> Archive</>}</span>
                  </button>
                  <div className="h-px bg-white/10" />
                  <button onClick={handleDelete} disabled={isDeleting} className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 text-sm flex items-center gap-2 disabled:opacity-50">
                    <Trash2 className="w-4 h-4" /> {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Caption */}
        {post.content && (
          <p className="mt-4 text-[15px] md:text-base leading-relaxed text-white/90">
            {post.content}
          </p>
        )}

        {/* Performance block: lift numbers as hero */}
        {hasPRStats && (
          <div className="mt-5 md:mt-6">
            {post.pr_exercise && (
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-3">
                {post.pr_exercise}
              </p>
            )}
            {(post.pr_weight != null || post.pr_reps != null) && (
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {post.pr_weight != null && (
                  <div className="rounded-xl bg-white/[0.06] border border-white/[0.06] p-4 md:p-5 text-center">
                    <p className="text-5xl md:text-6xl font-bold tabular-nums text-white tracking-tight leading-none">
                      {post.pr_weight}
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-white/45 mt-2">LBS</p>
                  </div>
                )}
                {post.pr_reps != null && (
                  <div className="rounded-xl bg-white/[0.06] border border-white/[0.06] p-4 md:p-5 text-center">
                    <p className="text-5xl md:text-6xl font-bold tabular-nums text-white tracking-tight leading-none">
                      {post.pr_reps}
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-white/45 mt-2">REPS</p>
                  </div>
                )}
              </div>
            )}
            {post.pr_weight != null && post.pr_reps != null && post.pr_reps > 1 && (
              <p className="text-[13px] text-white/45 mt-3 tabular-nums">
                Est. 1RM <span className="font-semibold text-white/70">{calculateOneRepMaxWithRPE(post.pr_weight, post.pr_reps, post.pr_rpe)} lbs</span>
              </p>
            )}
            {isPRPost && (
              <div className="inline-flex items-center gap-1.5 mt-3 rounded-full bg-white/10 px-2.5 py-1">
                <Trophy className="w-3.5 h-3.5 text-white/80" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">PR</span>
              </div>
            )}
          </div>
        )}

        {/* Deadcember inline */}
        {isDeadcemberPost && (post.deadcember_volume != null || post.deadcember_personal_total != null) && (
          <div className="mt-4 flex items-center gap-6 text-[13px]">
            {post.deadcember_volume != null && (
              <span className="text-white/70"><span className="font-semibold text-white">{post.deadcember_volume.toLocaleString()}</span> lbs</span>
            )}
            {post.deadcember_personal_total != null && (
              <span className="text-white/70"><span className="font-semibold text-white">{post.deadcember_personal_total.toLocaleString()}</span> total</span>
            )}
          </div>
        )}

        {/* Song */}
        {post.song_title && post.song_artist && (
          <div className="mt-4">
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

        {/* Workout details */}
        {post.workout_exercises && post.workout_exercises.length > 0 && (
          <WorkoutDetails exercises={post.workout_exercises} postId={post.id} />
        )}

        {/* Actions: like, comment */}
        <div className="flex items-center gap-6 pt-4 mt-4 border-t border-white/[0.06]">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-2 py-1 transition-colors ${
            liked ? 'text-white' : 'text-white/50 hover:text-white'
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
              className="text-[13px] tabular-nums hover:underline cursor-pointer"
            >
              {likeCount}
            </span>
          ) : (
            <span className="text-[13px] tabular-nums">{likeCount}</span>
          )}
        </button>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowCommentForm(!showCommentForm)
          }}
          className={`flex items-center gap-2 py-1 group transition-colors ${
            showCommentForm ? 'text-white' : 'text-white/50 hover:text-white'
          }`}
        >
          <MessageCircle className="w-4 h-4" strokeWidth={2} />
          <span className="text-[13px] tabular-nums">{commentCount}</span>
        </button>
        </div>

        {/* Inline Comment Form */}
        {showCommentForm && user && (
          <div className="pt-4 mt-4 border-t border-white/[0.06]">
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

        {/* Top comments */}
        {post.top_comments && post.top_comments.length > 0 && (
          <div className="mt-4 space-y-2">
            {post.top_comments.map((comment: any) => {
              const commentProfile = comment.profile || { username: 'unknown', avatar_url: null }
              const isGIF = comment.content && comment.content.startsWith('http') && (comment.content.includes('giphy.com') || comment.content.includes('.gif'))
              return (
                <div key={comment.id} className="flex items-start gap-2 text-[14px]">
                  <span className="font-semibold text-white shrink-0">{commentProfile.username}</span>
                  {isGIF ? (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
                      <Image src={comment.content} alt="GIF" fill className="object-cover" />
                    </div>
                  ) : (
                    <span className="text-white/80">{comment.content}</span>
                  )}
                </div>
              )
            })}
            {commentCount > 3 && (
              <Link href={`/post/${post.id}`} className="text-[13px] text-white/50 hover:text-white/80 font-medium block mt-1">
                View all {commentCount} comments
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Media: full-bleed below card content */}
      {post.media_url && (
        <div className="relative w-full aspect-square bg-black/50">
          {post.media_type === 'video' ? (
            <video src={post.media_url} controls className="w-full h-full object-cover" />
          ) : (
            <Image src={post.media_url} alt="Post" fill className="object-cover" />
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

