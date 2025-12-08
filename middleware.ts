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
  const publicPages = ['/auth', '/api', '/terms', '/privacy', '/refund', '/payment-required', '/demo']
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

    // Prevent redirect loops - if we're already redirecting, don't redirect again
    const redirectHeader = request.headers.get('x-middleware-redirect')
    if (redirectHeader) {
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
      // If we can't fetch profile, allow through to avoid blocking legitimate users
      // The app will handle the missing profile case
      return supabaseResponse
    }

    // Allow admins to bypass payment check
    const adminEmail = process.env.ADMIN_EMAIL
    const isAdmin = (adminEmail && user.email === adminEmail) || 
                    user.email === 'jackedapp@gmail.com' ||
                    user.email === 'chippersnyder0227@gmail.com' ||
                    user.email === 'demo@jackedlifting.com' || // Demo account bypass
                    (profile as any)?.is_admin === true

    if (isAdmin) {
      return supabaseResponse
    }

    // If profile doesn't exist yet, allow through (will be created)
    if (!profile) {
      return supabaseResponse
    }

    // Check if user has actually paid - require valid Stripe payment ID
    const hasPaidOnboarding = (profile as any)?.has_paid_onboarding === true
    const paymentId = (profile as any)?.onboarding_payment_id
    
    // Only consider it paid if:
    // 1. has_paid_onboarding is true AND
    // 2. onboarding_payment_id exists and looks like a valid Stripe ID (cs_ or pi_ prefix)
    // This prevents users who were accidentally marked as paid from accessing the app
    const hasValidPayment = hasPaidOnboarding && paymentId && (
      paymentId.startsWith('cs_') || // Stripe checkout session
      paymentId.startsWith('pi_') || // Stripe payment intent
      paymentId.startsWith('manual_') || // Manual admin fix (verify these)
      paymentId.startsWith('stripe_fix_') // Stripe fix script (verify these)
    )

    // If user has valid payment and on payment page, redirect to feed immediately
    // Use replace: true to prevent redirect loops
    if (hasValidPayment && request.nextUrl.pathname === '/payment-required') {
      const feedUrl = new URL('/feed', request.url)
      feedUrl.searchParams.set('_redirect', '1') // Add flag to prevent loops
      const response = NextResponse.redirect(feedUrl)
      response.headers.set('x-middleware-redirect', '1')
      return response
    }

    // If user hasn't paid or has invalid payment, redirect to payment
    // Only redirect if not already on payment page and not coming from a redirect
    if (!hasValidPayment && 
        request.nextUrl.pathname !== '/payment-required' &&
        !request.nextUrl.searchParams.has('_redirect')) {
      const paymentUrl = new URL('/payment-required', request.url)
      const response = NextResponse.redirect(paymentUrl)
      response.headers.set('x-middleware-redirect', '1')
      return response
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

