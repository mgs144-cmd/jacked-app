'use client'

import { useState, useRef, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PullToRefreshProps {
  children: React.ReactNode
}

export function PullToRefresh({ children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at top of page
      if (window.scrollY === 0) {
        touchStartY.current = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && touchStartY.current > 0) {
        const currentY = e.touches[0].clientY
        const distance = currentY - touchStartY.current
        
        if (distance > 0 && distance < 150) {
          setPullDistance(distance)
          // Prevent default scrolling when pulling
          if (distance > 10) {
            e.preventDefault()
          }
        }
      }
    }

    const handleTouchEnd = async () => {
      if (pullDistance > 80) {
        setIsRefreshing(true)
        
        // Trigger refresh
        router.refresh()
        
        // Keep spinner visible for at least 1 second
        setTimeout(() => {
          setIsRefreshing(false)
          setPullDistance(0)
        }, 1000)
      } else {
        setPullDistance(0)
      }
      touchStartY.current = 0
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pullDistance, router])

  const pullProgress = Math.min(pullDistance / 80, 1)
  const rotation = pullProgress * 360

  return (
    <div ref={containerRef} className="relative">
      {/* Pull-to-refresh indicator */}
      <div
        className="fixed top-0 left-0 right-0 flex justify-center z-50 pointer-events-none"
        style={{
          transform: `translateY(${Math.max(pullDistance - 60, -60)}px)`,
          opacity: pullProgress,
          transition: isRefreshing ? 'all 0.3s ease' : 'opacity 0.1s ease',
        }}
      >
        <div className="bg-gray-900 rounded-full p-3 mt-4 shadow-2xl border-2 border-gray-800">
          <RefreshCw
            className={`w-6 h-6 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: isRefreshing ? 'none' : `rotate(${rotation}deg)`,
              transition: 'transform 0.1s ease',
            }}
          />
        </div>
      </div>

      {children}
    </div>
  )
}
