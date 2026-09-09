'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, LayoutTemplate, History, SlidersHorizontal } from 'lucide-react'
import { WorkoutCalendar } from '@/components/log/WorkoutCalendar'
import { LogHubSectionToggle } from '@/components/log/LogHubSectionToggle'
import { ProgramBuilder } from '@/components/log/ProgramBuilder'
import { TemplateDayBuilder } from '@/components/log/TemplateDayBuilder'
import { TemplateDayStartSheet } from '@/components/log/TemplateDayStartSheet'
import {
  type WorkoutDayTemplateRow,
  type WorkoutDayTemplateJson,
  type TemplateSlotResolution,
  createEmptyTemplateDay,
  normalizeTemplateJson,
  getLastSessionPreview,
  getTemplateSlots,
} from '@/lib/workoutDayTemplates'
import {
  type TrainingProgramRow,
  type ProgramDay,
  type TrainingProgramJson,
  type WorkoutTemplate,
  createEmptyProgram,
  normalizeProgramJson,
} from '@/lib/trainingProgram'
import type { LiftRow } from '@/lib/liftChartData'
import type { LiftLogRecord } from '@/lib/workoutDayDetail'
import {
  buildWorkoutDays,
  formatWorkoutDate,
  formatWorkoutDateAbsolute,
  todayISO,
} from '@/lib/workoutSessions'
import { LogBrandHeading } from '@/components/log/LogBrandHeading'

interface TrackingViewProps {
  programs: TrainingProgramRow[]
  templates: WorkoutTemplate[]
  dayTemplates: WorkoutDayTemplateRow[]
  allLifts: LiftRow[]
  logPosts: any[]
  liftLogs: LiftLogRecord[]
  onEditPastWorkout: (date: string) => void
  onStartProgramDay: (day: ProgramDay, programName: string) => void
  onStartTemplate: (template: WorkoutTemplate) => void
  onStartDayTemplate: (
    template: WorkoutDayTemplateRow,
    mode: 'blank' | 'last',
    resolved: TemplateSlotResolution
  ) => void
  onSaveProgram: (payload: { id?: string; name: string; program_json: TrainingProgramJson }) => Promise<void>
  onDeleteProgram: (id: string) => Promise<void>
  onSaveDayTemplate: (payload: {
    id?: string
    label: string
    template_json: WorkoutDayTemplateJson
  }) => Promise<void>
  onDeleteDayTemplate: (id: string) => Promise<void>
}

type Panel = 'hub' | 'program-create' | 'program-edit' | 'template-create' | 'template-edit'

export function TrackingView({
  programs,
  templates,
  dayTemplates,
  allLifts,
  logPosts,
  liftLogs,
  onEditPastWorkout,
  onStartProgramDay,
  onStartTemplate,
  onStartDayTemplate,
  onSaveProgram,
  onDeleteProgram,
  onSaveDayTemplate,
  onDeleteDayTemplate,
}: TrackingViewProps) {
  const workoutDays = useMemo(() => buildWorkoutDays(allLifts, logPosts), [allLifts, logPosts])
  const [selectedCalDate, setSelectedCalDate] = useState<string | null>(null)
  const [panel, setPanel] = useState<Panel>('hub')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [programsOpen, setProgramsOpen] = useState(false)
  const [loadOpen, setLoadOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [programName, setProgramName] = useState('')
  const [programJson, setProgramJson] = useState<TrainingProgramJson>(createEmptyProgram())
  const [saving, setSaving] = useState(false)
  const [templateLabel, setTemplateLabel] = useState('')
  const [templateJson, setTemplateJson] = useState<WorkoutDayTemplateJson>(
    createEmptyTemplateDay().template_json
  )
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [startSheetTemplate, setStartSheetTemplate] = useState<WorkoutDayTemplateRow | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setSelectedCalDate((prev) => prev ?? todayISO())
  }, [])

  const calendarHint = useMemo(() => {
    if (!mounted) return 'This week'
    const count = workoutDays.length
    if (count === 0) return 'This week · no sessions yet'
    const latest = workoutDays[0]
    return `Last logged ${formatWorkoutDateAbsolute(latest.date)}`
  }, [workoutDays, mounted])

  const loadHint = useMemo(() => {
    const programDays = programs.reduce((n, p) => n + normalizeProgramJson(p.program_json).days.length, 0)
    const parts: string[] = []
    if (programDays > 0) parts.push(`${programDays} program day${programDays !== 1 ? 's' : ''}`)
    if (templates.length > 0) parts.push(`${templates.length} template${templates.length !== 1 ? 's' : ''}`)
    return parts.length ? parts.join(' · ') : 'Pre-fill from a saved split'
  }, [programs, templates])

  const setupHint = useMemo(() => {
    const n = dayTemplates.length + programs.length
    if (n === 0) return 'Create programs & template days'
    return `${n} saved item${n !== 1 ? 's' : ''}`
  }, [dayTemplates.length, programs.length])

  const openCreateProgram = () => {
    setEditingId(null)
    setProgramName('')
    setProgramJson(createEmptyProgram())
    setPanel('program-create')
  }

  const openEditProgram = (row: TrainingProgramRow) => {
    setEditingId(row.id)
    setProgramName(row.name)
    setProgramJson(normalizeProgramJson(row.program_json))
    setPanel('program-edit')
  }

  const handleSaveProgram = async () => {
    if (!programName.trim()) return
    setSaving(true)
    try {
      await onSaveProgram({
        id: editingId ?? undefined,
        name: programName.trim(),
        program_json: programJson,
      })
      setPanel('hub')
    } finally {
      setSaving(false)
    }
  }

  const openCreateTemplate = () => {
    const empty = createEmptyTemplateDay('PULL DAY')
    setEditingTemplateId(null)
    setTemplateLabel(empty.label)
    setTemplateJson(empty.template_json)
    setPanel('template-create')
  }

  const openEditTemplate = (row: WorkoutDayTemplateRow) => {
    setEditingTemplateId(row.id)
    setTemplateLabel(row.label)
    setTemplateJson(normalizeTemplateJson(row.template_json))
    setPanel('template-edit')
  }

  const handleSaveTemplate = async () => {
    if (!templateLabel.trim()) return
    setSaving(true)
    try {
      await onSaveDayTemplate({
        id: editingTemplateId ?? undefined,
        label: templateLabel.trim(),
        template_json: templateJson,
      })
      setPanel('hub')
    } finally {
      setSaving(false)
    }
  }

  if (panel === 'template-create' || panel === 'template-edit') {
    return (
      <TemplateDayBuilder
        label={templateLabel}
        template={templateJson}
        onLabelChange={setTemplateLabel}
        onTemplateChange={setTemplateJson}
        onSave={handleSaveTemplate}
        onCancel={() => setPanel('hub')}
        saving={saving}
      />
    )
  }

  if (panel === 'program-create' || panel === 'program-edit') {
    return (
      <ProgramBuilder
        name={programName}
        program={programJson}
        onNameChange={setProgramName}
        onProgramChange={setProgramJson}
        onSave={handleSaveProgram}
        onCancel={() => setPanel('hub')}
        saving={saving}
      />
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="mb-0.5">
        <LogBrandHeading variant="section">Tracking</LogBrandHeading>
      </div>

      <div className="space-y-2">
        <p className="log-screen-eyebrow">This week</p>
        <WorkoutCalendar
          workoutDays={workoutDays}
          selectedDate={selectedCalDate}
          onSelectDate={setSelectedCalDate}
          liftLogs={liftLogs}
          logPosts={logPosts}
          onEditWorkout={onEditPastWorkout}
          embedded
          mode="week"
        />
        <LogHubSectionToggle
          icon={History}
          title="Full calendar"
          hint={calendarHint}
          open={calendarOpen}
          onToggle={() => setCalendarOpen((o) => !o)}
        >
          <WorkoutCalendar
            workoutDays={workoutDays}
            selectedDate={selectedCalDate}
            onSelectDate={setSelectedCalDate}
            liftLogs={liftLogs}
            logPosts={logPosts}
            onEditWorkout={onEditPastWorkout}
            embedded
            mode="month"
          />
        </LogHubSectionToggle>
      </div>

      <LogHubSectionToggle
        icon={LayoutTemplate}
        title="Load a saved workout"
        hint={loadHint}
        open={loadOpen}
        onToggle={() => setLoadOpen((o) => !o)}
      >
        <div className="space-y-4">
          {programs.length > 0 && (
            <div>
              <p className="log-screen-eyebrow mb-2">Program day</p>
              <div className="space-y-2">
                {programs.map((prog) => {
                  const json = normalizeProgramJson(prog.program_json)
                  return json.days.map((day) => {
                    const count = day.exercises.filter((e) => e.exercise_name.trim()).length
                    if (count === 0) return null
                    return (
                      <button
                        key={`${prog.id}-${day.id}`}
                        type="button"
                        onClick={() => onStartProgramDay(day, prog.name)}
                        className="btn btn-list"
                      >
                        <span className="truncate">
                          <span className="text-white/45">{prog.name} · </span>
                          {day.label}
                        </span>
                        <span className="btn-list-label shrink-0 ml-2">{count} lifts</span>
                      </button>
                    )
                  })
                })}
              </div>
            </div>
          )}

          {templates.length > 0 && (
            <div>
              <p className="log-screen-eyebrow mb-2">Recent sessions</p>
              <ul className="space-y-1.5">
                {templates.map((t) => (
                  <li key={t.id}>
                    <button type="button" onClick={() => onStartTemplate(t)} className="btn btn-list">
                      <span>{t.label}</span>
                      <span className="btn-list-label ml-1">{t.exerciseNames.length} exercises</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {programs.length === 0 && templates.length === 0 && (
            <p className="log-screen-support text-xs text-center py-2">
              Log a few workouts or set up a program below.
            </p>
          )}
        </div>
      </LogHubSectionToggle>

      <LogHubSectionToggle
        icon={SlidersHorizontal}
        title="Programs & templates"
        hint={setupHint}
        open={programsOpen}
        onToggle={() => setProgramsOpen((o) => !o)}
      >
        <div className="space-y-4">
          <div>
            <p className="log-screen-eyebrow mb-2">Template days</p>
            {dayTemplates.length > 0 && (
              <ul className="space-y-1.5 mb-2">
                {dayTemplates.map((t) => {
                  const count = getTemplateSlots(t).length
                  const last = getLastSessionPreview(t, allLifts)
                  return (
                    <li
                      key={t.id}
                      className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-black/20 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setStartSheetTemplate(t)}
                        className="btn btn-list-stack"
                      >
                        <span className="btn-list-stack-title">{t.label}</span>
                        <span className="btn-list-stack-meta">
                          {count} slot{count !== 1 ? 's' : ''}
                          {last ? ` · ${formatWorkoutDate(last.date)}` : ''}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditTemplate(t)}
                        className="btn btn-icon shrink-0"
                        aria-label="Edit template"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void onDeleteDayTemplate(t.id)}
                        className="btn btn-link text-[10px] uppercase tracking-wider text-white/30 hover:text-red-400 shrink-0 px-2"
                      >
                        Delete
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <button type="button" onClick={openCreateTemplate} className="btn btn-dashed gap-2">
              <Plus className="w-3.5 h-3.5 shrink-0" />
              Create template day
            </button>
          </div>

          <div className="border-t border-white/5 pt-3">
            <p className="log-screen-eyebrow mb-2">Full programs</p>
            <button type="button" onClick={openCreateProgram} className="btn btn-dashed gap-2">
              <Plus className="w-3.5 h-3.5 shrink-0" />
              Create program
            </button>
          </div>

          {programs.map((row) => {
            const json = normalizeProgramJson(row.program_json)
            return (
              <div key={row.id} className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="log-screen-support text-sm text-white/75 truncate">{row.name}</p>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditProgram(row)}
                      className="btn btn-icon"
                      aria-label="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDeleteProgram(row.id)}
                      className="btn btn-link text-[10px] uppercase tracking-wider text-white/35 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="log-screen-meta text-xs">
                  {json.days.length} day{json.days.length !== 1 ? 's' : ''}
                </p>
              </div>
            )
          })}
        </div>
      </LogHubSectionToggle>

      {startSheetTemplate && (
        <TemplateDayStartSheet
          template={startSheetTemplate}
          lastSession={getLastSessionPreview(startSheetTemplate, allLifts)}
          onClose={() => setStartSheetTemplate(null)}
          onStart={(mode, resolved) => {
            onStartDayTemplate(startSheetTemplate, mode, resolved)
            setStartSheetTemplate(null)
          }}
        />
      )}
    </div>
  )
}
