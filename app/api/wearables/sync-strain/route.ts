import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncStrainForWindow, listConnections } from '@/lib/wearables'
import type { WearableProvider } from '@/lib/wearables/types'

/**
 * POST { provider?: 'whoop' | 'oura', start?: ISO, end?: ISO, sessionDate?: YYYY-MM-DD }
 * Fetches strain for the time window and upserts into workout_strain.
 * If provider omitted, syncs all connected providers.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const sessionDate =
      typeof body.sessionDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.sessionDate)
        ? body.sessionDate
        : null

    let start: string
    let end: string
    if (typeof body.start === 'string' && typeof body.end === 'string') {
      start = body.start
      end = body.end
    } else if (sessionDate) {
      // Full local calendar day window for matching Whoop/Oura workouts
      const [y, m, d] = sessionDate.split('-').map(Number)
      start = new Date(y, m - 1, d, 0, 0, 0, 0).toISOString()
      end = new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()
    } else {
      end = new Date().toISOString()
      start = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    }

    const connected = await listConnections(session.user.id)
    const requested = body.provider as WearableProvider | undefined
    const providers: WearableProvider[] =
      requested === 'whoop' || requested === 'oura'
        ? [requested]
        : connected.map((c) => c.provider)

    if (!providers.length) {
      return NextResponse.json(
        { error: 'No wearable connected. Connect Whoop or Oura in Settings.' },
        { status: 400 }
      )
    }

    const results: Record<string, { saved: number; scores: unknown[] }> = {}
    for (const provider of providers) {
      try {
        const { scores, saved } = await syncStrainForWindow({
          userId: session.user.id,
          provider,
          start,
          end,
        })
        results[provider] = {
          saved,
          scores: scores.map((s) => ({
            score: s.score,
            scaleMax: s.scaleMax,
            normalized01: s.normalized01,
            startedAt: s.startedAt,
            endedAt: s.endedAt,
            averageHeartRate: s.averageHeartRate,
            maxHeartRate: s.maxHeartRate,
            externalId: s.externalId,
          })),
        }
      } catch (e: any) {
        results[provider] = { saved: 0, scores: [] }
        console.warn(`[sync-strain] ${provider}`, e?.message)
      }
    }

    return NextResponse.json({ start, end, results })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Sync failed' }, { status: 500 })
  }
}
