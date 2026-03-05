'use client'

import Link from 'next/link'

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-black/95 backdrop-blur-sm border-b border-white/10">
        <Link 
          href="/" 
          className="font-bold text-xl tracking-wider uppercase text-white hover:opacity-70 transition-opacity"
          style={{ fontFamily: 'var(--font-black-ops-one)' }}
        >
          JACKED
        </Link>
        <div className="flex items-center gap-6">
          <Link 
            href="/auth/login" 
            className="text-sm font-medium text-white/70 hover:text-white transition-colors tracking-wide"
          >
            Log in
          </Link>
          <Link 
            href="/auth/signup" 
            className="text-sm font-semibold text-black bg-white hover:bg-white/90 px-4 py-2 rounded-full transition-colors tracking-wide"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero - Split layout */}
      <main className="flex-1 flex flex-col md:flex-row min-h-screen pt-16">
        {/* Left - Content */}
        <div className="flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24 py-16 md:py-0">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.15] mb-6 max-w-xl">
            The feed for people who lift.
          </h1>
          <p className="text-lg text-white/70 font-normal mb-10 max-w-md">
            Log your workouts, share your PRs, and connect with lifters who get it.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center w-fit px-8 py-3.5 bg-white hover:bg-white/90 text-black font-semibold text-base rounded-full transition-colors tracking-wide"
          >
            Get Started
          </Link>
        </div>

        {/* Right - Logo */}
        <div className="flex-1 min-h-[40vh] md:min-h-full flex items-center justify-center p-8 md:p-16">
          <span 
            className="text-white text-8xl md:text-[12rem] lg:text-[16rem] font-bold tracking-tighter leading-none"
            style={{ fontFamily: 'var(--font-black-ops-one)' }}
          >
            J
          </span>
        </div>
      </main>
    </div>
  )
}
