'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Heart, MessageCircle, MoreVertical, Crown, Trash2, Trophy, Globe, Lock, Edit, Archive, ArchiveRestore } from 'lucide-react'
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
    <article className={`rounded-2xl overflow-hidden transition-all duration-200 ${
      isDeadcemberPost
        ? 'bg-white/[0.03] border border-[#dc2626]/40'
        : isPRPost 
        ? 'bg-white/[0.02] border border-white/5' 
        : 'bg-white/[0.02] border border-white/5'
    }`}>
      {isDeadcemberPost && (
        <div className="bg-[#dc2626]/20 px-5 py-2.5 flex items-center justify-center space-x-2 border-b border-[#dc2626]/30">
          <Trophy className="w-4 h-4 text-[#dc2626]" />
          <span className="text-[#dc2626] font-semibold text-sm tracking-wide">Deadcember</span>
        </div>
      )}

      {isPRPost && !isDeadcemberPost && (
        <div className="h-0.5 bg-[#dc2626]/40" />
      )}

      <div className="flex items-center justify-between px-5 py-4">
        <Link href={profileLink} className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-full bg-white/5 overflow-hidden ring-1 ring-white/10">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.username}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/10 text-[#a1a1a1] font-medium text-sm">
                {profile.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-white text-[14px] group-hover:text-white/80 transition-colors">
              {profile.username || profile.full_name || 'Unknown'}
            </span>
            <span className="text-gray-600">•</span>
            <span className="text-[13px] text-gray-500 font-normal">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
        </Link>
        
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
                  className="w-full px-4 py-3 text-left text-[#dc2626] hover:bg-[#dc2626]/10 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="font-semibold">{isDeleting ? 'Deleting...' : 'Delete Post'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PR Stats - Technical, Data-Forward Typography */}
      {isPRPost && (post.pr_exercise || post.pr_weight || post.pr_reps) && (
        <div className="px-6 pb-6 pt-2">
          {/* Exercise label + PR badge */}
          <div className="flex items-center justify-between mb-4">
            {post.pr_exercise && (
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                {post.pr_exercise}
              </span>
            )}
            <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-[#dc2626]/10 rounded border border-[#dc2626]/20">
              <Trophy className="w-3 h-3 text-[#dc2626]" />
              <span className="text-[10px] font-semibold text-[#dc2626] uppercase tracking-wider">PR</span>
            </div>
          </div>
          
          {/* Large numeric data - condensed, tabular */}
          {(post.pr_weight || post.pr_reps) && (
            <div className="flex items-baseline space-x-10 mb-3">
              {post.pr_weight && (
                <div>
                  <div 
                    className="text-[64px] md:text-[72px] font-extrabold text-white tabular-nums leading-none" 
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {post.pr_weight}
                  </div>
                  <div className="text-sm font-semibold text-gray-500 uppercase mt-1.5">LBS</div>
                </div>
              )}
              
              {post.pr_reps && (
                <div>
                  <div 
                    className="text-[64px] md:text-[72px] font-extrabold text-white tabular-nums leading-none" 
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {post.pr_reps}
                  </div>
                  <div className="text-sm font-semibold text-gray-500 uppercase mt-1.5">REPS</div>
                </div>
              )}
            </div>
          )}
          
          {/* Secondary metric - subtle */}
          {post.pr_weight && post.pr_reps && post.pr_reps > 1 && (
            <div className="text-[13px] text-gray-600 font-normal">
              Est. 1RM: <span className="text-gray-500 font-medium tabular-nums">{calculateOneRepMax(post.pr_weight, post.pr_reps)} lbs</span>
            </div>
          )}
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

      {isDeadcemberPost && (post.deadcember_volume || post.deadcember_personal_total) && (
        <div className="px-5 py-5 bg-[#dc2626]/5 border-b border-[#dc2626]/20">
          <div className="space-y-4">
            {post.deadcember_volume && (
              <div className="text-center">
                <p className="text-[#a1a1a1] text-xs font-medium tracking-wide uppercase mb-2">This Workout</p>
                <p className="text-3xl md:text-4xl font-bold text-[#dc2626]">
                  {post.deadcember_volume.toLocaleString()} lbs
                </p>
              </div>
            )}
            {post.deadcember_personal_total && (
              <div className="text-center pt-4 border-t border-[#dc2626]/20">
                <p className="text-[#a1a1a1] text-xs font-medium tracking-wide uppercase mb-2">Personal Total</p>
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
        <div className="px-5 py-4 border-b border-white/5">
          <p className="text-white/90 leading-relaxed">
            <span className="font-semibold text-[#dc2626] mr-2">{profile.username}</span>
            {post.content}
          </p>
        </div>
      )}

      {/* Workout Details */}
      {post.workout_exercises && post.workout_exercises.length > 0 && (
        <WorkoutDetails exercises={post.workout_exercises} postId={post.id} />
      )}

      <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center space-x-2 group transition-all duration-200 ${
              liked ? 'text-[#dc2626]' : 'text-[#a1a1a1] hover:text-[#dc2626]'
            }`}
          >
            <Heart 
              className={`w-6 h-6 transition-all duration-300 group-hover:scale-110 ${
                liked ? 'fill-current' : ''
              }`}
              strokeWidth={2.5}
            />
            {likeCount > 0 && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowLikesModal(true)
                }}
                className="font-bold text-sm hover:underline"
              >
                {likeCount}
              </button>
            )}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowCommentForm(!showCommentForm)
            }}
            className="flex items-center space-x-2 text-[#a1a1a1] hover:text-white transition-all duration-200 group"
          >
            <MessageCircle 
              className={`w-7 h-7 md:w-6 md:h-6 group-hover:scale-110 transition-all duration-200 ${showCommentForm ? 'text-[#dc2626]' : ''}`}
              strokeWidth={2.5}
            />
            {commentCount > 0 && (
              <span className="font-bold text-sm">{commentCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Inline Comment Form */}
      {showCommentForm && user && (
        <div className="px-5 py-3 border-t border-white/5">
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
        <div className="px-5 py-3 space-y-2">
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

