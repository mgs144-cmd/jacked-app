import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  oauthPayloadCookieName,
  oauthStateCookieName,
  parseOAuthPayload,
} from '@/lib/wearables/oauthState'
import { exchangeOuraAuthCode } from '@/lib/wearables/providers/oura'
import { saveTokens } from '@/lib/wearables'

export const dynamic = 'force-dynamic'

function appOrigin(req: NextRequest) {
  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (env) return env
  return req.nextUrl.origin
}

export async function GET(req: NextRequest) {
  const origin = appOrigin(req)
  const settingsUrl = `${origin}/settings?wearable=oura`

  try {
    const code = req.nextUrl.searchParams.get('code')
    const state = req.nextUrl.searchParams.get('state')
    const err = req.nextUrl.searchParams.get('error')
    if (err) {
      return NextResponse.redirect(`${settingsUrl}&error=${encodeURIComponent(err)}`)
    }
    if (!code || !state) {
      return NextResponse.redirect(`${settingsUrl}&error=missing_code`)
    }

    const cookieState = req.cookies.get(oauthStateCookieName())?.value
    const cookiePayload = req.cookies.get(oauthPayloadCookieName())?.value
    if (!cookieState || cookieState !== state || !cookiePayload) {
      return NextResponse.redirect(`${settingsUrl}&error=invalid_state`)
    }

    const parsed = parseOAuthPayload(cookiePayload)
    if (!parsed || parsed.provider !== 'oura') {
      return NextResponse.redirect(`${settingsUrl}&error=invalid_state`)
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.id || user.id !== parsed.userId) {
      return NextResponse.redirect(`${origin}/auth/login`)
    }

    const tokens = await exchangeOuraAuthCode(code)
    await saveTokens(user.id, 'oura', tokens)

    const res = NextResponse.redirect(`${settingsUrl}&connected=1`)
    res.cookies.set(oauthStateCookieName(), '', { httpOnly: true, path: '/', maxAge: 0 })
    res.cookies.set(oauthPayloadCookieName(), '', { httpOnly: true, path: '/', maxAge: 0 })
    return res
  } catch (e: any) {
    console.error('[oura callback]', e)
    return NextResponse.redirect(
      `${settingsUrl}&error=${encodeURIComponent(e?.message || 'callback_failed')}`
    )
  }
}
