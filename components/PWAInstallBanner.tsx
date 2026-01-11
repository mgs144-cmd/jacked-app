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
      <div className="bg-gradient-to-r from-primary via-red-600 to-primary p-4 rounded-2xl shadow-2xl border-2 border-red-400/30 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/80 hover:text-white z-10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start space-x-3 relative z-10">
          <div className="w-12 h-12 bg-black/30 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
            <span className="text-2xl font-black text-white">J</span>
          </div>

          <div className="flex-1">
            <h3 className="text-white font-black text-lg mb-1 flex items-center space-x-2">
              <span>Install JACKED</span>
              <Smartphone className="w-5 h-5" />
            </h3>
            <p className="text-white/90 text-sm mb-3 leading-relaxed">
              Get the full app experience - faster loading, offline access, and it feels like a native app!
            </p>
            <button
              onClick={handleInstall}
              className="w-full bg-white text-primary font-black py-2.5 px-4 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Install Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
