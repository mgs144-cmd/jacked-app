import type { Metadata } from 'next'
import { Inter, Black_Ops_One } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })
const blackOpsOne = Black_Ops_One({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-black-ops-one',
})

export const metadata: Metadata = {
  title: 'Jacked - Social Fitness for Lifters',
  description: 'Log workouts, share progress, and connect with the lifting community',
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
    title: 'Jacked',
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
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

