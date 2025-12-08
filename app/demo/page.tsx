'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function DemoPage() {
  const [status, setStatus] = useState('Logging you into demo account...')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loginDemo = async () => {
      try {
        // Demo account credentials
        const DEMO_EMAIL = 'demo@jackedlifting.com'
        const DEMO_PASSWORD = 'DemoJacked2024!'

        setStatus('Signing in...')
        
        // Sign in with demo account
        const { data, error } = await supabase.auth.signInWithPassword({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
        })

        if (error) {
          console.error('Demo login error:', error)
          setStatus('Setting up demo account...')
          
          // If demo account doesn't exist, show error
          setStatus('Demo account not found. Please contact support.')
          return
        }

        if (data.user) {
          setStatus('Success! Redirecting to feed...')
          
          // Small delay for user feedback
          setTimeout(() => {
            router.push('/feed')
            router.refresh()
          }, 500)
        }
      } catch (err: any) {
        console.error('Demo error:', err)
        setStatus('Error: ' + (err.message || 'Failed to access demo'))
      }
    }

    loginDemo()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-12">
          {/* Logo/Branding */}
          <div className="mb-8">
            <div className="relative inline-block">
              <span className="text-6xl font-black bg-gradient-to-r from-primary via-red-500 to-primary bg-clip-text text-transparent animate-pulse">
                JACKED
              </span>
            </div>
          </div>

          {/* Demo Badge */}
          <div className="inline-block bg-yellow-950/30 border border-yellow-600/50 rounded-full px-4 py-2 mb-6">
            <span className="text-yellow-400 font-bold text-sm">🎭 DEMO MODE</span>
          </div>

          {/* Loading Spinner */}
          <div className="mb-6">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          </div>

          {/* Status Text */}
          <p className="text-white text-lg font-semibold mb-2">{status}</p>
          <p className="text-gray-500 text-sm">
            Welcome to the Jacked demo experience
          </p>

          {/* Info Box */}
          <div className="mt-8 bg-gray-800/50 rounded-lg p-4 text-left">
            <p className="text-gray-400 text-xs leading-relaxed">
              <strong className="text-white">Note:</strong> You're accessing a shared demo account. 
              Posts and changes you make will be visible to all demo users. 
              Sign up for your own account at <span className="text-primary">jackedlifting.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

