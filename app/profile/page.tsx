import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { PostCard } from '@/components/PostCard'
import { Crown, Settings, TrendingUp, Trophy } from 'lucide-react'
import { ProfileMusicPlayer } from '@/components/ProfileMusicPlayer'
import { PRDisplay } from '@/components/PRDisplay'
import { BadgeDisplay } from '@/components/BadgeDisplay'
import { FitnessGoalIndicator } from '@/components/FitnessGoalIndicator'
import { TopLiftsDisplay } from '@/components/TopLiftsDisplay'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  // Get follower/following counts
  const { count: followerCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', session.user.id)

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', session.user.id)

  // Get all posts including archived (user can see their own archived posts)
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(username, avatar_url, full_name, is_premium),
      likes(id),
      comments(id),
      workout_exercises(*)
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
  
  // Filter out archived posts from display (but keep them in data for archive page later)
  const visiblePosts = posts?.filter((p: any) => !p.is_archived) || []

  // Get PRs
  const { data: prs } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', session.user.id)
    .order('date', { ascending: false })

  // Get badges
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select(`
      *,
      badges(*)
    `)
    .eq('user_id', session.user.id)

  const badges = userBadges?.map((ub: any) => ({
    id: ub.badges.id,
    name: ub.badges.name,
    description: ub.badges.description,
    icon_url: ub.badges.icon_url,
    earned_at: ub.earned_at,
  })) || []

  // Get Deadcember total (only if they have entries)
  const { data: deadcemberTotal } = await (supabase.rpc as any)('get_user_deadcember_total', {
    p_user_id: session.user.id,
  })
  const hasDeadcemberEntries = deadcemberTotal && deadcemberTotal > 0

  const postsWithCounts = visiblePosts.map((post: any) => ({
    ...post,
    like_count: Array.isArray(post.likes) ? post.likes.length : 0,
    comment_count: Array.isArray(post.comments) ? post.comments.length : 0,
  }))


  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-24">
      <Navbar />
      
      <div className="max-w-4xl mx-auto">
        {/* Banner Section - Sleek Style */}
        <div className="relative w-full">
          {/* Banner Image */}
          {(profile as any)?.banner_url ? (
            <div className="relative w-full h-40 md:h-52 bg-gradient-to-br from-gray-800 to-gray-900">
              <Image
                src={(profile as any).banner_url}
                alt="Profile banner"
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="w-full h-40 md:h-52 bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"></div>
          )}
          
          {/* Profile Header Container */}
          <div className="relative px-4 md:px-6">
            {/* Avatar - Overlapping Banner */}
            <div className="flex items-end space-x-4 -mt-12 mb-4">
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden shadow-xl">
                  {(profile as any)?.avatar_url ? (
                    <Image
                      src={(profile as any).avatar_url}
                      alt={(profile as any).username || 'Profile'}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-white text-4xl md:text-5xl font-black">
                      {(profile as any)?.username?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                {(profile as any)?.is_premium && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-primary rounded-full flex items-center justify-center shadow-lg">
                    <Crown className="w-3.5 h-3.5 text-white fill-current" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h1 className="text-2xl md:text-3xl font-black text-white">
                        {(profile as any)?.username || (profile as any)?.full_name || 'User'}
                      </h1>
                      {(profile as any)?.is_premium && (
                        <span className="badge-premium text-xs">JACKED+</span>
                      )}
                    </div>
                    {(profile as any)?.full_name && (profile as any).full_name !== (profile as any).username && (
                      <p className="text-gray-400 text-sm">{(profile as any).full_name}</p>
                    )}
                  </div>
                  <Link
                    href="/settings"
                    className="btn-secondary px-3 py-2 text-sm flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden md:inline">Edit</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Profile Info Section */}
            <div className="space-y-3 mb-4">
              {/* Bio */}
              {(profile as any)?.bio && (
                <p className="text-gray-300 text-sm leading-relaxed max-w-2xl">{(profile as any).bio}</p>
              )}
              
              {/* Stats */}
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-1">
                  <span className="font-black text-white">{postsWithCounts?.length || 0}</span>
                  <span className="text-gray-500">posts</span>
                </div>
                {!(profile as any)?.hide_follower_count && (
                  <>
                    <Link href={`/user/${session.user.id}/followers`} className="flex items-center space-x-1 hover:text-primary transition-colors">
                      <span className="font-black text-white">{followerCount || 0}</span>
                      <span className="text-gray-500">followers</span>
                    </Link>
                    <Link href={`/user/${session.user.id}/following`} className="flex items-center space-x-1 hover:text-primary transition-colors">
                      <span className="font-black text-white">{followingCount || 0}</span>
                      <span className="text-gray-500">following</span>
                    </Link>
                  </>
                )}
              </div>
              
              {/* Fitness Goal */}
              {(profile as any)?.fitness_goal && (
                <div className="inline-block">
                  <FitnessGoalIndicator goal={(profile as any).fitness_goal} size="sm" />
                </div>
              )}
              
              {/* Profile Song */}
              {(profile as any)?.profile_song_title && (profile as any)?.profile_song_artist && (
                <div className="pt-2 opacity-70 hover:opacity-100 transition-opacity">
                  <div className="text-xs text-gray-400 flex items-center space-x-2">
                    <span>🎵</span>
                    <span className="font-medium">{(profile as any).profile_song_title}</span>
                    <span className="text-gray-600">•</span>
                    <span>{(profile as any).profile_song_artist}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-4 md:px-6 pb-6">
          {/* Top Lifts Display */}
          <div className="mb-6">
            <TopLiftsDisplay 
              topLift1={(profile as any)?.top_lift_1}
              topLift2={(profile as any)?.top_lift_2}
              topLift3={(profile as any)?.top_lift_3}
            />
          </div>

          {/* Compact Info Cards */}
          {(hasDeadcemberEntries || (prs && prs.length > 0) || badges.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {/* Deadcember Total */}
              {hasDeadcemberEntries && (
                <div className="bg-gradient-to-br from-red-950/30 to-gray-900/60 backdrop-blur-sm rounded-xl border border-primary/30 p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Deadcember</span>
                  </div>
                  <p className="text-2xl font-black text-primary">
                    {deadcemberTotal.toLocaleString()} lbs
                  </p>
                </div>
              )}
              
              {/* PRs Summary */}
              {prs && prs.length > 0 && (
                <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/60 p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">PRs</span>
                  </div>
                  <p className="text-2xl font-black text-white">{prs.length}</p>
                </div>
              )}
              
              {/* Badges Summary */}
              {badges.length > 0 && (
                <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/60 p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Crown className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Badges</span>
                  </div>
                  <p className="text-2xl font-black text-white">{badges.length}</p>
                </div>
              )}
            </div>
          )}

          {/* Expandable Sections */}
          {prs && prs.length > 0 && (
            <div className="mb-6">
              <PRDisplay prs={prs} userId={session.user.id} isOwnProfile={true} />
            </div>
          )}

          {badges.length > 0 && (
            <div className="mb-6">
              <BadgeDisplay badges={badges} />
            </div>
          )}

          {/* Posts Section */}
          <div>
            <h2 className="text-xl font-black text-white tracking-tight mb-4 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Posts</span>
            </h2>

          {postsWithCounts && postsWithCounts.length === 0 ? (
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-800/40 p-8 text-center">
              <p className="text-gray-400 font-medium mb-3">No posts yet</p>
              <Link href="/create" className="btn-primary inline-block px-6 py-2 text-sm">
                <span className="font-bold">Create First Post</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {postsWithCounts?.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
