'use client'

type LogoSize = 'default' | 'large' | 'compact' | 'hero'

const sizeClasses: Record<LogoSize, string> = {
  hero: 'text-[clamp(3.5rem,14vw,11rem)]',
  large: 'text-4xl md:text-5xl',
  compact: 'text-lg sm:text-xl',
  default: 'text-2xl md:text-[1.75rem]',
}

/** Brand wordmark: JACKED in Good Times Bold (self-hosted + Adobe kit). */
export function JackedLogo({ className = '', size = 'default' }: { className?: string; size?: LogoSize }) {
  return (
    <span
      className={`font-logo tk-good-times inline-block text-white ${sizeClasses[size]} ${className}`}
      style={{
        fontFamily: "'Good Times', 'good-times', sans-serif",
        fontWeight: 700,
        fontStyle: 'normal',
      }}
      aria-label="JACKED"
    >
      JACKED
    </span>
  )
}

/** Tighter mark for small headers */
export function JackedLogoCompact({ className = '' }: { className?: string }) {
  return <JackedLogo className={className} size="compact" />
}
