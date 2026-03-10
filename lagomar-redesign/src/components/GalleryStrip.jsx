import React from 'react'

export function GalleryStrip({ theme, images }) {
  const c = theme.colors

  return (
    <section
      className="py-12 md:py-16"
      style={{ backgroundColor: c.bgAlt }}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex gap-2 overflow-x-auto pb-2 md:gap-4">
          {images.map((src, i) => (
            <div
              key={i}
              className="h-56 w-72 shrink-0 overflow-hidden rounded-sm md:h-64"
            >
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
