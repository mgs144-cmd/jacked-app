import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { CommentForm } from '@/components/CommentForm'
import { CommentList } from '@/components/CommentList'
import { formatDistanceToNow } from 'date-fns'
import { Crown, MessageCircle } from 'lucide-react'

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

  const { data: post, error: postError } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(username, avatar_url, full_name, is_premium)
    `)
    .eq('id', params.id)
    .single()

  if (postError || !post) {
    return (
      <div className="min-h-screen pb-20 md:pb-0 md:pt-24">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-12 text-center card-elevated">
            <p className="text-gray-400 text-lg font-semibold">Post not found</p>
          </div>
        </div>
      </div>
    )
  }

  const { data: comments } = await supabase
    .from('comments')
    .select(`
      *,
      profiles:user_id(username, avatar_url, full_name)
    `)
    .eq('post_id', params.id)
    .order('created_at', { ascending: true })

  // Handle profile data - could be object, array, or null
  let profileData = (post as any).profiles
  if (Array.isArray(profileData)) {
    profileData = profileData[0] || null
  }
  
  const profile = profileData || {
    username: 'unknown',
    avatar_url: null,
    full_name: null,
    is_premium: false,
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-24">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Post */}
        <article className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 overflow-hidden card-elevated mb-6">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-800/40">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden ring-2 ring-gray-800">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.username}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-gray-300 font-bold text-lg">
                      {profile.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                {profile.is_premium && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-primary rounded-full flex items-center justify-center ring-2 ring-gray-900">
                    <Crown className="w-3 h-3 text-white fill-current" />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">
                    {profile.username || 'Unknown'}
                  </span>
                  {profile.is_premium && (
                    <span className="badge-premium text-[10px] px-2 py-0.5">JACKED+</span>
                  )}
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {formatDistanceToNow(new Date((post as any).created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          {/* Media */}
          {(post as any).media_url && (
            <div className="relative w-full aspect-square bg-black">
              {(post as any).media_type === 'video' ? (
                <video
                  src={(post as any).media_url}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={(post as any).media_url}
                  alt="Post media"
                  fill
                  className="object-cover"
                />
              )}
            </div>
          )}

          {/* Content */}
          {(post as any).content && (
            <div className="px-5 py-4">
              <p className="text-gray-100 leading-relaxed">
                <span className="font-bold text-primary mr-2">{profile.username}</span>
                {(post as any).content}
              </p>
            </div>
          )}
        </article>

        {/* Comments Section */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-6 card-elevated">
          <div className="flex items-center space-x-3 mb-6">
            <MessageCircle className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-black text-white tracking-tight">
              Comments ({comments?.length || 0})
            </h2>
          </div>

          <CommentForm postId={params.id} userId={session.user.id} />

          <div className="border-t border-gray-800/40 pt-6">
            <CommentList comments={comments || []} />
          </div>
        </div>
      </div>
    </div>
  )
}
