'use client'

const BRAND_FONT = "'Good Times', 'good-times', sans-serif"

const brandStyle = {
  fontFamily: BRAND_FONT,
  fontWeight: 700,
  fontStyle: 'normal' as const,
}

type Variant = 'page' | 'section'

const sizeClass: Record<Variant, string> = {
  page: 'text-[1.625rem] sm:text-[1.75rem]',
  section: 'text-[1.25rem] sm:text-[1.375rem]',
}

interface BrandHeadingProps {
  variant: Variant
  children: React.ReactNode
  className?: string
}

/** Major screen titles — Good Times Bold, ALL CAPS (FEED, LOG, COMMUNITY, etc.) */
export function BrandHeading({ variant, children, className = '' }: BrandHeadingProps) {
  const shared = `font-logo tk-good-times log-screen-brand block text-white leading-[0.92] tracking-[0.06em] uppercase ${sizeClass[variant]} ${className}`

  if (variant === 'page') {
    return (
      <h1 className={shared} style={brandStyle}>
        {children}
      </h1>
    )
  }

  return (
    <h2 className={shared} style={brandStyle}>
      {children}
    </h2>
  )
}
