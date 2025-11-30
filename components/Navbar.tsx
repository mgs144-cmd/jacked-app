'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { Home, PlusCircle, User, Settings, Users, Trophy } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const { user } = useAuth()

  if (!user) return null

  const currentMonth = new Date().getMonth() + 1
  const isDecember = currentMonth === 12
  // Always show Deadcember for now (can change back to isDecember only later)
  const showDeadcember = true // Change to: isDecember

  const navItems = [
    { href: '/feed', icon: Home, label: 'Feed' },
    { href: '/discover', icon: Users, label: 'Discover' },
    ...(showDeadcember ? [{ href: '/deadcember', icon: Trophy, label: 'Deadcember' }] : []),
    { href: '/create', icon: PlusCircle, label: 'Post', isPrimary: true },
    { href: '/profile', icon: User, label: 'Profile' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-metal backdrop-blur-xl border-t border-gray-800/50 z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-center md:justify-between h-16 md:h-24">
          {/* Logo - Hidden on mobile, shown on desktop */}
          <Link
            href="/feed"
            className="hidden md:flex items-center space-x-3 group"
          >
            <div className="relative">
              <span className="text-white text-3xl md:text-5xl font-logo tracking-[0.2em] text-glow transition-all duration-300 group-hover:scale-105 block">
                JACKED
              </span>
              <div className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 glow-red-sm"></div>
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-1 md:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              if (item.isPrimary) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex flex-col md:flex-row items-center justify-center space-y-1 md:space-y-0 md:space-x-2 px-4 py-2 rounded-xl bg-gradient-primary text-white hover:brightness-110 transition-all duration-300 shadow-lg hover:shadow-red-500/30 hover:scale-105"
                  >
                    <Icon className="w-5 h-5 md:w-5 md:h-5" strokeWidth={2.5} />
                    <span className="text-[10px] md:text-sm font-bold tracking-wide">{item.label}</span>
                  </Link>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col md:flex-row items-center justify-center space-y-1 md:space-y-0 md:space-x-2 px-3 py-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'text-white bg-gray-800/60 shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={2.5} />
                  <span className="text-[10px] md:text-sm font-semibold hidden md:inline">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
