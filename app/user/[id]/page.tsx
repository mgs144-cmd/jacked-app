import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { PostCard } from '@/components/PostCard'
import { FollowButton } from '@/components/FollowButton'
import { Crown, Calendar, ArrowLeft } from 'lucide-react'
import { ProfileMusicPlayer } from '@/components/ProfileMusicPlayer'
import { PRDisplay } from '@/components/PRDisplay'
import { BadgeDisplay } from '@/components/BadgeDisplay'
import { FitnessGoalIndicator } from '@/components/FitnessGoalIndicator'
import { TopLiftsDisplay } from '@/components/TopLiftsDisplay'
import { Trophy } from 'lucide-react'

export default async function UserProfilePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const isOwnProfile = session.user.id === params.id

  // Redirect to /profile if viewing own profile
  if (isOwnProfile) {
    redirect('/profile')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!profile) {
    return (
      <div className="min-h-screen pb-20 md:pb-0 md:pt-24">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-12 text-center card-elevated">
            <p className="text-gray-400 text-lg font-semibold">User not found</p>
          </div>
        </div>
      </div>
    )
  }

  // Check if current user is following this user
  const { data: followData } = await supabase
    .from('follows')
    .select('*')
    .match({
      follower_id: session.user.id,
      following_id: params.id,
    })
    .single()

  const isFollowing = !!followData

  // Check follow request status
  const { data: requestData } = await supabase
    .from('follow_requests')
    .select('status')
    .eq('requester_id', session.user.id)
    .eq('target_id', params.id)
    .maybeSingle()

  const requestStatus = (requestData as any)?.status || 'none'

  // Get follower/following counts
  const { count: followerCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', params.id)

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', params.id)

  // Get user's posts (only public posts or if following, include private)
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(username, avatar_url, full_name, is_premium),
      likes(id),
      comments(id)
    `)
    .eq('user_id', params.id)
    .order('created_at', { ascending: false })

  const postsWithCounts = posts?.map((post: any) => ({
    ...post,
    like_count: Array.isArray(post.likes) ? post.likes.length : 0,
    comment_count: Array.isArray(post.comments) ? post.comments.length : 0,
  }))

  // Filter posts based on privacy
  const visiblePosts = postsWithCounts?.filter((post) => 
    !post.is_private || isFollowing
  )

  const totalLikes = visiblePosts?.reduce((sum, post) => sum + post.like_count, 0) || 0

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-24">
      <Navbar />
      
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <div className="px-4 md:px-8 pt-6 md:pt-8">
          <Link
            href="/discover"
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Discover</span>
          </Link>
        </div>

        {/* Banner Section - YouTube/LinkedIn Style */}
        <div className="relative w-full">
          {/* Banner Image */}
          {(profile as any)?.banner_url ? (
            <div className="relative w-full h-48 md:h-64 bg-gradient-to-br from-gray-800 to-gray-900">
              <Image
                src={(profile as any).banner_url}
                alt="Profile banner"
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="w-full h-48 md:h-64 bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"></div>
          )}
          
          {/* Profile Header Container - Overlapping Banner */}
          <div className="relative px-4 md:px-8">
            {/* Avatar - Overlapping Banner Bottom */}
            <div className="relative -mt-16 md:-mt-20 mb-4">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden shadow-2xl">
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
                    {(profile as any)?.username?.[0]?.toUpperCase() || (profile as any)?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              {(profile as any)?.is_premium && (
                <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center shadow-lg">
                  <Crown className="w-5 h-5 text-white fill-current" />
                </div>
              )}
            </div>

            {/* Profile Info Section */}
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-6 md:p-8 mb-6 card-elevated">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1 w-full">
                  {/* Username and Follow Button */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h1 className="text-3xl md:text-4xl font-black text-white">
                          {(profile as any)?.username || (profile as any)?.full_name || 'User'}
                        </h1>
                        {(profile as any)?.is_premium && (
                          <span className="badge-premium text-xs">JACKED+</span>
                        )}
                      </div>
                      {(profile as any)?.full_name && (profile as any).full_name !== (profile as any).username && (
                        <p className="text-gray-400 font-medium mb-3 text-base">{(profile as any).full_name}</p>
                      )}
                      {(profile as any)?.bio && (
                        <p className="text-gray-300 leading-relaxed mb-4 max-w-2xl text-sm md:text-base">{(profile as any).bio}</p>
                      )}
                    </div>
                    <FollowButton
                      userId={params.id}
                      currentUserId={session.user.id}
                      initialIsFollowing={isFollowing}
                      isPrivateAccount={(profile as any)?.is_account_private || false}
                      initialRequestStatus={requestStatus as any}
                    />
                  </div>
                  
                  {/* Profile Song */}
                  {(profile as any)?.profile_song_title && (profile as any)?.profile_song_artist && (
                    <div className="mb-3 opacity-70 hover:opacity-100 transition-opacity">
                      <div className="text-xs text-gray-400 flex items-center space-x-2">
                        <span>🎵</span>
                        <span className="font-medium">{(profile as any).profile_song_title}</span>
                        <span className="text-gray-600">•</span>
                        <span>{(profile as any).profile_song_artist}</span>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center space-x-8 pt-4 border-t border-gray-800/60">
                    <div>
                      <p className="text-2xl font-black text-white">{visiblePosts?.length || 0}</p>
                      <p className="text-xs text-gray-500 font-semibold tracking-wide">POSTS</p>
                    </div>
                    {!(profile as any)?.hide_follower_count && (
                      <>
                        <div className="h-10 w-px bg-gray-800"></div>
                        <Link href={`/user/${params.id}/followers`} className="hover:opacity-80 transition-opacity">
                          <p className="text-2xl font-black text-white">{followerCount || 0}</p>
                          <p className="text-xs text-gray-500 font-semibold tracking-wide">FOLLOWERS</p>
                        </Link>
                        <div className="h-10 w-px bg-gray-800"></div>
                        <Link href={`/user/${params.id}/following`} className="hover:opacity-80 transition-opacity">
                          <p className="text-2xl font-black text-white">{followingCount || 0}</p>
                          <p className="text-xs text-gray-500 font-semibold tracking-wide">FOLLOWING</p>
                        </Link>
                      </>
                    )}
                    <div className="h-10 w-px bg-gray-800"></div>
                    <div>
                      <p className="text-2xl font-black text-primary">{totalLikes}</p>
                      <p className="text-xs text-gray-500 font-semibold tracking-wide">TOTAL LIKES</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Below Profile Header */}
        <div className="px-4 md:px-8 pb-6 md:pb-8">
          {/* Posts Section */}
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-6">Posts</h2>

          {visiblePosts && visiblePosts.length === 0 ? (
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-12 text-center card-elevated">
              <p className="text-gray-400 text-lg font-semibold mb-2">
                {isFollowing ? 'No posts yet' : 'No public posts'}
              </p>
              {!isFollowing && (
                <p className="text-gray-600 text-sm">Follow to see their private posts</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {visiblePosts?.map((post: any) => (
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


