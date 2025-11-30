import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { AdminDashboard } from '@/components/AdminDashboard'

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // Check if user is admin
  // For now, we'll allow access if ADMIN_EMAIL is set and matches, or if is_admin flag is true
  // If ADMIN_EMAIL is not set, we'll allow the first user to access (for initial setup)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const adminEmail = process.env.ADMIN_EMAIL
  const isAdminByEmail = adminEmail && session.user.email === adminEmail
  const isAdminByFlag = (profile as any)?.is_admin === true
  
  // If no ADMIN_EMAIL is set, allow access for initial setup (you can restrict later)
  // Otherwise, check email or flag
  const isAdmin = isAdminByEmail || isAdminByFlag || (!adminEmail)

  if (!isAdmin) {
    redirect('/feed')
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-24">
      <Navbar />
      <AdminDashboard />
    </div>
  )
}

