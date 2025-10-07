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
    const { urls, options, batchSize = 5, delayMs = 1000 } = body

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json(
        { error: 'URLs array is required' },
        { status: 400 }
      )
    }

    if (urls.length === 0) {
      return NextResponse.json(
        { error: 'At least one URL is required' },
        { status: 400 }
      )
    }

    if (urls.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 URLs allowed per batch request' },
        { status: 400 }
      )
    }

    // Validate URL formats
    for (const url of urls) {
      try {
        new URL(url)
      } catch {
        return NextResponse.json(
          { error: `Invalid URL format: ${url}` },
          { status: 400 }
        )
      }
    }

    // Validate batch parameters
    if (batchSize < 1 || batchSize > 10) {
      return NextResponse.json(
        { error: 'Batch size must be between 1 and 10' },
        { status: 400 }
      )
    }

    if (delayMs < 0 || delayMs > 10000) {
      return NextResponse.json(
        { error: 'Delay must be between 0 and 10000 milliseconds' },
        { status: 400 }
      )
    }

    // Initialize Firecrawl service
    const firecrawlService = new FirecrawlService({ apiKey })

    // Batch scrape URLs
    const results = await firecrawlService.batchScrape(urls, options, batchSize, delayMs)

    // Convert results map to object for JSON serialization
    const resultsObject: Record<string, any> = {}
    let successCount = 0
    let errorCount = 0

    results.forEach((result, url) => {
      if (result instanceof Error) {
        resultsObject[url] = { error: result.message }
        errorCount++
      } else {
        resultsObject[url] = result
        successCount++
      }
    })

    return NextResponse.json({
      success: true,
      totalUrls: urls.length,
      successCount,
      errorCount,
      results: resultsObject,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Firecrawl batch scrape error:', error)

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
      { error: error.message || 'Failed to batch scrape URLs' },
      { status: 500 }
    )
  }
}
