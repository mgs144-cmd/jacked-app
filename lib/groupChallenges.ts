import { calculateOneRepMaxWithRPE } from '@/utils/oneRepMax'

export type GroupChallengeType =
  | 'freeform'
  | 'first_to_weight'
  | 'combined_pr'
  | 'individual_targets'
  | 'peak_day'

export type GroupChallengeRow = {
  id: string
  group_id: string
  title: string
  metric_hint?: string | null
  ends_at?: string | null
  created_by: string
  created_at: string
  challenge_type?: GroupChallengeType
  exercise_name?: string | null
  target_weight?: number | null
  combined_target?: number | null
  peak_date?: string | null
  config_json?: Record<string, unknown> | null
  status?: string
  challenge_updates?: ChallengeUpdateRow[]
}

export type ChallengeUpdateRow = {
  id: string
  challenge_id: string
  user_id: string
  value_numeric?: number | null
  reps?: number | null
  note?: string | null
  post_id?: string | null
  activity_kind?: string
  created_at: string
  profiles?: { username?: string; avatar_url?: string | null } | null
}

export type GroupMemberRow = {
  user_id: string
  profiles?: { id?: string; username?: string | null; avatar_url?: string | null; full_name?: string | null } | null
}

export function exerciseMatches(challengeExercise: string | null | undefined, prExercise: string | null | undefined): boolean {
  const a = (challengeExercise || '').trim().toLowerCase()
  const b = (prExercise || '').trim().toLowerCase()
  if (!a || !b) return false
  return a === b || b.includes(a) || a.includes(b)
}

/** Best weight from challenge log updates for a user (typed challenges). */
export function bestUpdateWeight(updates: ChallengeUpdateRow[], userId: string): number {
  let max = 0
  for (const u of updates) {
    if (u.user_id !== userId) continue
    const w = u.value_numeric != null ? Number(u.value_numeric) : NaN
    if (Number.isFinite(w) && w > max) max = w
  }
  return max
}

export type FirstToRankRow = {
  user_id: string
  username: string
  best_weight: number
  hit_target: boolean
  first_hit_at: string | null
  rank: number
}

export function rankFirstToWeight(
  memberIds: string[],
  usernameById: Record<string, string>,
  updates: ChallengeUpdateRow[],
  targetWeight: number
): FirstToRankRow[] {
  const rows: Omit<FirstToRankRow, 'rank'>[] = memberIds.map((user_id) => {
    const userUpdates = [...updates].filter((u) => u.user_id === user_id && u.value_numeric != null)
    let best = 0
    let firstHit: string | null = null
    for (const u of userUpdates.sort((a, b) => a.created_at.localeCompare(b.created_at))) {
      const w = Number(u.value_numeric)
      if (!Number.isFinite(w)) continue
      if (w > best) best = w
      if (w >= targetWeight && firstHit == null) firstHit = u.created_at
    }
    return {
      user_id,
      username: usernameById[user_id] || 'Member',
      best_weight: best,
      hit_target: best >= targetWeight,
      first_hit_at: firstHit,
    }
  })

  rows.sort((a, b) => {
    if (a.hit_target !== b.hit_target) return a.hit_target ? -1 : 1
    if (a.hit_target && b.hit_target) {
      const ta = a.first_hit_at || 'Z'
      const tb = b.first_hit_at || 'Z'
      return ta.localeCompare(tb)
    }
    return b.best_weight - a.best_weight
  })

  return rows.map((r, i) => ({ ...r, rank: i + 1 }))
}

export type CombinedRankRow = {
  user_id: string
  username: string
  best_pr: number
  rank: number
}

/** Uses max personal_records.weight per member for exercise (case-insensitive partial match). */
export function rankCombinedContributions(
  memberIds: string[],
  usernameById: Record<string, string>,
  prRows: { user_id: string; exercise_name: string; weight: number | null }[],
  exerciseName: string
): { rows: CombinedRankRow[]; total: number } {
  const bestByUser: Record<string, number> = {}
  for (const uid of memberIds) bestByUser[uid] = 0

  for (const row of prRows) {
    if (!memberIds.includes(row.user_id)) continue
    if (!exerciseMatches(exerciseName, row.exercise_name)) continue
    const w = row.weight != null ? Number(row.weight) : 0
    if (!Number.isFinite(w)) continue
    if (w > (bestByUser[row.user_id] || 0)) bestByUser[row.user_id] = w
  }

  const rows: CombinedRankRow[] = memberIds.map((user_id) => ({
    user_id,
    username: usernameById[user_id] || 'Member',
    best_pr: bestByUser[user_id] || 0,
    rank: 0,
  }))
  rows.sort((a, b) => b.best_pr - a.best_pr)
  rows.forEach((r, i) => {
    r.rank = i + 1
  })
  const total = rows.reduce((s, r) => s + r.best_pr, 0)
  return { rows, total }
}

export type IndividualRankRow = {
  user_id: string
  username: string
  target: number
  best: number
  pct: number
  hit: boolean
  rank: number
}

export function rankIndividualTargets(
  targets: Record<string, number>,
  usernameById: Record<string, string>,
  updates: ChallengeUpdateRow[]
): IndividualRankRow[] {
  const memberIds = Object.keys(targets).filter((id) => targets[id] > 0)
  const rows: Omit<IndividualRankRow, 'rank'>[] = memberIds.map((user_id) => {
    const target = targets[user_id]
    const best = bestUpdateWeight(updates, user_id)
    const t = target && target > 0 ? target : 1
    const pct = Math.min(100, Math.round((best / t) * 100))
    const hit = target != null && target > 0 && best >= target
    return {
      user_id,
      username: usernameById[user_id] || 'Member',
      target: target || 0,
      best,
      pct,
      hit,
    }
  })

  rows.sort((a, b) => {
    if (a.hit !== b.hit) return a.hit ? -1 : 1
    if (b.pct !== a.pct) return b.pct - a.pct
    return b.best - a.best
  })

  return rows.map((r, i) => ({ ...r, rank: i + 1 }))
}

export function parseIndividualTargets(config: Record<string, unknown> | null | undefined): Record<string, number> {
  const raw = config && typeof config === 'object' && 'targets' in config ? (config as { targets?: unknown }).targets : null
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = typeof v === 'number' ? v : parseFloat(String(v))
    if (Number.isFinite(n) && n > 0) out[k] = n
  }
  return out
}

/** YYYY-MM-DD from ISO timestamp or date string */
export function isoDateOnly(iso: string | null | undefined): string {
  if (!iso) return ''
  const s = String(iso).trim()
  return s.length >= 10 ? s.slice(0, 10) : s
}

export type LiftLogRow = {
  user_id: string
  exercise_name: string
  weight: number
  reps: number
  rpe: number | null
  logged_at: string
}

export function e1FromWeightReps(weight: number, reps: number, rpe: number | null): number {
  const r = reps > 0 ? reps : 1
  return calculateOneRepMaxWithRPE(weight, r, rpe ?? 10)
}

export type PeakTrainingRow = {
  user_id: string
  username: string
  est_1rm: number
  best_weight: number
  last_at: string | null
  rank: number
}

/** Best est. 1RM and supporting stats before peak date (exclusive), from challenge updates + lift logs for exercise. */
export function rankPeakDayTraining(
  memberIds: string[],
  usernameById: Record<string, string>,
  updates: ChallengeUpdateRow[],
  liftLogs: LiftLogRow[],
  exerciseName: string,
  peakDate: string
): PeakTrainingRow[] {
  const beforePeak = (d: string) => isoDateOnly(d) < peakDate

  const bestE1: Record<string, number> = {}
  const bestW: Record<string, number> = {}
  const lastAt: Record<string, string> = {}

  const bump = (userId: string, at: string, w: number, e1: number) => {
    if (!beforePeak(at)) return
    if (e1 > (bestE1[userId] || 0)) bestE1[userId] = e1
    if (w > (bestW[userId] || 0)) bestW[userId] = w
    if (!lastAt[userId] || at > lastAt[userId]) lastAt[userId] = at
  }

  for (const u of updates) {
    const w = u.value_numeric != null ? Number(u.value_numeric) : NaN
    if (!Number.isFinite(w) || w <= 0) continue
    const reps = u.reps != null && u.reps > 0 ? Number(u.reps) : 1
    const e1 = e1FromWeightReps(w, reps, null)
    bump(u.user_id, u.created_at, w, e1)
  }

  for (const log of liftLogs) {
    if (!memberIds.includes(log.user_id)) continue
    if (!exerciseMatches(exerciseName, log.exercise_name)) continue
    const w = Number(log.weight)
    const reps = Number(log.reps) || 1
    if (!Number.isFinite(w) || w <= 0) continue
    const e1 = e1FromWeightReps(w, reps, log.rpe)
    bump(log.user_id, log.logged_at, w, e1)
  }

  const rows: PeakTrainingRow[] = memberIds.map((user_id) => ({
    user_id,
    username: usernameById[user_id] || 'Member',
    est_1rm: bestE1[user_id] || 0,
    best_weight: bestW[user_id] || 0,
    last_at: lastAt[user_id] || null,
    rank: 0,
  }))
  rows.sort((a, b) => {
    if (b.est_1rm !== a.est_1rm) return b.est_1rm - a.est_1rm
    return b.best_weight - a.best_weight
  })
  rows.forEach((r, i) => {
    r.rank = i + 1
  })
  return rows
}

export type PeakOfficialRow = {
  user_id: string
  username: string
  best_weight: number
  best_e1: number
  rank: number
}

/** Heaviest single on peak calendar date (updates + logs), tie-break by est. 1RM of that set. */
export function rankPeakDayOfficial(
  memberIds: string[],
  usernameById: Record<string, string>,
  updates: ChallengeUpdateRow[],
  liftLogs: LiftLogRow[],
  exerciseName: string,
  peakDate: string
): PeakOfficialRow[] {
  const onPeak = (d: string) => isoDateOnly(d) === peakDate

  const bestW: Record<string, number> = {}
  const bestE: Record<string, number> = {}

  const consider = (userId: string, at: string, w: number, reps: number, rpe: number | null) => {
    if (!onPeak(at)) return
    const e1 = e1FromWeightReps(w, reps, rpe)
    if (w > (bestW[userId] || 0)) {
      bestW[userId] = w
      bestE[userId] = e1
    } else if (w === (bestW[userId] || 0) && e1 > (bestE[userId] || 0)) {
      bestE[userId] = e1
    }
  }

  for (const u of updates) {
    const w = u.value_numeric != null ? Number(u.value_numeric) : NaN
    if (!Number.isFinite(w) || w <= 0) continue
    const reps = u.reps != null && u.reps > 0 ? Number(u.reps) : 1
    consider(u.user_id, u.created_at, w, reps, null)
  }

  for (const log of liftLogs) {
    if (!memberIds.includes(log.user_id)) continue
    if (!exerciseMatches(exerciseName, log.exercise_name)) continue
    const w = Number(log.weight)
    const reps = Number(log.reps) || 1
    if (!Number.isFinite(w) || w <= 0) continue
    consider(log.user_id, log.logged_at, w, reps, log.rpe)
  }

  const rows: PeakOfficialRow[] = memberIds.map((user_id) => ({
    user_id,
    username: usernameById[user_id] || 'Member',
    best_weight: bestW[user_id] || 0,
    best_e1: bestE[user_id] || 0,
    rank: 0,
  }))
  rows.sort((a, b) => {
    if (b.best_weight !== a.best_weight) return b.best_weight - a.best_weight
    return b.best_e1 - a.best_e1
  })
  rows.forEach((r, i) => {
    r.rank = i + 1
  })
  return rows
}

/** True when the challenge goal is met (typed challenges only; freeform never auto-structural). */
export function isGroupChallengeStructurallyComplete(
  ch: GroupChallengeRow,
  memberIds: string[],
  prRows: { user_id: string; exercise_name: string; weight: number | null }[],
  liftLogRows: LiftLogRow[]
): boolean {
  const t = (ch.challenge_type as string) || 'freeform'
  const updates = (ch.challenge_updates || []) as ChallengeUpdateRow[]
  const usernameById: Record<string, string> = {}
  for (const id of memberIds) usernameById[id] = 'Member'

  if (t === 'first_to_weight' && ch.target_weight != null && ch.exercise_name) {
    const rows = rankFirstToWeight(memberIds, usernameById, updates, Number(ch.target_weight))
    return rows.some((r) => r.hit_target)
  }
  if (t === 'combined_pr' && ch.exercise_name && ch.combined_target != null) {
    const { total } = rankCombinedContributions(memberIds, usernameById, prRows, ch.exercise_name)
    return total >= Number(ch.combined_target)
  }
  if (t === 'individual_targets') {
    const targets = parseIndividualTargets(ch.config_json as Record<string, unknown>)
    if (Object.keys(targets).length === 0) return false
    const rows = rankIndividualTargets(targets, usernameById, updates)
    return rows.length > 0 && rows.every((r) => r.target <= 0 || r.hit)
  }
  if (t === 'peak_day' && ch.exercise_name && ch.peak_date) {
    const peak = isoDateOnly(ch.peak_date)
    const today = new Date().toISOString().slice(0, 10)
    return Boolean(peak && today > peak)
  }
  return false
}

/** Past / completed for UI: explicit status, end date passed, or structural win. */
export function isGroupChallengeInactiveForDisplay(
  ch: GroupChallengeRow,
  memberIds: string[],
  prRows: { user_id: string; exercise_name: string; weight: number | null }[],
  liftLogRows: LiftLogRow[]
): boolean {
  if (ch.status === 'completed' || ch.status === 'archived') return true
  if (ch.ends_at && new Date(ch.ends_at).getTime() < Date.now()) return true
  return isGroupChallengeStructurallyComplete(ch, memberIds, prRows, liftLogRows)
}
