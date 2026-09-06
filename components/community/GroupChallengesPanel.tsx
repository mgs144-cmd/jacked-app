'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { ExerciseAutocomplete } from '@/components/ExerciseAutocomplete'
import { GroupChallengeProgressChart } from '@/components/community/GroupChallengeProgressChart'
import {
  type GroupChallengeRow,
  type GroupMemberRow,
  type ChallengeUpdateRow,
  rankFirstToWeight,
  rankCombinedContributions,
  rankIndividualTargets,
  parseIndividualTargets,
  rankPeakDayTraining,
  rankPeakDayOfficial,
  isoDateOnly,
  type LiftLogRow,
  isGroupChallengeInactiveForDisplay,
  isGroupChallengeStructurallyComplete,
} from '@/lib/groupChallenges'

function normType(c: GroupChallengeRow): string {
  return (c.challenge_type as string) || 'freeform'
}

function typeLabel(t: string): string {
  const labels: Record<string, string> = {
    freeform: 'Open',
    first_to_weight: 'Race',
    combined_pr: 'Team total',
    peak_day: 'Peak day',
    individual_targets: 'Targets',
  }
  return labels[t] || 'Goal'
}

function challengeOneLiner(ch: GroupChallengeRow): string | null {
  const t = normType(ch)
  if (t === 'peak_day' && ch.exercise_name && ch.peak_date) {
    const d = new Date(ch.peak_date + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    return `${ch.exercise_name} · peak ${d}`
  }
  if (t === 'first_to_weight' && ch.target_weight != null && ch.exercise_name) {
    return `First to ${ch.target_weight} lb · ${ch.exercise_name}`
  }
  if (t === 'combined_pr' && ch.combined_target != null && ch.exercise_name) {
    return `${ch.combined_target} lb team · ${ch.exercise_name}`
  }
  if (ch.exercise_name) return ch.exercise_name
  return null
}

function StandingsRows({
  rows,
  renderStat,
}: {
  rows: { user_id: string; username: string; rank: number }[]
  renderStat: (row: { user_id: string; username: string; rank: number }) => ReactNode
}) {
  if (!rows.length) return <p className="text-xs text-white/35 py-2">No entries yet.</p>
  return (
    <ul className="rounded-xl border border-white/[0.07] divide-y divide-white/[0.05] overflow-hidden">
      {rows.map((r) => (
        <li key={r.user_id} className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm bg-black/20">
          <span className="text-white/85 truncate">
            <span className="text-white/35 tabular-nums mr-2 text-xs">#{r.rank}</span>
            {r.username}
          </span>
          {renderStat(r)}
        </li>
      ))}
    </ul>
  )
}

interface GroupChallengesPanelProps {
  groupId: string
  currentUserId: string
  members: GroupMemberRow[]
  challenges: GroupChallengeRow[]
  onChallengeCreated: (row: GroupChallengeRow) => void
  onReload: () => Promise<void>
}

export function GroupChallengesPanel({
  groupId,
  currentUserId,
  members,
  challenges,
  onChallengeCreated,
  onReload,
}: GroupChallengesPanelProps) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const memberIds = useMemo(() => members.map((m) => m.user_id), [members])
  const usernameById = useMemo(() => {
    const m: Record<string, string> = {}
    for (const row of members) {
      const u = row.profiles?.username || row.profiles?.full_name || 'Member'
      m[row.user_id] = String(u)
    }
    return m
  }, [members])

  const [chType, setChType] = useState<string>('first_to_weight')
  const [chTitle, setChTitle] = useState('')
  const [chExercise, setChExercise] = useState('Bench press')
  const [chTargetWeight, setChTargetWeight] = useState('225')
  const [chCombined, setChCombined] = useState('1000')
  const [chPeakDate, setChPeakDate] = useState('')
  const [chEnds, setChEnds] = useState('')
  const [individualDraft, setIndividualDraft] = useState<Record<string, string>>({})
  const [creatingChallenge, setCreatingChallenge] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const [prRows, setPrRows] = useState<{ user_id: string; exercise_name: string; weight: number | null }[]>([])
  const [liftLogRows, setLiftLogRows] = useState<LiftLogRow[]>([])
  const [recentPosts, setRecentPosts] = useState<
    { id: string; content: string | null; created_at: string; is_pr_post?: boolean; pr_exercise?: string | null; pr_weight?: number | null }[]
  >([])

  const [logOpenId, setLogOpenId] = useState<string | null>(null)
  const [logWeight, setLogWeight] = useState('')
  const [logReps, setLogReps] = useState('')
  const [logNote, setLogNote] = useState('')
  const [logPostId, setLogPostId] = useState<string | null>(null)
  const [logging, setLogging] = useState(false)

  const completionSyncRef = useRef<Set<string>>(new Set())

  const { activeChallenges, pastChallenges } = useMemo(() => {
    const active: GroupChallengeRow[] = []
    const past: GroupChallengeRow[] = []
    for (const ch of challenges) {
      if (isGroupChallengeInactiveForDisplay(ch, memberIds, prRows, liftLogRows)) past.push(ch)
      else active.push(ch)
    }
    const byCreated = (a: GroupChallengeRow, b: GroupChallengeRow) =>
      String(b.created_at || '').localeCompare(String(a.created_at || ''))
    active.sort(byCreated)
    past.sort(byCreated)
    return { activeChallenges: active, pastChallenges: past }
  }, [challenges, memberIds, prRows, liftLogRows])

  useEffect(() => {
    setIndividualDraft((prev) => {
      const next = { ...prev }
      for (const m of members) {
        if (next[m.user_id] === undefined) next[m.user_id] = ''
      }
      for (const k of Object.keys(next)) {
        if (!members.some((m) => m.user_id === k)) delete next[k]
      }
      return next
    })
  }, [members])

  const loadPrs = useCallback(async () => {
    if (!memberIds.length) {
      setPrRows([])
      return
    }
    const typed = challenges.filter((c) => normType(c) === 'combined_pr' && c.exercise_name)
    if (!typed.length) {
      setPrRows([])
      return
    }
    const { data, error } = await (supabase as any)
      .from('personal_records')
      .select('user_id, exercise_name, weight')
      .in('user_id', memberIds)
    if (!error && data) setPrRows(data)
    else setPrRows([])
  }, [supabase, memberIds, challenges])

  useEffect(() => {
    void loadPrs()
  }, [loadPrs])

  const loadLiftLogs = useCallback(async () => {
    if (!memberIds.length) {
      setLiftLogRows([])
      return
    }
    const needLogs =
      challenges.length > 0 &&
      challenges.some(
        (c) =>
          c.exercise_name ||
          normType(c) !== 'freeform' ||
          ((c.challenge_updates || []) as ChallengeUpdateRow[]).some((u) => u.value_numeric != null)
      )
    if (!needLogs) {
      setLiftLogRows([])
      return
    }
    const { data, error } = await supabase
      .from('lift_logs')
      .select('user_id, exercise_name, weight, reps, rpe, logged_at')
      .in('user_id', memberIds)
      .order('logged_at', { ascending: false })
      .limit(500)
    if (error) {
      console.warn('lift_logs fetch (peak day / group):', error.message)
      setLiftLogRows([])
      return
    }
    const rows: LiftLogRow[] = (data || []).map((r: any) => ({
      user_id: r.user_id,
      exercise_name: String(r.exercise_name || ''),
      weight: Number(r.weight),
      reps: Number(r.reps) || 1,
      rpe: r.rpe != null ? Number(r.rpe) : null,
      logged_at: String(r.logged_at),
    }))
    setLiftLogRows(rows)
  }, [supabase, memberIds, challenges])

  useEffect(() => {
    void loadLiftLogs()
  }, [loadLiftLogs])

  const loadRecentPosts = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('id, content, created_at, is_pr_post, pr_exercise, pr_weight, pr_reps')
      .eq('user_id', currentUserId)
      .or('is_archived.is.null,is_archived.eq.false')
      .order('created_at', { ascending: false })
      .limit(30)
    setRecentPosts((data as any[]) || [])
  }, [supabase, currentUserId])

  useEffect(() => {
    if (logOpenId) void loadRecentPosts()
  }, [logOpenId, loadRecentPosts])

  useEffect(() => {
    let cancelled = false
    const sync = async () => {
      for (const ch of challenges) {
        if (ch.status && ch.status !== 'active') continue
        if (!isGroupChallengeStructurallyComplete(ch, memberIds, prRows, liftLogRows)) continue
        if (completionSyncRef.current.has(ch.id)) continue
        completionSyncRef.current.add(ch.id)
        const { error } = await (supabase as any)
          .from('group_challenges')
          .update({ status: 'completed' })
          .eq('id', ch.id)
          .eq('status', 'active')
        if (error) {
          completionSyncRef.current.delete(ch.id)
        } else if (!cancelled) {
          await onReload()
          break
        }
      }
    }
    void sync()
    return () => {
      cancelled = true
    }
  }, [challenges, memberIds, prRows, liftLogRows, supabase, onReload])

  const createChallenge = async () => {
    const title = chTitle.trim()
    if (!title) {
      alert('Add a challenge title.')
      return
    }
    const exercise = chExercise.trim()
    let config_json: Record<string, unknown> = {}
    let target_weight: number | null = null
    let combined_target: number | null = null

    if (chType === 'first_to_weight') {
      const tw = parseFloat(chTargetWeight)
      if (!exercise || !Number.isFinite(tw) || tw <= 0) {
        alert('First-to-weight: set exercise and a target weight (e.g. 225).')
        return
      }
      target_weight = tw
    } else if (chType === 'combined_pr') {
      const ct = parseFloat(chCombined)
      if (!exercise || !Number.isFinite(ct) || ct <= 0) {
        alert('Combined PR: set exercise and a team total (e.g. 1000).')
        return
      }
      combined_target = ct
    } else if (chType === 'individual_targets') {
      if (!exercise) {
        alert('Set the lift (e.g. bench press) for this challenge.')
        return
      }
      const targets: Record<string, number> = {}
      for (const m of members) {
        const v = parseFloat((individualDraft[m.user_id] || '').trim())
        if (Number.isFinite(v) && v > 0) targets[m.user_id] = v
      }
      if (Object.keys(targets).length === 0) {
        alert('Set at least one member target weight.')
        return
      }
      config_json = { targets }
    } else if (chType === 'peak_day') {
      if (!exercise) {
        alert('Choose the lift for peak day (e.g. bench press).')
        return
      }
      const pd = chPeakDate.trim()
      if (!pd || !/^\d{4}-\d{2}-\d{2}$/.test(pd)) {
        alert('Pick the peak date (the day max weight counts).')
        return
      }
    }

    setCreatingChallenge(true)
    try {
      const row: Record<string, unknown> = {
        group_id: groupId,
        title,
        metric_hint:
          chType === 'first_to_weight'
            ? `First to ${target_weight} lb × ${exercise}`
            : chType === 'combined_pr'
              ? `Team sum ${combined_target} lb · ${exercise}`
              : chType === 'individual_targets'
                ? `Per-member targets · ${exercise}`
                : chType === 'peak_day'
                  ? `Heaviest ${exercise} on ${chPeakDate.trim()}`
                  : null,
        ends_at: chEnds ? new Date(chEnds).toISOString() : null,
        created_by: currentUserId,
        challenge_type: chType,
        exercise_name: ['first_to_weight', 'combined_pr', 'individual_targets', 'peak_day'].includes(chType) ? exercise : null,
        target_weight,
        combined_target,
        peak_date: chType === 'peak_day' ? chPeakDate.trim() : null,
        config_json,
        status: 'active',
      }

      const { data, error } = await (supabase as any)
        .from('group_challenges')
        .insert(row)
        .select('*, challenge_updates(*)')
        .single()

      if (error) {
        const msg = error.message || ''
        if (msg.includes('challenge_type') || msg.includes('column')) {
          alert(
            'Run ADD_GROUP_CHALLENGE_ENHANCEMENTS.sql and ADD_GROUP_PEAK_DAY.sql in Supabase for typed group challenges (including peak day).'
          )
        } else {
          alert(msg || 'Could not create challenge.')
        }
        return
      }

      const inserted = data as GroupChallengeRow
      onChallengeCreated(inserted)
      setChTitle('')
      setChEnds('')
      setChPeakDate('')
      router.refresh()
      await onReload()
      void loadPrs()
      void loadLiftLogs()
    } finally {
      setCreatingChallenge(false)
    }
  }

  const logProgress = async (challengeId: string) => {
    const w = logWeight.trim() ? parseFloat(logWeight) : NaN
    const r = logReps.trim() ? parseInt(logReps, 10) : NaN
    const note = logNote.trim()
    if (!Number.isFinite(w) && !note && !logPostId) {
      alert('Add a weight, note, or link a post.')
      return
    }

    setLogging(true)
    try {
      const activity_kind = logPostId ? 'linked_post' : 'manual'
      const { error } = await (supabase as any).from('challenge_updates').insert({
        challenge_id: challengeId,
        user_id: currentUserId,
        value_numeric: Number.isFinite(w) ? w : null,
        reps: Number.isFinite(r) && r > 0 ? r : null,
        note: note || null,
        post_id: logPostId,
        activity_kind,
      })
      if (error) throw error
      setLogOpenId(null)
      setLogWeight('')
      setLogReps('')
      setLogNote('')
      setLogPostId(null)
      await onReload()
      void loadPrs()
      void loadLiftLogs()
      router.refresh()
    } catch {
      alert('Could not save progress.')
    } finally {
      setLogging(false)
    }
  }

  const renderLeaderboard = (ch: GroupChallengeRow) => {
    const updates = (ch.challenge_updates || []) as ChallengeUpdateRow[]
    const t = normType(ch)

    if (t === 'first_to_weight' && ch.target_weight != null && ch.exercise_name) {
      const rows = rankFirstToWeight(memberIds, usernameById, updates, Number(ch.target_weight))
      return (
        <div className="mt-3">
          <p className="text-[10px] font-medium text-white/40 mb-2">Standings</p>
          <StandingsRows
            rows={rows}
            renderStat={(r) => {
              const row = rows.find((x) => x.user_id === r.user_id)!
              return (
                <span className="tabular-nums text-white/70 shrink-0 text-xs">
                  {row.best_weight > 0 ? `${row.best_weight} lb` : '—'}
                  {row.hit_target && <span className="text-emerald-400/90 ml-1">✓</span>}
                </span>
              )
            }}
          />
        </div>
      )
    }

    if (t === 'combined_pr' && ch.exercise_name && ch.combined_target != null) {
      const { rows, total } = rankCombinedContributions(memberIds, usernameById, prRows, ch.exercise_name)
      const goal = Number(ch.combined_target)
      const pct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0
      return (
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-xs text-white/55 mb-1">
            <span>Team total</span>
            <span className="tabular-nums text-white font-medium">
              {Math.round(total)} / {goal} lb
            </span>
          </div>
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-white/70" style={{ width: `${pct}%` }} />
          </div>
          <StandingsRows
            rows={rows}
            renderStat={(r) => {
              const row = rows.find((x) => x.user_id === r.user_id)!
              return (
                <span className="tabular-nums text-white/70 shrink-0 text-xs">
                  {row.best_pr > 0 ? `${Math.round(row.best_pr)} lb` : '—'}
                </span>
              )
            }}
          />
        </div>
      )
    }

    if (t === 'peak_day' && ch.exercise_name && ch.peak_date) {
      const peak = isoDateOnly(ch.peak_date)
      const beforePeak = new Date().toISOString().slice(0, 10) < peak
      const rows = beforePeak
        ? rankPeakDayTraining(memberIds, usernameById, updates, liftLogRows, ch.exercise_name, peak)
        : rankPeakDayOfficial(memberIds, usernameById, updates, liftLogRows, ch.exercise_name, peak)

      return (
        <div className="mt-3">
          <p className="text-[10px] font-medium text-white/40 mb-2">{beforePeak ? 'Training' : 'Results'}</p>
          <StandingsRows
            rows={rows}
            renderStat={(r) => {
              const row = rows.find((x) => x.user_id === r.user_id)!
              if (beforePeak) {
                const tr = row as { est_1rm: number; best_weight: number }
                return (
                  <span className="tabular-nums text-white/70 shrink-0 text-xs">
                    {tr.best_weight > 0 ? `${tr.best_weight} lb` : `~${Math.round(tr.est_1rm)} e1RM`}
                  </span>
                )
              }
              const off = row as { best_weight: number }
              return (
                <span className="tabular-nums text-white/70 shrink-0 text-xs">
                  {off.best_weight > 0 ? `${off.best_weight} lb` : '—'}
                </span>
              )
            }}
          />
        </div>
      )
    }

    if (t === 'individual_targets') {
      const targets = parseIndividualTargets(ch.config_json as Record<string, unknown>)
      const rows = rankIndividualTargets(targets, usernameById, updates)
      return (
        <div className="mt-3">
          <p className="text-[10px] font-medium text-white/40 mb-2">Standings</p>
          <StandingsRows
            rows={rows}
            renderStat={(r) => {
              const row = rows.find((x) => x.user_id === r.user_id)!
              return (
                <span className="tabular-nums text-white/70 shrink-0 text-xs">
                  {row.target > 0 ? (
                    <>
                      {row.best}/{row.target} lb{row.hit ? ' ✓' : ''}
                    </>
                  ) : (
                    '—'
                  )}
                </span>
              )
            }}
          />
        </div>
      )
    }

    return null
  }

  const renderActivity = (ch: GroupChallengeRow) => {
    const updates = [...(ch.challenge_updates || [])].sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))
    if (!updates.length) return null

    const shown = updates.slice(0, 4)
    return (
      <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1.5">
        {shown.map((u: any) => {
          const name = u.profiles?.username || usernameById[u.user_id] || 'Member'
          const w = u.value_numeric != null ? `${u.value_numeric} lb${u.reps != null ? ` × ${u.reps}` : ''}` : null
          return (
            <div key={u.id} className="flex items-baseline justify-between gap-2 text-xs">
              <span className="text-white/55 truncate">
                {name}
                {u.user_id === currentUserId && <span className="text-white/30"> · you</span>}
              </span>
              <span className="tabular-nums text-white/75 shrink-0">{w || '—'}</span>
            </div>
          )
        })}
        {updates.length > 4 && <p className="text-[10px] text-white/30">+{updates.length - 4} more</p>}
      </div>
    )
  }

  const renderChallengeCard = (ch: GroupChallengeRow, allowLog: boolean) => {
    const inactive = !allowLog
    const line = challengeOneLiner(ch)
    const t = normType(ch)

    return (
      <div
        key={ch.id}
        className={`rounded-2xl border p-4 ${inactive ? 'border-white/[0.06] bg-white/[0.02]' : 'border-white/10 bg-white/[0.03]'}`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h3 className="ui-heading text-base text-white truncate">{ch.title}</h3>
            {line && <p className="text-xs text-white/45 mt-0.5">{line}</p>}
          </div>
          <span className="shrink-0 text-[10px] font-medium text-white/40 px-2 py-0.5 rounded-full border border-white/10">
            {typeLabel(t)}
          </span>
        </div>

        {renderLeaderboard(ch)}
        <GroupChallengeProgressChart
          challenge={ch}
          memberIds={memberIds}
          usernameById={usernameById}
          liftLogRows={liftLogRows}
        />
        {renderActivity(ch)}

        {allowLog && logOpenId === ch.id ? (
          <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                className="input-field text-xs"
                placeholder="Weight (lb)"
                value={logWeight}
                onChange={(e) => setLogWeight(e.target.value)}
              />
              <input
                className="input-field text-xs"
                placeholder="Reps"
                value={logReps}
                onChange={(e) => setLogReps(e.target.value)}
              />
            </div>
            <select
              className="input-field text-xs"
              value={logPostId || ''}
              onChange={(e) => {
                const id = e.target.value || null
                setLogPostId(id)
                const pr = recentPosts.find((x) => x.id === id)
                if (pr?.is_pr_post && pr.pr_weight != null) setLogWeight(String(pr.pr_weight))
              }}
            >
              <option value="">Link post (optional)</option>
              {recentPosts.map((post) => (
                <option key={post.id} value={post.id}>
                  {(post.content || 'Post').slice(0, 36)}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={logging}
                className="text-xs text-white font-medium disabled:opacity-50"
                onClick={() => logProgress(ch.id)}
              >
                {logging ? 'Saving…' : 'Save'}
              </button>
              <button type="button" className="text-xs text-white/40" onClick={() => setLogOpenId(null)}>
                Cancel
              </button>
            </div>
          </div>
        ) : allowLog ? (
          <button
            type="button"
            className="mt-3 text-xs font-medium text-white/70 hover:text-white"
            onClick={() => setLogOpenId(ch.id)}
          >
            Log a lift
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <section className="space-y-4">
      {activeChallenges.length > 0 && (
        <div className="space-y-3">{activeChallenges.map((ch) => renderChallengeCard(ch, true))}</div>
      )}

      {pastChallenges.length > 0 && (
        <details className="group">
          <summary className="text-xs font-medium text-white/45 cursor-pointer list-none flex items-center gap-1">
            <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
            Past goals ({pastChallenges.length})
          </summary>
          <div className="mt-3 space-y-3">{pastChallenges.map((ch) => renderChallengeCard(ch, false))}</div>
        </details>
      )}

      {activeChallenges.length === 0 && pastChallenges.length === 0 && (
        <p className="text-sm text-white/40 text-center py-6">No goals yet — start one below.</p>
      )}

      <button
        type="button"
        onClick={() => setCreateOpen((o) => !o)}
        className="btn btn-row border border-white/10 bg-white/[0.03] rounded-xl"
      >
        <span className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {createOpen ? 'Cancel' : 'New challenge'}
        </span>
        {createOpen ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
      </button>

      {createOpen && (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
          <select className="input-field w-full text-sm" value={chType} onChange={(e) => setChType(e.target.value)}>
            <option value="freeform">Open goal</option>
            <option value="first_to_weight">Race to a weight</option>
            <option value="combined_pr">Team combined total</option>
            <option value="peak_day">Peak day</option>
            <option value="individual_targets">Custom targets</option>
          </select>
          <input
            className="input-field w-full text-sm"
            placeholder="Title"
            value={chTitle}
            onChange={(e) => setChTitle(e.target.value)}
          />
          {chType !== 'freeform' && (
            <ExerciseAutocomplete
              value={chExercise}
              onChange={setChExercise}
              placeholder="Lift"
              className="input-field w-full text-sm"
            />
          )}
          {chType === 'first_to_weight' && (
            <input
              className="input-field w-full text-sm"
              type="number"
              placeholder="Target weight (lb)"
              value={chTargetWeight}
              onChange={(e) => setChTargetWeight(e.target.value)}
            />
          )}
          {chType === 'combined_pr' && (
            <input
              className="input-field w-full text-sm"
              type="number"
              placeholder="Team total (lb)"
              value={chCombined}
              onChange={(e) => setChCombined(e.target.value)}
            />
          )}
          {chType === 'peak_day' && (
            <input type="date" className="input-field w-full text-sm" value={chPeakDate} onChange={(e) => setChPeakDate(e.target.value)} />
          )}
          {chType === 'individual_targets' && members.length > 0 && (
            <div className="space-y-2 max-h-[160px] overflow-y-auto">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 truncate text-white/70">{m.profiles?.username || 'Member'}</span>
                  <input
                    type="number"
                    className="input-field w-20 text-xs"
                    placeholder="lb"
                    value={individualDraft[m.user_id] ?? ''}
                    onChange={(e) => setIndividualDraft((prev) => ({ ...prev, [m.user_id]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}
          <input type="datetime-local" className="input-field w-full text-sm" value={chEnds} onChange={(e) => setChEnds(e.target.value)} />
          <button
            type="button"
            disabled={creatingChallenge || !chTitle.trim()}
            onClick={createChallenge}
            className="btn btn-primary btn-block disabled:opacity-50"
          >
            {creatingChallenge ? 'Creating…' : 'Create'}
          </button>
        </div>
      )}
    </section>
  )
}
