/** Compact paste-ready workout summary for external AI trackers. */

export type AiExportSet = {
  exercise_name: string
  weight: number
  reps: number
  rpe?: number | null
}

export type AiExportStrain = {
  provider: string
  score: number
  scaleMax: number
  averageHeartRate?: number | null
  maxHeartRate?: number | null
}

export function formatWorkoutForAiExport(params: {
  summarySets: AiExportSet[]
  sessionDate?: string | null
  loggedDateLabel?: string
  strain?: AiExportStrain | null
}): string {
  const { summarySets, sessionDate, loggedDateLabel, strain } = params
  const byExercise = summarySets.reduce<Record<string, AiExportSet[]>>((acc, s) => {
    const name = (s.exercise_name || 'Unknown').trim() || 'Unknown'
    if (!acc[name]) acc[name] = []
    acc[name].push(s)
    return acc
  }, {})

  const dateLine =
    sessionDate ||
    (loggedDateLabel && loggedDateLabel !== 'Today' ? loggedDateLabel : null) ||
    new Date().toISOString().slice(0, 10)

  const lines: string[] = [`Workout ${dateLine}`]

  for (const [name, sets] of Object.entries(byExercise)) {
    const setParts = sets.map((s) => {
      const w = Number(s.weight)
      const r = Number(s.reps)
      const base =
        Number.isFinite(w) && Number.isFinite(r) ? `${w}x${r}` : `${s.weight}x${s.reps}`
      return s.rpe != null && s.rpe !== undefined && String(s.rpe) !== ''
        ? `${base}@${s.rpe}`
        : base
    })
    lines.push(`${name}: ${setParts.join(', ')}`)
  }

  if (strain) {
    const bits = [
      `${strain.provider} strain ${Number(strain.score).toFixed(1)}/${strain.scaleMax}`,
      strain.averageHeartRate ? `avg HR ${strain.averageHeartRate}` : null,
      strain.maxHeartRate ? `max HR ${strain.maxHeartRate}` : null,
    ].filter(Boolean)
    lines.push(bits.join(', '))
  }

  return lines.join('\n')
}
