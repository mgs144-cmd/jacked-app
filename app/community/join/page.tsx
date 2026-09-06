'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/Navbar'
import { groupInviteJoinPath, safeInternalRedirectPath } from '@/lib/groupInviteLink'

function JoinGroupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const codeRaw = searchParams.get('code')
  const code = codeRaw?.trim() || ''

  const [phase, setPhase] = useState<'checking' | 'joining' | 'error' | 'done'>('checking')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (!code) {
      setPhase('error')
      setErrorMsg('This invite link is missing a code. Ask your friend for a new link or enter the code under Community → Groups.')
      return
    }

    if (started.current) return
    started.current = true

    const run = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        const joinPath = groupInviteJoinPath(code)
        router.replace(`/auth/login?redirect=${encodeURIComponent(joinPath)}`)
        return
      }

      setPhase('joining')
      try {
        const { data, error } = await (supabase as any).rpc('join_lifting_group_by_code', { code })
        if (error) throw error
        const gid = data as string
        if (!gid) throw new Error('No group returned')
        setPhase('done')
        router.replace(`/community/groups/${gid}`)
        router.refresh()
      } catch (e: unknown) {
        setPhase('error')
        const msg =
          e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Could not join this group.'
        setErrorMsg(msg.includes('Invalid') ? 'Invalid or expired invite code.' : msg)
      }
    }

    void run()
  }, [code, router, supabase])

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-14 bg-black flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-md mx-auto text-center">
        {(phase === 'checking' || phase === 'joining' || phase === 'done') && code ? (
          <>
            <Loader2 className="w-10 h-10 text-white/50 animate-spin mx-auto mb-4" />
            <h1 className="ui-page-title text-lg mb-1">{phase === 'done' ? 'Redirecting…' : 'Joining group…'}</h1>
            <p className="text-sm text-white/50">One moment while we add you to the group.</p>
          </>
        ) : null}

        {phase === 'error' && (
          <>
            <h1 className="ui-page-title text-lg mb-2">Could not join</h1>
            <p className="text-sm text-white/60 mb-6">{errorMsg}</p>
            <div className="flex flex-col gap-2 w-full">
              <Link href="/community" className="btn btn-primary btn-block">
                Back to Community
              </Link>
              <Link href="/auth/login" className="btn btn-secondary btn-block">
                Sign in with a different account
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default function CommunityJoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-white/40 animate-spin" />
        </div>
      }
    >
      <JoinGroupContent />
    </Suspense>
  )
}
