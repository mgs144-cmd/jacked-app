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
    const { exercise_type, sets, caption, privacy_option } = body

    if (!exercise_type || !sets || !Array.isArray(sets) || sets.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate exercise type
    const validExerciseTypes = ['deadlift', 'paused_deadlift', 'rdl', 'sumo_deadlift', 'deficit_deadlift']
    if (!validExerciseTypes.includes(exercise_type)) {
      return NextResponse.json({ error: 'Invalid exercise type' }, { status: 400 })
    }

    // Calculate total volume from all sets
    const volume = sets.reduce((total: number, set: { weight: number; reps: number }) => {
      return total + (set.weight * set.reps)
    }, 0)

    // Get user's current Deadcember total
    const { data: userTotal } = await (supabase.rpc as any)('get_user_deadcember_total', {
      p_user_id: session.user.id,
    })

    const newPersonalTotal = (userTotal || 0) + volume

    // Get global total
    const { data: globalTotal } = await (supabase.rpc as any)('get_global_deadcember_total')

    // Create Deadcember entries for each set
    const entries = []
    for (const set of sets) {
      const { data: entry, error: entryError } = await (supabase.from('deadcember_entries') as any)
        .insert({
          user_id: session.user.id,
          exercise_type,
          weight: set.weight,
          reps: set.reps,
          sets: 1, // Each entry is one set
          date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single()

      if (entryError) throw entryError
      entries.push(entry)
    }

    // Handle privacy options
    let post = null
    let postId = null

    if (privacy_option !== 'silent') {
      // Create post content based on privacy option
      let postContent = ''
      
      if (privacy_option === 'full') {
        // Show all details: weights, sets, reps, and volume
        const setsDetails = sets.map((set: any, i: number) => 
          `Set ${i + 1}: ${set.weight}lbs × ${set.reps} reps`
        ).join('\n')
        const defaultContent = `Deadcember Log: ${exercise_type.replace('_', ' ').toUpperCase()}\n\n${setsDetails}\n\nTotal Volume: ${volume.toLocaleString()}lbs`
        postContent = caption ? `${caption}\n\n${defaultContent}` : defaultContent
      } else if (privacy_option === 'volume_only') {
        // Show only total volume
        const defaultContent = `Deadcember Log: ${exercise_type.replace('_', ' ').toUpperCase()} - ${volume.toLocaleString()}lbs total volume`
        postContent = caption ? `${caption}\n\n${defaultContent}` : defaultContent
      }

      const { data: createdPost, error: postError } = await (supabase.from('posts') as any)
        .insert({
          user_id: session.user.id,
          content: postContent,
          is_deadcember_post: true,
          deadcember_volume: volume,
          deadcember_personal_total: newPersonalTotal,
          is_private: false, // Deadcember posts are public (privacy is handled by content)
        })
        .select()
        .single()

      if (postError) throw postError
      post = createdPost
      postId = createdPost.id

      // Update all entries with post_id
      for (const entry of entries) {
        await (supabase.from('deadcember_entries') as any)
          .update({ post_id: postId })
          .eq('id', entry.id)
      }
    }

    return NextResponse.json({
      success: true,
      entries,
      post,
      personalTotal: newPersonalTotal,
      globalTotal: globalTotal || 0,
      volume,
      privacyOption: privacy_option,
    })
  } catch (error: any) {
    console.error('Deadcember log error:', error)
    return NextResponse.json({ error: error.message || 'Failed to log workout' }, { status: 500 })
  }
}
