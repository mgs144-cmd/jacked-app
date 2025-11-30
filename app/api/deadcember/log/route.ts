import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { exercise_type, weight, reps, sets } = body

    if (!exercise_type || !weight || !reps || !sets) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (exercise_type !== 'deadlift' && exercise_type !== 'rdl') {
      return NextResponse.json({ error: 'Invalid exercise type' }, { status: 400 })
    }

    const volume = weight * reps * sets

    // Get user's current Deadcember total
    const { data: userTotal } = await (supabase.rpc as any)('get_user_deadcember_total', {
      p_user_id: session.user.id,
    })

    const newPersonalTotal = (userTotal || 0) + volume

    // Get global total
    const { data: globalTotal } = await (supabase.rpc as any)('get_global_deadcember_total')

    // Create Deadcember entry
    const { data: entry, error: entryError } = await (supabase.from('deadcember_entries') as any)
      .insert({
        user_id: session.user.id,
        exercise_type,
        weight,
        reps,
        sets,
        date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (entryError) throw entryError

    // Create Deadcember post
    const { data: post, error: postError } = await (supabase.from('posts') as any)
      .insert({
        user_id: session.user.id,
        content: `💀 Deadcember Log: ${exercise_type.toUpperCase()} - ${weight}lbs × ${reps} reps × ${sets} sets = ${volume.toLocaleString()}lbs total volume`,
        is_deadcember_post: true,
        deadcember_volume: volume,
        deadcember_personal_total: newPersonalTotal,
        is_private: false, // Deadcember posts are public
      })
      .select()
      .single()

    if (postError) throw postError

    // Update entry with post_id
    await (supabase.from('deadcember_entries') as any)
      .update({ post_id: post.id })
      .eq('id', entry.id)

    return NextResponse.json({
      success: true,
      entry,
      post,
      personalTotal: newPersonalTotal,
      globalTotal: globalTotal || 0,
    })
  } catch (error: any) {
    console.error('Deadcember log error:', error)
    return NextResponse.json({ error: error.message || 'Failed to log workout' }, { status: 500 })
  }
}

