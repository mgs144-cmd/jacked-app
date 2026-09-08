import type { WearableDataProvider, WearableTokens, StrainFetchParams, StrainScore } from '../types'
import { buildStrainScore } from '../strain'

const OURA_AUTH = 'https://cloud.ouraring.com/oauth/authorize'
const OURA_TOKEN = 'https://api.ouraring.com/oauth/token'
const OURA_API = 'https://api.ouraring.com'

/** Oura has no Whoop-style 0–21 strain; we map workout intensity → 0–10. */
export const OURA_SCOPES = ['workout', 'heartrate', 'daily'].join(' ')

export function getOuraClientConfig() {
  const clientId = process.env.OURA_CLIENT_ID?.trim()
  const clientSecret = process.env.OURA_CLIENT_SECRET?.trim()
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || '').replace(/\/$/, '')
  const base = appUrl.startsWith('http') ? appUrl : appUrl ? `https://${appUrl}` : ''
  const redirectUri =
    process.env.OURA_REDIRECT_URI?.trim() ||
    (base ? `${base}/api/wearables/oura/callback` : '')

  return { clientId, clientSecret, redirectUri }
}

export function buildOuraAuthorizeUrl(state: string): string {
  const { clientId, redirectUri } = getOuraClientConfig()
  if (!clientId || !redirectUri) {
    throw new Error('OURA_CLIENT_ID and redirect URI are required')
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: OURA_SCOPES,
    state,
  })
  return `${OURA_AUTH}?${params.toString()}`
}

async function exchangeOuraToken(body: Record<string, string>): Promise<WearableTokens> {
  const { clientId, clientSecret } = getOuraClientConfig()
  if (!clientId || !clientSecret) throw new Error('Oura client credentials missing')

  const res = await fetch(OURA_TOKEN, {
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
    throw new Error(`Oura token error ${res.status}: ${text.slice(0, 300)}`)
  }
  const json = (await res.json()) as {
    access_token: string
    refresh_token?: string
    expires_in?: number
    token_type?: string
  }
  const expiresAt =
    typeof json.expires_in === 'number'
      ? new Date(Date.now() + json.expires_in * 1000).toISOString()
      : null
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    tokenType: json.token_type ?? 'bearer',
    scope: OURA_SCOPES,
    expiresAt,
  }
}

export async function exchangeOuraAuthCode(code: string): Promise<WearableTokens> {
  const { redirectUri } = getOuraClientConfig()
  return exchangeOuraToken({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri!,
  })
}

type OuraWorkout = {
  id: string
  start_datetime?: string
  end_datetime?: string
  activity?: string
  intensity?: 'easy' | 'moderate' | 'hard' | string
  calories?: number
  average_heart_rate?: number
  max_heart_rate?: number
}

function intensityToStrain10(intensity?: string, calories?: number): number {
  const base =
    intensity === 'hard' ? 7.5 : intensity === 'moderate' ? 5 : intensity === 'easy' ? 2.5 : 4
  const calBump = calories && calories > 0 ? Math.min(2.5, calories / 400) : 0
  return Math.min(10, Math.round((base + calBump) * 10) / 10)
}

async function ouraGet<T>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(`${OURA_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Oura API ${res.status}: ${text.slice(0, 300)}`)
  }
  return res.json() as Promise<T>
}

export const ouraProvider: WearableDataProvider = {
  id: 'oura',
  displayName: 'Oura',

  async refreshTokens(tokens: WearableTokens): Promise<WearableTokens> {
    if (!tokens.refreshToken) throw new Error('No Oura refresh token')
    return exchangeOuraToken({
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
    })
  },

  async fetchStrainForWindow(
    tokens: WearableTokens,
    params: StrainFetchParams
  ): Promise<StrainScore[]> {
    const qs = new URLSearchParams({
      start_datetime: params.start,
      end_datetime: params.end,
    })
    const data = await ouraGet<{ data?: OuraWorkout[] }>(
      tokens.accessToken,
      `/v2/usercollection/workout?${qs.toString()}`
    )
    const records = data.data || []
    return records
      .filter((w) => w.start_datetime && w.end_datetime)
      .map((w) =>
        buildStrainScore({
          provider: 'oura',
          score: intensityToStrain10(w.intensity, w.calories),
          scaleMax: 10,
          averageHeartRate: w.average_heart_rate ?? null,
          maxHeartRate: w.max_heart_rate ?? null,
          startedAt: w.start_datetime!,
          endedAt: w.end_datetime!,
          externalId: w.id,
          raw: w,
        })
      )
  },
}
