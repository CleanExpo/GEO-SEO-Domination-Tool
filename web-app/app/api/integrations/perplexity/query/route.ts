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
    const { prompt, model = 'sonar-pro' } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Validate prompt length
    if (prompt.length < 10) {
      return NextResponse.json(
        { error: 'Prompt must be at least 10 characters long' },
        { status: 400 }
      )
    }

    if (prompt.length > 10000) {
      return NextResponse.json(
        { error: 'Prompt must not exceed 10000 characters' },
        { status: 400 }
      )
    }

    // Validate model
    const validModels = ['sonar', 'sonar-pro', 'sonar-reasoning']
    if (!validModels.includes(model)) {
      return NextResponse.json(
        { error: `Invalid model. Must be one of: ${validModels.join(', ')}` },
        { status: 400 }
      )
    }

    // Initialize Perplexity service
    const perplexityService = new PerplexityService(apiKey)

    // Execute query
    const response = await perplexityService.query(prompt, model)

    return NextResponse.json({
      success: true,
      model,
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      response,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Perplexity query error:', error)

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
      { error: error.message || 'Failed to execute query' },
      { status: 500 }
    )
  }
}
