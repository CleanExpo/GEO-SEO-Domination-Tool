import { NextRequest, NextResponse } from 'next/server'
import { FirecrawlService } from '@/services/api/firecrawl'

export async function POST(request: NextRequest) {
  try {
    // Validate API key from environment or request headers
    const apiKey = process.env.FIRECRAWL_API_KEY || request.headers.get('x-firecrawl-api-key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Firecrawl API key is required. Set FIRECRAWL_API_KEY environment variable or provide x-firecrawl-api-key header.' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { url, options } = body

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

    // Validate options
    if (options?.maxDepth && (options.maxDepth < 1 || options.maxDepth > 10)) {
      return NextResponse.json(
        { error: 'Max depth must be between 1 and 10' },
        { status: 400 }
      )
    }

    if (options?.limit && (options.limit < 1 || options.limit > 1000)) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 1000' },
        { status: 400 }
      )
    }

    // Initialize Firecrawl service
    const firecrawlService = new FirecrawlService({ apiKey })

    // Crawl website
    const data = await firecrawlService.crawlWebsite(url, options)

    return NextResponse.json({
      success: true,
      url,
      pagesFound: data.length,
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Firecrawl crawl error:', error)

    // Handle rate limiting
    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // Handle API errors
    if (error.message?.includes('Invalid API key') || error.message?.includes('unauthorized')) {
      return NextResponse.json(
        { error: 'Invalid API key or insufficient permissions' },
        { status: 403 }
      )
    }

    // Handle timeout
    if (error.message?.includes('timed out')) {
      return NextResponse.json(
        { error: 'Crawl operation timed out. Try reducing the limit or max depth.' },
        { status: 408 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to crawl website' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')
  const maxDepth = parseInt(searchParams.get('maxDepth') || '2')
  const limit = parseInt(searchParams.get('limit') || '10')

  if (!url) {
    return NextResponse.json(
      { error: 'URL query parameter is required' },
      { status: 400 }
    )
  }

  const options = { maxDepth, limit }

  // Create a new request for POST handler
  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ url, options }),
  })

  return POST(mockRequest as NextRequest)
}
