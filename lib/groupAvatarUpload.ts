import type { SupabaseClient } from '@supabase/supabase-js'

/** Upload via server (service role) so storage RLS on group-avatars/ is not required. */
export async function uploadGroupAvatarFile(
  _supabase: SupabaseClient,
  groupId: string,
  file: File
): Promise<string> {
  const form = new FormData()
  form.append('groupId', groupId)
  form.append('file', file)

  const res = await fetch('/api/group-avatar', {
    method: 'POST',
    body: form,
    credentials: 'include',
  })

  const body = (await res.json().catch(() => ({}))) as { publicUrl?: string; error?: string }
  if (!res.ok) {
    throw new Error(body.error || `Upload failed (${res.status})`)
  }
  if (!body.publicUrl) {
    throw new Error('Upload succeeded but no URL returned')
  }
  return body.publicUrl
}

export async function persistGroupAvatarUrl(
  supabase: SupabaseClient,
  groupId: string,
  avatarUrl: string | null
): Promise<void> {
  const { error } = await supabase.rpc('set_group_avatar_url', {
    p_group_id: groupId,
    p_avatar_url: avatarUrl ?? '',
  })
  if (error) throw error
}
