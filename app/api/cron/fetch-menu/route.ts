import { NextResponse } from 'next/server'

export async function GET() {

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
      return NextResponse.json({ error: 'Failed to trigger workflow', details: error, status: response.status }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Workflow triggered' })
  } catch (error) {
    console.error('Error triggering workflow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
