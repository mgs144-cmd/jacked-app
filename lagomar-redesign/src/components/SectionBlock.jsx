import React from 'react'

export function SectionBlock({
  theme,
  id,
  heading,
  subheading,
  description,
  cta,
  image,
  image2,
  imageLeft = false,
  altBg = false,
  children,
}) {
  const c = theme.colors

  return (
    <section
      id={id}
      className="scroll-mt-24 py-16 md:py-20"
      style={{ backgroundColor: altBg ? c.bgAlt : c.bg }}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div
          className={`grid gap-12 md:grid-cols-2 md:gap-16 ${imageLeft ? 'md:grid-flow-dense' : ''}`}
        >
          <div
            className={`flex flex-col justify-center ${imageLeft ? 'md:col-start-2' : ''}`}
          >
            {subheading && (
              <p
                className="font-sans text-sm font-medium tracking-widest uppercase"
                style={{ color: c.accent ?? c.primary }}
              >
                {subheading}
              </p>
            )}
            <h2
              className="mt-2 font-serif text-3xl font-semibold tracking-tight md:text-4xl"
              style={{ color: c.primary }}
            >
              {heading}
            </h2>
            {description && (
              <p
                className="mt-4 max-w-lg font-sans text-base leading-relaxed"
                style={{ color: c.textMuted }}
              >
                {description}
              </p>
            )}
            {cta && (
              <a
                href="#"
                className="mt-6 inline-block font-sans text-sm font-medium underline decoration-2 underline-offset-4 transition-opacity hover:opacity-80"
                style={{ color: c.primary }}
              >
                {cta}
              </a>
            )}
            {children}
          </div>
          <div className={`relative ${imageLeft ? 'md:col-start-1 md:row-start-1' : ''}`}>
            {image && (
              <div className="overflow-hidden rounded-sm">
                <img
                  src={image}
                  alt=""
                  className="h-72 w-full object-cover md:h-80"
                />
              </div>
            )}
            {image2 && (
              <div className="mt-4 overflow-hidden rounded-sm md:mt-6">
                <img
                  src={image2}
                  alt=""
                  className="h-48 w-full object-cover md:h-56"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
