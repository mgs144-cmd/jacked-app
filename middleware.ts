import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  // Check payment requirement for protected routes (except auth pages and API routes)
  if (user && !request.nextUrl.pathname.startsWith('/auth') && !request.nextUrl.pathname.startsWith('/api')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('has_paid_onboarding')
      .eq('id', user.id)
      .single()

    // If user hasn't paid and not already on payment page, redirect to payment
    if (!(profile as any)?.has_paid_onboarding && request.nextUrl.pathname !== '/payment-required') {
      return NextResponse.redirect(new URL('/payment-required', request.url))
    }

    // If user has paid and on payment page, redirect to feed
    if ((profile as any)?.has_paid_onboarding && request.nextUrl.pathname === '/payment-required') {
      return NextResponse.redirect(new URL('/feed', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

