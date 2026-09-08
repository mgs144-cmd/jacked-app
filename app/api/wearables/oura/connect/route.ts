import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createOAuthPayload,
  createShortOAuthNonce,
  oauthPayloadCookieName,
  oauthStateCookieName,
} from '@/lib/wearables/oauthState'
import { buildOuraAuthorizeUrl, getOuraClientConfig } from '@/lib/wearables/providers/oura'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/auth/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
    }

    const { clientId, redirectUri } = getOuraClientConfig()
    if (!clientId || !redirectUri) {
      return NextResponse.json(
        {
          error:
            'Oura is not configured. Set OURA_CLIENT_ID, OURA_CLIENT_SECRET, and NEXT_PUBLIC_APP_URL (or OURA_REDIRECT_URI).',
        },
        { status: 503 }
      )
    }

    const state = createShortOAuthNonce()
    const payload = createOAuthPayload('oura', session.user.id)
    const url = buildOuraAuthorizeUrl(state)
    const res = NextResponse.redirect(url)
    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 600,
    }
    res.cookies.set(oauthStateCookieName(), state, cookieOpts)
    res.cookies.set(oauthPayloadCookieName(), payload, cookieOpts)
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Oura connect failed' }, { status: 500 })
  }
}
