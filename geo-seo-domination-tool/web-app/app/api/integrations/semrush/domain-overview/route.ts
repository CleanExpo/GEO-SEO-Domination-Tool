import { NextRequest, NextResponse } from 'next/server'
import { SEMrushService } from '@/services/api/semrush'

export async function POST(request: NextRequest) {
  try {
    // Validate API key from environment or request headers
    const apiKey = process.env.SEMRUSH_API_KEY || request.headers.get('x-semrush-api-key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'SEMrush API key is required. Set SEMRUSH_API_KEY environment variable or provide x-semrush-api-key header.' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { domain, database = 'us' } = body

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      )
    }

    // Validate domain format
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      )
    }

    // Initialize SEMrush service
    const semrushService = new SEMrushService(apiKey)

    // Get domain overview
    const data = await semrushService.getDomainOverview(domain, database)

    return NextResponse.json({
      success: true,
      domain,
      database,
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('SEMrush domain overview error:', error)

    // Handle rate limiting
    if (error.response?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // Handle API errors
    if (error.response?.status === 403) {
      return NextResponse.json(
        { error: 'Invalid API key or insufficient permissions' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch domain overview' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const domain = searchParams.get('domain')
  const database = searchParams.get('database') || 'us'

  if (!domain) {
    return NextResponse.json(
      { error: 'Domain query parameter is required' },
      { status: 400 }
    )
  }

  // Create a new request for POST handler
  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ domain, database }),
  })

  return POST(mockRequest as NextRequest)
}
