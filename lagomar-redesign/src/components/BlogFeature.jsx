import React from 'react'

export function BlogFeature({ theme, blog, themeId }) {
  const c = theme.colors

  return (
    <section
      className="py-16 md:py-20"
      style={{ backgroundColor: c.bg }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-2 md:gap-14">
          <div className="flex flex-col justify-center">
            <p
              className="font-sans text-xs font-medium tracking-widest uppercase"
              style={{ color: c.textMuted }}
            >
              {blog.eyebrow}
            </p>
            <h2
              className="mt-2 font-serif text-3xl font-semibold italic tracking-tight md:text-4xl"
              style={{ color: c.primary }}
            >
              {blog.title}
            </h2>
            <hr
              className="mt-4 w-16 border-t"
              style={{ borderColor: c.border }}
            />
            <p
              className="mt-6 font-sans text-base leading-relaxed"
              style={{ color: c.text }}
            >
              {blog.body}
            </p>
            <a
              href="#"
              className="mt-8 inline-block rounded-sm px-6 py-3 font-sans text-sm font-medium uppercase tracking-wide transition-opacity hover:opacity-90"
              style={{
                backgroundColor: c.primary,
                color: c.bg,
              }}
            >
              {blog.cta}
            </a>
          </div>
          <div className="overflow-hidden rounded-sm">
            <img
              src={blog.image}
              alt="Family on the beach at Lago Mar"
              className="h-80 w-full object-cover md:h-96"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1506953820596-b2f2c786753c?w=800&q=85'
              }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
