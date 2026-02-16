'use client'

import Link from 'next/link'

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation - Strava-style minimal */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-transparent">
        <Link 
          href="/" 
          className="font-bold text-xl tracking-wider uppercase text-white hover:opacity-90 transition-opacity"
          style={{ fontFamily: 'var(--font-black-ops-one)' }}
        >
          JACKED
        </Link>
        <div className="flex items-center gap-6">
          <Link 
            href="/auth/login" 
            className="text-sm font-medium text-white/90 hover:text-white transition-colors tracking-wide"
          >
            Log in
          </Link>
          <Link 
            href="/auth/signup" 
            className="text-sm font-semibold text-white bg-[#dc2626] hover:bg-[#b91c1c] px-4 py-2 rounded-lg transition-colors tracking-wide"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero - Dark gradient, Strava-inspired */}
      <main 
        className="flex-1 flex items-center justify-center px-6 pt-16"
        style={{
          background: 'linear-gradient(180deg, #0d0a08 0%, #1a0f0a 40%, #2d1510 70%, #3d1f12 100%)',
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6">
            Lift.
            <br />
            Share.
            <br />
            Dominate.
          </h1>
          <p className="text-lg md:text-xl text-white/80 font-normal mb-10 max-w-lg mx-auto">
            Every rep counts on Jacked. The social network for lifters.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center px-10 py-4 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold text-base rounded-lg transition-colors tracking-wide"
          >
            Get Started
          </Link>
        </div>
      </main>
    </div>
  )
}
