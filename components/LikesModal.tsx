'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Crown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface LikesModalProps {
  postId: string
  isOpen: boolean
  onClose: () => void
}

export function LikesModal({ postId, isOpen, onClose }: LikesModalProps) {
  const [likes, setLikes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadLikes = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          *,
          profiles:user_id(username, avatar_url, full_name, is_premium)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const normalizedLikes = (data || []).map((like: any) => {
        let profile = like.profiles
        if (Array.isArray(profile)) {
          profile = profile[0] || null
        }
        return {
          ...like,
          profile: profile || { username: 'unknown', avatar_url: null, is_premium: false }
        }
      })

      setLikes(normalizedLikes)
    } catch (error) {
      console.error('Error loading likes:', error)
    } finally {
      setLoading(false)
    }
  }, [postId, supabase])

  useEffect(() => {
    if (isOpen && postId) {
      loadLikes()
    }
  }, [isOpen, postId, loadLikes])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-[12px] border border-white/5 w-full max-w-md max-h-[80vh] flex flex-col" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-white font-bold text-lg">Likes</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-[#ff5555] border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : likes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#a1a1a1]">No likes yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {likes.map((like) => (
                <Link
                  key={like.id}
                  href={`/user/${like.user_id}`}
                  onClick={onClose}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-white/5 overflow-hidden ring-1 ring-white/10">
                      {like.profile.avatar_url ? (
                        <Image
                          src={like.profile.avatar_url}
                          alt={like.profile.username}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/10 text-[#ff5555] font-semibold text-lg">
                          {like.profile.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white truncate">
                        {like.profile.username || like.profile.full_name || 'Unknown'}
                      </span>
                    </div>
                    {like.profile.full_name && like.profile.full_name !== like.profile.username && (
                      <p className="text-sm text-gray-400 truncate">{like.profile.full_name}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

