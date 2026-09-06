'use client'

import { useEffect, useState } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

const DISMISS_KEY = 'pwa-install-dismissed'
const SESSION_DISMISS_KEY = 'pwa-banner-session-dismiss'

export function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(ios)

    const hasSeenPrompt = localStorage.getItem(DISMISS_KEY)
    const sessionDismissed = sessionStorage.getItem(SESSION_DISMISS_KEY)

    if (isStandalone || hasSeenPrompt || sessionDismissed) return

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)

      const pageViews = parseInt(localStorage.getItem('page-views') || '0', 10)
      const newViews = pageViews + 1
      localStorage.setItem('page-views', newViews.toString())

      if (newViews >= 3) {
        setTimeout(() => setShowBanner(true), 2000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    if (ios) {
      const pageViews = parseInt(localStorage.getItem('page-views') || '0', 10)
      const newViews = pageViews + 1
      localStorage.setItem('page-views', newViews.toString())

      if (newViews >= 3) {
        setTimeout(() => setShowBanner(true), 2000)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const applyDismissPreference = () => {
    if (dontShowAgain) {
      localStorage.setItem(DISMISS_KEY, 'true')
    } else {
      sessionStorage.setItem(SESSION_DISMISS_KEY, '1')
    }
    setShowBanner(false)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setShowBanner(false)
      alert(
        'Add Jacked to your home screen:\n\n' +
          '1. Tap the Share button\n' +
          '2. Scroll down in the menu\n' +
          '3. Tap "Add to Home Screen"\n\n' +
          'Then confirm in the dialog.'
      )
      if (dontShowAgain) {
        localStorage.setItem(DISMISS_KEY, 'true')
      } else {
        sessionStorage.setItem(SESSION_DISMISS_KEY, '1')
      }
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User installed JACKED PWA')
    }

    setDeferredPrompt(null)
    setShowBanner(false)
    if (dontShowAgain) {
      localStorage.setItem(DISMISS_KEY, 'true')
    } else {
      sessionStorage.setItem(SESSION_DISMISS_KEY, '1')
    }
  }

  const handleDismiss = () => {
    applyDismissPreference()
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-20 md:bottom-8 left-4 right-4 z-50 animate-slide-up">
      <div className="card relative p-4 shadow-xl border-red-600/20">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-secondary hover:text-primary transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-surface-hover rounded-lg flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-primary" aria-hidden />
          </div>

          <div className="flex-1 pr-6 space-y-3">
            <div>
              <h3 className="text-primary font-semibold text-base mb-1">Install Jacked on your home screen</h3>
              {isIOS ? (
                <p className="text-secondary text-sm leading-relaxed">
                  On iPhone or iPad: tap <span className="text-primary font-medium">Share</span>, scroll down, then tap{' '}
                  <span className="text-primary font-medium">Add to Home Screen</span>. You’ll get the full-screen app
                  experience and quicker access from your home page.
                </p>
              ) : (
                <p className="text-secondary text-sm leading-relaxed">
                  Install the app for faster loading, offline access, and a home screen shortcut like a native app.
                </p>
              )}
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 text-left">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0"
              />
              <span className="text-sm text-secondary leading-snug">Don&apos;t show me again</span>
            </label>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button onClick={handleInstall} className="btn btn-primary btn-sm w-full sm:flex-1">
                <Download className="w-4 h-4 mr-1.5" />
                <span>{isIOS && !deferredPrompt ? 'Show me the steps' : 'Install app'}</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="btn btn-secondary btn-sm w-full sm:flex-1 border-white/10 text-secondary hover:text-primary"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
