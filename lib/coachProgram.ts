/** Deterministic skeleton program generation for Coach tab (edited via AI chat optionally). */

export type CoachSessionPrescription = {
  label: string
  detail: string
}

export type CoachProgramWeek = {
  weekIndex: number
  theme: string
  sessions: CoachSessionPrescription[]
}

export type CoachProgramJson = {
  weeks: CoachProgramWeek[]
  summary: string
  notes?: string
}

/** Safe summary string from stored program_json (e.g. coach_plans rows). */
export function getCoachProgramSummary(program_json: unknown): string {
  if (!program_json || typeof program_json !== 'object') return ''
  const s = (program_json as CoachProgramJson).summary
  return typeof s === 'string' ? s : ''
}

function formatExercise(name: string) {
  const t = name.trim()
  return t.length ? t : 'Lift'
}

/** Default horizon when user has not set a target date (12 weeks). */
const DEFAULT_WEEKS_NO_DATE = 12

export function buildCoachProgram(params: {
  exerciseName: string
  targetWeight: number
  targetReps: number
  /** If omitted or null, scaffold uses a default multi-week block; summary prompts Coach for a real test date. */
  targetDateISO?: string | null
  currentEstimateLbs?: number | null
}): CoachProgramJson {
  const ex = formatExercise(params.exerciseName)
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const raw = params.targetDateISO?.trim()
  let hasDate = Boolean(raw)
  let end = new Date(start)
  if (hasDate && raw) {
    const parsed = new Date(raw)
    if (Number.isNaN(parsed.getTime())) {
      hasDate = false
    } else {
      end = parsed
    }
  }
  if (!hasDate) {
    end = new Date(start)
    end.setDate(end.getDate() + DEFAULT_WEEKS_NO_DATE * 7)
  }

  const daysRaw = hasDate ? Math.ceil((end.getTime() - start.getTime()) / 86400000) : DEFAULT_WEEKS_NO_DATE * 7
  const days = Math.max(14, daysRaw)
  const weekCount = Math.min(52, Math.max(3, Math.ceil(days / 7)))

  let phase = ''
  const weeks: CoachProgramWeek[] = []
  const target = Number(params.targetWeight)
  const est = params.currentEstimateLbs != null && params.currentEstimateLbs > 0 ? Number(params.currentEstimateLbs) : null
  const gapPct =
    est && target > est ? Math.round(((target - est) / Math.max(est, 1)) * 100) : null

  for (let w = 1; w <= weekCount; w++) {
    const pct = weekCount <= 1 ? 1 : (w - 1) / (weekCount - 1)
    if (pct < 0.35) phase = 'Base volume & consistency'
    else if (pct < 0.7) phase = 'Intensity blocks'
    else phase = 'Peaking toward goal'

    const rpeMain = pct < 0.5 ? 'RPE 7–8' : pct < 0.85 ? 'RPE 8–9' : 'RPE 8–10 (planned singles / AMRAPS as appropriate)'

    weeks.push({
      weekIndex: w,
      theme: phase,
      sessions: [
        {
          label: `${ex} — primary`,
          detail: `${w <= 3 ? '3–4' : '2–4'} working sets × 3–8 reps @ ${rpeMain}. Log every session.`,
        },
        {
          label: 'Accessory / shoulders & arms',
          detail: `2–3 accessories that support lockout and shoulders. Aim for moderate volume, recover well.`,
        },
        {
          label: 'Recovery / optional light day',
          detail: `Light variation or cardio + mobility — keep stimulus without junk volume.`,
        },
      ],
    })
  }

  const datePhrase = hasDate
    ? `by ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : 'with no fixed test date yet'

  const summaryParts = [
    hasDate
      ? `${weekCount}-week scaffold for ${target} lbs × ${params.targetReps} on ${ex} ${datePhrase}.`
      : `${weekCount}-week starter scaffold for ${target} lbs × ${params.targetReps} on ${ex}. ${datePhrase} — ask Coach for a realistic meet or max-out week.`,
  ]
  if (gapPct != null) summaryParts.push(`Estimated gap vs current e1RM/best tracked: ~${gapPct}% — adjust week count if joints or sleep suffer.`)
  summaryParts.push('Talk with the AI coach anytime to reshape weeks, taper, or set a target date.')

  return {
    weeks,
    summary: summaryParts.join(' '),
    notes:
      est != null
        ? `Coach is using ~${Math.round(est)} lbs as your current strength baseline for progression language. Update after PRs in Log.`
        : undefined,
  }
}

