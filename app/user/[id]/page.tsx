import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { PostCard } from '@/components/PostCard'
import { FollowButton } from '@/components/FollowButton'
import { Crown, Calendar, ArrowLeft } from 'lucide-react'

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

  // Get user's posts (only public posts or if following, include private)
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(username, avatar_url, full_name, is_premium),
      likes(count),
      comments(count)
    `)
    .eq('user_id', params.id)
    .order('created_at', { ascending: false })

  const postsWithCounts = posts?.map((post) => ({
    ...post,
    like_count: (post as any).likes?.length || 0,
    comment_count: (post as any).comments?.length || 0,
  }))

  // Filter posts based on privacy
  const visiblePosts = postsWithCounts?.filter((post) => 
    !post.is_private || isFollowing
  )

  const totalLikes = visiblePosts?.reduce((sum, post) => sum + post.like_count, 0) || 0

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-24">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/discover"
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Discover</span>
        </Link>

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
                    {(profile as any)?.username?.[0]?.toUpperCase() || (profile as any)?.email?.[0]?.toUpperCase() || 'U'}
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
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-8 mb-4">
                <div>
                  <p className="text-2xl font-black text-white">{visiblePosts?.length || 0}</p>
                  <p className="text-xs text-gray-500 font-semibold tracking-wide">POSTS</p>
                </div>
                <div className="h-10 w-px bg-gray-800"></div>
                <Link href={`/user/${params.id}/followers`} className="hover:text-primary transition-colors">
                  <p className="text-2xl font-black text-white">{(profile as any).followers_count || 0}</p>
                  <p className="text-xs text-gray-500 font-semibold tracking-wide">FOLLOWERS</p>
                </Link>
                <div className="h-10 w-px bg-gray-800"></div>
                <Link href={`/user/${params.id}/following`} className="hover:text-primary transition-colors">
                  <p className="text-2xl font-black text-white">{(profile as any).following_count || 0}</p>
                  <p className="text-xs text-gray-500 font-semibold tracking-wide">FOLLOWING</p>
                </Link>
                <div className="h-10 w-px bg-gray-800"></div>
                <div>
                  <p className="text-2xl font-black text-primary">{totalLikes}</p>
                  <p className="text-xs text-gray-500 font-semibold tracking-wide">TOTAL LIKES</p>
                </div>
              </div>

              {/* Follow Button */}
              <FollowButton
                userId={params.id}
                currentUserId={session.user.id}
                initialIsFollowing={isFollowing}
              />
            </div>
          </div>
        </div>

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
  )
}


