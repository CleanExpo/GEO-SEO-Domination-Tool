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
    const { domain, competitors, industry } = body

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      )
    }

    if (!competitors || !Array.isArray(competitors) || competitors.length === 0) {
      return NextResponse.json(
        { error: 'At least one competitor is required' },
        { status: 400 }
      )
    }

    if (competitors.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 competitors allowed' },
        { status: 400 }
      )
    }

    if (!industry) {
      return NextResponse.json(
        { error: 'Industry is required' },
        { status: 400 }
      )
    }

    // Validate domain formats
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      )
    }

    for (const competitor of competitors) {
      if (!domainRegex.test(competitor)) {
        return NextResponse.json(
          { error: `Invalid competitor domain format: ${competitor}` },
          { status: 400 }
        )
      }
    }

    // Initialize Claude service
    const claudeService = new ClaudeService(apiKey)

    // Identify content gaps
    const gaps = await claudeService.identifyContentGaps(domain, competitors, industry)

    return NextResponse.json({
      success: true,
      domain,
      competitors,
      industry,
      gaps,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Claude content gaps error:', error)

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
      { error: error.message || 'Failed to identify content gaps' },
      { status: 500 }
    )
  }
}
