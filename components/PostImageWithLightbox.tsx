'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, X } from 'lucide-react'
import {
  POST_MEDIA_BACKDROP,
  POST_MEDIA_VIGNETTE,
} from '@/components/postMediaClasses'

type PostImageWithLightboxProps = {
  src: string
  alt?: string
  /** Outer frame (e.g. POST_MEDIA_FRAME) */
  frameClassName: string
  /** Foreground image (e.g. POST_MEDIA_IMAGE_CONTAIN) */
  imgClassName: string
}

/**
 * Feed post image: blurred backdrop fill + sharp foreground; tap to expand.
 */
export function PostImageWithLightbox({ src, alt = '', frameClassName, imgClassName }: PostImageWithLightboxProps) {
  const [open, setOpen] = useState(false)

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onKey])

  const modal =
    open &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        className="fixed inset-0 z-[200] flex flex-col bg-black/98 p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Expanded image"
        onClick={() => setOpen(false)}
      >
        <div className="flex shrink-0 justify-end pb-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full p-2 text-white/80 hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt || 'Post image'} className="max-h-[85dvh] max-w-full object-contain" />
        </div>
        <p className="shrink-0 pt-2 text-center text-[11px] text-white/40" onClick={(e) => e.stopPropagation()}>
          Tap outside or press Esc to close
        </p>
      </div>,
      document.body
    )

  return (
    <>
      <div className={frameClassName}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" aria-hidden className={POST_MEDIA_BACKDROP} loading="lazy" decoding="async" />
        <div className={POST_MEDIA_VIGNETTE} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group absolute inset-0 block h-full w-full cursor-zoom-in text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/30"
          aria-label="View image larger"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className={`${imgClassName} pointer-events-none transition-transform duration-300 group-hover:scale-[1.01]`}
            loading="lazy"
            decoding="async"
          />
          <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[10px] font-medium text-white/70 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            <Maximize2 className="h-3 w-3" />
            Expand
          </span>
        </button>
      </div>
      {modal}
    </>
  )
}
