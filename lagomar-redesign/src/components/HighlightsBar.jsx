import React from 'react'

function Icon({ name }) {
  if (name === 'wifi')
    return (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
    )
  if (name === 'fee')
    return (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  if (name === 'parking')
    return (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    )
  return null
}

export function HighlightsBar({ theme, highlights }) {
  const c = theme.colors

  return (
    <section
      className="border-y py-8 md:py-10"
      style={{ borderColor: c.border, backgroundColor: c.bgAlt }}
    >
      <div className="mx-auto max-w-5xl px-6 text-center">
        <p
          className="font-sans text-xs font-medium tracking-widest uppercase md:text-sm"
          style={{ color: c.textMuted }}
        >
          {highlights.line}
        </p>
        <div className="mt-8 flex flex-wrap items-start justify-center gap-10 md:gap-16">
          {highlights.items.map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span style={{ color: c.primary }}>
                <Icon name={item.icon} />
              </span>
              <span
                className="font-sans text-sm font-medium"
                style={{ color: c.text }}
              >
                {item.label}
              </span>
              {item.sublabel && (
                <span
                  className="font-sans text-xs"
                  style={{ color: c.textMuted }}
                >
                  {item.sublabel}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
