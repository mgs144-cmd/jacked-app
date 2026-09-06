'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Trophy, Search, Hash, ChevronUp, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { DiscoverClient } from '@/components/DiscoverClient'
import { GroupAvatar } from '@/components/community/GroupAvatar'

interface CommunityClientProps {
  currentUserId: string
  initialUsers: Record<string, unknown>[]
  suggestedUsers: Record<string, unknown>[]
  followingIds: string[]
  requestStatusMap: Record<string, string>
  initialGroups: Record<string, unknown>[]
}

export function CommunityClient({
  currentUserId,
  initialUsers,
  suggestedUsers,
  followingIds,
  requestStatusMap,
  initialGroups,
}: CommunityClientProps) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [groups, setGroups] = useState(initialGroups as any[])

  const [createOpen, setCreateOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')

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
        .maybeSingle()

      if (error) {
        const err = error as { message?: string; details?: string; hint?: string; code?: string }
        const bits = [err.message, err.details, err.hint, err.code && `code: ${err.code}`].filter(Boolean)
        alert(`Could not create group.\n\n${bits.join('\n')}`)
        return
      }

      if (!data) {
        alert(
          'Create may have succeeded but the app could not read the new group (often RLS).\n\n' +
            'In Supabase run FIX_GROUP_RLS_CREATE.sql, confirm you are on the same project as this site, then refresh the page.'
        )
        router.refresh()
        return
      }

      const g = data as any
      setGroups((prev) => [g, ...prev])
      setNewGroupName('')
      setNewGroupDesc('')
      setCreateOpen(false)
      router.push(`/community/groups/${g.id}`)
      router.refresh()
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : e instanceof Error
            ? e.message
            : String(e)
      alert(`Could not create group.\n\n${msg}`)
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
        setCreateOpen(false)
        router.push(`/community/groups/${gid}`)
        router.refresh()
      }
    } catch {
      alert('Invalid invite code — double-check caps or ask the creator.')
    }
  }

  return (
    <div className="space-y-10">
      {/* Groups */}
      <section>
        <h2 className="ui-section-title mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Your groups
        </h2>
        <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-5 px-1 min-w-min">
            {groups.map((g: any) => (
              <Link
                key={g.id}
                href={`/community/groups/${g.id}`}
                className="flex flex-col items-center gap-2 shrink-0 w-[76px] group"
              >
                <div className="transition-transform group-active:scale-95 group-hover:scale-[1.02]">
                  <GroupAvatar name={g.name} groupId={g.id} avatarUrl={g.avatar_url} size="lg" />
                </div>
                <span className="text-xs font-medium text-white/85 truncate w-full text-center leading-tight">
                  {g.name}
                </span>
              </Link>
            ))}

            <button
              type="button"
              onClick={() => setCreateOpen((o) => !o)}
              className="flex flex-col items-center gap-2 shrink-0 w-[76px] group"
              aria-label={createOpen ? 'Cancel' : 'Create or join a group'}
            >
              <div
                className={`w-[72px] h-[72px] rounded-full border-2 border-dashed flex items-center justify-center transition-colors ${
                  createOpen
                    ? 'border-white/30 bg-white/10 text-white'
                    : 'border-white/20 bg-white/[0.03] text-white/50 group-hover:border-white/35 group-hover:bg-white/[0.06] group-hover:text-white/70'
                }`}
              >
                {createOpen ? (
                  <ChevronUp className="w-6 h-6" strokeWidth={1.75} />
                ) : (
                  <Plus className="w-7 h-7" strokeWidth={1.75} />
                )}
              </div>
              <span className="text-xs font-medium text-white/50 group-hover:text-white/70">
                {createOpen ? 'Cancel' : 'New'}
              </span>
            </button>
          </div>
        </div>

        {groups.length === 0 && !createOpen && (
          <p className="mt-4 text-sm text-white/40 text-center px-2">
            Tap <span className="text-white/55">New</span> to create a group or join with a code.
          </p>
        )}

        {createOpen && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4 animate-in fade-in duration-200">
            <input
              className="input-field w-full text-sm"
              placeholder="Group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <input
              className="input-field w-full text-sm"
              placeholder="Description (optional)"
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
            />
            <button
              type="button"
              disabled={creatingGroup || !newGroupName.trim()}
              onClick={createGroup}
              className="btn btn-primary btn-block disabled:opacity-50"
            >
              {creatingGroup ? 'Creating…' : 'Create group'}
            </button>
            <div className="border-t border-white/10 pt-4 flex flex-col gap-2">
              <span className="text-xs text-white/50 flex items-center gap-1">
                <Hash className="w-3 h-3" /> Or join with invite code
              </span>
              <div className="flex gap-2">
                <input
                  className="input-field flex-1 text-sm"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="e.g. A1B2C3D4"
                />
                <button
                  type="button"
                  onClick={joinGroup}
                  className="btn btn-secondary shrink-0"
                >
                  Join
                </button>
              </div>
              <p className="text-[11px] text-white/35">Invite links also work — ask a teammate to share from inside the group.</p>
            </div>
          </div>
        )}
      </section>

      {/* Find people */}
      <section className="pt-2 border-t border-white/[0.06]">
        <h2 className="ui-section-title mb-5 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Find people
        </h2>
        <DiscoverClient
          currentUserId={currentUserId}
          initialUsers={initialUsers as any[]}
          suggestedUsers={suggestedUsers as any[]}
          followingIds={followingIds}
          requestStatusMap={requestStatusMap}
          previewCount={99}
          embedded
          compact
        />
      </section>
    </div>
  )
}
