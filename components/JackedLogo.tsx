'use client'

/**
 * JACKED Wordmark Component
 * Custom logo with premium typography treatment
 */
export function JackedLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative inline-flex items-baseline">
        <span className="font-black text-2xl tracking-[0.12em] uppercase text-white" 
              style={{ 
                fontFamily: 'var(--font-black-ops-one, -apple-system, BlinkMacSystemFont, sans-serif)',
                letterSpacing: '0.12em'
              }}>
          JACKED
        </span>
        <span className="absolute -bottom-1 left-0 w-10 h-[2px] bg-white" />
      </div>
    </div>
  )
}

/**
 * Compact version for mobile/small spaces
 */
export function JackedLogoCompact({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative inline-flex items-baseline">
        <span className="font-black text-base tracking-[0.12em] uppercase text-white" 
              style={{ 
                fontFamily: 'var(--font-black-ops-one, -apple-system, BlinkMacSystemFont, sans-serif)',
                letterSpacing: '0.12em'
              }}>
          JACKED
        </span>
        <span className="absolute -bottom-0.5 left-0 w-6 h-[2px] bg-white" />
      </div>
    </div>
  )
}
