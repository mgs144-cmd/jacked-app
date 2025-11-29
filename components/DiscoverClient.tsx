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
        setUsers(data || [])
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
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by username or name..."
            className="input-field w-full pl-12"
          />
          {searching && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      {isSearching && (
        <div className="mb-10">
          <div className="flex items-center space-x-3 mb-6">
            <Search className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-black text-white tracking-tight">
              Search Results {users.length > 0 && `(${users.length})`}
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
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-12 text-center">
              <p className="text-gray-400 text-lg font-semibold">No users found for &quot;{query}&quot;</p>
            </div>
          )}
        </div>
      )}

      {/* Suggested Users - Only show when not searching */}
      {!isSearching && suggestedUsers.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center space-x-3 mb-6">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-black text-white tracking-tight">Suggested For You</h2>
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

