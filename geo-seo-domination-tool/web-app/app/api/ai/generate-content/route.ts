/**
 * AI Content Generation API Route
 *
 * POST /api/ai/generate-content
 *
 * Generates SEO-optimized content outlines at scale using DeepSeek
 */

import { NextRequest, NextResponse } from 'next/server';
import { AIOrchestrator } from '@/services/api/ai-orchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topics, industry, location, contentType = 'blog' } = body;

    // Validation
    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid topics array' },
        { status: 400 }
      );
    }

    if (!industry || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: industry, location' },
        { status: 400 }
      );
    }

    const validContentTypes = ['blog', 'pillar', 'service', 'location'];
    if (!validContentTypes.includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid contentType. Must be one of: ${validContentTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Initialize AI orchestrator
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY not configured' },
        { status: 500 }
      );
    }

    const orchestrator = new AIOrchestrator(openrouterKey);

    // Generate content plan
    const result = await orchestrator.generateContentPlan(
      topics,
      industry,
      location,
      contentType
    );

    return NextResponse.json({
      success: true,
      data: {
        contentPlan: result.result,
        metadata: {
          primaryModel: result.primaryModel,
          topicsCount: topics.length,
          cost: result.cost,
          processingTime: result.processingTime,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate content',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
