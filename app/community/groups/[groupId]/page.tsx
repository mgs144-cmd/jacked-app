import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { GroupDetailView } from '@/components/community/GroupDetailView'
import type { GroupChallengeRow, GroupMemberRow } from '@/lib/groupChallenges'

export const dynamic = 'force-dynamic'

export default async function GroupDetailPage({ params }: { params: { groupId: string } }) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const groupId = params.groupId?.trim()
  if (!groupId) {
    notFound()
  }

  const sb = supabase as any

  const { data: membership } = await sb
    .from('lifting_group_members')
    .select('group_id')
    .eq('user_id', session.user.id)
    .eq('group_id', groupId)
    .maybeSingle()

  if (!membership) {
    redirect('/community')
  }

  // Use * so missing optional columns (e.g. avatar_url before migration) don't 404 the page.
  const { data: group, error: groupErr } = await sb.from('lifting_groups').select('*').eq('id', groupId).maybeSingle()

  if (groupErr || !group) {
    notFound()
  }

  let challenges: GroupChallengeRow[] = []
  const { data: challengeRows, error: challengesErr } = await sb
    .from('group_challenges')
    .select('*, challenge_updates(*, profiles:user_id(username, avatar_url))')
    .eq('group_id', groupId)

  if (challengesErr) {
    const { data: fallback } = await sb.from('group_challenges').select('*').eq('group_id', groupId)
    challenges = (fallback || []) as GroupChallengeRow[]
  } else {
    challenges = (challengeRows || []) as GroupChallengeRow[]
  }

  const { data: memberRows } = await sb
    .from('lifting_group_members')
    .select('user_id, profiles:user_id(id, username, avatar_url, full_name)')
    .eq('group_id', groupId)

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-14 bg-black flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col min-h-0 w-full max-w-3xl mx-auto px-4 py-4 md:py-6">
        <GroupDetailView
          currentUserId={session.user.id}
          group={{
            id: group.id,
            name: group.name,
            description: group.description,
            invite_code: group.invite_code,
            avatar_url: group.avatar_url ?? null,
          }}
          initialChallenges={challenges}
          initialMembers={(memberRows || []) as GroupMemberRow[]}
        />
      </main>
    </div>
  )
}
