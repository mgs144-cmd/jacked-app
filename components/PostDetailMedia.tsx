'use client'

import { PostImageWithLightbox } from '@/components/PostImageWithLightbox'
import { POST_MEDIA_FRAME, POST_MEDIA_IMAGE_CONTAIN, POST_MEDIA_IMG } from '@/components/postMediaClasses'

type PostDetailMediaProps = {
  mediaUrl: string
  mediaType: string | null
}

export function PostDetailMedia({ mediaUrl, mediaType }: PostDetailMediaProps) {
  const isVideo = mediaType === 'video'

  if (isVideo) {
    return (
      <div className={`${POST_MEDIA_FRAME} max-h-[min(70vh,560px)]`}>
        <video src={mediaUrl} controls className={POST_MEDIA_IMG} />
      </div>
    )
  }

  return (
    <PostImageWithLightbox
      src={mediaUrl}
      alt="Post media"
      frameClassName={`${POST_MEDIA_FRAME} max-h-[min(70vh,560px)]`}
      imgClassName={POST_MEDIA_IMAGE_CONTAIN}
    />
  )
}
