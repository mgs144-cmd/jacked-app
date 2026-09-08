/**
 * Strain helpers that are independent of data source.
 * Heart-rate path is for HealthKit (or any HR series); wearable APIs
 * usually return a precomputed strain that we only normalize.
 */

import type { HeartRateSample, StrainProvider, StrainScore } from './types'

/** Estimate max HR (fallback when resting HR / true max unknown). */
export function estimateMaxHeartRate(ageYears: number): number {
  const age = Math.max(10, Math.min(100, ageYears))
  return Math.round(220 - age)
}

/**
 * Basic session strain from HR samples (0–10 scale).
 * Uses mean relative intensity vs estimated max HR (or HR reserve if resting given).
 */
export function computeStrainFromHeartRate(params: {
  samples: HeartRateSample[]
  ageYears?: number
  restingHeartRate?: number
  startedAt: string
  endedAt: string
  provider?: StrainProvider
}): StrainScore | null {
  const { samples, startedAt, endedAt } = params
  if (!samples.length) return null

  const bpms = samples.map((s) => s.bpm).filter((n) => Number.isFinite(n) && n > 30 && n < 250)
  if (!bpms.length) return null

  const avg = bpms.reduce((a, b) => a + b, 0) / bpms.length
  const max = Math.max(...bpms)
  const maxHr = estimateMaxHeartRate(params.ageYears ?? 30)
  const rest = params.restingHeartRate && params.restingHeartRate > 30 ? params.restingHeartRate : 60

  // Fraction of heart-rate reserve used (Karvonen-style), clamped
  const reserve = Math.max(1, maxHr - rest)
  const avgIntensity = Math.min(1, Math.max(0, (avg - rest) / reserve))
  const peakIntensity = Math.min(1, Math.max(0, (max - rest) / reserve))

  // Blend average + peak; scale to 0–10
  const score = Math.round((avgIntensity * 0.65 + peakIntensity * 0.35) * 10 * 10) / 10
  const scaleMax = 10

  return {
    provider: params.provider ?? 'healthkit',
    score,
    scaleMax,
    averageHeartRate: Math.round(avg),
    maxHeartRate: Math.round(max),
    startedAt,
    endedAt,
    externalId: null,
    normalized01: Math.min(1, score / scaleMax),
    raw: { sampleCount: bpms.length, maxHr, rest },
  }
}

/** Clamp / map any provider score onto 0–1 for UI */
export function normalizeStrain01(score: number, scaleMax: number): number {
  if (!Number.isFinite(score) || !Number.isFinite(scaleMax) || scaleMax <= 0) return 0
  return Math.min(1, Math.max(0, score / scaleMax))
}

export function buildStrainScore(partial: Omit<StrainScore, 'normalized01'>): StrainScore {
  return {
    ...partial,
    normalized01: normalizeStrain01(partial.score, partial.scaleMax),
  }
}
