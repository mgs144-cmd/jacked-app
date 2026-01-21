'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { Home, PlusCircle, User, Users, Trophy } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const { user } = useAuth()

  if (!user) return null

  const currentMonth = new Date().getMonth() + 1
  const isDecember = currentMonth === 12
  const showDeadcember = true // Change to: isDecember

  const navItems = [
    { href: '/feed', icon: Home, label: 'Feed' },
    { href: '/discover', icon: Users, label: 'Discover' },
    { href: '/create', icon: PlusCircle, label: 'New', isPrimary: true },
    ...(showDeadcember ? [{ href: '/deadcember', icon: Trophy, label: 'Deadcember' }] : []),
    { href: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 bg-surface border-b border-default z-50 backdrop-blur-xl bg-opacity-90">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/feed" className="flex items-center space-x-2 group">
              <span className="text-xl font-semibold text-primary tracking-tight">
                JACKED
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                if (item.isPrimary) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="btn btn-primary btn-sm ml-2"
                    >
                      <Icon className="w-4 h-4 mr-1.5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                }
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-default z-50 backdrop-blur-xl bg-opacity-95">
        <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            if (item.isPrimary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-red-600 text-white active-scale"
                >
                  <Icon className="w-6 h-6" strokeWidth={2} />
                  <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
                </Link>
              )
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-secondary'
                }`}
              >
                <Icon className="w-6 h-6" strokeWidth={2} />
                <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
