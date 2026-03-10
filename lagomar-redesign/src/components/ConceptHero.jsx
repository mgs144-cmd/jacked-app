import React from 'react'

const LOGO_SRC = '/lago-mar-logo.png'

export function ConceptHero({ theme, themeId, hero }) {
  const c = theme.colors

  return (
    <section className="relative aspect-[16/10] w-full min-h-[420px] max-h-[85vh] overflow-hidden md:aspect-[3/1] md:min-h-[480px]">
      <img
        src={hero.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        style={{ backgroundColor: c.overlay }}
      >
        <img
          src={LOGO_SRC}
          alt="Lago Mar Beach Resort & Club"
          className="mb-6 h-16 w-auto drop-shadow-md md:h-20"
          style={{ maxHeight: '100px' }}
          onError={(e) => {
            e.target.style.display = 'none'
            const next = e.target.nextElementSibling
            if (next) next.classList.remove('hidden')
          }}
        />
        <p className="hidden font-serif text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Lago Mar
        </p>
        <h1 className="font-serif text-2xl font-medium tracking-wide text-white drop-shadow md:text-4xl lg:text-5xl">
          {hero.title}
        </h1>
        <p className="mt-3 max-w-xl font-sans text-base font-light leading-relaxed text-white/95 md:text-lg">
          {hero.subtitle}
        </p>
        <a
          href={themeId ? `#${themeId}-accommodations` : '#accommodations'}
          className="mt-8 inline-block rounded-sm px-6 py-3 text-sm font-medium tracking-wide transition-opacity hover:opacity-90"
          style={{
            backgroundColor: c.accent ?? c.primary,
            color: c.bg,
          }}
        >
          {hero.cta}
        </a>
      </div>
    </section>
  )
}
