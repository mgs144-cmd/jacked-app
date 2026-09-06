import type { SupabaseClient } from '@supabase/supabase-js'
import { todayISO } from '@/lib/workoutSessions'
import type { StrengthSex } from '@/lib/strengthStandards'

export type BodyWeightLogRow = {
  id: string
  weight_lb: number
  logged_on: string
}

export type BodyWeightTrendPoint = {
  date: string
  weight: number
}

export function parseBodyWeightLogs(rows: { weight_lb: unknown; logged_on: string }[]): BodyWeightTrendPoint[] {
  return rows
    .map((r) => ({
      date: r.logged_on,
      weight: Number(r.weight_lb),
    }))
    .filter((p) => Number.isFinite(p.weight) && p.weight > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function latestBodyWeightLb(logs: BodyWeightTrendPoint[]): number | null {
  if (logs.length === 0) return null
  return logs[logs.length - 1].weight
}

export async function fetchBodyWeightLogs(
  supabase: SupabaseClient,
  userId: string,
  limit = 120
): Promise<BodyWeightTrendPoint[]> {
  const { data, error } = await supabase
    .from('body_weight_logs')
    .select('weight_lb, logged_on')
    .eq('user_id', userId)
    .order('logged_on', { ascending: true })
    .limit(limit)

  if (error) {
    console.warn('body_weight_logs fetch:', error.message)
    return []
  }
  return parseBodyWeightLogs(data || [])
}

/** Upsert today's body weight (one entry per calendar day). */
export async function upsertBodyWeightForToday(
  supabase: SupabaseClient,
  userId: string,
  weightLb: number
): Promise<{ error: string | null }> {
  const loggedOn = todayISO()
  const { error } = await supabase.from('body_weight_logs').upsert(
    {
      user_id: userId,
      weight_lb: weightLb,
      logged_on: loggedOn,
    },
    { onConflict: 'user_id,logged_on' }
  )

  if (error) return { error: error.message }
  return { error: null }
}

export async function updateStrengthSex(
  supabase: SupabaseClient,
  userId: string,
  sex: StrengthSex
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('profiles').update({ strength_sex: sex }).eq('id', userId)
  if (error) return { error: error.message }
  return { error: null }
}
