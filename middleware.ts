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

  // Public pages that don't require payment
  const publicPages = ['/auth', '/api', '/terms', '/privacy', '/refund', '/payment-required']
  const isPublicPage = publicPages.some(page => request.nextUrl.pathname.startsWith(page))

  // Check if user is admin (for /admin access) - admins can access without payment
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
    // Admin can access without payment, continue
    return supabaseResponse
  }

  // TEMPORARY: Bypass payment check if DISABLE_PAYMENT_CHECK is set
  // Set this environment variable to "true" to disable payment requirements
  const disablePaymentCheck = process.env.DISABLE_PAYMENT_CHECK === 'true'

  // Check payment requirement for protected routes (except public pages and admin)
  if (user && !isPublicPage && !request.nextUrl.pathname.startsWith('/admin')) {
    // If payment check is disabled, allow all users through
    if (disablePaymentCheck) {
      return supabaseResponse
    }

    const { data: profile, error } = await (supabase
      .from('profiles') as any)
      .select('has_paid_onboarding, is_admin, onboarding_payment_id')
      .eq('id', user.id)
      .single()

    // Log for debugging if there's an error
    if (error) {
      console.error('Middleware: Error fetching profile:', error)
    }

    // Allow admins to bypass payment check
    const adminEmail = process.env.ADMIN_EMAIL
    const isAdmin = (adminEmail && user.email === adminEmail) || 
                    user.email === 'jackedapp@gmail.com' ||
                    user.email === 'chippersnyder0227@gmail.com' ||
                    (profile as any)?.is_admin === true

    if (isAdmin) {
      return supabaseResponse
    }

    // If profile doesn't exist yet, allow through (will be created)
    if (!profile) {
      return supabaseResponse
    }

    const hasPaid = (profile as any)?.has_paid_onboarding === true

    // If user has paid and on payment page, redirect to feed immediately
    if (hasPaid && request.nextUrl.pathname === '/payment-required') {
      return NextResponse.redirect(new URL('/feed', request.url))
    }

    // If user hasn't paid and not already on payment page, redirect to payment
    if (!hasPaid && request.nextUrl.pathname !== '/payment-required') {
      return NextResponse.redirect(new URL('/payment-required', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

