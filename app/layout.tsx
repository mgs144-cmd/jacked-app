import type { Metadata } from 'next'
import { Inter, Black_Ops_One } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import { PWAInstallBanner } from '@/components/PWAInstallBanner'

const inter = Inter({ subsets: ['latin'] })
const blackOpsOne = Black_Ops_One({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-black-ops-one',
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
    { media: '(prefers-color-scheme: dark)', color: '#950606' },
    { media: '(prefers-color-scheme: light)', color: '#950606' },
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
    <html lang="en">
      <body className={`${inter.className} ${blackOpsOne.variable}`}>
        <PWAInstallPrompt />
        <PWAInstallBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

