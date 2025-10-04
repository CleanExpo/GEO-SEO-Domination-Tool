import { NextRequest, NextResponse } from 'next/server'
import { PerplexityService } from '@/services/api/perplexity'

export async function POST(request: NextRequest) {
  try {
    // Validate API key from environment or request headers
    const apiKey = process.env.PERPLEXITY_API_KEY || request.headers.get('x-perplexity-api-key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Perplexity API key is required. Set PERPLEXITY_API_KEY environment variable or provide x-perplexity-api-key header.' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { competitorDomain, industry } = body

    if (!competitorDomain) {
      return NextResponse.json(
        { error: 'Competitor domain is required' },
        { status: 400 }
      )
    }

    if (!industry) {
      return NextResponse.json(
        { error: 'Industry is required' },
        { status: 400 }
      )
    }

    // Validate domain format
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i
    if (!domainRegex.test(competitorDomain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      )
    }

    // Initialize Perplexity service
    const perplexityService = new PerplexityService(apiKey)

    // Analyze competitor
    const analysis = await perplexityService.analyzeCompetitor(competitorDomain, industry)

    return NextResponse.json({
      success: true,
      competitorDomain,
      industry,
      analysis,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Perplexity competitor analysis error:', error)

    // Handle rate limiting
    if (error.response?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // Handle API errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      return NextResponse.json(
        { error: 'Invalid API key or insufficient permissions' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to analyze competitor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const competitorDomain = searchParams.get('domain')
  const industry = searchParams.get('industry')

  if (!competitorDomain || !industry) {
    return NextResponse.json(
      { error: 'Domain and industry query parameters are required' },
      { status: 400 }
    )
  }

  // Create a new request for POST handler
  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ competitorDomain, industry }),
  })

  return POST(mockRequest as NextRequest)
}
