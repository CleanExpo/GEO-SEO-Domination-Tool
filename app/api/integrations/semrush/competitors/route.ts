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
    const { domain, database = 'us', limit = 10 } = body

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

    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    // Initialize SEMrush service
    const semrushService = new SEMrushService(apiKey)

    // Get competitors
    const data = await semrushService.getCompetitors(domain, database, limit)

    return NextResponse.json({
      success: true,
      domain,
      database,
      limit,
      count: data.length,
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('SEMrush competitors error:', error)

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
      { error: error.message || 'Failed to fetch competitors' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const domain = searchParams.get('domain')
  const database = searchParams.get('database') || 'us'
  const limit = parseInt(searchParams.get('limit') || '10')

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
    body: JSON.stringify({ domain, database, limit }),
  })

  return POST(mockRequest as NextRequest)
}
