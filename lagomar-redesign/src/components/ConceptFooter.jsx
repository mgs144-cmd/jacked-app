import React from 'react'

export function ConceptFooter({ theme, footer }) {
  const c = theme.colors

  return (
    <footer
      className="border-t py-12 md:py-16"
      style={{ borderColor: c.border, backgroundColor: c.bg }}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-3 md:gap-12">
          <div>
            <p
              className="font-serif text-xl font-semibold"
              style={{ color: c.primary }}
            >
              {footer.tagline}
            </p>
            <p
              className="mt-3 font-sans text-sm leading-relaxed"
              style={{ color: c.textMuted }}
            >
              {footer.address}
            </p>
            <p
              className="mt-1 font-sans text-sm"
              style={{ color: c.textMuted }}
            >
              {footer.phone}
            </p>
          </div>
          <div className="md:col-span-2">
            <nav className="flex flex-wrap gap-6 md:justify-end" aria-label="Footer">
              {footer.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="font-sans text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ color: c.text }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
        <p
          className="mt-10 border-t pt-6 font-sans text-xs"
          style={{ borderColor: c.border, color: c.textMuted }}
        >
          © {new Date().getFullYear()} Lago Mar Beach Resort & Club. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
