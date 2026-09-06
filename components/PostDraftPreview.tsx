'use client'

import Image from 'next/image'
import { PostImageWithLightbox } from '@/components/PostImageWithLightbox'
import { POST_MEDIA_FRAME, POST_MEDIA_IMAGE_CONTAIN, POST_MEDIA_IMG } from '@/components/postMediaClasses'

export type PostDraftPreviewProps = {
  username: string
  avatarUrl?: string | null
  content: string
  mediaPreview: string | null
  mediaType: 'image' | 'video' | null
  isPRPost: boolean
  prExercise: string
  prWeight: string
  prReps: string
}

export function PostDraftPreview({
  username,
  avatarUrl,
  content,
  mediaPreview,
  mediaType,
  isPRPost,
  prExercise,
  prWeight,
  prReps,
}: PostDraftPreviewProps) {
  const hasMedia = Boolean(mediaPreview && mediaType)
  const hasPr = isPRPost && (prExercise.trim() || prWeight || prReps)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden max-w-[390px] mx-auto shadow-lg">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 px-3 pt-3 pb-1">Feed preview</p>
      <div className="px-3 py-2 flex items-center gap-2 border-b border-white/10">
        <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden shrink-0 ring-1 ring-white/10">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" width={36} height={36} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white/50">
              {username.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="ui-body-medium text-sm text-white truncate">{username}</p>
          <p className="text-[10px] text-white/40">Now</p>
        </div>
      </div>

      {hasMedia && mediaType === 'image' && (
        <PostImageWithLightbox
          src={mediaPreview!}
          alt=""
          frameClassName={POST_MEDIA_FRAME}
          imgClassName={POST_MEDIA_IMAGE_CONTAIN}
        />
      )}

      {hasMedia && mediaType === 'video' && (
        <div className={POST_MEDIA_FRAME}>
          <video src={mediaPreview!} controls className={POST_MEDIA_IMG} />
        </div>
      )}

      <div className="px-3 py-2.5 space-y-2">
        {hasPr && (
          <div className="text-center py-1">
            {prExercise.trim() && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45 mb-1">{prExercise}</p>
            )}
            <div className="flex justify-center gap-6">
              {prWeight && <span className="ui-stat-value tabular-nums">{prWeight}</span>}
              {prReps && <span className="ui-stat-value tabular-nums">{prReps}</span>}
            </div>
            {(prWeight || prReps) && (
              <p className="text-[9px] text-white/40 uppercase tracking-wide mt-1">lbs · reps</p>
            )}
          </div>
        )}

        {content.trim() && (
          <p className={`text-[13px] text-white/90 leading-snug ${hasPr ? 'mt-2' : ''}`}>
            <span className="font-semibold text-white">{username}</span> {content}
          </p>
        )}

        {!hasMedia && !content.trim() && !hasPr && (
          <p className="text-xs text-white/40 text-center py-4">Add a photo, caption, or PR to see preview</p>
        )}
      </div>
    </div>
  )
}
