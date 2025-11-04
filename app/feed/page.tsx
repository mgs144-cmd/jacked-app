import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PostCard } from '@/components/PostCard'
import { Navbar } from '@/components/Navbar'

export default async function FeedPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // Fetch posts with user profiles
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(username, avatar_url, full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pt-20">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Feed</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            Error loading posts: {error.message}
          </div>
        )}

        {posts && posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No posts yet. Be the first to share!</p>
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
  )
}

