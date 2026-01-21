import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip middleware for static files and API routes to improve performance
  const path = request.nextUrl.pathname
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.includes('.') // Files with extensions (images, etc.)
  ) {
    return supabaseResponse
  }

  try {
    // Add timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Middleware timeout')), 5000) // 5 second timeout
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

    // Get user with timeout protection
    const userPromise = supabase.auth.getUser()
    const { data: { user } } = await Promise.race([userPromise, timeoutPromise]) as any

    // App is now completely free - no payment checks needed!
    // Only protect admin routes (and only if user is logged in)
    if (user && path.startsWith('/admin')) {
      // Simple admin check without database query for performance
      const adminEmails = [
        'jackedapp@gmail.com',
        'chippersnyder0227@gmail.com',
        process.env.ADMIN_EMAIL
      ].filter(Boolean)

      const isAdmin = adminEmails.includes(user.email || '')

      // If not admin, redirect to feed
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/feed', request.url))
      }
    }

    return supabaseResponse
  } catch (error) {
    // If middleware fails, allow the request through to avoid blocking the app
    console.error('Middleware error:', error)
    return supabaseResponse
  }
}

export const config = {
  matcher: [
    // Only run middleware on pages, not static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
