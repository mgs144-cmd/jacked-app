'use client'

import { useState, useEffect } from 'react'
import { Search, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { UserCard } from '@/components/UserCard'

interface DiscoverClientProps {
  currentUserId: string
  initialUsers: any[]
  suggestedUsers: any[]
  followingIds: string[]
  requestStatusMap: Record<string, string>
  /** How many profiles to show before "View more" (default 3). */
  previewCount?: number
  embedded?: boolean
  /** Compact grid — show all suggestions at once (community page). */
  compact?: boolean
}

function UserListSection({
  title,
  icon: Icon,
  users,
  previewCount,
  currentUserId,
  followingIds,
  requestStatusMap,
  emptyMessage,
  compact = false,
}: {
  title: string
  icon: typeof Search
  users: any[]
  previewCount: number
  currentUserId: string
  followingIds: string[]
  requestStatusMap: Record<string, string>
  emptyMessage?: string
  compact?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const hasMore = !compact && users.length > previewCount
  const visible = compact || expanded ? users : users.slice(0, previewCount)

  if (!users.length) {
    if (!emptyMessage) return null
    return (
      <div className="rounded-[12px] border border-white/10 p-8 text-center bg-white/[0.02]">
        <p className="text-white/60 text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div>
      <div className={`flex items-center gap-2 ${compact ? 'mb-2' : 'mb-4'}`}>
        <Icon className={compact ? 'w-4 h-4 text-white' : 'w-5 h-5 text-white'} />
        <h2 className={compact ? 'ui-section-title text-sm' : 'ui-section-title'}>
          {title}{' '}
          <span className="ui-meta font-normal normal-case">({users.length})</span>
        </h2>
      </div>
      <div className={compact ? 'grid grid-cols-2 sm:grid-cols-3 gap-2' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
        {visible.map((user: any) => (
          <UserCard
            key={user.id}
            user={user}
            currentUserId={currentUserId}
            isFollowing={followingIds.includes(user.id)}
            isPrivateAccount={user.is_account_private || false}
            requestStatus={(requestStatusMap[user.id] as 'none' | 'pending' | 'accepted' | 'rejected' | undefined) || 'none'}
            compact={compact}
          />
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 btn btn-secondary btn-block gap-1.5"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              View {users.length - previewCount} more
            </>
          )}
        </button>
      )}
    </div>
  )
}

export function DiscoverClient({
  currentUserId,
  initialUsers,
  suggestedUsers,
  followingIds,
  requestStatusMap,
  previewCount = 3,
  embedded = false,
  compact = false,
}: DiscoverClientProps) {
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

        const usersWithCounts = await Promise.all(
          (data || []).map(async (user: any) => {
            const [followerResult, followingResult] = await Promise.all([
              supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
              supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
            ])

            return {
              ...user,
              followers_count: followerResult.count || 0,
              following_count: followingResult.count || 0,
            }
          })
        )

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
  const discoverList = !isSearching && suggestedUsers.length === 0 ? initialUsers : suggestedUsers

  return (
    <>
      <div className={embedded ? 'mb-5' : 'mb-8'}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lifters by name or username…"
            className="input-field w-full text-sm placeholder:text-white/40 pr-10"
            style={{ paddingLeft: '3.25rem' }}
          />
          {searching && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {isSearching ? (
        <UserListSection
          key={query}
          title="Search results"
          icon={Search}
          users={users}
          previewCount={previewCount}
          currentUserId={currentUserId}
          followingIds={followingIds}
          requestStatusMap={requestStatusMap}
          emptyMessage={`No users found for "${query}"`}
        />
      ) : (
        <UserListSection
          title="Suggested for you"
          icon={TrendingUp}
          users={discoverList}
          previewCount={previewCount}
          currentUserId={currentUserId}
          followingIds={followingIds}
          requestStatusMap={requestStatusMap}
          emptyMessage="No suggestions right now — try searching above."
          compact={compact}
        />
      )}
    </>
  )
}
