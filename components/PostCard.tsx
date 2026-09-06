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
import { PostImageWithLightbox } from '@/components/PostImageWithLightbox'
import { POST_MEDIA_FRAME, POST_MEDIA_IMAGE_CONTAIN, POST_MEDIA_IMG } from '@/components/postMediaClasses'
import { CommentGif } from '@/components/CommentGif'
import { isGifComment } from '@/lib/commentContent'

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
      if (post.media_url) {
        const bucket = post.media_type === 'video' ? 'videos' : 'images'
        const fileName = post.media_url.split('/').pop()
        if (fileName) {
          await supabase.storage.from(bucket).remove([fileName])
        }
      }

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
  const hasMedia = Boolean(post.media_url)
  const hasWorkout = Array.isArray(post.workout_exercises) && post.workout_exercises.length > 0

  const padX = 'px-3 sm:px-4 md:px-5'
  const padBlock = `${padX} py-2 md:py-2.5`

  const headerBlock = (
    <div className={`flex items-center justify-between gap-2 ${padBlock} ${hasMedia ? 'pb-1.5' : ''}`}>
      <Link href={profileLink} className="flex items-center min-w-0 flex-1 active:opacity-80">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 overflow-hidden flex-shrink-0 ring-1 ring-white/5">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.username}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/10 text-white/50 font-semibold text-xs md:text-base">
              {profile.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className="ml-2 min-w-0 flex-1 md:ml-2.5">
          <p className="ui-body-medium text-base md:text-lg text-white truncate leading-tight">
            {profile.username || profile.full_name || 'Unknown'}
          </p>
          <p className="ui-meta truncate">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
        {hasPRStats && (
          <div className="inline-flex items-center gap-1 md:gap-2">
            <Trophy className="w-4 h-4 md:w-5 md:h-5 text-white/85" />
            <span className="text-[10px] md:text-[13px] font-semibold uppercase tracking-wider text-white/85">PR</span>
          </div>
        )}
        {isOwner && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 md:p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              <MoreVertical className="w-[18px] h-[18px] md:w-5 md:h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-xl z-10 overflow-hidden">
                <Link href={`/post/${post.id}/edit`} className="flex items-center gap-2 w-full px-4 py-3 text-left text-white hover:bg-white/5 text-sm" onClick={() => setShowMenu(false)}>
                  <Edit className="w-4 h-4" /> Edit Post
                </Link>
                <div className="h-px bg-white/10" />
                <button type="button" onClick={handleTogglePrivacy} disabled={isUpdatingPrivacy} className="w-full px-4 py-3 text-left text-white hover:bg-white/5 text-sm flex items-center justify-between disabled:opacity-50">
                  <span className="flex items-center gap-2">{isPrivate ? <><Lock className="w-4 h-4" /> Followers</> : <><Globe className="w-4 h-4" /> Public</>}</span>
                  {isUpdatingPrivacy && <span className="text-xs text-white/50">Updating...</span>}
                </button>
                <div className="h-px bg-white/10" />
                <button type="button" onClick={handleToggleArchive} disabled={isArchiving} className="w-full px-4 py-3 text-left text-white hover:bg-white/5 text-sm flex items-center justify-between disabled:opacity-50">
                  <span className="flex items-center gap-2">{isArchived ? <><ArchiveRestore className="w-4 h-4" /> Unarchive</> : <><Archive className="w-4 h-4" /> Archive</>}</span>
                </button>
                <div className="h-px bg-white/10" />
                <button type="button" onClick={handleDelete} disabled={isDeleting} className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 text-sm flex items-center gap-2 disabled:opacity-50">
                  <Trash2 className="w-4 h-4" /> {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  const captionBlock = post.content ? (
    <p
      className={`text-[15px] md:text-[17px] leading-snug text-white/90 ${
        hasPRStats ? 'mt-2' : hasMedia ? 'mt-1' : 'mt-2'
      }`}
    >
      {hasMedia ? (
        <>
          <Link href={profileLink} className="font-semibold text-white hover:underline">
            {profile.username}
          </Link>
          <Link href={`/post/${post.id}`} className="text-white/90 hover:underline">
            {' '}
            {post.content}
          </Link>
        </>
      ) : (
        post.content
      )}
    </p>
  ) : null

  const prBlock = hasPRStats ? (
    <div className={`text-center ${hasMedia ? 'mt-0.5' : 'mt-3'}`}>
      {post.pr_exercise && (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/50 mb-1">
          {post.pr_exercise}
        </p>
      )}
      {(post.pr_weight != null || post.pr_reps != null) && (
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-3xl md:text-5xl font-bold tabular-nums text-white tracking-metric leading-none">
            {post.pr_weight != null ? post.pr_weight : null}
            {post.pr_reps != null && post.pr_reps > 1 ? (
              <span className="text-white/75">×{post.pr_reps}</span>
            ) : null}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">lbs</p>
        </div>
      )}
      {post.pr_weight != null && post.pr_reps != null && post.pr_reps > 1 && (
        <p className="text-[10px] font-medium uppercase tracking-wide text-white/45 mt-1 tabular-nums">
          ~<span className="text-white/70">{calculateOneRepMaxWithRPE(post.pr_weight, post.pr_reps, post.pr_rpe)}</span> 1RM
        </p>
      )}
    </div>
  ) : null

  const captionAndMeta = (
    <>
      {hasPRStats ? (
        <>
          {prBlock}
          {captionBlock}
        </>
      ) : (
        captionBlock
      )}

      {isDeadcemberPost && (post.deadcember_volume != null || post.deadcember_personal_total != null) && (
        <div className="mt-2 flex items-center gap-4 text-xs">
          {post.deadcember_volume != null && (
            <span className="text-white/70"><span className="font-semibold text-white">{post.deadcember_volume.toLocaleString()}</span> lbs</span>
          )}
          {post.deadcember_personal_total != null && (
            <span className="text-white/70"><span className="font-semibold text-white">{post.deadcember_personal_total.toLocaleString()}</span> total</span>
          )}
        </div>
      )}

      {post.song_title && post.song_artist && (
        <div className="mt-2">
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

      {hasWorkout && !hasMedia && (
        <WorkoutDetails exercises={post.workout_exercises} postId={post.id} />
      )}
    </>
  )

  const actionRow = (
    <div className="flex items-center gap-5 md:gap-6">
      <button
        type="button"
        onClick={handleLike}
        disabled={isLiking}
        className={`flex items-center gap-1.5 py-0.5 transition-colors ${
          liked ? 'text-white' : 'text-white/50 hover:text-white'
        }`}
      >
        <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} strokeWidth={2} />
        {likeCount > 0 ? (
          <span
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowLikesModal(true)
            }}
            className="text-sm tabular-nums hover:underline cursor-pointer"
          >
            {likeCount}
          </span>
        ) : (
          <span className="text-sm tabular-nums">{likeCount}</span>
        )}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowCommentForm(!showCommentForm)
        }}
        className={`flex items-center gap-1.5 py-0.5 group transition-colors ${
          showCommentForm ? 'text-white' : 'text-white/50 hover:text-white'
        }`}
      >
        <MessageCircle className="w-5 h-5" strokeWidth={2} />
        <span className="text-sm tabular-nums">{commentCount}</span>
      </button>
    </div>
  )

  const commentsBlock = (
    <>
      {showCommentForm && user && (
        <div className="pt-2 mt-2 border-t border-white/[0.06]">
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

      {post.top_comments && post.top_comments.length > 0 && (
        <div className={`space-y-1.5 ${showCommentForm && user ? 'mt-2' : 'mt-2'}`}>
          {post.top_comments.map((comment: any) => {
            const commentProfile = comment.profile || { username: 'unknown', avatar_url: null }
            const gif = isGifComment(comment.content)

            if (gif && !showCommentForm) {
              return (
                <button
                  key={comment.id}
                  type="button"
                  onClick={() => setShowCommentForm(true)}
                  className="flex items-baseline gap-1.5 text-sm text-left hover:opacity-90"
                >
                  <span className="font-semibold text-white shrink-0">{commentProfile.username}</span>
                  <span className="text-white/45">GIF</span>
                </button>
              )
            }

            if (gif && showCommentForm) {
              return (
                <div key={comment.id} className="space-y-2">
                  <span className="font-semibold text-white text-sm">
                    {commentProfile.username}
                  </span>
                  <CommentGif src={comment.content} size="feed" />
                </div>
              )
            }

            return (
              <div key={comment.id} className="flex items-start gap-2 text-sm">
                <span className="font-semibold text-white shrink-0">{commentProfile.username}</span>
                <span className="text-white/80">{comment.content}</span>
              </div>
            )
          })}
          {commentCount > 3 && (
            <Link href={`/post/${post.id}`} className="text-sm text-white/50 hover:text-white/80 font-medium block mt-1">
              View all {commentCount} comments
            </Link>
          )}
        </div>
      )}
    </>
  )

  return (
    <article
      className={`relative w-full max-w-[640px] overflow-hidden sm:rounded-2xl ${
        hasMedia
          ? 'border-y border-white/[0.06] bg-black sm:border sm:border-white/[0.08]'
          : 'border-y border-white/[0.06] bg-white/[0.02] sm:border sm:border-white/[0.08] sm:bg-white/[0.03]'
      }`}
    >
      {headerBlock}

      {hasMedia && (
        <Link href={`/post/${post.id}`} className="relative block w-full active:opacity-95">
          {post.media_type === 'video' ? (
            <div className={POST_MEDIA_FRAME}>
              <video src={post.media_url} controls className={POST_MEDIA_IMG} playsInline />
            </div>
          ) : (
            <PostImageWithLightbox
              src={post.media_url}
              alt=""
              frameClassName={POST_MEDIA_FRAME}
              imgClassName={POST_MEDIA_IMAGE_CONTAIN}
            />
          )}
        </Link>
      )}

      {hasMedia && hasWorkout && (
        <div className={`border-t border-white/[0.06] bg-white/[0.02] ${padX} py-0.5`}>
          <WorkoutDetails exercises={post.workout_exercises} postId={post.id} defaultExpanded={false} />
        </div>
      )}

      {!hasMedia && <div className={`${padX} pb-2 md:pb-3 pt-0`}>{captionAndMeta}</div>}

      <div
        className={`${padX} py-2 md:py-2.5 ${
          hasMedia ? 'pt-1.5 bg-black border-t border-white/[0.06]' : 'pt-1.5 border-t border-white/[0.06]'
        }`}
      >
        {hasMedia ? (
          <>
            {actionRow}
            {captionAndMeta}
            {commentsBlock}
          </>
        ) : (
          <>
            {actionRow}
            {commentsBlock}
          </>
        )}
      </div>

      <LikesModal postId={post.id} isOpen={showLikesModal} onClose={() => setShowLikesModal(false)} />
    </article>
  )
}
