import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron or authorized caller
  const authHeader = request.headers.get('authorization')
  const url = new URL(request.url)
  const secretParam = url.searchParams.get('secret')

  const isAuthorized =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    secretParam === process.env.CRON_SECRET

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Trigger the GitHub Action workflow
    const response = await fetch(
      'https://api.github.com/repos/brandoncuii/usc-rate-my-dhall/actions/workflows/fetch-menu.yml/dispatches',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${process.env.GITHUB_PAT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main'
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('GitHub API error:', error)
      return NextResponse.json({ error: 'Failed to trigger workflow' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Workflow triggered' })
  } catch (error) {
    console.error('Error triggering workflow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
