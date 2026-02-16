'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { Home, PlusCircle, User, Users } from 'lucide-react'
import { JackedLogo, JackedLogoCompact } from './JackedLogo'

export function Navbar() {
  const pathname = usePathname()
  const { user, loading } = useAuth()

  // Only hide when we're certain user isn't logged in (avoids navbar flash while auth loads)
  if (!user && !loading) return null

  const navItems = [
    { href: '/feed', icon: Home, label: 'Feed' },
    { href: '/discover', icon: Users, label: 'Discover' },
    { href: '/create', icon: PlusCircle, label: 'New', isPrimary: true },
    { href: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <>
      {/* Desktop Navigation - minimal, Strava-style */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 bg-[#1a1a1a]/95 border-b border-white/5 z-50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <Link href="/feed" className="flex items-center group">
              <JackedLogo />
            </Link>

            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                if (item.isPrimary) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="ml-2 px-4 py-2 bg-[#ff5555] hover:bg-[#ff4444] text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Icon className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                      {item.label}
                    </Link>
                  )
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'text-white bg-white/5' : 'text-[#a1a1a1] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - clean bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1a1a]/98 border-t border-white/5 z-50 backdrop-blur-xl safe-area-pb">
        <div className="flex items-center justify-around px-4 py-2 min-h-[48px]">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            if (item.isPrimary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center min-h-[48px] min-w-[48px] p-2 rounded-xl bg-[#ff5555] text-white active:scale-95 transition-transform"
                >
                  <Icon className="w-6 h-6" strokeWidth={2} />
                  <span className="text-[11px] font-medium mt-0.5">{item.label}</span>
                </Link>
              )
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] p-2 rounded-xl transition-colors ${
                  isActive ? 'text-[#ff5555]' : 'text-[#a1a1a1]'
                }`}
              >
                <Icon className="w-6 h-6" strokeWidth={2} />
                <span className="text-[11px] font-medium mt-0.5">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
