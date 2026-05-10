import React from 'react'

export function WelcomeSection({ theme, welcome }) {
  const c = theme.colors

  // Split awards text and inject links for publication names
  const awardLinkLabels = welcome.awardLinks.map((l) => l.label)
  const parts = awardLinkLabels.reduce(
    (acc, label) => {
      const last = acc[acc.length - 1]
      if (typeof last === 'string' && last.includes(label)) {
        const link = welcome.awardLinks.find((a) => a.label === label)
        const before = last.substring(0, last.indexOf(label))
        const after = last.substring(last.indexOf(label) + label.length)
        acc[acc.length - 1] = before
        acc.push(link)
        if (after) acc.push(after)
      }
      return acc
    },
    [welcome.awards]
  )

  return (
    <section
      className="py-16 md:py-24"
      style={{ backgroundColor: c.bg }}
    >
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p
          className="font-sans text-xs font-medium tracking-widest uppercase"
          style={{ color: c.textMuted }}
        >
          {welcome.eyebrow}
        </p>
        <h2
          className="mt-2 font-serif text-4xl font-semibold italic tracking-tight md:text-5xl"
          style={{ color: c.primary }}
        >
          {welcome.heading}
        </h2>
        <p
          className="mt-8 font-sans text-base leading-relaxed"
          style={{ color: c.text }}
        >
          {welcome.body}
        </p>
        <p
          className="mt-6 font-sans text-sm leading-relaxed"
          style={{ color: c.textMuted }}
        >
          {parts.map((part, i) =>
            typeof part === 'object' && part.href ? (
              <a
                key={i}
                href={part.href}
                className="underline decoration-2 underline-offset-2 transition-opacity hover:opacity-80"
                style={{ color: c.primary }}
              >
                {part.label}
              </a>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>
        <a
          href="#accommodations"
          className="mt-10 inline-block rounded-sm px-8 py-3 font-sans text-sm font-medium uppercase tracking-wide transition-opacity hover:opacity-90"
          style={{
            backgroundColor: c.primary,
            color: c.bg,
          }}
        >
          {welcome.cta}
        </a>
      </div>
    </section>
  )
}
