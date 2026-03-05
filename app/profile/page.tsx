import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { PostCard } from '@/components/PostCard'
import { Crown, Settings, TrendingUp } from 'lucide-react'
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

  // Get all posts including archived
  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles:user_id(username, avatar_url, full_name), likes(id), comments(id), workout_exercises(*)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
  
  // Filter out archived posts
  const visiblePosts = posts?.filter((p: any) => !p.is_archived) || []

  // Get badges
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('*, badges(*)')
    .eq('user_id', session.user.id)

  const badges = userBadges?.map((ub: any) => ({
    id: ub.badges.id,
    name: ub.badges.name,
    description: ub.badges.description,
    icon_url: ub.badges.icon_url,
    earned_at: ub.earned_at,
  })) || []

  const postsWithCounts = visiblePosts.map((post: any) => ({
    ...post,
    like_count: Array.isArray(post.likes) ? post.likes.length : 0,
    comment_count: Array.isArray(post.comments) ? post.comments.length : 0,
  }))

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-14 bg-black">
      <Navbar />
      
      <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        {(profile as any)?.banner_url ? (
          <div className="relative w-full h-36 md:h-44 bg-black">
            <Image
              src={(profile as any).banner_url}
              alt="Profile banner"
              fill
              className="object-cover object-center"
              priority
            />
          </div>
        ) : (
          <div className="w-full h-36 md:h-44 bg-black"></div>
        )}
      </div>

      {/* Profile Content Container - Centered, higher up */}
      <div className="max-w-4xl mx-auto relative z-10 px-4 md:px-6 -mt-16 md:-mt-20">
        {/* Avatar - Centered, Overlapping Banner, larger */}
        <div className="flex flex-col items-center mb-4">
          <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full bg-white/5 overflow-hidden shadow-xl border-4 border-black ring-2 ring-white/10 mb-4">
            {(profile as any)?.avatar_url ? (
              <Image
                src={(profile as any).avatar_url}
                alt={(profile as any).username || 'Profile'}
                width={176}
                height={176}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/10 text-white text-4xl md:text-5xl font-semibold">
                {(profile as any)?.username?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          
          {/* User Info - Centered, larger */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white">
                {(profile as any)?.username || (profile as any)?.full_name || 'User'}
              </h1>
            </div>
            {(profile as any)?.full_name && (profile as any).full_name !== (profile as any).username && (
              <p className="text-white/60 text-base md:text-lg mb-3">{(profile as any).full_name}</p>
            )}
          </div>
        </div>

        {/* Edit Button - Top Right */}
        <Link
          href="/settings"
          className="absolute top-0 right-4 md:right-8 px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 flex items-center space-x-2"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden md:inline">Edit</span>
        </Link>

        {/* Profile Info Section - Centered, larger */}
        <div className="space-y-3 mb-4 flex flex-col items-center">
          {/* Bio */}
          {(profile as any)?.bio && (
            <p className="text-white/80 text-base leading-relaxed max-w-2xl">{(profile as any).bio}</p>
          )}
          
          {/* Stats - larger */}
          <div className="flex items-center justify-center gap-8 md:gap-10 text-base md:text-lg">
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-white text-lg md:text-xl">{postsWithCounts?.length || 0}</span>
              <span className="text-white/50">posts</span>
            </div>
            {!(profile as any)?.hide_follower_count && (
              <>
                <Link href={`/user/${session.user.id}/followers`} className="flex items-center space-x-1.5 hover:text-primary transition-colors">
                  <span className="font-black text-white text-lg md:text-xl">{followerCount || 0}</span>
                  <span className="text-white/50">followers</span>
                </Link>
                <Link href={`/user/${session.user.id}/following`} className="flex items-center space-x-1.5 hover:text-primary transition-colors">
                  <span className="font-black text-white text-lg md:text-xl">{followingCount || 0}</span>
                  <span className="text-white/50">following</span>
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
              <div className="text-xs text-white/60 flex items-center space-x-2">
                <span>🎵</span>
                <span className="font-medium">{(profile as any).profile_song_title}</span>
                <span className="text-white/50">•</span>
                <span>{(profile as any).profile_song_artist}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Section - Same centered column as Feed (max-w-[640px]) */}
      <div className="w-full max-w-[640px] mx-auto px-4 md:px-6 pb-8">
        {/* Top Lifts Display */}
        <div className="mb-6">
          <TopLiftsDisplay 
            topLift1={(profile as any)?.top_lift_1}
            topLift2={(profile as any)?.top_lift_2}
            topLift3={(profile as any)?.top_lift_3}
          />
        </div>

        {/* Badges Section */}
        {badges.length > 0 && (
          <div className="mb-6">
            <BadgeDisplay badges={badges} />
          </div>
        )}

        {/* Posts Section */}
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-white" />
            <span>Posts</span>
          </h2>

          {postsWithCounts && postsWithCounts.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
              <p className="text-white/70 font-medium mb-3">No posts yet</p>
              <Link href="/create" className="inline-block px-6 py-2.5 bg-white hover:bg-white/90 text-black font-semibold rounded-full text-sm">
                Create first post
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
  )
}
