/**
 * Typography:
 * - Good Times (`good-times`) — brand wordmark only (.font-logo)
 * - FF DIN — action / performance UI (.font-action, .action-text, .label-caps)
 * - Inter + Neue Haas Grotesk — readable UI (.font-ui, .ui-heading, .ui-body)
 * - Acumin Pro — legacy body fallback
 *
 * Adobe Fonts: NEXT_PUBLIC_ADOBE_FONTS_KIT in .env.local
 * Inter: loaded via next/font in app/layout.tsx (--font-inter)
 */

export const ADOBE_FONTS_KIT = process.env.NEXT_PUBLIC_ADOBE_FONTS_KIT

export const fontVars = {
  brand: 'var(--font-brand)',
  body: 'var(--font-body)',
  ui: 'var(--font-ui)',
  metric: 'var(--font-metric)',
  action: 'var(--font-metric)',
} as const
