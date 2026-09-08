import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createOAuthPayload,
  createShortOAuthNonce,
  oauthPayloadCookieName,
  oauthStateCookieName,
} from '@/lib/wearables/oauthState'
import { buildWhoopAuthorizeUrl, getWhoopClientConfig } from '@/lib/wearables/providers/whoop'

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

    const { clientId, redirectUri } = getWhoopClientConfig()
    if (!clientId || !redirectUri) {
      return NextResponse.json(
        {
          error:
            'Whoop is not configured. Set WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET, and NEXT_PUBLIC_APP_URL (or WHOOP_REDIRECT_URI).',
        },
        { status: 503 }
      )
    }

    const state = createShortOAuthNonce()
    const payload = createOAuthPayload('whoop', session.user.id)
    const url = buildWhoopAuthorizeUrl(state)
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
    return NextResponse.json({ error: e?.message || 'Whoop connect failed' }, { status: 500 })
  }
}
