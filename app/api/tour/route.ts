import Anthropic from '@anthropic-ai/sdk'
import type { TourStop } from '@/types'

const client = new Anthropic()

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'AI narration not configured' }, { status: 503 })
  }

  let stops: TourStop[]
  try {
    const body = await request.json()
    stops = body.stops
    if (!Array.isArray(stops) || stops.length === 0) throw new Error()
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const stopsContext = stops
    .map(
      (s) =>
        `Stop ${s.order}: ${s.title}${s.extract ? ` — ${s.extract.slice(0, 200)}` : ''}`
    )
    .join('\n')

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a knowledgeable London guide with a gift for atmospheric storytelling. Given these walking tour stops with their Wikipedia summaries, write a 2-sentence narration for each stop that connects it to London's broader character and history.

Tour stops:
${stopsContext}

Return ONLY valid JSON in this exact format, no other text:
{"narrations": [{"pageid": <number>, "narration": "<2 sentences>"}]}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(text) as { narrations: Array<{ pageid: number; narration: string }> }

    const narrationMap = new Map(parsed.narrations.map((n) => [n.pageid, n.narration]))
    const enrichedStops = stops.map((s) => ({
      ...s,
      narration: narrationMap.get(s.pageid) ?? undefined,
    }))

    return Response.json({ stops: enrichedStops })
  } catch (err) {
    console.error('Tour narration error:', err)
    return Response.json({ stops }, { status: 200 })
  }
}
