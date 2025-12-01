import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CreditCard, Loader2 } from 'lucide-react'
import { PaymentRequiredClient } from '@/components/PaymentRequiredClient'
import Link from 'next/link'

export default async function PaymentRequiredPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // Check if user has paid with proper validation
  const { data: profile } = await supabase
    .from('profiles')
    .select('has_paid_onboarding, onboarding_payment_id')
    .eq('id', session.user.id)
    .single()

  // If they've paid with valid payment ID, redirect to feed
  // Use same validation logic as middleware to prevent loops
  if (profile) {
    const hasPaidOnboarding = (profile as any)?.has_paid_onboarding === true
    const paymentId = (profile as any)?.onboarding_payment_id
    
    const hasValidPayment = hasPaidOnboarding && paymentId && (
      paymentId.startsWith('cs_') ||
      paymentId.startsWith('pi_') ||
      paymentId.startsWith('manual_') ||
      paymentId.startsWith('stripe_fix_')
    )

    if (hasValidPayment) {
      redirect('/feed')
    }
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-24">
      <Navbar />
      <PaymentRequiredClient userId={session.user.id} />
      <div className="max-w-md mx-auto px-4 pb-8">
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 mt-8">
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy
          </Link>
          <Link href="/refund" className="hover:text-white transition-colors">
            Refund
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}

