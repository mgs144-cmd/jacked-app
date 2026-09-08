/** Shared wearable / strain types — provider-agnostic */

export type WearableProvider = 'whoop' | 'oura'

export type StrainProvider = WearableProvider | 'healthkit' | 'manual'

export type HeartRateSample = {
  bpm: number
  recordedAt: string // ISO
}

/** Whoop-style zone time buckets (ms). Used to build a simplified HR chart. */
export type ZoneDurationsMs = {
  zone0: number
  zone1: number
  zone2: number
  zone3: number
  zone4: number
  zone5: number
}

/** Normalized strain result used by Story templates and UI */
export type StrainScore = {
  provider: StrainProvider
  /** Raw score on the provider's scale */
  score: number
  /** Upper bound of that scale (Whoop 21, mapped Oura/HealthKit 10, etc.) */
  scaleMax: number
  averageHeartRate?: number | null
  maxHeartRate?: number | null
  startedAt: string
  endedAt: string
  externalId?: string | null
  zoneDurations?: ZoneDurationsMs | null
  /** Optional 0–1 for UI bars */
  normalized01: number
  raw?: unknown
}

export type WearableTokens = {
  accessToken: string
  refreshToken?: string | null
  tokenType?: string
  scope?: string | null
  expiresAt?: string | null
  providerUserId?: string | null
}

export type StrainFetchParams = {
  userId: string
  start: string // ISO
  end: string // ISO
}

export interface WearableDataProvider {
  readonly id: WearableProvider
  readonly displayName: string
  /** Fetch strain for workouts overlapping [start, end] */
  fetchStrainForWindow(
    tokens: WearableTokens,
    params: StrainFetchParams
  ): Promise<StrainScore[]>
  refreshTokens(tokens: WearableTokens): Promise<WearableTokens>
}
