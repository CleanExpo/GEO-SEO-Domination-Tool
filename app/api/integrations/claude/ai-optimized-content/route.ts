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
    const { topic, industry, targetAudience, contentType = 'pillar' } = body

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    if (!industry) {
      return NextResponse.json(
        { error: 'Industry is required' },
        { status: 400 }
      )
    }

    if (!targetAudience) {
      return NextResponse.json(
        { error: 'Target audience is required' },
        { status: 400 }
      )
    }

    // Validate content type
    const validContentTypes = ['pillar', 'supporting', 'commercial']
    if (!validContentTypes.includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid content type. Must be one of: ${validContentTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Initialize Claude service
    const claudeService = new ClaudeService(apiKey)

    // Generate AI-optimized content
    const content = await claudeService.generateAIOptimizedContent(
      topic,
      industry,
      targetAudience,
      contentType as 'pillar' | 'supporting' | 'commercial'
    )

    return NextResponse.json({
      success: true,
      topic,
      industry,
      targetAudience,
      contentType,
      content,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Claude AI-optimized content generation error:', error)

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
      { error: error.message || 'Failed to generate AI-optimized content' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const topic = searchParams.get('topic')
  const industry = searchParams.get('industry')
  const targetAudience = searchParams.get('targetAudience')
  const contentType = searchParams.get('contentType') || 'pillar'

  if (!topic || !industry || !targetAudience) {
    return NextResponse.json(
      { error: 'Topic, industry, and targetAudience query parameters are required' },
      { status: 400 }
    )
  }

  // Create a new request for POST handler
  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ topic, industry, targetAudience, contentType }),
  })

  return POST(mockRequest as NextRequest)
}
