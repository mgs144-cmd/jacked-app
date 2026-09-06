/** Path (with query) to open in-app and join via invite code. */
export function groupInviteJoinPath(inviteCode: string): string {
  const c = inviteCode.trim()
  return `/community/join?code=${encodeURIComponent(c)}`
}

/** Full URL for sharing (call from browser only). */
export function groupInviteJoinUrl(origin: string, inviteCode: string): string {
  const base = origin.replace(/\/$/, '')
  return `${base}${groupInviteJoinPath(inviteCode)}`
}

/** Prevent open redirects after login; only same-app relative paths. */
export function safeInternalRedirectPath(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== 'string') return null
  const t = raw.trim()
  if (!t.startsWith('/') || t.startsWith('//')) return null
  if (t.length > 512) return null
  const lower = t.toLowerCase()
  if (lower.startsWith('/javascript:') || lower.includes('://')) return null
  return t
}
