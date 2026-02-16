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
      <div className="min-h-screen pb-20 md:pb-0 md:pt-14 bg-[#1a1a1a]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="rounded-[12px] border border-white/5 bg-[#1a1a1a] p-12 text-center" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <p className="text-[#a1a1a1] text-lg font-medium">Post not found</p>
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
    <div className="min-h-screen pb-20 md:pb-0 md:pt-14 bg-[#1a1a1a]">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <article className="rounded-[12px] border border-white/5 overflow-hidden mb-6 bg-[#1a1a1a]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-white/5 overflow-hidden ring-1 ring-white/10">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.username}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/10 text-[#ff5555] font-semibold text-lg">
                      {profile.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">
                    {profile.username || 'Unknown'}
                  </span>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {formatDistanceToNow(new Date((post as any).created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          {(post as any).media_url && (
            <div className="relative w-full aspect-square bg-[#1a1a1a]">
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

          {(post as any).content && (
            <div className="px-6 py-5">
              <p className="text-white/90 leading-relaxed">
                <span className="font-semibold text-[#ff5555] mr-2">{profile.username}</span>
                {(post as any).content}
              </p>
            </div>
          )}
        </article>

        <div className="rounded-[12px] border border-white/5 p-6 bg-[#1a1a1a]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div className="flex items-center space-x-3 mb-6">
            <MessageCircle className="w-6 h-6 text-[#ff5555]" />
            <h2 className="text-xl font-semibold text-white">
              Comments ({comments?.length || 0})
            </h2>
          </div>

          <CommentForm postId={params.id} userId={session.user.id} />

          <div className="border-t border-white/5 pt-6">
            <CommentList comments={comments || []} />
          </div>
        </div>
      </div>
    </div>
  )
}
