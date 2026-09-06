/** Posts newer than this many days can appear in the main feed. */
export const FEED_RECENT_DAYS = 7

export function getFeedCutoffDate(): Date {
  const d = new Date()
  d.setDate(d.getDate() - FEED_RECENT_DAYS)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getFeedCutoffISO(): string {
  return getFeedCutoffDate().toISOString()
}

export function isPostWithinFeedWindow(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false
  return new Date(createdAt).getTime() >= getFeedCutoffDate().getTime()
}

export function filterUnseenRecentPosts<T extends { id: string; created_at?: string }>(
  posts: T[],
  seenPostIds: Set<string>
): T[] {
  return posts.filter((p) => isPostWithinFeedWindow(p.created_at) && !seenPostIds.has(p.id))
}
