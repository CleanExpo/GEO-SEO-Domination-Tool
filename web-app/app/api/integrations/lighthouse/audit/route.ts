import { NextRequest, NextResponse } from 'next/server'
import { LighthouseService } from '@/services/api/lighthouse'

export async function POST(request: NextRequest) {
  try {
    // Validate API key from environment or request headers
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY || request.headers.get('x-google-api-key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google PageSpeed API key is required. Set GOOGLE_PAGESPEED_API_KEY environment variable or provide x-google-api-key header.' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { url, strategy = 'mobile' } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Validate strategy
    if (strategy !== 'mobile' && strategy !== 'desktop') {
      return NextResponse.json(
        { error: 'Strategy must be either "mobile" or "desktop"' },
        { status: 400 }
      )
    }

    // Initialize Lighthouse service
    const lighthouseService = new LighthouseService(apiKey)

    // Audit page
    const scores = await lighthouseService.auditPage(url, strategy)

    return NextResponse.json({
      success: true,
      url,
      strategy,
      scores,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Lighthouse audit error:', error)

    // Handle rate limiting
    if (error.response?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // Handle API errors
    if (error.response?.status === 400) {
      return NextResponse.json(
        { error: 'Invalid request. Please check the URL and try again.' },
        { status: 400 }
      )
    }

    if (error.response?.status === 403) {
      return NextResponse.json(
        { error: 'Invalid API key or insufficient permissions' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to perform Lighthouse audit' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')
  const strategy = searchParams.get('strategy') || 'mobile'

  if (!url) {
    return NextResponse.json(
      { error: 'URL query parameter is required' },
      { status: 400 }
    )
  }

  // Create a new request for POST handler
  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ url, strategy }),
  })

  return POST(mockRequest as NextRequest)
}
