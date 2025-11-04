'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { Home, Plus, User, Settings, Crown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function Navbar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  if (!user) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link
            href="/feed"
            className="flex items-center space-x-2 text-2xl font-bold"
          >
            <span className="text-primary">JACKED</span>
          </Link>

          <div className="flex items-center space-x-6 md:space-x-8">
            <Link
              href="/feed"
              className={`flex items-center space-x-2 transition-colors ${
                pathname === '/feed'
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="hidden md:inline">Feed</span>
            </Link>

            <Link
              href="/create"
              className={`flex items-center space-x-2 transition-colors ${
                pathname === '/create'
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span className="hidden md:inline">Create</span>
            </Link>

            <Link
              href="/profile"
              className={`flex items-center space-x-2 transition-colors ${
                pathname === '/profile'
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="hidden md:inline">Profile</span>
            </Link>

            <Link
              href="/premium"
              className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors"
            >
              <Crown className="w-5 h-5" />
              <span className="hidden md:inline">Premium</span>
            </Link>

            <Link
              href="/settings"
              className={`flex items-center space-x-2 transition-colors ${
                pathname === '/settings'
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="hidden md:inline">Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

