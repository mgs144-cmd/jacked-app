import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string }

const MEMORY_MAX_CHARS = 14000
const INSIGHTS_HISTORY_LIMIT = 48

function appendConversationToMemory(prev: string, userLine: string, coachLine: string) {
  const stamp = new Date().toISOString().slice(0, 10)
  const block = `\n--- ${stamp} ---\nUser: ${userLine.slice(0, 700)}\nCoach: ${coachLine.slice(0, 1000)}`
  const next = (prev || '') + block
  return next.length > MEMORY_MAX_CHARS ? next.slice(-MEMORY_MAX_CHARS) : next
}

function fallbackPlanReply(messages: ChatMessage[], context: Record<string, unknown>) {
  const last = [...messages].reverse().find((m) => m.role === 'user')?.content?.trim() || ''
  const exercise = typeof context.exercise_name === 'string' ? context.exercise_name : 'your lift'
  const weight = typeof context.target_weight === 'number' ? context.target_weight : '?'
  const rawDate = context.target_date
  const hasDate =
    typeof rawDate === 'string' &&
    rawDate.trim() !== '' &&
    !Number.isNaN(new Date(rawDate).getTime())
  const dateStr = hasDate
    ? new Date(rawDate as string).toLocaleDateString('en-US', { dateStyle: 'medium' })
    : null

  const lowered = last.toLowerCase()
  let body = hasDate
    ? `For **${exercise}** aiming for **${weight} lbs** by **${dateStr}**, stay patient with overload: add load or reps slowly when bar speed is solid. `
    : `For **${exercise}** aiming for **${weight} lbs** (no fixed target date yet), stay patient with overload. Ask me when to schedule a max / meet week. `
  if (lowered.includes('deload') || lowered.includes('tired') || lowered.includes('fatigue')) {
    body += `A **deload** week (~40–50% fewer working sets or drop top set RPE by 2) often helps more than grinding. `
  }
  if (lowered.includes('bench') || exercise.toLowerCase().includes('bench')) {
    body += `Bench often improves with **2×/week** frequency: one heavier day + one paused or tempo day. `
  }
  if (lowered.includes('squat')) {
    body += `Keep a weekly slot for **technique** (paused or tempo squats) alongside heavier work. `
  }
  body +=
    'Add **OPENAI_API_KEY** on the server for richer coaching. I still save what you tell me to your coach memory.'
  return body
}

function fallbackInsightsReply(userMsg: string, memoryNotes: string) {
  const l = userMsg.toLowerCase()
  let body =
    "Thanks for checking in. I'm in **fallback mode** until `OPENAI_API_KEY` is set on the server — you'll get fuller answers then. "
  if (l.includes('remember') || l.includes('i usually') || l.includes('i train')) {
    body += "I've stored this chat in your history and notes so future replies can reference it. "
  }
  if (l.includes('deload') || l.includes('tired')) {
    body += 'If fatigue is high, a lighter week with fewer hard sets is reasonable. '
  }
  body += 'Keep logging — your Insights cards summarize trends from your log.'
  if (memoryNotes.trim()) {
    body += `\n\n**Saved context (tail):**\n${memoryNotes.slice(-1200)}`
  }
  return body
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const sb = supabase as any

    const body = await req.json()
    const channel = body.channel === 'insights' ? 'insights' : 'plan'

    const { data: memRow } = await sb.from('coach_user_memory').select('notes').eq('user_id', userId).maybeSingle()
    let memoryNotes = typeof memRow?.notes === 'string' ? memRow.notes : ''

    if (channel === 'insights') {
      const message = typeof body.message === 'string' ? body.message.trim() : ''
      if (!message) {
        return NextResponse.json({ error: 'message required' }, { status: 400 })
      }

      const insightsContext =
        typeof body.insightsContext === 'object' && body.insightsContext !== null ? body.insightsContext : {}

      const { error: insUserErr } = await sb.from('coach_insights_messages').insert({
        user_id: userId,
        role: 'user',
        content: message,
      })
      if (insUserErr) {
        console.error('coach_insights insert user', insUserErr)
        return NextResponse.json(
          { error: 'Could not save message. Run ADD_COACH_INSIGHTS_MEMORY.sql in Supabase.' },
          { status: 500 }
        )
      }

      const { data: hist } = await sb
        .from('coach_insights_messages')
        .select('role, content')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(INSIGHTS_HISTORY_LIMIT)

      const thread: ChatMessage[] = (hist || []).map((r: { role: string; content: string }) => ({
        role: r.role as 'user' | 'assistant',
        content: r.content,
      }))

      const apiKey = process.env.OPENAI_API_KEY
      const memorySnippet = memoryNotes.slice(-6000)

      const ctxStr = JSON.stringify(insightsContext).slice(0, 2500)
      const system = [
        'You are a concise, supportive strength coach.',
        'The user is in the Log > Insights tab. You may see summary strings from their training analytics — use them as hints, not medical facts.',
        'They may share casual facts (schedule, injuries, preferences, equipment). Acknowledge and incorporate them; these notes persist for future chats.',
        'Do not diagnose injuries; suggest a clinician for sharp pain.',
        'Keep replies under ~180 words unless they ask for detail.',
        `Insights snapshot (JSON): ${ctxStr}`,
        memorySnippet.trim()
          ? `Long-term notes about this athlete (may be long; favor recent entries at the end):\n${memorySnippet}`
          : 'No prior long-term notes yet — start building rapport.',
      ].join('\n\n')

      let reply: string

      if (apiKey && thread.length > 0) {
        const completion = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
            messages: [{ role: 'system', content: system }, ...thread],
            temperature: 0.65,
            max_tokens: 700,
          }),
        })

        if (!completion.ok) {
          const errText = await completion.text().catch(() => '')
          console.error('OpenAI insights error:', completion.status, errText.slice(0, 400))
          reply = fallbackInsightsReply(message, memoryNotes)
        } else {
          const data = (await completion.json()) as {
            choices?: { message?: { content?: string } }[]
          }
          reply = data.choices?.[0]?.message?.content?.trim() || fallbackInsightsReply(message, memoryNotes)
        }
      } else {
        reply = fallbackInsightsReply(message, memoryNotes)
      }

      const { error: asstErr } = await sb.from('coach_insights_messages').insert({
        user_id: userId,
        role: 'assistant',
        content: reply,
      })
      if (asstErr) console.error('coach_insights insert assistant', asstErr)

      memoryNotes = appendConversationToMemory(memoryNotes, message, reply)
      await sb.from('coach_user_memory').upsert(
        {
          user_id: userId,
          notes: memoryNotes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

      return NextResponse.json({ reply })
    }

    // --- Plan coach (floating dock) ---
    const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : []
    const planContext: Record<string, unknown> =
      typeof body.planContext === 'object' && body.planContext !== null ? body.planContext : {}

    const apiKey = process.env.OPENAI_API_KEY

    const memorySnippetPlan = memoryNotes.slice(-4000)
    const baseCoach = [
      'You are a concise, supportive strength coach for barbell trainees.',
      'Give practical tweaks to weekly structure, taper, accessory work, recovery, peaking.',
      'If target_date is missing or null in context, help pick a realistic test or meet week.',
      'Do not diagnose injuries; suggest seeing a clinician for pain.',
      memorySnippetPlan.trim()
        ? `Long-term notes about this athlete (recent tail):\n${memorySnippetPlan}`
        : '',
      `Plan JSON context: ${JSON.stringify(planContext).slice(0, 3500)}`,
    ]
      .filter(Boolean)
      .join('\n\n')

    if (apiKey && messages.length > 0) {
      const completion = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'system', content: baseCoach }, ...messages],
          temperature: 0.6,
          max_tokens: 700,
        }),
      })

      if (!completion.ok) {
        const errText = await completion.text().catch(() => '')
        console.error('OpenAI coach error:', completion.status, errText.slice(0, 500))
        const reply = fallbackPlanReply(messages, planContext)
        const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content?.trim() || ''
        if (lastUser && reply) {
          memoryNotes = appendConversationToMemory(memoryNotes, lastUser, reply)
          await sb.from('coach_user_memory').upsert(
            { user_id: userId, notes: memoryNotes, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          )
        }
        return NextResponse.json({ reply })
      }

      const data = (await completion.json()) as {
        choices?: { message?: { content?: string } }[]
      }
      const reply =
        data.choices?.[0]?.message?.content?.trim() || fallbackPlanReply(messages, planContext)

      const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content?.trim() || ''
      if (lastUser && reply) {
        memoryNotes = appendConversationToMemory(memoryNotes, lastUser, reply)
        await sb.from('coach_user_memory').upsert(
          { user_id: userId, notes: memoryNotes, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
      }

      return NextResponse.json({ reply })
    }

    const reply = fallbackPlanReply(messages, planContext)
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content?.trim() || ''
    if (lastUser && reply) {
      memoryNotes = appendConversationToMemory(memoryNotes, lastUser, reply)
      await sb.from('coach_user_memory').upsert(
        { user_id: userId, notes: memoryNotes, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    }
    return NextResponse.json({ reply })
  } catch (e: unknown) {
    console.error('coach-chat route', e)
    return NextResponse.json({ reply: 'Something went wrong. Try again shortly.' }, { status: 200 })
  }
}
