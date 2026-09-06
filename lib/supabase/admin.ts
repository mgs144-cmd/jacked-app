import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

function serviceRoleKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE?.trim() ||
    process.env.SUPABASE_SERVICE_KEY?.trim()
  )
}

/** Server-only Supabase client (bypasses storage RLS). */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = serviceRoleKey()
  if (!url || !serviceKey) {
    throw new Error(
      'Missing service role key. Set SUPABASE_SERVICE_ROLE_KEY in Vercel (Supabase → API → service_role secret).'
    )
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
