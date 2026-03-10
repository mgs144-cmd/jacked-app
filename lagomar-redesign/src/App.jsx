import React from 'react'
import { themes } from './data/themes'
import { content } from './data/content'
import { ConceptHomepage } from './components/ConceptHomepage'

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', color: '#1a1a1a', maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
          <pre style={{ background: '#f5f5f5', padding: '1rem', overflow: 'auto', fontSize: '12px' }}>
            {this.state.error?.message ?? String(this.state.error)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

const NAV_LINKS = [
  { label: 'Intro', href: '#intro' },
  { label: 'Concept 1', href: '#concept1' },
  { label: 'Concept 2', href: '#concept2' },
  { label: 'Concept 3', href: '#concept3' },
  { label: 'Concept 4', href: '#concept4' },
  { label: 'Summary', href: '#summary' },
]

export default function App() {
  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-stone-100" style={{ minHeight: '100vh', backgroundColor: '#f5f5f4' }}>
      {/* Sticky comparison nav */}
      <nav
        style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #d6d3d1', backgroundColor: 'rgba(231,229,228,0.95)', padding: '0.75rem 1rem', color: '#292524' }}
        className="sticky top-0 z-50 border-b border-stone-300 bg-stone-200/95 shadow-sm backdrop-blur-sm"
        aria-label="Comparison navigation"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 md:px-6">
          <span className="font-serif text-lg font-semibold text-stone-800">
            Lago Mar — Homepage Exploration
          </span>
          <div className="flex flex-wrap items-center gap-1 md:gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded px-2 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-300/60 hover:text-stone-900 md:px-3"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Intro section */}
      <section
        id="intro"
        className="scroll-mt-20 border-b border-stone-300 bg-stone-50 px-6 py-12 md:py-16"
      >
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
            Homepage Brand Direction Exploration
          </h1>
          <p className="mt-4 font-sans text-base leading-relaxed text-stone-600">
            Four distinct visual directions for Lago Mar Beach Resort & Club, each reflecting
            heritage coastal luxury and Fort Lauderdale elegance. Scroll to compare full
            hero-to-footer homepage mockups and choose the direction that best fits the brand.
          </p>
        </div>
      </section>

      {/* Compact comparison bar */}
      <section
        className="border-b border-stone-300 bg-white px-4 py-6 md:px-6"
        aria-label="Concept comparison overview"
      >
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-4 font-serif text-sm font-semibold uppercase tracking-widest text-stone-500">
            At a glance
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(themes).map(([key, t]) => (
              <a
                key={key}
                href={`#${key}`}
                className="rounded border border-stone-200 bg-stone-50/80 p-4 transition-shadow hover:shadow-md"
              >
                <p className="font-serif font-semibold text-stone-900">{t.name}</p>
                <p className="mt-1 font-sans text-xs font-medium text-stone-500">
                  {t.logoStyle}
                </p>
                <p className="mt-1 font-sans text-xs text-stone-600">{t.palette}</p>
                <p className="mt-2 font-sans text-xs italic text-stone-500">{t.vibe}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Concept 1 */}
      <div id="concept1" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 pt-8 pb-2 md:px-6">
          <span className="font-serif text-2xl font-semibold text-stone-800">
            Concept 1 — Heritage Coastal Classic
          </span>
        </div>
        <ConceptHomepage theme={themes.concept1} themeId="concept1" />
      </div>

      {/* Concept 2 */}
      <div id="concept2" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 pt-8 pb-2 md:px-6">
          <span className="font-serif text-2xl font-semibold text-stone-800">
            Concept 2 — Soft Sage Resort
          </span>
        </div>
        <ConceptHomepage theme={themes.concept2} themeId="concept2" />
      </div>

      {/* Concept 3 */}
      <div id="concept3" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 pt-8 pb-2 md:px-6">
          <span className="font-serif text-2xl font-semibold text-stone-800">
            Concept 3 — Rosewood-Inspired Editorial Luxury
          </span>
        </div>
        <ConceptHomepage theme={themes.concept3} themeId="concept3" />
      </div>

      {/* Concept 4 */}
      <div id="concept4" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 pt-8 pb-2 md:px-6">
          <span className="font-serif text-2xl font-semibold text-stone-800">
            Concept 4 — Ocean Club / Nautical Heritage
          </span>
        </div>
        <ConceptHomepage theme={themes.concept4} themeId="concept4" />
      </div>

      {/* Final comparison summary */}
      <section
        id="summary"
        className="scroll-mt-20 border-t border-stone-300 bg-stone-100 px-6 py-16 md:py-20"
      >
        <div className="mx-auto max-w-7xl">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
            Summary — Choose a direction
          </h2>
          <p className="mt-2 max-w-2xl font-sans text-base text-stone-600">
            Each concept uses the same content structure and sections; only the visual identity
            and brand pack change. Select the direction that best reflects Lago Mar’s heritage
            and future.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(themes).map(([key, t]) => (
              <a
                key={key}
                href={`#${key}`}
                className="group overflow-hidden rounded-sm border border-stone-300 bg-white shadow-sm transition-all hover:shadow-md"
              >
                <div
                  className="h-24 w-full"
                  style={{ backgroundColor: t.colors.bg }}
                />
                <div
                  className="h-2 w-full"
                  style={{ backgroundColor: t.colors.primary }}
                />
                <div className="p-4">
                  <p className="font-serif font-semibold text-stone-900">{t.name}</p>
                  <p className="mt-1 font-sans text-xs text-stone-500">{t.palette}</p>
                  <p className="mt-2 font-sans text-sm text-stone-600">{t.vibe}</p>
                  <span className="mt-3 inline-block font-sans text-sm font-medium text-stone-700 group-hover:underline">
                    View full concept →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
    </ErrorBoundary>
  )
}
