import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { PostCard } from '@/components/PostCard'
import { Crown, Settings, TrendingUp, Calendar } from 'lucide-react'
import { ProfileMusicPlayer } from '@/components/ProfileMusicPlayer'
import { PRDisplay } from '@/components/PRDisplay'
import { BadgeDisplay } from '@/components/BadgeDisplay'
import { FitnessGoalIndicator } from '@/components/FitnessGoalIndicator'

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

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(username, avatar_url, full_name, is_premium),
      likes(count),
      comments(count),
      workout_exercises(*)
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

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

  const postsWithCounts = posts?.map((post: any) => ({
    ...post,
    like_count: post.likes?.length || 0,
    comment_count: post.comments?.length || 0,
  }))


  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-24">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
        {/* Profile Header */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-6 md:p-8 mb-6 card-elevated">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden ring-4 ring-gray-800">
                {(profile as any)?.avatar_url ? (
                  <Image
                    src={(profile as any).avatar_url}
                    alt={(profile as any).username || 'Profile'}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-white text-5xl font-black">
                    {(profile as any)?.username?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              {(profile as any)?.is_premium && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center ring-4 ring-gray-900 glow-red-sm">
                  <Crown className="w-6 h-6 text-white fill-current" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-black text-white">
                      {(profile as any)?.username || (profile as any)?.full_name || 'User'}
                    </h1>
                    {(profile as any)?.is_premium && (
                      <span className="badge-premium text-xs">JACKED+</span>
                    )}
                  </div>
                  {(profile as any)?.full_name && (profile as any).full_name !== (profile as any).username && (
                    <p className="text-gray-400 font-medium mb-2">{(profile as any).full_name}</p>
                  )}
                  {(profile as any)?.bio && (
                    <p className="text-gray-300 leading-relaxed mb-3 max-w-2xl">{(profile as any).bio}</p>
                  )}
                  <p className="text-sm text-gray-500 font-medium mb-4">{session.user.email}</p>
                  
                  {/* Profile Song */}
                  {(profile as any)?.profile_song_title && (profile as any)?.profile_song_artist && (
                    <div className="mb-4">
                      <ProfileMusicPlayer
                        songTitle={(profile as any).profile_song_title}
                        songArtist={(profile as any).profile_song_artist}
                        songUrl={(profile as any).profile_song_url || undefined}
                        spotifyId={(profile as any).profile_song_spotify_id || undefined}
                      />
                    </div>
                  )}
                  
                  {/* Fitness Goal Indicator */}
                  {(profile as any)?.fitness_goal && (
                    <div className="mb-4">
                      <FitnessGoalIndicator goal={(profile as any).fitness_goal} size="md" />
                    </div>
                  )}
                </div>
                <Link
                  href="/settings"
                  className="btn-secondary px-4 py-2 flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden md:inline">Edit Profile</span>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-8">
                <div>
                  <p className="text-2xl font-black text-white">{postsWithCounts?.length || 0}</p>
                  <p className="text-xs text-gray-500 font-semibold tracking-wide">POSTS</p>
                </div>
                {!(profile as any)?.hide_follower_count && (
                  <>
                    <div className="h-10 w-px bg-gray-800"></div>
                    <div>
                      <p className="text-2xl font-black text-white">{followerCount || 0}</p>
                      <p className="text-xs text-gray-500 font-semibold tracking-wide">FOLLOWERS</p>
                    </div>
                    <div className="h-10 w-px bg-gray-800"></div>
                    <div>
                      <p className="text-2xl font-black text-white">{followingCount || 0}</p>
                      <p className="text-xs text-gray-500 font-semibold tracking-wide">FOLLOWING</p>
                    </div>
                  </>
                )}
                <div className="h-10 w-px bg-gray-800"></div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-500 font-medium">
                    Joined {new Date(session.user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PRs Section */}
        {prs && prs.length > 0 && (
          <div className="mb-10">
            <PRDisplay prs={prs} userId={session.user.id} isOwnProfile={true} />
          </div>
        )}

        {/* Badges Section */}
        {badges.length > 0 && (
          <div className="mb-10">
            <BadgeDisplay badges={badges} />
          </div>
        )}

        {/* Posts Section */}
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-black text-white tracking-tight">Your Posts</h2>
          </div>

          {postsWithCounts && postsWithCounts.length === 0 ? (
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-12 text-center card-elevated">
              <p className="text-gray-400 text-lg font-semibold mb-4">You haven&apos;t posted anything yet</p>
              <Link href="/create" className="btn-primary inline-block px-8 py-3">
                <span className="font-bold">CREATE YOUR FIRST POST</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {postsWithCounts?.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
