import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const form = await request.formData()
    const groupId = String(form.get('groupId') || '').trim()
    const file = form.get('file')

    if (!groupId || !(file instanceof File)) {
      return NextResponse.json({ error: 'groupId and file are required' }, { status: 400 })
    }

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: 'Use JPEG, PNG, or WebP' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image must be under 5 MB' }, { status: 400 })
    }

    const sb = supabase as any
    const { data: membership } = await sb
      .from('lifting_group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .eq('group_id', groupId)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
    const path = `group-avatars/${groupId}/${Date.now()}.${safeExt}`

    const admin = createAdminClient()
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await admin.storage.from('images').upload(path, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })

    if (uploadError) {
      console.error('group-avatar upload:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = admin.storage.from('images').getPublicUrl(path)
    const publicUrl = urlData?.publicUrl
    if (!publicUrl) {
      return NextResponse.json({ error: 'Could not get public URL' }, { status: 500 })
    }

    const { error: rpcError } = await sb.rpc('set_group_avatar_url', {
      p_group_id: groupId,
      p_avatar_url: publicUrl,
    })

    if (rpcError) {
      console.error('set_group_avatar_url:', rpcError)
      return NextResponse.json({ error: rpcError.message }, { status: 500 })
    }

    return NextResponse.json({ publicUrl })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Upload failed'
    if (msg.includes('service role key') || msg.includes('SERVICE_ROLE')) {
      return NextResponse.json({ error: msg }, { status: 503 })
    }
    console.error('group-avatar route:', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
