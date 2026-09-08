import { createHash, randomBytes } from 'crypto'
import type { WearableProvider } from './types'

const STATE_COOKIE = 'jacked_wearable_oauth_state'
const PAYLOAD_COOKIE = 'jacked_wearable_oauth_payload'

export function oauthStateCookieName() {
  return STATE_COOKIE
}

export function oauthPayloadCookieName() {
  return PAYLOAD_COOKIE
}

/** Whoop requires state length of 8 characters. */
export function createShortOAuthNonce(): string {
  return randomBytes(4).toString('hex') // 8 hex chars
}

export function createOAuthPayload(provider: WearableProvider, userId: string): string {
  const nonce = randomBytes(8).toString('hex')
  const payload = `${provider}:${userId}:${nonce}`
  const sig = createHash('sha256')
    .update(
      `${payload}:${process.env.WEARABLE_OAUTH_STATE_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'jacked'}`
    )
    .digest('hex')
    .slice(0, 16)
  return Buffer.from(`${payload}:${sig}`).toString('base64url')
}

export function parseOAuthPayload(
  encoded: string
): { provider: WearableProvider; userId: string } | null {
  try {
    const raw = Buffer.from(encoded, 'base64url').toString('utf8')
    const parts = raw.split(':')
    if (parts.length < 4) return null
    const [provider, userId, nonce, sig] = parts
    if (provider !== 'whoop' && provider !== 'oura') return null
    const payload = `${provider}:${userId}:${nonce}`
    const expected = createHash('sha256')
      .update(
        `${payload}:${process.env.WEARABLE_OAUTH_STATE_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'jacked'}`
      )
      .digest('hex')
      .slice(0, 16)
    if (sig !== expected) return null
    return { provider, userId }
  } catch {
    return null
  }
}
