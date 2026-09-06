'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { Home, PlusCircle, User, Users, ClipboardList } from 'lucide-react'
import { JackedLogo } from './JackedLogo'

export function Navbar() {
  const pathname = usePathname()
  const { user, loading } = useAuth()

  if (!user && !loading) return null

  const navItems = [
    { href: '/feed', icon: Home, label: 'Feed' },
    { href: '/log', icon: ClipboardList, label: 'Log' },
    { href: '/create', icon: PlusCircle, label: 'New', isPrimary: true },
    { href: '/community', icon: Users, label: 'Community' },
    { href: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <>
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-xl">
        <div className="flex h-14 w-full max-w-[100vw] items-center justify-between pl-5 pr-5 lg:pl-10 lg:pr-10">
          <Link
            href="/feed"
            className="flex shrink-0 items-center py-1 transition-opacity hover:opacity-90 [font-family:unset]"
          >
            <JackedLogo />
          </Link>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.href === '/community'
                  ? pathname === '/community' || pathname.startsWith('/community/')
                  : pathname === item.href
              if (item.isPrimary) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="btn btn-primary ml-1 lg:ml-2 gap-1.5 action-text"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {item.label}
                  </Link>
                )
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`btn btn-ghost action-text gap-1.5 ${isActive ? 'text-white bg-white/10' : ''}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      <nav className="fixed bottom-0 left-0 right-0 z-50 overflow-visible border-t border-white/10 bg-black/98 backdrop-blur-xl md:hidden">
        <div className="grid min-h-[56px] grid-cols-5 items-end px-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === '/community'
                ? pathname === '/community' || pathname.startsWith('/community/')
                : pathname === item.href
            if (item.isPrimary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex w-full flex-col items-center justify-end gap-0.5 pb-0.5"
                  aria-label="Create post"
                >
                  <span className="flex h-11 w-11 -translate-y-1 items-center justify-center rounded-full bg-white text-black shadow-[0_2px_12px_rgba(0,0,0,0.45)] transition-transform active:scale-95">
                    <Icon className="h-6 w-6" strokeWidth={2} />
                  </span>
                  <span className="text-[10px] font-metric font-semibold uppercase tracking-[0.1em] text-white/70">
                    {item.label}
                  </span>
                </Link>
              )
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex w-full flex-col items-center justify-end gap-0.5 pb-1.5 transition-colors ${
                  isActive ? 'text-white' : 'text-white/55'
                }`}
              >
                <Icon className="h-6 w-6 shrink-0" strokeWidth={2} />
                <span className="text-[10px] font-metric font-semibold uppercase tracking-[0.1em]">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
