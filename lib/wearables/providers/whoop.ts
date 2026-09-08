import type { WearableDataProvider, WearableTokens, StrainFetchParams, StrainScore } from '../types'
import { buildStrainScore } from '../strain'

const WHOOP_API = 'https://api.prod.whoop.com/developer'
const WHOOP_TOKEN = 'https://api.prod.whoop.com/oauth/oauth2/token'
const WHOOP_AUTH = 'https://api.prod.whoop.com/oauth/oauth2/auth'

export const WHOOP_SCOPES = [
  'read:workout',
  'read:cycles',
  'read:recovery',
  'read:profile',
  'offline',
].join(' ')

export function getWhoopClientConfig() {
  const clientId = process.env.WHOOP_CLIENT_ID?.trim()
  const clientSecret = process.env.WHOOP_CLIENT_SECRET?.trim()
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || '').replace(/\/$/, '')
  const base = appUrl.startsWith('http') ? appUrl : appUrl ? `https://${appUrl}` : ''
  const redirectUri =
    process.env.WHOOP_REDIRECT_URI?.trim() ||
    (base ? `${base}/api/wearables/whoop/callback` : '')

  return { clientId, clientSecret, redirectUri }
}

export function buildWhoopAuthorizeUrl(state: string): string {
  const { clientId, redirectUri } = getWhoopClientConfig()
  if (!clientId || !redirectUri) {
    throw new Error('WHOOP_CLIENT_ID and redirect URI are required')
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: WHOOP_SCOPES,
    state,
  })
  return `${WHOOP_AUTH}?${params.toString()}`
}

async function exchangeWhoopToken(body: Record<string, string>): Promise<WearableTokens> {
  const { clientId, clientSecret } = getWhoopClientConfig()
  if (!clientId || !clientSecret) throw new Error('WHOOP client credentials missing')

  const res = await fetch(WHOOP_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      ...body,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Whoop token error ${res.status}: ${text.slice(0, 300)}`)
  }
  const json = (await res.json()) as {
    access_token: string
    refresh_token?: string
    expires_in?: number
    token_type?: string
    scope?: string
  }
  const expiresAt =
    typeof json.expires_in === 'number'
      ? new Date(Date.now() + json.expires_in * 1000).toISOString()
      : null
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    tokenType: json.token_type ?? 'bearer',
    scope: json.scope ?? WHOOP_SCOPES,
    expiresAt,
  }
}

export async function exchangeWhoopAuthCode(code: string): Promise<WearableTokens> {
  const { redirectUri } = getWhoopClientConfig()
  return exchangeWhoopToken({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri!,
  })
}

type WhoopWorkout = {
  id: string
  start: string
  end: string
  sport_name?: string
  score_state?: string
  score?: {
    strain?: number
    average_heart_rate?: number
    max_heart_rate?: number
  } | null
}

async function whoopGet<T>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(`${WHOOP_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Whoop API ${res.status}: ${text.slice(0, 300)}`)
  }
  return res.json() as Promise<T>
}

export const whoopProvider: WearableDataProvider = {
  id: 'whoop',
  displayName: 'WHOOP',

  async refreshTokens(tokens: WearableTokens): Promise<WearableTokens> {
    if (!tokens.refreshToken) throw new Error('No Whoop refresh token (request offline scope)')
    return exchangeWhoopToken({
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
      scope: 'offline',
    })
  },

  async fetchStrainForWindow(
    tokens: WearableTokens,
    params: StrainFetchParams
  ): Promise<StrainScore[]> {
    const qs = new URLSearchParams({
      start: params.start,
      end: params.end,
      limit: '25',
    })
    const data = await whoopGet<{ records?: WhoopWorkout[] }>(
      tokens.accessToken,
      `/v2/activity/workout?${qs.toString()}`
    )
    const records = data.records || []
    return records
      .filter((w) => w.score?.strain != null && Number.isFinite(w.score.strain))
      .map((w) =>
        buildStrainScore({
          provider: 'whoop',
          score: Number(w.score!.strain),
          scaleMax: 21,
          averageHeartRate: w.score?.average_heart_rate ?? null,
          maxHeartRate: w.score?.max_heart_rate ?? null,
          startedAt: w.start,
          endedAt: w.end,
          externalId: w.id,
          raw: w,
        })
      )
  },
}
