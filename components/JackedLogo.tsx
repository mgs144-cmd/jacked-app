'use client'

/**
 * JACKED Wordmark Component
 * Custom logo with premium typography treatment
 */
export function JackedLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative inline-flex items-baseline">
        {/* Main wordmark */}
        <span className="font-black text-2xl tracking-[0.12em] uppercase text-[#ff5555]" 
              style={{ 
                fontFamily: 'var(--font-black-ops-one, -apple-system, BlinkMacSystemFont, sans-serif)',
                letterSpacing: '0.12em'
              }}>
          JAC
          {/* K with notch detail */}
          <span className="relative inline-block">
            K
            {/* Subtle cut/notch on the K */}
            <span className="absolute top-[48%] left-[35%] w-[2px] h-[6px] bg-[#0a0a0a] transform -rotate-[25deg] z-10" />
          </span>
          ED
        </span>
        {/* Minimal red accent bar */}
        <span className="absolute -bottom-1 left-0 w-10 h-[2px] bg-[#ff5555]" />
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
        <span className="font-black text-base tracking-[0.12em] uppercase text-[#ff5555]" 
              style={{ 
                fontFamily: 'var(--font-black-ops-one, -apple-system, BlinkMacSystemFont, sans-serif)',
                letterSpacing: '0.12em',
                fontStretch: 'condensed'
              }}>
          JACKED
        </span>
        <span className="absolute -bottom-0.5 left-0 w-6 h-[2px] bg-[#ff5555]" />
      </div>
    </div>
  )
}
