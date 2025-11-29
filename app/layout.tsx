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

