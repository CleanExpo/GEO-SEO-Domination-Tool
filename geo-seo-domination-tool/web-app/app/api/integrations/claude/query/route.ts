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
    const { prompt, systemPrompt } = body

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

    if (prompt.length > 50000) {
      return NextResponse.json(
        { error: 'Prompt must not exceed 50000 characters' },
        { status: 400 }
      )
    }

    // Initialize Claude service
    const claudeService = new ClaudeService(apiKey)

    // Execute query
    const response = await claudeService.query(prompt, systemPrompt)

    return NextResponse.json({
      success: true,
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      systemPrompt: systemPrompt ? systemPrompt.substring(0, 50) + '...' : undefined,
      response,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Claude query error:', error)

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
      { error: error.message || 'Failed to execute query' },
      { status: 500 }
    )
  }
}
