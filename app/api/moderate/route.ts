import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ flagged: false })
    }

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      // If no API key configured, allow all comments (log warning in production)
      console.warn('OPENAI_API_KEY not configured - skipping moderation')
      return NextResponse.json({ flagged: false })
    }

    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: text }),
    })

    if (!response.ok) {
      console.error('OpenAI Moderation API error:', response.status)
      // Fail open - allow comment if API is unavailable
      return NextResponse.json({ flagged: false })
    }

    const data = await response.json()
    const result = data.results?.[0]

    if (result?.flagged) {
      // Return which categories were flagged for potential logging
      const categories = Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category]) => category)

      return NextResponse.json({
        flagged: true,
        categories,
        message: 'Your comment contains inappropriate content and cannot be posted.',
      })
    }

    return NextResponse.json({ flagged: false })
  } catch (error) {
    console.error('Moderation error:', error)
    // Fail open on errors
    return NextResponse.json({ flagged: false })
  }
}
