import React, { useState } from 'react'

const LOGO_SRC = '/lago-mar-logo.png'

export function ConceptHeader({ theme, themeId, navLinks }) {
  const [open, setOpen] = useState(false)
  const c = theme.colors

  return (
    <header
      className="w-full border-b transition-colors duration-200"
      style={{
        backgroundColor: c.bg,
        borderColor: c.border,
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <a href="/" className="shrink-0" aria-label="Lago Mar home">
          <img
            src={LOGO_SRC}
            alt="Lago Mar Beach Resort & Club"
            className="h-12 w-auto md:h-14"
            style={{ maxHeight: '56px' }}
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextElementSibling?.classList.remove('hidden')
            }}
          />
          <span
            className="hidden font-serif text-2xl font-semibold tracking-tight md:text-3xl"
            style={{ color: c.primary }}
          >
            Lago Mar
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: c.text }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <a
            href="#reservations"
            className="hidden rounded-sm px-4 py-2 text-sm font-medium transition-colors sm:inline-block"
            style={{
              backgroundColor: c.primary,
              color: c.bg,
            }}
          >
            Reservations
          </a>
          <button
            type="button"
            className="md:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Toggle menu"
            style={{ color: c.primary }}
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path fillRule="evenodd" d="M18.278 16.864a1 1 0 0 1-1.414 1.414L12 13.414l-4.864 4.864a1 1 0 0 1-1.414-1.414L10.586 12 5.722 7.136a1 1 0 0 1 1.414-1.414L12 10.586l4.864-4.864a1 1 0 0 1 1.414 1.414L13.414 12l4.864 4.864z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 1 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 1 1 0 2H4a1 1 0 1 1 0-2z" clipRule="evenodd" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div
          className="border-t px-6 py-4 md:hidden"
          style={{ borderColor: c.border, backgroundColor: c.bgAlt }}
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block py-2 text-sm font-medium"
              style={{ color: c.text }}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#reservations"
            className="mt-2 block w-full rounded-sm px-4 py-2 text-center text-sm font-medium"
            style={{ backgroundColor: c.primary, color: c.bg }}
            onClick={() => setOpen(false)}
          >
            Reservations
          </a>
        </div>
      )}
    </header>
  )
}
