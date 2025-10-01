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
    const { domain, database = 'us', limit = 100, keywords } = body

    // Handle both organic keywords and keyword difficulty
    if (keywords && Array.isArray(keywords)) {
      // Keyword difficulty endpoint
      if (keywords.length === 0) {
        return NextResponse.json(
          { error: 'At least one keyword is required' },
          { status: 400 }
        )
      }

      if (keywords.length > 100) {
        return NextResponse.json(
          { error: 'Maximum 100 keywords allowed per request' },
          { status: 400 }
        )
      }

      const semrushService = new SEMrushService(apiKey)
      const data = await semrushService.getKeywordDifficulty(keywords, database)

      return NextResponse.json({
        success: true,
        type: 'keyword_difficulty',
        keywords,
        database,
        data,
        timestamp: new Date().toISOString(),
      })
    }

    // Organic keywords endpoint
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required for organic keywords' },
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
    if (limit < 1 || limit > 10000) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 10000' },
        { status: 400 }
      )
    }

    // Initialize SEMrush service
    const semrushService = new SEMrushService(apiKey)

    // Get organic keywords
    const data = await semrushService.getOrganicKeywords(domain, database, limit)

    return NextResponse.json({
      success: true,
      type: 'organic_keywords',
      domain,
      database,
      limit,
      count: data.length,
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('SEMrush keywords error:', error)

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
      { error: error.message || 'Failed to fetch keywords data' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const domain = searchParams.get('domain')
  const database = searchParams.get('database') || 'us'
  const limit = parseInt(searchParams.get('limit') || '100')
  const keywordsParam = searchParams.get('keywords')

  const body: any = { database, limit }

  if (keywordsParam) {
    body.keywords = keywordsParam.split(',').map(k => k.trim())
  } else if (domain) {
    body.domain = domain
  } else {
    return NextResponse.json(
      { error: 'Either domain or keywords query parameter is required' },
      { status: 400 }
    )
  }

  // Create a new request for POST handler
  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(body),
  })

  return POST(mockRequest as NextRequest)
}
