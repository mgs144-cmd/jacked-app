'use client'

import { useEffect, useState } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

export function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const hasSeenPrompt = localStorage.getItem('pwa-install-dismissed')
    
    if (isStandalone || hasSeenPrompt) return

    // Listen for the beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Show banner after user has engaged (viewed 3+ pages)
      const pageViews = parseInt(localStorage.getItem('page-views') || '0')
      const newViews = pageViews + 1
      localStorage.setItem('page-views', newViews.toString())
      
      if (newViews >= 3) {
        setTimeout(() => setShowBanner(true), 2000) // Show after 2 seconds
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // For iOS, show after 3 page views
    if (isIOS && !hasSeenPrompt) {
      const pageViews = parseInt(localStorage.getItem('page-views') || '0')
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

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // iOS or already installed - show instructions
      setShowBanner(false)
      alert('To install:\n\n1. Tap the Share button\n2. Scroll down\n3. Tap "Add to Home Screen"')
      localStorage.setItem('pwa-install-dismissed', 'true')
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User installed JACKED PWA')
    }

    setDeferredPrompt(null)
    setShowBanner(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-20 md:bottom-8 left-4 right-4 z-50 animate-slide-up">
      <div className="card p-4 shadow-xl border-red-600/20">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-secondary hover:text-primary transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-surface-hover rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-semibold text-primary">J</span>
          </div>

          <div className="flex-1 pr-6">
            <h3 className="text-primary font-semibold text-base mb-1 flex items-center space-x-2">
              <span>Install JACKED</span>
            </h3>
            <p className="text-secondary text-sm mb-3 leading-relaxed">
              Get faster loading, offline access, and a native app experience.
            </p>
            <button
              onClick={handleInstall}
              className="btn btn-primary btn-sm w-full"
            >
              <Download className="w-4 h-4 mr-1.5" />
              <span>Install App</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
