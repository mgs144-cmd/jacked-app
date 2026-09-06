'use client'

import Link from 'next/link'
import { JackedLogo } from '@/components/JackedLogo'

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-black">
      <nav className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-black/95 px-5 backdrop-blur-sm md:px-10 lg:px-12">
        <Link href="/" className="text-white transition-opacity hover:opacity-90">
          <JackedLogo size="compact" />
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

      <main className="flex-1 flex flex-col md:flex-row min-h-screen pt-16">
        <div className="flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24 py-16 md:py-0">
          <h1 className="ui-hero-title mb-6 max-w-xl">
            The feed for people who lift.
          </h1>
          <p className="ui-subtitle text-lg mb-10 max-w-md">
            Log your workouts, share your PRs, and connect with lifters who get it.
          </p>
          <Link href="/auth/signup" className="btn btn-primary btn-lg btn-round">
            Get started
          </Link>
        </div>

        <div className="flex-1 min-h-[40vh] md:min-h-full flex items-center justify-center p-8 md:p-16">
          <JackedLogo size="hero" />
        </div>
      </main>
    </div>
  )
}
