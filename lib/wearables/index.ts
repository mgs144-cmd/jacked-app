import { createClient } from '@/lib/supabase/server'
import type { WearableProvider, WearableTokens, StrainScore } from './types'
import { whoopProvider } from './providers/whoop'
import { ouraProvider } from './providers/oura'
import type { WearableDataProvider } from './types'

const providers: Record<WearableProvider, WearableDataProvider> = {
  whoop: whoopProvider,
  oura: ouraProvider,
}

export function getWearableProvider(id: WearableProvider): WearableDataProvider {
  return providers[id]
}

export function listWearableProviders(): WearableDataProvider[] {
  return Object.values(providers)
}

export async function getStoredTokens(
  userId: string,
  provider: WearableProvider
): Promise<WearableTokens | null> {
  const supabase = await createClient()
  const { data, error } = await (supabase.from('wearable_connections') as any)
    .select('access_token, refresh_token, token_type, scope, expires_at, provider_user_id')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle()

  if (error || !data) return null
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenType: data.token_type,
    scope: data.scope,
    expiresAt: data.expires_at,
    providerUserId: data.provider_user_id,
  }
}

export async function saveTokens(
  userId: string,
  provider: WearableProvider,
  tokens: WearableTokens
): Promise<void> {
  const supabase = await createClient()
  const row = {
    user_id: userId,
    provider,
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken ?? null,
    token_type: tokens.tokenType ?? 'bearer',
    scope: tokens.scope ?? null,
    expires_at: tokens.expiresAt ?? null,
    provider_user_id: tokens.providerUserId ?? null,
    updated_at: new Date().toISOString(),
  }
  const { error } = await (supabase.from('wearable_connections') as any).upsert(row, {
    onConflict: 'user_id,provider',
  })
  if (error) throw new Error(error.message || 'Failed to save wearable tokens')
}

export async function deleteConnection(userId: string, provider: WearableProvider): Promise<void> {
  const supabase = await createClient()
  const { error } = await (supabase.from('wearable_connections') as any)
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider)
  if (error) throw new Error(error.message || 'Failed to disconnect wearable')
}

export async function listConnections(userId: string): Promise<{ provider: WearableProvider; connectedAt: string }[]> {
  const supabase = await createClient()
  const { data, error } = await (supabase.from('wearable_connections') as any)
    .select('provider, connected_at')
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  return (data || []).map((r: any) => ({
    provider: r.provider as WearableProvider,
    connectedAt: r.connected_at,
  }))
}

function tokenExpired(tokens: WearableTokens, skewMs = 60_000): boolean {
  if (!tokens.expiresAt) return false
  return new Date(tokens.expiresAt).getTime() <= Date.now() + skewMs
}

/** Ensure access token is fresh; refresh + persist if needed. */
export async function getValidTokens(
  userId: string,
  provider: WearableProvider
): Promise<WearableTokens | null> {
  const existing = await getStoredTokens(userId, provider)
  if (!existing) return null
  if (!tokenExpired(existing)) return existing

  const impl = getWearableProvider(provider)
  try {
    const refreshed = await impl.refreshTokens(existing)
    await saveTokens(userId, provider, refreshed)
    return refreshed
  } catch (e) {
    console.warn(`[wearables] refresh failed for ${provider}:`, e)
    return existing
  }
}

export async function upsertStrainScores(userId: string, scores: StrainScore[]): Promise<number> {
  if (!scores.length) return 0
  const supabase = await createClient()
  let saved = 0
  for (const s of scores) {
    const sessionDate = (s.startedAt.split('T')[0] || s.startedAt).slice(0, 10)
    const row = {
      user_id: userId,
      session_date: sessionDate,
      started_at: s.startedAt,
      ended_at: s.endedAt,
      provider: s.provider,
      strain_score: s.score,
      strain_scale_max: s.scaleMax,
      average_heart_rate: s.averageHeartRate ?? null,
      max_heart_rate: s.maxHeartRate ?? null,
      external_id: s.externalId ?? null,
      raw: s.raw ?? null,
      updated_at: new Date().toISOString(),
    }

    if (s.externalId) {
      const { data: existing } = await (supabase.from('workout_strain') as any)
        .select('id')
        .eq('user_id', userId)
        .eq('provider', s.provider)
        .eq('external_id', s.externalId)
        .maybeSingle()

      if (existing?.id) {
        const { error } = await (supabase.from('workout_strain') as any)
          .update(row)
          .eq('id', existing.id)
        if (error) {
          console.warn('[wearables] strain update failed', error.message)
          continue
        }
        saved += 1
        continue
      }
    }

    const { error } = await (supabase.from('workout_strain') as any).insert(row)
    if (error) {
      console.warn('[wearables] strain insert failed', error.message)
      continue
    }
    saved += 1
  }
  return saved
}

export async function syncStrainForWindow(params: {
  userId: string
  provider: WearableProvider
  start: string
  end: string
}): Promise<{ scores: StrainScore[]; saved: number }> {
  const tokens = await getValidTokens(params.userId, params.provider)
  if (!tokens) throw new Error(`Connect ${params.provider} first`)

  const impl = getWearableProvider(params.provider)
  let scores: StrainScore[]
  try {
    scores = await impl.fetchStrainForWindow(tokens, {
      userId: params.userId,
      start: params.start,
      end: params.end,
    })
  } catch (e: any) {
    // One refresh retry on 401-ish errors
    if (String(e?.message || '').includes('401') && tokens.refreshToken) {
      const refreshed = await impl.refreshTokens(tokens)
      await saveTokens(params.userId, params.provider, refreshed)
      scores = await impl.fetchStrainForWindow(refreshed, {
        userId: params.userId,
        start: params.start,
        end: params.end,
      })
    } else {
      throw e
    }
  }

  const saved = await upsertStrainScores(params.userId, scores)
  return { scores, saved }
}
