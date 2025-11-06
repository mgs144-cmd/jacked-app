import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { Navbar } from '@/components/Navbar'
import { PostCard } from '@/components/PostCard'
import { Crown } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  // Fetch user's posts
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(username, avatar_url, full_name)
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pt-20">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {(profile as any)?.avatar_url ? (
                <Image
                  src={(profile as any).avatar_url}
                  alt={(profile as any).username || 'Profile'}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-3xl font-semibold">
                  {(profile as any)?.username?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {(profile as any)?.username || (profile as any)?.full_name || 'User'}
                </h1>
                {(profile as any)?.is_premium && (
                  <span className="flex items-center space-x-1 text-primary">
                    <Crown className="w-5 h-5 fill-current" />
                    <span className="text-sm font-semibold">Jacked+</span>
                  </span>
                )}
              </div>
              {(profile as any)?.full_name && (profile as any).full_name !== (profile as any).username && (
                <p className="text-gray-600 mb-2">{(profile as any).full_name}</p>
              )}
              {(profile as any)?.bio && (
                <p className="text-gray-700 mb-2">{(profile as any).bio}</p>
              )}
              <p className="text-sm text-gray-500">{session.user.email}</p>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-900">Your Posts</h2>
          {posts && posts.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500 mb-4">You haven&apos;t posted anything yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts?.map((post: any) => (
                <PostCard
                  key={post.id}
                  post={{
                    ...post,
                    profile: post.profiles || null,
                  }}
                  currentUserId={session.user.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

