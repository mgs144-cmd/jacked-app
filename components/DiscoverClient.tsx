'use client'

import { useState, useEffect } from 'react'
import { Search, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { UserCard } from '@/components/UserCard'

interface DiscoverClientProps {
  currentUserId: string
  initialUsers: any[]
  suggestedUsers: any[]
  followingIds: string[]
  requestStatusMap: Record<string, string>
}

export function DiscoverClient({ currentUserId, initialUsers, suggestedUsers, followingIds, requestStatusMap }: DiscoverClientProps) {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState(initialUsers)
  const [searching, setSearching] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        setUsers(initialUsers)
        return
      }

      setSearching(true)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', currentUserId)
          .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
          .limit(50)

        if (error) throw error
        
        // Calculate follower/following counts for search results
        const usersWithCounts = await Promise.all((data || []).map(async (user: any) => {
          const [followerResult, followingResult] = await Promise.all([
            supabase
              .from('follows')
              .select('*', { count: 'exact', head: true })
              .eq('following_id', user.id),
            supabase
              .from('follows')
              .select('*', { count: 'exact', head: true })
              .eq('follower_id', user.id)
          ])

          return {
            ...user,
            followers_count: followerResult.count || 0,
            following_count: followingResult.count || 0,
          }
        }))
        
        setUsers(usersWithCounts)
      } catch (error) {
        console.error('Search error:', error)
        setUsers([])
      } finally {
        setSearching(false)
      }
    }

    const debounceTimer = setTimeout(() => {
      searchUsers()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query, currentUserId, initialUsers, supabase])

  const isSearching = query.trim().length > 0

  return (
    <>
      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            className="input-field w-full pl-11 pr-10 text-sm placeholder:text-tertiary"
          />
          {searching && (
            <div className="absolute right-3.5 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-[#ff5555] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      {isSearching && (
        <div className="mb-10">
          <div className="flex items-center space-x-2.5 mb-5">
            <Search className="w-5 h-5 text-[#ff5555]" />
            <h2 className="text-lg font-semibold text-white">
              Search Results {users.length > 0 && <span className="text-secondary font-normal">({users.length})</span>}
            </h2>
          </div>
          {users.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map((user: any) => (
                <UserCard 
                  key={user.id} 
                  user={user} 
                  currentUserId={currentUserId}
                  isFollowing={followingIds.includes(user.id)}
                  isPrivateAccount={user.is_account_private || false}
                  requestStatus={(requestStatusMap[user.id] as 'none' | 'pending' | 'accepted' | 'rejected' | undefined) || 'none'}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[12px] border border-white/5 p-12 text-center bg-[#1a1a1a]">
              <p className="text-[#a1a1a1] text-base font-medium">No users found for &quot;{query}&quot;</p>
            </div>
          )}
        </div>
      )}

      {/* Suggested Users - Only show when not searching */}
      {!isSearching && suggestedUsers.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center space-x-2.5 mb-5">
            <TrendingUp className="w-5 h-5 text-[#ff5555]" />
            <h2 className="text-lg font-semibold text-white">Suggested For You</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestedUsers.map((user: any) => (
              <UserCard 
                key={user.id} 
                user={user} 
                currentUserId={currentUserId}
                isFollowing={false}
                isPrivateAccount={user.is_account_private || false}
                requestStatus={(requestStatusMap[user.id] as 'none' | 'pending' | 'accepted' | 'rejected' | undefined) || 'none'}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

