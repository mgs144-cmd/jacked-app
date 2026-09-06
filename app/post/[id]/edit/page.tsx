import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditPostClient from './EditPostClient'

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const { data: post, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      profiles:user_id(username, avatar_url),
      workout_exercises(*)
    `
    )
    .eq('id', params.id)
    .single()

  if (error || !post || (post as any).user_id !== session.user.id) {
    redirect('/feed')
  }

  return <EditPostClient initialPost={post as any} />
}
