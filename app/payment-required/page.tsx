import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { CreditCard, Loader2 } from 'lucide-react'
import { PaymentRequiredClient } from '@/components/PaymentRequiredClient'

export default async function PaymentRequiredPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // Check if user has paid
  const { data: profile } = await supabase
    .from('profiles')
    .select('has_paid_onboarding')
    .eq('id', session.user.id)
    .single()

  // If they've paid, redirect to feed
  if ((profile as any)?.has_paid_onboarding) {
    redirect('/feed')
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-24">
      <Navbar />
      <PaymentRequiredClient userId={session.user.id} />
    </div>
  )
}

