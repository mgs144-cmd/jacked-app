'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface UserSearchProps {
  currentUserId: string
  onResults: (users: any[]) => void
}

export function UserSearch({ currentUserId, onResults }: UserSearchProps) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        onResults([])
        return
      }

      setSearching(true)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', currentUserId)
          .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
          .limit(20)

        if (error) throw error
        onResults(data || [])
      } catch (error) {
        console.error('Search error:', error)
        onResults([])
      } finally {
        setSearching(false)
      }
    }

    const debounceTimer = setTimeout(() => {
      searchUsers()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query, currentUserId, onResults, supabase])

  return (
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
  )
}

