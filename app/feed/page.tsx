import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { FeedClient } from '@/components/FeedClient'
import { filterUnseenRecentPosts, getFeedCutoffISO, FEED_RECENT_DAYS } from '@/lib/feedSeen'

const POST_SELECT = `
  *,
  profiles:user_id(username, avatar_url, full_name, is_premium, is_account_private),
  likes(id),
  comments(id, content, created_at, user_id, profiles:user_id(username, avatar_url)),
  workout_exercises(*)
`

/** Normalize visibility (handles null / legacy rows). */
function isArchivedPost(p: any) {
  return p.is_archived === true
}

function isLogOnlyPost(p: any) {
  return p.is_log_only === true
}

function truthyPrivate(p: any) {
  const v = p.is_private
  return v === true || v === 'true' || v === 1
}

function isPublicPost(p: any) {
  return !truthyPrivate(p)
}

function isFollowersOnlyPost(p: any) {
  return truthyPrivate(p)
}

/** Supabase row from feed select (explicit to avoid `never` inference on chained filters). */
type FeedPostRow = Record<string, unknown> & { user_id?: string }

function normalizeFeedPost(post: any) {
  let profile = post.profiles
  if (Array.isArray(profile)) {
    profile = profile[0] || null
  }

  const allComments = post.comments || []
  const topComments = allComments
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)
    .map((comment: any) => {
      let commentProfile = comment.profiles
      if (Array.isArray(commentProfile)) {
        commentProfile = commentProfile[0] || null
      }
      return {
        ...comment,
        profile: commentProfile || { username: 'unknown', avatar_url: null },
      }
    })

  return {
    ...post,
    profile,
    like_count: Array.isArray(post.likes) ? post.likes.length : 0,
    comment_count: allComments.length,
    top_comments: topComments,
  }
}

export default async function FeedPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', session.user.id)

  const followingIds = following?.map((f: any) => f.following_id) || []
  const friendUserIds = Array.from(new Set([session.user.id, ...followingIds]))
  const feedSince = getFeedCutoffISO()

  const seenPostIds = new Set<string>()
  try {
    const sb = supabase as any
    const { data: seenRows } = await sb
      .from('feed_post_views')
      .select('post_id')
      .eq('user_id', session.user.id)
    for (const row of seenRows || []) {
      if (row?.post_id) seenPostIds.add(row.post_id as string)
    }
  } catch {
    // Table missing until ADD_FEED_SEEN.sql is run — feed still filters by recency only.
  }

  // Community: everyone can see — public posts only (not followers-only, not log-only)
  const { data: communityRaw } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .gte('created_at', feedSince)
    .or('is_private.is.null,is_private.eq.false')
    .or('is_log_only.is.null,is_log_only.eq.false')
    .or('is_archived.is.null,is_archived.eq.false')
    .order('created_at', { ascending: false })
    .limit(80)

  // Friends: people you follow (and you) — followers-only posts; public posts stay in Community only
  const { data: friendsRaw } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .gte('created_at', feedSince)
    .in('user_id', friendUserIds)
    .eq('is_private', true)
    .or('is_log_only.is.null,is_log_only.eq.false')
    .or('is_archived.is.null,is_archived.eq.false')
    .order('created_at', { ascending: false })
    .limit(80)

  const friendSet = new Set(friendUserIds)

  const communityRows = (communityRaw ?? []) as FeedPostRow[]
  const friendsRows = (friendsRaw ?? []) as FeedPostRow[]

  // Re-filter in Node so tabs stay correct even if chained `.or()` filters behave unexpectedly in PostgREST.
  const communityPosts = filterUnseenRecentPosts(
    communityRows
      .filter((p) => !isArchivedPost(p) && !isLogOnlyPost(p) && isPublicPost(p))
      .map(normalizeFeedPost),
    seenPostIds
  )

  const friendsPosts = filterUnseenRecentPosts(
    friendsRows
      .filter(
        (p) =>
          !isArchivedPost(p) &&
          !isLogOnlyPost(p) &&
          isFollowersOnlyPost(p) &&
          typeof p.user_id === 'string' &&
          friendSet.has(p.user_id)
      )
      .map(normalizeFeedPost),
    seenPostIds
  )

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pt-14 bg-black">
      <Navbar />
      <FeedClient
        currentUserId={session.user.id}
        communityPosts={communityPosts}
        friendsPosts={friendsPosts}
        feedRecentDays={FEED_RECENT_DAYS}
      />
    </div>
  )
}
