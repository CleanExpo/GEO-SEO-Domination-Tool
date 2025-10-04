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
    const { url, content, industry } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    if (!industry) {
      return NextResponse.json(
        { error: 'Industry is required' },
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

    // Initialize Claude service
    const claudeService = new ClaudeService(apiKey)

    // Analyze for AI citations
    const analysis = await claudeService.analyzeForAICitations(url, content, industry)

    return NextResponse.json({
      success: true,
      url,
      industry,
      contentLength: content.length,
      analysis,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Claude AI citations analysis error:', error)

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
      { error: error.message || 'Failed to analyze for AI citations' },
      { status: 500 }
    )
  }
}
