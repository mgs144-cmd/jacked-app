import type { LiftRow } from '@/lib/liftChartData'
import type { SetEntry, WorkoutExerciseEntry } from '@/components/log/types'

export interface TemplateDayExercise {
  id: string
  /** Single-exercise slot (when not using alternatives). */
  exercise_name: string
  /** Two or more names = pick one when starting the workout. */
  alternatives?: string[]
  /** Optional blank-start set count; omit for a single empty set. */
  target_sets?: number | null
  /** Optional note for yourself (not applied to the workout). */
  target_reps?: string | null
}

export interface WorkoutDayTemplateJson {
  exercises: TemplateDayExercise[]
}

export interface WorkoutDayTemplateRow {
  id: string
  user_id: string
  label: string
  template_json: WorkoutDayTemplateJson
  created_at?: string
  updated_at?: string
}

export type TemplateSlotResolution = Record<string, string>

function dateKey(isoOrDate: string): string {
  return isoOrDate.split('T')[0] || isoOrDate
}

export function getSlotOptions(ex: TemplateDayExercise): string[] {
  const alts = (ex.alternatives ?? []).map((a) => a.trim()).filter(Boolean)
  if (alts.length >= 2) return alts
  if (alts.length === 1) return alts
  const primary = ex.exercise_name.trim()
  return primary ? [primary] : []
}

export function isVariationSlot(ex: TemplateDayExercise): boolean {
  return getSlotOptions(ex).length >= 2
}

export function getTemplateSlots(template: WorkoutDayTemplateRow): { id: string; options: string[] }[] {
  return template.template_json.exercises
    .map((ex) => ({ id: ex.id, options: getSlotOptions(ex) }))
    .filter((s) => s.options.length > 0)
}

export function getVariationSlots(template: WorkoutDayTemplateRow): { id: string; options: string[] }[] {
  return getTemplateSlots(template).filter((s) => s.options.length >= 2)
}

export function slotDisplayLabel(ex: TemplateDayExercise): string {
  const opts = getSlotOptions(ex)
  if (opts.length >= 2) return opts.join(' · ')
  return opts[0] ?? ''
}

export function createEmptyTemplateDay(label = 'New day'): {
  label: string
  template_json: WorkoutDayTemplateJson
} {
  return {
    label,
    template_json: {
      exercises: [
        {
          id: crypto.randomUUID(),
          exercise_name: '',
          target_sets: null,
          target_reps: null,
        },
      ],
    },
  }
}

export function normalizeTemplateJson(raw: unknown): WorkoutDayTemplateJson {
  if (!raw || typeof raw !== 'object') return { exercises: [] }
  const exercises = (raw as WorkoutDayTemplateJson).exercises
  if (!Array.isArray(exercises)) return { exercises: [] }
  return {
    exercises: exercises.map((ex) => {
      const alts = Array.isArray(ex.alternatives)
        ? ex.alternatives.map((a) => String(a).trim()).filter(Boolean)
        : undefined
      const setsRaw = ex.target_sets
      const target_sets =
        setsRaw == null
          ? null
          : Number(setsRaw) > 0
            ? Number(setsRaw)
            : null
      const target_reps =
        ex.target_reps != null && String(ex.target_reps).trim() !== ''
          ? String(ex.target_reps).trim()
          : null

      if (alts && alts.length >= 2) {
        return {
          id: ex.id || crypto.randomUUID(),
          exercise_name: '',
          alternatives: alts,
          target_sets,
          target_reps,
        }
      }

      return {
        id: ex.id || crypto.randomUUID(),
        exercise_name: ex.exercise_name || (alts?.[0] ?? ''),
        alternatives: undefined,
        target_sets,
        target_reps,
      }
    }),
  }
}

export function templateHasValidSlots(json: WorkoutDayTemplateJson): boolean {
  return json.exercises.some((ex) => {
    const opts = getSlotOptions(ex)
    if (isVariationSlot(ex)) return opts.length >= 2
    return opts.length >= 1
  })
}

export function defaultResolutionForTemplate(template: WorkoutDayTemplateRow): TemplateSlotResolution {
  const out: TemplateSlotResolution = {}
  template.template_json.exercises.forEach((ex) => {
    const opts = getSlotOptions(ex)
    if (opts.length) out[ex.id] = opts[0]
  })
  return out
}

/** Most recent date where each slot had at least one of its options logged. */
export function findLastSessionDateForTemplate(
  template: WorkoutDayTemplateRow,
  allLifts: LiftRow[]
): string | null {
  const slots = getTemplateSlots(template)
  if (!slots.length) return null

  const byDate: Record<string, Set<string>> = {}
  allLifts.forEach((l) => {
    if (l.weight <= 0 || l.reps <= 0) return
    const d = dateKey(l.date)
    const ex = l.exercise_name.trim().toLowerCase()
    if (!byDate[d]) byDate[d] = new Set()
    byDate[d].add(ex)
  })

  return (
    Object.entries(byDate)
      .filter(([, logged]) =>
        slots.every((slot) =>
          slot.options.some((name) => logged.has(name.trim().toLowerCase()))
        )
      )
      .map(([d]) => d)
      .sort((a, b) => b.localeCompare(a))[0] ?? null
  )
}

export function getLastSessionPreview(
  template: WorkoutDayTemplateRow,
  allLifts: LiftRow[]
): { date: string; setCount: number } | null {
  const date = findLastSessionDateForTemplate(template, allLifts)
  if (!date) return null

  const slotOptions = new Set(
    getTemplateSlots(template).flatMap((s) => s.options.map((n) => n.trim().toLowerCase()))
  )
  const setCount = allLifts.filter(
    (l) =>
      dateKey(l.date) === date &&
      slotOptions.has(l.exercise_name.trim().toLowerCase()) &&
      l.weight > 0 &&
      l.reps > 0
  ).length
  return { date, setCount }
}

function blankSetCount(ex: TemplateDayExercise): number {
  if (ex.target_sets != null && ex.target_sets > 0) return ex.target_sets
  return 1
}

function resolveSlotName(ex: TemplateDayExercise, resolved: TemplateSlotResolution): string {
  const picked = resolved[ex.id]?.trim()
  if (picked) return picked
  return getSlotOptions(ex)[0] ?? ''
}

export function buildWorkoutFromTemplateBlank(
  template: WorkoutDayTemplateRow,
  resolved: TemplateSlotResolution
): WorkoutExerciseEntry[] {
  return template.template_json.exercises
    .map((ex) => {
      const name = resolveSlotName(ex, resolved)
      if (!name) return null
      const count = blankSetCount(ex)
      const sets: SetEntry[] = Array.from({ length: count }, () => ({
        weight: '',
        reps: '',
        rpe: '',
      }))
      return {
        id: crypto.randomUUID(),
        exercise_name: name,
        sets,
      }
    })
    .filter((e): e is WorkoutExerciseEntry => e != null)
}

export function buildWorkoutFromTemplateLastSession(
  template: WorkoutDayTemplateRow,
  allLifts: LiftRow[],
  resolved: TemplateSlotResolution
): { entries: WorkoutExerciseEntry[]; sessionDate: string } | null {
  const sessionDate = findLastSessionDateForTemplate(template, allLifts)
  if (!sessionDate) return null

  const entries: WorkoutExerciseEntry[] = []

  for (const ex of template.template_json.exercises) {
    const name = resolveSlotName(ex, resolved)
    if (!name) continue

    const needle = name.toLowerCase()
    const setsOnDay = allLifts
      .filter(
        (l) =>
          dateKey(l.date) === sessionDate &&
          l.exercise_name.trim().toLowerCase() === needle &&
          l.weight > 0 &&
          l.reps > 0
      )
      .sort((a, b) => (a.date > b.date ? 1 : -1))

    const sets: SetEntry[] =
      setsOnDay.length > 0
        ? setsOnDay.map((s) => ({
            weight: String(s.weight),
            reps: String(s.reps),
            rpe: s.rpe != null ? String(s.rpe) : '',
          }))
        : [{ weight: '', reps: '', rpe: '' }]

    entries.push({
      id: crypto.randomUUID(),
      exercise_name: name,
      sets,
    })
  }

  if (!entries.length) return null
  return { entries, sessionDate }
}

/** @deprecated Use getTemplateSlots */
export function templateExerciseNames(template: WorkoutDayTemplateRow): string[] {
  return getTemplateSlots(template).flatMap((s) => s.options)
}
