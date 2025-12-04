import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PaymentRequiredClient } from '@/components/PaymentRequiredClient'
import { Navbar } from '@/components/Navbar'

export default async function PaymentRequiredPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If not logged in, redirect to login
  if (!session) {
    redirect('/auth/login')
  }

  // Check if user has already paid
  const { data: profile } = await (supabase
    .from('profiles') as any)
    .select('has_paid_onboarding, onboarding_payment_id')
    .eq('id', session.user.id)
    .single()

  // If user has paid, redirect to feed
  if (profile?.has_paid_onboarding && profile?.onboarding_payment_id) {
    redirect('/feed')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <Navbar />
      <PaymentRequiredClient userId={session.user.id} />
    </div>
  )
}

