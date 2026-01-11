'use client'

import { useEffect } from 'react'

export function PWAInstallPrompt() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration.scope)
          })
          .catch((error) => {
            console.log('Service Worker registration failed:', error)
          })
      })
    }

    // Listen for install prompt
    let deferredPrompt: any
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e
      console.log('PWA install prompt available')
      
      // You can show a custom install button here if you want
      // For now, the browser's default prompt will show
    })

    // Log when app is installed
    window.addEventListener('appinstalled', () => {
      console.log('JACKED PWA installed successfully!')
      deferredPrompt = null
    })
  }, [])

  return null // This component doesn't render anything
}


