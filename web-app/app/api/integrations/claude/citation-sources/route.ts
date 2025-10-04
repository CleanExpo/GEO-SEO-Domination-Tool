import { NextRequest, NextResponse } from 'next/server'
import { ClaudeService } from '@/services/api/claude'

export async function POST(request: NextRequest) {
  try {
    // Validate API key from environment or request headers
    const apiKey = process.env.ANTHROPIC_API_KEY || request.headers.get('x-anthropic-api-key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Claude API key is required. Set ANTHROPIC_API_KEY environment variable or provide x-anthropic-api-key header.' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { industry, location } = body

    if (!industry) {
      return NextResponse.json(
        { error: 'Industry is required' },
        { status: 400 }
      )
    }

    if (!location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      )
    }

    // Initialize Claude service
    const claudeService = new ClaudeService(apiKey)

    // Find citation sources
    const sources = await claudeService.findCitationSources(industry, location)

    return NextResponse.json({
      success: true,
      industry,
      location,
      sources,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Claude citation sources error:', error)

    // Handle rate limiting
    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // Handle API errors
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json(
        { error: 'Invalid API key or insufficient permissions' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to find citation sources' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const industry = searchParams.get('industry')
  const location = searchParams.get('location')

  if (!industry || !location) {
    return NextResponse.json(
      { error: 'Industry and location query parameters are required' },
      { status: 400 }
    )
  }

  // Create a new request for POST handler
  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ industry, location }),
  })

  return POST(mockRequest as NextRequest)
}
