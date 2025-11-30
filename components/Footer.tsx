'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-800/50 bg-gray-900/40 backdrop-blur-sm py-6 mt-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between space-y-4 md:space-y-0">
          <div className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Jacked. All rights reserved.
          </div>
          <div className="flex items-center space-x-6">
            <Link 
              href="/terms" 
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Terms & Conditions
            </Link>
            <Link 
              href="/privacy" 
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/refund" 
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

