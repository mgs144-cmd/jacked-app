import {
  type GroupChallengeRow,
  type ChallengeUpdateRow,
  type LiftLogRow,
  exerciseMatches,
  e1FromWeightReps,
  isoDateOnly,
} from '@/lib/groupChallenges'

export type GroupChallengeChartMetric = 'weight' | 'e1rm'

export type GroupChallengeChartSeries = {
  userId: string
  label: string
  dataKey: string
  color: string
}

export type GroupChallengeChartPoint = {
  date: string
  [key: string]: string | number | null
}

const MEMBER_COLORS = [
  '#fbbf24',
  '#34d399',
  '#60a5fa',
  '#f472b6',
  '#a78bfa',
  '#fb923c',
  '#2dd4bf',
  '#818cf8',
  '#f87171',
  '#4ade80',
]

export function userChartDataKey(userId: string): string {
  return `u_${userId.replace(/-/g, '_')}`
}

type RawPoint = { userId: string; date: string; weight: number; e1rm: number }

function collectRawPoints(
  ch: GroupChallengeRow,
  memberIds: string[],
  liftLogRows: LiftLogRow[]
): RawPoint[] {
  const out: RawPoint[] = []
  const memberSet = new Set(memberIds)
  const updates = (ch.challenge_updates || []) as ChallengeUpdateRow[]
  const exercise = ch.exercise_name

  for (const u of updates) {
    if (!memberSet.has(u.user_id)) continue
    const w = u.value_numeric != null ? Number(u.value_numeric) : NaN
    if (!Number.isFinite(w) || w <= 0) continue
    const reps = u.reps != null && u.reps > 0 ? Number(u.reps) : 1
    const date = isoDateOnly(u.created_at)
    if (!date) continue
    out.push({
      userId: u.user_id,
      date,
      weight: w,
      e1rm: e1FromWeightReps(w, reps, null),
    })
  }

  if (exercise) {
    for (const log of liftLogRows) {
      if (!memberSet.has(log.user_id)) continue
      if (!exerciseMatches(exercise, log.exercise_name)) continue
      const w = Number(log.weight)
      const reps = Number(log.reps) || 1
      if (!Number.isFinite(w) || w <= 0) continue
      const date = isoDateOnly(log.logged_at)
      if (!date) continue
      out.push({
        userId: log.user_id,
        date,
        weight: w,
        e1rm: e1FromWeightReps(w, reps, log.rpe),
      })
    }
  }

  return out
}

/** Best per user per calendar day (from challenge logs + matching lift logs). */
function dailyBestByUser(
  raw: RawPoint[],
  metric: GroupChallengeChartMetric
): Record<string, Record<string, number>> {
  const byUser: Record<string, Record<string, number>> = {}
  for (const p of raw) {
    const v = metric === 'weight' ? p.weight : p.e1rm
    if (!byUser[p.userId]) byUser[p.userId] = {}
    const prev = byUser[p.userId][p.date]
    if (prev == null || v > prev) byUser[p.userId][p.date] = v
  }
  return byUser
}

/**
 * Running best-over-time per member for line chart comparison.
 * Returns null when there is no plottable data.
 */
export function buildGroupChallengeComparisonChart(
  ch: GroupChallengeRow,
  memberIds: string[],
  usernameById: Record<string, string>,
  liftLogRows: LiftLogRow[],
  metric: GroupChallengeChartMetric
): { points: GroupChallengeChartPoint[]; series: GroupChallengeChartSeries[] } | null {
  const raw = collectRawPoints(ch, memberIds, liftLogRows)
  if (!raw.length) return null

  const daily = dailyBestByUser(raw, metric)
  const dateSet = new Set<string>()
  for (const uid of Object.keys(daily)) {
    for (const d of Object.keys(daily[uid])) dateSet.add(d)
  }
  const dates = [...dateSet].sort((a, b) => a.localeCompare(b))
  if (!dates.length) return null

  const activeMemberIds = memberIds.filter((id) => daily[id] && Object.keys(daily[id]).length > 0)
  if (!activeMemberIds.length) return null

  const series: GroupChallengeChartSeries[] = activeMemberIds.map((userId, i) => ({
    userId,
    label: usernameById[userId] || 'Member',
    dataKey: userChartDataKey(userId),
    color: MEMBER_COLORS[i % MEMBER_COLORS.length],
  }))

  const running: Record<string, number> = {}
  const points: GroupChallengeChartPoint[] = []

  for (const date of dates) {
    const row: GroupChallengeChartPoint = { date }
    let any = false
    for (const s of series) {
      const dayVal = daily[s.userId]?.[date]
      if (dayVal != null) {
        running[s.userId] = Math.max(running[s.userId] ?? 0, dayVal)
      }
      const v = running[s.userId]
      if (v != null && v > 0) {
        row[s.dataKey] = Math.round(v)
        any = true
      } else {
        row[s.dataKey] = null
      }
    }
    if (any) points.push(row)
  }

  if (points.length < 1) return null
  return { points, series }
}

export function challengeHasChartData(
  ch: GroupChallengeRow,
  memberIds: string[],
  liftLogRows: LiftLogRow[]
): boolean {
  return buildGroupChallengeComparisonChart(ch, memberIds, {}, liftLogRows, 'weight') != null
}
