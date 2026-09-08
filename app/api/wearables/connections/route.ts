import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteConnection, listConnections } from '@/lib/wearables'
import type { WearableProvider } from '@/lib/wearables/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const connections = await listConnections(session.user.id)
    return NextResponse.json({ connections })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    const provider = body.provider as WearableProvider
    if (provider !== 'whoop' && provider !== 'oura') {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }
    await deleteConnection(session.user.id, provider)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
