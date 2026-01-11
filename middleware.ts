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

  // App is now completely free - no payment checks needed!
  // Only protect admin routes
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('*')
      .eq('id', user.id)
      .single()

    const adminEmail = process.env.ADMIN_EMAIL
    const isAdmin = (adminEmail && user.email === adminEmail) || 
                    user.email === 'jackedapp@gmail.com' ||
                    user.email === 'chippersnyder0227@gmail.com' ||
                    (profile as any)?.is_admin === true ||
                    !adminEmail // Allow if ADMIN_EMAIL not set (for initial setup)

    // If not admin, redirect to feed
    if (!isAdmin) {
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

