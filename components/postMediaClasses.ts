/** Shared feed / detail frame — portrait-friendly, full bleed inside the card. */
export const POST_MEDIA_FRAME =
  'relative w-full aspect-[4/5] max-h-[min(44svh,380px)] sm:max-h-[min(48svh,420px)] md:max-h-[min(52svh,480px)] overflow-hidden bg-[#050505]'

/** Blurred fill behind letterboxed photos (avoids empty black bars). */
export const POST_MEDIA_BACKDROP =
  'absolute inset-0 h-full w-full object-cover scale-110 blur-2xl opacity-[0.35] brightness-[0.55] saturate-[1.15] pointer-events-none select-none'

/** Soft edge vignette over the frame. */
export const POST_MEDIA_VIGNETTE =
  'absolute inset-0 pointer-events-none bg-gradient-to-b from-black/25 via-transparent to-black/40'

/** Video: fill frame edge-to-edge. */
export const POST_MEDIA_IMG = 'absolute inset-0 h-full w-full object-cover object-center'

/** Still images: sharp full image on top of blurred backdrop. */
export const POST_MEDIA_IMAGE_CONTAIN =
  'absolute inset-0 h-full w-full object-contain object-center drop-shadow-[0_8px_32px_rgba(0,0,0,0.45)]'

export const POST_MEDIA_VIDEO = `${POST_MEDIA_FRAME} [&>video]:absolute [&>video]:inset-0 [&>video]:h-full [&>video]:w-full [&>video]:object-cover`
