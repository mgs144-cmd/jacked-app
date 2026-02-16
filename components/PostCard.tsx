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
import { calculateOneRepMax } from '@/utils/oneRepMax'

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
      className="relative overflow-hidden transition-all duration-200 w-full max-w-[640px] rounded-lg md:rounded-xl p-5 md:p-7"
      style={{ 
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
        backgroundColor: '#1a1a1a',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
      }}
    >
      {isDeadcemberPost && (
        <div 
          className="bg-[#ff5555]/15 py-3 flex items-center justify-center gap-2 border-b border-white/5 -mx-5 -mt-5 md:-mx-7 md:-mt-7 px-5 md:px-7"
        >
          <Trophy className="w-4 h-4 text-[#ff5555]" />
          <span className="text-[#ff5555] font-semibold text-sm tracking-wide">Deadcember</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link href={profileLink} className="flex items-center group">
          <div className="w-[50px] h-[50px] rounded-full bg-white/5 overflow-hidden ring-1 ring-white/10 flex-shrink-0">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.username}
                width={50}
                height={50}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/10 text-[#a1a1a1] font-medium text-sm">
                {profile.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className={`ml-3 flex items-center gap-2 min-w-0 flex-1 ${isPRPost && (post.pr_exercise || post.pr_weight || post.pr_reps) ? 'pr-20' : ''}`}>
            <span className="text-[15px] md:text-base font-semibold text-white truncate" style={{ fontWeight: 600 }}>
              {profile.username || profile.full_name || 'Unknown'}
            </span>
            <span className="text-gray-600 flex-shrink-0">•</span>
            <span className="text-[14px] font-normal flex-shrink-0" style={{ opacity: 0.6 }}>
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
        </Link>
        
        <div className="flex items-center gap-2">
        {isOwner && (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-[#a1a1a1] hover:text-white hover:bg-white/5 p-2 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-10 overflow-hidden">
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
                  <span className="text-xs text-gray-400">
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
                  <span className="text-xs text-gray-400">
                    {isArchiving ? 'Updating...' : ''}
                  </span>
                </button>
                <div className="h-px bg-white/10"></div>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full px-4 py-3 text-left text-[#ff5555] hover:bg-[#ff5555]/10 transition-colors flex items-center space-x-2 disabled:opacity-50"
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
        <div 
          className="absolute top-5 right-5 flex items-center gap-1.5 rounded-md border border-[#ff5555]/20 bg-[#ff5555]/10 cursor-default shrink-0"
          style={{ padding: '6px 12px' }}
        >
          <Trophy className="w-4 h-4 text-[#ff5555]" />
          <span className="font-semibold text-[#ff5555] uppercase tracking-wider" style={{ fontSize: '13px' }}>PR</span>
        </div>
      )}

      {isPRPost && (post.pr_exercise || post.pr_weight || post.pr_reps) && (
        <div className="flex flex-col items-center mt-4 md:mt-5">
          {post.pr_exercise && (
            <span 
              className="uppercase text-center text-base md:text-[15px] font-semibold tracking-wider"
              style={{ color: 'rgba(255, 255, 255, 0.9)' }}
            >
              {post.pr_exercise}
            </span>
          )}
          
          {(post.pr_weight || post.pr_reps) && (
            <div 
              className="flex justify-center items-baseline gap-8 md:gap-12 mt-3"
            >
              {post.pr_weight && (
                <div className="flex flex-col items-center">
                  <div 
                    className="text-white tabular-nums leading-none text-[68px] md:text-[76px] font-bold"
                  >
                    {post.pr_weight}
                  </div>
                  <span 
                    className="uppercase"
                    style={{ 
                      fontSize: '11px', 
                      letterSpacing: '1px', 
                      opacity: 0.5, 
                      marginTop: '4px' 
                    }}
                  >
                    LBS
                  </span>
                </div>
              )}
              {post.pr_reps && (
                <div className="flex flex-col items-center">
                  <div 
                    className="text-white tabular-nums leading-none text-[68px] md:text-[76px] font-bold"
                  >
                    {post.pr_reps}
                  </div>
                  <span 
                    className="uppercase"
                    style={{ 
                      fontSize: '11px', 
                      letterSpacing: '1px', 
                      opacity: 0.5, 
                      marginTop: '4px' 
                    }}
                  >
                    REPS
                  </span>
                </div>
              )}
            </div>
          )}
          
          {post.pr_weight && post.pr_reps && post.pr_reps > 1 && (
            <div 
              className="tabular-nums mt-2.5 md:mt-3 text-center"
              style={{ fontSize: '13px', opacity: 0.6 }}
            >
              Est. 1RM: <span className="font-medium">{calculateOneRepMax(post.pr_weight, post.pr_reps)} lbs</span>
            </div>
          )}
        </div>
      )}

      {/* Song/Music Info */}
      {(post.song_title || post.song_artist) && (
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

      {/* Media */}
      {post.media_url && (
        <div className="relative w-full aspect-square bg-[#1a1a1a] mt-4">
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

      {isDeadcemberPost && (post.deadcember_volume || post.deadcember_personal_total) && (
        <div className="py-5 bg-[#ff5555]/5 border-b border-white/5">
          <div className="space-y-4">
            {post.deadcember_volume && (
              <div className="text-center">
                <p className="text-[#a1a1a1] text-xs font-medium tracking-wide uppercase mb-2">This Workout</p>
                <p className="text-3xl md:text-4xl font-bold text-[#ff5555]">
                  {post.deadcember_volume.toLocaleString()} lbs
                </p>
              </div>
            )}
            {post.deadcember_personal_total && (
              <div className="text-center pt-4 border-t border-white/5">
                <p className="text-[#a1a1a1] text-xs font-medium tracking-wide uppercase mb-2">Personal Total</p>
                <p className="text-2xl md:text-3xl font-black text-white">
                  {post.deadcember_personal_total.toLocaleString()} lbs
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {post.content && (
        <div 
          className="mt-4 md:mt-5 pb-4 md:pb-5 border-b border-white/5"
        >
          <p 
            className="text-base md:text-lg leading-[1.4] font-medium"
            style={{ color: 'rgba(255, 255, 255, 0.85)' }}
          >
            {post.content}
          </p>
        </div>
      )}

      {/* Workout Details */}
      {post.workout_exercises && post.workout_exercises.length > 0 && (
        <WorkoutDetails exercises={post.workout_exercises} postId={post.id} />
      )}

      <div 
        className="flex items-center min-h-[44px] pt-4 md:pt-5 border-t border-white/5 mt-4 md:mt-5"
      >
        <div className="flex items-center gap-5">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center min-h-[44px] -my-2 py-2 group transition-all duration-200 active:scale-95 touch-manipulation ${
              liked ? 'text-[#ff5555]' : 'text-[#a1a1a1] hover:text-[#ff5555]'
            }`}
            style={{ gap: '6px' }}
          >
            <Heart 
              className={`transition-all duration-200 group-hover:scale-110 w-6 h-6 md:w-[22px] md:h-[22px] ${
                liked ? 'fill-current' : ''
              }`}
              strokeWidth={2.5}
            />
            {likeCount > 0 ? (
              <span
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowLikesModal(true)
                }}
                className="text-sm font-medium tabular-nums hover:underline cursor-pointer"
              >
                {likeCount}
              </span>
            ) : (
              <span className="text-sm font-medium tabular-nums">{likeCount}</span>
            )}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowCommentForm(!showCommentForm)
            }}
            className={`flex items-center min-h-[44px] -my-2 py-2 group transition-all duration-200 active:scale-95 touch-manipulation ${
              showCommentForm ? 'text-[#ff5555]' : 'text-[#a1a1a1] hover:text-[#ff5555]'
            }`}
            style={{ gap: '6px' }}
          >
            <MessageCircle 
              className="group-hover:scale-110 transition-all duration-200 w-6 h-6 md:w-[22px] md:h-[22px]"
              strokeWidth={2.5}
            />
            <span className="text-sm font-medium tabular-nums">{commentCount}</span>
          </button>
        </div>
      </div>

      {/* Inline Comment Form */}
      {showCommentForm && user && (
        <div className="py-4 border-t border-white/5">
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
        <div className="py-4 space-y-3">
          {post.top_comments.map((comment: any) => {
            const commentProfile = comment.profile || { username: 'unknown', avatar_url: null }
            const isGIF = comment.content && comment.content.startsWith('http') && (comment.content.includes('giphy.com') || comment.content.includes('.gif'))
            
            return (
              <div key={comment.id} className="flex items-start space-x-2">
                <span className="font-bold text-sm text-white">{commentProfile.username}</span>
                {isGIF ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                    <Image
                      src={comment.content}
                      alt="GIF comment"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-gray-300 flex-1">{comment.content}</span>
                )}
              </div>
            )
          })}
          {commentCount > 3 && (
            <Link
              href={`/post/${post.id}`}
              className="text-sm text-gray-500 hover:text-gray-300 font-medium transition-colors block mt-2"
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

