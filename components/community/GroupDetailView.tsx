'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Send, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { GroupChallengesPanel } from '@/components/community/GroupChallengesPanel'
import type { GroupChallengeRow, GroupMemberRow } from '@/lib/groupChallenges'
import { groupInviteJoinUrl } from '@/lib/groupInviteLink'
import { GroupAvatarPicker } from '@/components/community/GroupAvatarPicker'

export type GroupDetailGroup = {
  id: string
  name: string
  description?: string | null
  invite_code: string
  avatar_url?: string | null
}

interface GroupDetailViewProps {
  currentUserId: string
  group: GroupDetailGroup
  initialChallenges: GroupChallengeRow[]
  initialMembers: GroupMemberRow[]
}

export function GroupDetailView({ currentUserId, group, initialChallenges, initialMembers }: GroupDetailViewProps) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [groupMsgs, setGroupMsgs] = useState<any[]>([])
  const [msgBody, setMsgBody] = useState('')
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [groupMembers, setGroupMembers] = useState<GroupMemberRow[]>(initialMembers)
  const [groupChallenges, setGroupChallenges] = useState<GroupChallengeRow[]>(initialChallenges)
  const [copiedInvite, setCopiedInvite] = useState(false)
  const [shareUrlDisplay, setShareUrlDisplay] = useState('')
  const [groupAvatarUrl, setGroupAvatarUrl] = useState<string | null>(group.avatar_url ?? null)

  useEffect(() => {
    setShareUrlDisplay(groupInviteJoinUrl(window.location.origin, group.invite_code))
  }, [group.invite_code])

  const copyInviteLink = async () => {
    const url = shareUrlDisplay || groupInviteJoinUrl(window.location.origin, group.invite_code)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedInvite(true)
      window.setTimeout(() => setCopiedInvite(false), 2000)
    } catch {
      alert('Could not copy link.')
    }
  }

  const reloadGroupExtras = useCallback(
    async (gid: string) => {
      setLoadingMsgs(true)
      try {
        const [{ data: msgs }, { data: challenges }, { data: memberRows }] = await Promise.all([
          (supabase as any)
            .from('group_chat_messages')
            .select('id, body, created_at, user_id, profiles:user_id(username, avatar_url, full_name)')
            .eq('group_id', gid)
            .order('created_at', { ascending: true })
            .limit(100),
          (supabase as any)
            .from('group_challenges')
            .select('*, challenge_updates(*, profiles:user_id(username, avatar_url))')
            .eq('group_id', gid),
          (supabase as any)
            .from('lifting_group_members')
            .select('user_id, profiles:user_id(id, username, avatar_url, full_name)')
            .eq('group_id', gid),
        ])
        setGroupMsgs(msgs || [])
        setGroupMembers((memberRows as GroupMemberRow[]) || [])
        setGroupChallenges((challenges as GroupChallengeRow[]) || [])
      } catch {
        setGroupMsgs([])
      } finally {
        setLoadingMsgs(false)
      }
    },
    [supabase]
  )

  useEffect(() => {
    void reloadGroupExtras(group.id)
  }, [group.id, reloadGroupExtras])

  const sendGroupMessage = async () => {
    const trim = msgBody.trim()
    if (!trim) return
    try {
      const { error } = await (supabase as any).from('group_chat_messages').insert({
        group_id: group.id,
        user_id: currentUserId,
        body: trim,
      })
      if (error) throw error
      setMsgBody('')
      await reloadGroupExtras(group.id)
      router.refresh()
    } catch {
      alert('Message failed.')
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-start gap-3 shrink-0 mb-4">
        <Link
          href="/community"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-white/80 hover:bg-white/[0.06] transition-colors shrink-0 mt-1"
          aria-label="Back to community"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <GroupAvatarPicker
          groupId={group.id}
          groupName={group.name}
          avatarUrl={groupAvatarUrl}
          onUpdated={setGroupAvatarUrl}
          size="lg"
        />
        <div className="min-w-0 flex-1 pt-2">
          <h1 className="ui-page-title text-lg truncate">{group.name}</h1>
          <p className="text-xs text-white/45">
            {groupMembers.length} member{groupMembers.length !== 1 ? 's' : ''}
            {group.description ? ` · ${group.description}` : ''}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-5 pb-4">
        <GroupChallengesPanel
          groupId={group.id}
          currentUserId={currentUserId}
          members={groupMembers}
          challenges={groupChallenges}
          onChallengeCreated={(row) => {
            setGroupChallenges((prev) => [row, ...prev.filter((c) => c.id !== row.id)])
          }}
          onReload={() => reloadGroupExtras(group.id)}
        />

        <div className="rounded-2xl border border-white/10 overflow-hidden flex flex-col min-h-[200px] max-h-[min(40vh,400px)]">
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2 shrink-0">
            <MessageCircle className="w-4 h-4 text-white/45" />
            <span className="text-xs font-medium text-white/55">Chat</span>
            {loadingMsgs && <span className="text-[10px] text-white/30 ml-auto">…</span>}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[80px]">
            {groupMsgs.length === 0 ? (
              <p className="text-xs text-white/35 text-center py-6">No messages yet.</p>
            ) : (
              groupMsgs.map((m: any) => (
                <div key={m.id} className="rounded-xl bg-white/[0.04] px-3 py-2">
                  <p className="text-[10px] text-white/40 mb-0.5">{m.profiles?.username || 'Member'}</p>
                  <p className="text-sm text-white/85">{m.body}</p>
                </div>
              ))
            )}
          </div>
          <div className="p-2 border-t border-white/5 flex gap-2 shrink-0">
            <input
              className="input-field flex-1 text-sm py-2"
              placeholder="Message…"
              value={msgBody}
              onChange={(e) => setMsgBody(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendGroupMessage()}
            />
            <button type="button" onClick={sendGroupMessage} className="shrink-0 rounded-xl px-4 bg-white text-black">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="shrink-0 pt-3 mt-2 border-t border-white/[0.08]">
        <button
          type="button"
          onClick={copyInviteLink}
          className="btn btn-secondary btn-block gap-2"
        >
          <UserPlus className="w-4 h-4" />
          {copiedInvite ? 'Invite link copied' : 'Invite friends'}
        </button>
      </div>
    </div>
  )
}
