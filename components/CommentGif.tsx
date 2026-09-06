type CommentGifSize = 'preview' | 'feed' | 'detail'

const sizeClass: Record<CommentGifSize, string> = {
  preview: 'max-w-[140px] max-h-[140px]',
  feed: 'max-w-[min(100%,280px)] max-h-[220px]',
  detail: 'max-w-[min(100%,340px)] max-h-[280px]',
}

interface CommentGifProps {
  src: string
  size?: CommentGifSize
  className?: string
}

/** Animated GIFs use a native img so frames play reliably. */
export function CommentGif({ src, size = 'feed', className = '' }: CommentGifProps) {
  return (
    <div
      className={`inline-block rounded-xl overflow-hidden bg-black/30 ${sizeClass[size]} ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="GIF comment" className="w-full h-auto object-contain rounded-xl" loading="lazy" />
    </div>
  )
}
