import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { Navbar } from '@/components/Navbar'
import { CommentForm } from '@/components/CommentForm'
import { CommentList } from '@/components/CommentList'

export default async function PostPage({
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

  // Fetch post with user profile
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(username, avatar_url, full_name)
    `)
    .eq('id', params.id)
    .single()

  if (postError || !post) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pt-20">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Post not found</p>
          </div>
        </div>
      </div>
    )
  }

  // Fetch comments
  const { data: comments } = await supabase
    .from('comments')
    .select(`
      *,
      profiles:user_id(username, avatar_url, full_name)
    `)
    .eq('post_id', params.id)
    .order('created_at', { ascending: true })

  const profile = (post as any).profiles || {
    username: 'unknown',
    avatar_url: null,
    full_name: null,
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pt-0 md:pt-20">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Post */}
        <article className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mb-6">
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.username}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 font-semibold">
                    {profile.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {profile.username || 'Unknown'}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>

          {/* Media */}
          {post.media_url && (
            <div className="relative w-full aspect-square bg-gray-100">
              {post.media_type === 'video' ? (
                <video
                  src={post.media_url}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={post.media_url}
                  alt={post.content || 'Post image'}
                  fill
                  className="object-cover"
                />
              )}
            </div>
          )}

          {/* Content */}
          {post.content && (
            <div className="p-4">
              <div className="text-gray-900">
                <span className="font-semibold mr-2">{profile.username}</span>
                <span>{post.content}</span>
              </div>
            </div>
          )}
        </article>

        {/* Comments Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-gray-900">
            Comments ({comments?.length || 0})
          </h2>

          <CommentForm postId={params.id} userId={session.user.id} />

          <div className="mt-6">
            <CommentList comments={comments || []} />
          </div>
        </div>
      </div>
    </div>
  )
}

