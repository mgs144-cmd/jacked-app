'use client'

import { useEffect, useMemo, useCallback, useState } from 'react'
import {
  Trophy,
  Users,
  Search,
  UserPlus,
  MessageCircle,
  Hash,
  Send,
  Plus,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { DiscoverClient } from '@/components/DiscoverClient'
import { UserCard } from '@/components/UserCard'

type CommunityTab = 'friends' | 'discover' | 'groups'

interface CommunityClientProps {
  currentUserId: string
  initialUsers: Record<string, unknown>[]
  suggestedUsers: Record<string, unknown>[]
  followingIds: string[]
  requestStatusMap: Record<string, string>
  friendsProfiles: Record<string, unknown>[]
  initialGroups: Record<string, unknown>[]
  initialGroupChallenges: Record<string, unknown>[]
}

export function CommunityClient({
  currentUserId,
  initialUsers,
  suggestedUsers,
  followingIds,
  requestStatusMap,
  friendsProfiles,
  initialGroups,
  initialGroupChallenges,
}: CommunityClientProps) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [tab, setTab] = useState<CommunityTab>('friends')

  const [groups, setGroups] = useState(initialGroups as any[])
  const [groupChallenges, setGroupChallenges] = useState(initialGroupChallenges as any[])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(groups[0]?.id ?? null)
  const [groupMsgs, setGroupMsgs] = useState<any[]>([])
  const [msgBody, setMsgBody] = useState('')
  const [loadingMsgs, setLoadingMsgs] = useState(false)

  const [joinCode, setJoinCode] = useState('')
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [creatingChallenge, setCreatingChallenge] = useState(false)
  const [chTitle, setChTitle] = useState('')
  const [chMetric, setChMetric] = useState('')
  const [chEnds, setChEnds] = useState('')
  const [challengeNote, setChallengeNote] = useState('')
  const [challengeWeight, setChallengeWeight] = useState('')
  const [activeChallengeForLog, setActiveChallengeForLog] = useState<string | null>(null)

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null
  const challengesForGroup = useMemo(
    () => groupChallenges.filter((c) => c.group_id === selectedGroupId),
    [groupChallenges, selectedGroupId]
  )

  const reloadGroupExtras = useCallback(
    async (gid: string) => {
      setLoadingMsgs(true)
      try {
        const [{ data: msgs }, { data: challenges }] = await Promise.all([
          (supabase as any)
            .from('group_chat_messages')
            .select('id, body, created_at, user_id, profiles:user_id(username, avatar_url, full_name)')
            .eq('group_id', gid)
            .order('created_at', { ascending: true })
            .limit(100),
          (supabase as any).from('group_challenges').select('*, challenge_updates(*)').eq('group_id', gid),
        ])
        setGroupMsgs(msgs || [])
        setGroupChallenges((prev) => {
          const rest = prev.filter((c: any) => c.group_id !== gid)
          return [...rest, ...(challenges || [])]
        })
      } catch {
        setGroupMsgs([])
      } finally {
        setLoadingMsgs(false)
      }
    },
    [supabase]
  )

  useEffect(() => {
    if (selectedGroupId) void reloadGroupExtras(selectedGroupId)
  }, [selectedGroupId, reloadGroupExtras])

  const onSelectGroup = (gid: string) => {
    setSelectedGroupId(gid)
    setChallengeNote('')
    setChallengeWeight('')
    setActiveChallengeForLog(null)
  }

  const createGroup = async () => {
    const name = newGroupName.trim()
    if (!name) return
    setCreatingGroup(true)
    try {
      const { data, error } = await (supabase as any)
        .from('lifting_groups')
        .insert({
          name,
          description: newGroupDesc.trim() || null,
          creator_id: currentUserId,
        })
        .select('*')
        .single()

      if (error) throw error
      const g = data as any
      setGroups((prev) => [g, ...prev])
      setNewGroupName('')
      setNewGroupDesc('')
      setSelectedGroupId(g.id)
      router.refresh()
    } catch (e: unknown) {
      alert(
        (e instanceof Error ? e.message : '').includes('lifting_groups')
          ? 'Run ADD_COACH_COMMUNITY.sql in Supabase for groups.'
          : 'Could not create group.'
      )
    } finally {
      setCreatingGroup(false)
    }
  }

  const joinGroup = async () => {
    const c = joinCode.trim()
    if (!c) return
    try {
      const { data, error } = await (supabase as any).rpc('join_lifting_group_by_code', { code: c })
      if (error) throw error
      const gid = data as string
      const { data: gRow } = await (supabase as any).from('lifting_groups').select('*').eq('id', gid).single()
      if (gRow) {
        setGroups((prev) => (prev.some((x) => x.id === gid) ? prev : [gRow, ...prev]))
        setJoinCode('')
        onSelectGroup(gid)
        router.refresh()
      }
    } catch {
      alert('Invalid invite code — double-check caps or ask the creator.')
    }
  }

  const sendGroupMessage = async () => {
    const trim = msgBody.trim()
    if (!trim || !selectedGroupId) return
    try {
      const { error } = await (supabase as any).from('group_chat_messages').insert({
        group_id: selectedGroupId,
        user_id: currentUserId,
        body: trim,
      })
      if (error) throw error
      setMsgBody('')
      await reloadGroupExtras(selectedGroupId)
      router.refresh()
    } catch {
      alert('Message failed.')
    }
  }

  const createChallenge = async () => {
    if (!selectedGroupId || !chTitle.trim()) return
    setCreatingChallenge(true)
    try {
      const { data, error } = await (supabase as any)
        .from('group_challenges')
        .insert({
          group_id: selectedGroupId,
          title: chTitle.trim(),
          metric_hint: chMetric.trim() || null,
          ends_at: chEnds ? new Date(chEnds).toISOString() : null,
          created_by: currentUserId,
        })
        .select('*, challenge_updates(*)')
        .single()
      if (error) throw error
      const row = data as any
      setGroupChallenges((prev) => [...prev.filter((c) => c.id !== row.id), row])
      setChTitle('')
      setChMetric('')
      setChEnds('')
      router.refresh()
    } finally {
      setCreatingChallenge(false)
    }
  }

  const logChallengeUpdate = async (challengeId: string) => {
    const note = challengeNote.trim()
    const weight = challengeWeight.trim() ? parseFloat(challengeWeight) : null
    if (!challengeId || (!note && weight == null)) return
    try {
      await (supabase as any).from('challenge_updates').insert({
        challenge_id: challengeId,
        user_id: currentUserId,
        note: note || null,
        value_numeric: weight != null && Number.isFinite(weight) ? weight : null,
      })
      setChallengeNote('')
      setChallengeWeight('')
      setActiveChallengeForLog(null)
      if (selectedGroupId) await reloadGroupExtras(selectedGroupId)
      router.refresh()
    } catch {
      alert('Could not save progress.')
    }
  }

  const tabs = [
    { id: 'friends' as const, label: 'Friends', icon: Users },
    { id: 'discover' as const, label: 'Find people', icon: Search },
    { id: 'groups' as const, label: 'Groups', icon: Trophy },
  ]

  return (
    <div className="space-y-6">
      <div className="flex gap-0.5 p-1 rounded-xl bg-white/5 border border-white/5 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active ? 'bg-white text-black' : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{t.label}</span>
            </button>
          )
        })}
      </div>

      {tab === 'friends' && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your friends
          </h2>
          {(friendsProfiles as any[])?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(friendsProfiles as any[]).map((user: any) => (
                <UserCard
                  key={user.id as string}
                  user={user}
                  currentUserId={currentUserId}
                  isFollowing
                  isPrivateAccount={user.is_account_private || false}
                  requestStatus={(requestStatusMap[user.id] as 'none' | 'pending' | 'accepted' | 'rejected' | undefined) || 'accepted'}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[12px] border border-white/10 p-8 text-center bg-white/[0.02] text-white/60 text-sm">
              You&apos;re not following anyone yet — open <button type="button" className="text-white underline mx-1" onClick={() => setTab('discover')}>Find people</button> to add friends.
            </div>
          )}
        </div>
      )}

      {tab === 'discover' && (
        <DiscoverClient
          currentUserId={currentUserId}
          initialUsers={initialUsers as any[]}
          suggestedUsers={suggestedUsers as any[]}
          followingIds={followingIds}
          requestStatusMap={requestStatusMap}
        />
      )}

      {tab === 'groups' && (
        <div className="space-y-8">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-white/70" /> Create group
            </h3>
            <input className="input-field w-full text-sm" placeholder="Group name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
            <input className="input-field w-full text-sm" placeholder="Description (optional)" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} />
            <button
              type="button"
              disabled={creatingGroup}
              onClick={createGroup}
              className="rounded-xl px-4 py-2 bg-white text-black text-sm font-semibold disabled:opacity-50"
            >
              {creatingGroup ? 'Creating…' : 'Create'}
            </button>
            <div className="border-t border-white/10 pt-4 flex flex-col gap-2">
              <span className="text-xs text-white/50 flex items-center gap-1"><Hash className="w-3 h-3" /> Join with invite code</span>
              <div className="flex gap-2">
                <input className="input-field flex-1 text-sm" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="e.g. A1B2C3D4" />
                <button type="button" onClick={joinGroup} className="rounded-xl px-3 py-2 border border-white/20 text-white text-sm font-medium whitespace-nowrap">
                  Join
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-3 flex items-center gap-2"><Trophy className="w-5 h-5" />Your groups</h3>
            {groups.length === 0 ? (
              <div className="rounded-[12px] border border-white/10 p-8 text-white/55 text-sm text-center">
                No groups yet. Create one above or join with an invite code.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mb-6">
                {groups.map((g: any) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onSelectGroup(g.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      g.id === selectedGroupId
                        ? 'border-amber-400/50 bg-amber-400/10 text-white'
                        : 'border-white/10 text-white/70 hover:bg-white/[0.04]'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedGroup && (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                <h4 className="text-white font-semibold">{selectedGroup.name}</h4>
                {selectedGroup.description && <p className="text-white/65 text-sm">{selectedGroup.description}</p>}
                <p className="text-[11px] text-white/40 font-mono">Invite · {selectedGroup.invite_code as string}</p>
              </div>

              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-emerald-200/95 text-sm font-semibold flex items-center gap-2"><Trophy className="w-4 h-4" /> Challenges</h4>
                </div>
                <div className="grid gap-2">
                  <input className="input-field text-sm" placeholder='Title (e.g. "Bench max by June")' value={chTitle} onChange={(e) => setChTitle(e.target.value)} />
                  <input className="input-field text-sm" placeholder="Metric hint (e.g. 1RM lbs)" value={chMetric} onChange={(e) => setChMetric(e.target.value)} />
                  <input type="datetime-local" className="input-field text-sm" value={chEnds} onChange={(e) => setChEnds(e.target.value)} />
                  <button
                    type="button"
                    disabled={creatingChallenge}
                    onClick={createChallenge}
                    className="self-start rounded-lg px-3 py-1.5 bg-emerald-500/90 text-black text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" /> New challenge
                  </button>
                </div>

                <div className="space-y-4 mt-4">
                  {challengesForGroup.length === 0 && <p className="text-xs text-white/45">Start a bench or squat chase — teammates post updates below.</p>}
                  {challengesForGroup.map((ch: any) => (
                    <div key={ch.id} className="rounded-xl border border-white/08 bg-black/40 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <span className="text-white font-medium text-sm">{ch.title}</span>
                        <span className="text-[10px] text-white/40">{ch.metric_hint}</span>
                      </div>
                      {ch.ends_at && (
                        <p className="text-[11px] text-white/35 mb-2">Ends {new Date(ch.ends_at).toLocaleString()}</p>
                      )}
                      <div className="space-y-2 max-h-[180px] overflow-y-auto">
                        {[...(ch.challenge_updates || [])]
                          .sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))
                          .map((u: any) => (
                            <div key={u.id} className="rounded-lg px-3 py-2 bg-white/[0.04] text-xs text-white/75">
                              {u.note && <p>{u.note}</p>}
                              {u.value_numeric != null && <p className="font-mono text-amber-200/95 mt-0.5">{u.value_numeric} lbs</p>}
                              <p className="text-[10px] text-white/35 mt-1">{new Date(u.created_at).toLocaleDateString()} · member</p>
                            </div>
                          ))}
                      </div>
                      {activeChallengeForLog === ch.id ? (
                        <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                          <input className="input-field text-xs" placeholder="lbs (optional)" value={challengeWeight} onChange={(e) => setChallengeWeight(e.target.value)} />
                          <input className="input-field text-xs" placeholder="Caption / workout note" value={challengeNote} onChange={(e) => setChallengeNote(e.target.value)} />
                          <div className="flex gap-2">
                            <button type="button" className="text-xs text-emerald-300" onClick={() => logChallengeUpdate(ch.id)}>Save</button>
                            <button type="button" className="text-xs text-white/40" onClick={() => setActiveChallengeForLog(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button type="button" className="text-xs mt-2 text-emerald-300 hover:text-emerald-200 font-medium" onClick={() => setActiveChallengeForLog(ch.id)}>
                          Log progress
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 overflow-hidden flex flex-col min-h-[260px] max-h-[440px]">
                <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-white/45" />
                  <span className="text-xs font-medium text-white/55">Group chat</span>
                  {loadingMsgs && <span className="text-[10px] text-white/30 ml-auto">Loading…</span>}
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {groupMsgs.map((m: any) => (
                    <div key={m.id} className="rounded-2xl border border-white/08 bg-white/[0.03] px-3 py-2">
                      <p className="text-[10px] text-white/35 mb-0.5">{m.profiles?.username || 'Member'}</p>
                      <p className="text-sm text-white/85">{m.body}</p>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-white/5 flex gap-2">
                  <button type="button" className="text-[10px] text-white/40 px-2" onClick={() => selectedGroupId && reloadGroupExtras(selectedGroupId)}>Refresh</button>
                  <input
                    className="input-field flex-1 text-sm py-2"
                    placeholder="Say hi..."
                    value={msgBody}
                    onChange={(e) => setMsgBody(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendGroupMessage()}
                  />
                  <button type="button" onClick={sendGroupMessage} className="shrink-0 rounded-xl px-4 bg-white text-black">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
