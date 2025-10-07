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
    const { url, schema } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    if (!schema || typeof schema !== 'object') {
      return NextResponse.json(
        { error: 'Schema object is required' },
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

    // Initialize Firecrawl service
    const firecrawlService = new FirecrawlService({ apiKey })

    // Extract data
    const data = await firecrawlService.extractData(url, schema)

    return NextResponse.json({
      success: true,
      url,
      schema,
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Firecrawl data extraction error:', error)

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

    return NextResponse.json(
      { error: error.message || 'Failed to extract data' },
      { status: 500 }
    )
  }
}
