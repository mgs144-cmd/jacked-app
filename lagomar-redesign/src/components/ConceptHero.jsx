import React from 'react'

const LOGO_SRC = '/lago-mar-logo.png'

export function ConceptHero({ theme, themeId, hero }) {
  const c = theme.colors
  const useVideo = hero.video

  return (
    <section className="relative w-full min-h-[75vh] overflow-hidden md:min-h-[85vh]">
      {useVideo ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={hero.image}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={hero.video} type="video/mp4" />
          <img src={hero.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        </video>
      ) : (
        <img
          src={hero.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        style={{
          backgroundColor: c.overlay,
          paddingTop: '12%',
        }}
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
        {hero.eyebrow && (
          <p className="font-sans text-sm font-medium tracking-widest uppercase text-white/90 md:text-base">
            {hero.eyebrow}
          </p>
        )}
        <h1 className="mt-2 font-serif text-3xl font-medium italic tracking-wide text-white drop-shadow md:text-5xl lg:text-6xl">
          {hero.title}
        </h1>
        {hero.tagline && (
          <p className="mt-3 font-serif text-lg font-normal text-white/95 md:text-xl lg:text-2xl">
            {hero.tagline}
          </p>
        )}
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
