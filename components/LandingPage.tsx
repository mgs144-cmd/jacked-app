'use client'

import Link from 'next/link'

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3ef]">
      {/* Navigation - Light, bordered */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-[#f5f3ef]/95 backdrop-blur-sm border-b border-black/10">
        <Link 
          href="/" 
          className="font-bold text-xl tracking-wider uppercase text-black hover:opacity-70 transition-opacity"
          style={{ fontFamily: 'var(--font-black-ops-one)' }}
        >
          JACKED
        </Link>
        <div className="flex items-center gap-6">
          <Link 
            href="/auth/login" 
            className="text-sm font-medium text-black/70 hover:text-black transition-colors tracking-wide"
          >
            Log in
          </Link>
          <Link 
            href="/auth/signup" 
            className="text-sm font-semibold text-white bg-black hover:bg-black/90 px-4 py-2 rounded-full transition-colors tracking-wide"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero - Split layout, light editorial */}
      <main className="flex-1 flex flex-col md:flex-row min-h-screen pt-16">
        {/* Left - Content */}
        <div className="flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24 py-16 md:py-0">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black tracking-tight leading-[1.15] mb-6 max-w-xl">
            The feed for people who lift.
          </h1>
          <p className="text-lg text-black/70 font-normal mb-10 max-w-md">
            Log your workouts, share your PRs, and connect with lifters who get it.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center w-fit px-8 py-3.5 bg-black hover:bg-black/90 text-white font-semibold text-base rounded-full transition-colors tracking-wide"
          >
            Get Started
          </Link>
        </div>

        {/* Right - Bold graphic block */}
        <div className="flex-1 min-h-[40vh] md:min-h-full flex items-center justify-center p-8 md:p-16">
          <div className="w-full max-w-md aspect-square rounded-3xl bg-black flex items-center justify-center">
            <span 
              className="text-[#f5f3ef] text-6xl md:text-8xl font-bold tracking-tighter"
              style={{ fontFamily: 'var(--font-black-ops-one)' }}
            >
              J
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
