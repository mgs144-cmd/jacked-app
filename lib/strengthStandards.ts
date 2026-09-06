/**
 * Strength percentiles from estimated 1RM ÷ bodyweight (lb).
 * Ratio bands follow Strength Level–style population benchmarks
 * (beginner ~5th, novice ~20th, intermediate ~50th, advanced ~80th, elite ~95th).
 */

export type StrengthSex = 'male' | 'female'

export type StandardLiftId =
  | 'bench_press'
  | 'squat'
  | 'deadlift'
  | 'overhead_press'
  | 'barbell_row'
  | 'romanian_deadlift'
  | 'leg_press'
  | 'lat_pulldown'
  | 'hip_thrust'
  | 'leg_extension'
  | 'incline_bench'

export type StrengthLevelId = 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'elite'

type RatioBand = {
  ratio: number
  percentile: number
  level: StrengthLevelId
  label: string
}

const LEVEL_LABELS: Record<StrengthLevelId, string> = {
  beginner: 'Beginner',
  novice: 'Novice',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  elite: 'Elite',
}

/** Male e1RM / bodyweight ratio thresholds (trained-population style). */
const MALE_STANDARDS: Record<StandardLiftId, RatioBand[]> = {
  bench_press: [
    { ratio: 0.5, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 0.75, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 1.0, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 1.5, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 2.0, percentile: 95, level: 'elite', label: 'Elite' },
  ],
  incline_bench: [
    { ratio: 0.4, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 0.6, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 0.85, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 1.2, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 1.55, percentile: 95, level: 'elite', label: 'Elite' },
  ],
  squat: [
    { ratio: 0.75, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 1.0, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 1.5, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 2.25, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 2.75, percentile: 95, level: 'elite', label: 'Elite' },
  ],
  deadlift: [
    { ratio: 1.0, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 1.25, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 1.75, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 2.5, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 3.0, percentile: 95, level: 'elite', label: 'Elite' },
  ],
  romanian_deadlift: [
    { ratio: 0.75, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 1.0, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 1.35, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 1.85, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 2.25, percentile: 95, level: 'elite', label: 'Elite' },
  ],
  overhead_press: [
    { ratio: 0.35, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 0.55, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 0.8, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 1.1, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 1.4, percentile: 95, level: 'elite', label: 'Elite' },
  ],
  barbell_row: [
    { ratio: 0.5, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 0.75, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 1.0, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 1.4, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 1.75, percentile: 95, level: 'elite', label: 'Elite' },
  ],
  leg_press: [
    { ratio: 1.0, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 1.5, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 2.25, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 3.25, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 4.0, percentile: 95, level: 'elite', label: 'Elite' },
  ],
  lat_pulldown: [
    { ratio: 0.45, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 0.65, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 0.9, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 1.2, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 1.5, percentile: 95, level: 'elite', label: 'Elite' },
  ],
  hip_thrust: [
    { ratio: 0.75, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 1.1, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 1.5, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 2.1, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 2.6, percentile: 95, level: 'elite', label: 'Elite' },
  ],
  leg_extension: [
    { ratio: 0.35, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 0.5, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 0.7, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 0.95, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 1.2, percentile: 95, level: 'elite', label: 'Elite' },
  ],
}

/** Female ratio bands (~trained population, lower absolute ratios). */
const FEMALE_STANDARDS: Record<StandardLiftId, RatioBand[]> = {
  bench_press: [
    { ratio: 0.3, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 0.5, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 0.75, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 1.0, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 1.25, percentile: 95, level: 'elite', label: 'Elite' },
  ],
  incline_bench: [
    { ratio: 0.25, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 0.4, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 0.6, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 0.85, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 1.05, percentile: 95, level: 'elite', label: 'Elite' },
  ],
  squat: [
    { ratio: 0.5, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 0.75, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 1.1, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 1.6, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 2.0, percentile: 95, level: 'elite', label: 'Elite' },
  ],
  deadlift: [
    { ratio: 0.75, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 1.0, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 1.35, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 1.9, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 2.3, percentile: 95, level: 'elite', label: 'Elite' },
  ],
  romanian_deadlift: [
    { ratio: 0.55, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 0.75, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 1.05, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 1.45, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 1.75, percentile: 95, level: 'elite', label: 'Elite' },
  ],
  overhead_press: [
    { ratio: 0.2, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 0.35, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 0.55, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 0.75, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 0.95, percentile: 95, level: 'elite', label: 'Elite' },
  ],
  barbell_row: [
    { ratio: 0.35, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 0.5, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 0.7, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 0.95, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 1.2, percentile: 95, level: 'elite', label: 'Elite' },
  ],
  leg_press: [
    { ratio: 0.75, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 1.1, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 1.6, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 2.3, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 2.9, percentile: 95, level: 'elite', label: 'Elite' },
  ],
  lat_pulldown: [
    { ratio: 0.3, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 0.45, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 0.65, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 0.85, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 1.05, percentile: 95, level: 'elite', label: 'Elite' },
  ],
  hip_thrust: [
    { ratio: 0.55, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 0.85, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 1.2, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 1.65, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 2.05, percentile: 95, level: 'elite', label: 'Elite' },
  ],
  leg_extension: [
    { ratio: 0.25, percentile: 5, level: 'beginner', label: 'Beginner' },
    { ratio: 0.35, percentile: 20, level: 'novice', label: 'Novice' },
    { ratio: 0.5, percentile: 50, level: 'intermediate', label: 'Intermediate' },
    { ratio: 0.7, percentile: 80, level: 'advanced', label: 'Advanced' },
    { ratio: 0.85, percentile: 95, level: 'elite', label: 'Elite' },
  ],
}

export const STANDARD_LIFT_LABELS: Record<StandardLiftId, string> = {
  bench_press: 'Bench press',
  incline_bench: 'Incline bench',
  squat: 'Squat',
  deadlift: 'Deadlift',
  romanian_deadlift: 'Romanian deadlift',
  overhead_press: 'Overhead press',
  barbell_row: 'Row',
  leg_press: 'Leg press',
  lat_pulldown: 'Lat pulldown',
  hip_thrust: 'Hip thrust',
  leg_extension: 'Leg extension',
}

export type StrengthAssessment = {
  liftId: StandardLiftId
  liftLabel: string
  exerciseName: string
  ratio: number
  percentile: number
  level: StrengthLevelId
  levelLabel: string
  bodyweightLb: number
  e1rmLb: number
  nextLevel: {
    level: StrengthLevelId
    levelLabel: string
    percentile: number
    targetRatio: number
    targetE1rm: number
  } | null
}

export function resolveStandardLift(exerciseName: string): StandardLiftId | null {
  const n = exerciseName.trim().toLowerCase()
  if (!n) return null

  if (n.includes('incline') && n.includes('bench')) return 'incline_bench'
  if (n.includes('bench') && !n.includes('row')) return 'bench_press'
  if (n.includes('romanian') || n === 'rdl' || n.includes('rdl ')) return 'romanian_deadlift'
  if (n.includes('deadlift') || n === 'dl') return 'deadlift'
  if (n.includes('front squat') || n.includes('back squat') || n.includes('squat')) return 'squat'
  if (n.includes('overhead') || n.includes('ohp') || (n.includes('shoulder') && n.includes('press')))
    return 'overhead_press'
  if (n.includes('hip thrust')) return 'hip_thrust'
  if (n.includes('leg extension')) return 'leg_extension'
  if (n.includes('leg press')) return 'leg_press'
  if (n.includes('lat pulldown') || n.includes('pulldown')) return 'lat_pulldown'
  if (
    n.includes('row') ||
    n.includes('chest-supported') ||
    n.includes('chest supported') ||
    n.includes('t-bar') ||
    n.includes('t bar')
  )
    return 'barbell_row'

  return null
}

function interpolatePercentile(ratio: number, bands: RatioBand[]): {
  percentile: number
  level: StrengthLevelId
  levelLabel: string
  nextBand: RatioBand | null
} {
  if (ratio <= bands[0].ratio) {
    const p = Math.max(1, Math.round((ratio / bands[0].ratio) * bands[0].percentile))
    return { percentile: p, level: bands[0].level, levelLabel: bands[0].label, nextBand: bands[1] }
  }

  for (let i = 0; i < bands.length - 1; i++) {
    const lo = bands[i]
    const hi = bands[i + 1]
    if (ratio >= lo.ratio && ratio < hi.ratio) {
      const t = (ratio - lo.ratio) / (hi.ratio - lo.ratio)
      const percentile = Math.round(lo.percentile + t * (hi.percentile - lo.percentile))
      return { percentile, level: lo.level, levelLabel: lo.label, nextBand: hi }
    }
  }

  const top = bands[bands.length - 1]
  const extra = Math.min(4, Math.round((ratio - top.ratio) * 10))
  return {
    percentile: Math.min(99, top.percentile + extra),
    level: 'elite',
    levelLabel: top.label,
    nextBand: null,
  }
}

export function assessStrength(params: {
  exerciseName: string
  e1rmLb: number
  bodyweightLb: number
  sex: StrengthSex
}): StrengthAssessment | null {
  const { exerciseName, e1rmLb, bodyweightLb, sex } = params
  if (!Number.isFinite(e1rmLb) || e1rmLb <= 0) return null
  if (!Number.isFinite(bodyweightLb) || bodyweightLb <= 0) return null

  const liftId = resolveStandardLift(exerciseName)
  if (!liftId) return null

  const bands = sex === 'female' ? FEMALE_STANDARDS[liftId] : MALE_STANDARDS[liftId]
  const ratio = e1rmLb / bodyweightLb
  const { percentile, level, levelLabel, nextBand } = interpolatePercentile(ratio, bands)

  return {
    liftId,
    liftLabel: STANDARD_LIFT_LABELS[liftId],
    exerciseName,
    ratio,
    percentile,
    level,
    levelLabel,
    bodyweightLb,
    e1rmLb,
    nextLevel: nextBand
      ? {
          level: nextBand.level,
          levelLabel: nextBand.label,
          percentile: nextBand.percentile,
          targetRatio: nextBand.ratio,
          targetE1rm: Math.round(nextBand.ratio * bodyweightLb),
        }
      : null,
  }
}

export type LiftStrengthRow = {
  exerciseName: string
  e1rmLb: number
  assessment: StrengthAssessment
}

/** Rank lifts with benchmarks; lowest percentile = most "behind". */
export function buildLiftStrengthOverview(
  exerciseNames: string[],
  e1rmByExercise: Record<string, number>,
  bodyweightLb: number,
  sex: StrengthSex
): {
  ranked: LiftStrengthRow[]
  behind: LiftStrengthRow[]
  unmapped: string[]
  medianPercentile: number | null
} {
  const ranked: LiftStrengthRow[] = []
  const unmapped: string[] = []

  for (const name of exerciseNames) {
    const e1rm = e1rmByExercise[name]
    if (e1rm == null || e1rm <= 0) continue
    const assessment = assessStrength({ exerciseName: name, e1rmLb: e1rm, bodyweightLb, sex })
    if (!assessment) {
      unmapped.push(name)
      continue
    }
    ranked.push({ exerciseName: name, e1rmLb: e1rm, assessment })
  }

  ranked.sort((a, b) => a.assessment.percentile - b.assessment.percentile)
  const behind = ranked.filter((r) => r.assessment.percentile < 50)

  const medianPercentile =
    ranked.length > 0
      ? ranked[Math.floor(ranked.length / 2)].assessment.percentile
      : null

  return { ranked, behind, unmapped, medianPercentile }
}

export const STRENGTH_STANDARDS_FOOTNOTE =
  'Percentiles estimated from bodyweight × strength ratio benchmarks (Strength Level–style trained lifter data). Log body weight and pick sex for best accuracy.'
