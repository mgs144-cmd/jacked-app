import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import { PWAInstallBanner } from '@/components/PWAInstallBanner'
import { ADOBE_FONTS_KIT } from '@/lib/fonts'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'JACKED - Fitness Social Network',
  description: 'Share your workouts, connect with other lifters, and track your progress',
  keywords: ['fitness', 'gym', 'workout', 'social', 'lifting', 'powerlifting', 'bodybuilding'],
  authors: [{ name: 'JACKED' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
    { media: '(prefers-color-scheme: light)', color: '#000000' },
  ],
  icons: {
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'JACKED',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preload" href="/fonts/GoodTimes-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/FFDINPaneuropean-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://p.typekit.net" crossOrigin="anonymous" />
        {ADOBE_FONTS_KIT ? (
          <link rel="stylesheet" href={`https://use.typekit.net/${ADOBE_FONTS_KIT}.css`} crossOrigin="anonymous" />
        ) : null}
      </head>
      <body className={`${inter.variable} app-ui font-sans antialiased`}>
        <PWAInstallPrompt />
        <PWAInstallBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
