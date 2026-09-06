'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FeedPostSeenTrackerProps {
  postId: string
  userId: string
  children: React.ReactNode
}

const pendingByUser = new Map<string, Set<string>>()
const flushTimers = new Map<string, ReturnType<typeof setTimeout>>()

function scheduleFlush(userId: string) {
  const existing = flushTimers.get(userId)
  if (existing) clearTimeout(existing)

  flushTimers.set(
    userId,
    setTimeout(() => {
      flushTimers.delete(userId)
      void flushSeen(userId)
    }, 400)
  )
}

async function flushSeen(userId: string) {
  const pending = pendingByUser.get(userId)
  if (!pending?.size) return

  const postIds = [...pending]
  pending.clear()

  const supabase = createClient()
  const rows = postIds.map((post_id) => ({
    user_id: userId,
    post_id,
    viewed_at: new Date().toISOString(),
  }))

  const { error } = await (supabase.from('feed_post_views') as any).upsert(rows, {
    onConflict: 'user_id,post_id',
  })

  if (error) {
    postIds.forEach((id) => pendingByUser.get(userId)?.add(id))
  }
}

export function markPostSeen(userId: string, postId: string) {
  if (!pendingByUser.has(userId)) pendingByUser.set(userId, new Set())
  pendingByUser.get(userId)!.add(postId)
  scheduleFlush(userId)
}

export function FeedPostSeenTracker({ postId, userId, children }: FeedPostSeenTrackerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const marked = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || !userId) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (marked.current) return
        const entry = entries[0]
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.35) {
          marked.current = true
          markPostSeen(userId, postId)
          observer.disconnect()
        }
      },
      { threshold: [0, 0.35, 0.6] }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [postId, userId])

  return <div ref={ref}>{children}</div>
}
