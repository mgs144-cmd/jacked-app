import { NextResponse } from 'next/server'

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string }

function fallbackReply(messages: ChatMessage[], context: Record<string, unknown>) {
  const last = [...messages].reverse().find((m) => m.role === 'user')?.content?.trim() || ''
  const exercise = typeof context.exercise_name === 'string' ? context.exercise_name : 'your lift'
  const weight = typeof context.target_weight === 'number' ? context.target_weight : '?'
  const date =
    typeof context.target_date === 'string'
      ? new Date(context.target_date).toLocaleDateString('en-US', { dateStyle: 'medium' })
      : 'your target date'

  const lowered = last.toLowerCase()
  let body =
    `For **${exercise}** aiming for **${weight} lbs** by **${date}**, stay patient with overload: add load or reps slowly when bar speed is solid. `
  if (lowered.includes('deload') || lowered.includes('tired') || lowered.includes('fatigue')) {
    body +=
      `A **deload** week (~40–50% fewer working sets or drop top set RPE by 2) usually clears plateaus faster than forcing max effort every session. `
  }
  if (lowered.includes('bench') || exercise.toLowerCase().includes('bench')) {
    body += `Bench responds well to **frequency 2×/week**: one heavier day + one paused or tempo day. `
  }
  if (lowered.includes('squat')) {
    body += `Squats often need **weekly slot for technique** (paused reps or tempo) alongside heavy singles/doubles. `
  }
  body +=
    `If you paste your latest logged top set, advice can line up tighter with volume and intensity. (Connect **OPENAI_API_KEY** for fuller coaching replies.)`

  return body
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : []
    const planContext: Record<string, unknown> =
      typeof body.planContext === 'object' && body.planContext !== null ? body.planContext : {}

    const apiKey = process.env.OPENAI_API_KEY

    if (apiKey && messages.length > 0) {
      const system = [
        'You are a concise, supportive strength coach for barbell trainees.',
        'Give practical tweaks to weekly structure, taper, accessory work, recovery, peaking.',
        'Do not diagnose injuries; suggest seeing a clinician for pain.',
        'Reference the user\'s goal and program summary when helpful.',
        `Plan JSON context: ${JSON.stringify(planContext).slice(0, 3500)}`,
      ].join(' ')

      const completion = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'system', content: system }, ...messages],
          temperature: 0.6,
          max_tokens: 700,
        }),
      })

      if (!completion.ok) {
        const errText = await completion.text().catch(() => '')
        console.error('OpenAI coach error:', completion.status, errText.slice(0, 500))
        return NextResponse.json({
          reply: fallbackReply(messages, planContext),
        })
      }

      const data = (await completion.json()) as {
        choices?: { message?: { content?: string } }[]
      }
      const reply = data.choices?.[0]?.message?.content?.trim()
      if (reply) return NextResponse.json({ reply })

      return NextResponse.json({
        reply: fallbackReply(messages, planContext),
      })
    }

    return NextResponse.json({
      reply: fallbackReply(messages, planContext),
    })
  } catch (e: unknown) {
    console.error('coach-chat route', e)
    return NextResponse.json({ reply: 'Something went wrong. Try again shortly.' }, { status: 200 })
  }
}

