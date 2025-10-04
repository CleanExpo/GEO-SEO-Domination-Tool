/**
 * AI Keyword Research API Route
 *
 * POST /api/ai/generate-keywords
 *
 * Generates keyword clusters and topical maps using DeepSeek
 */

import { NextRequest, NextResponse } from 'next/server';
import { AIOrchestrator } from '@/services/api/ai-orchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seedKeywords, industry, location } = body;

    // Validation
    if (!seedKeywords || !Array.isArray(seedKeywords) || seedKeywords.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid seedKeywords array' },
        { status: 400 }
      );
    }

    if (!industry || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: industry, location' },
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

    // Generate keyword strategy
    const result = await orchestrator.generateKeywordStrategy(
      seedKeywords,
      industry,
      location
    );

    return NextResponse.json({
      success: true,
      data: {
        keywordStrategy: result.result,
        metadata: {
          primaryModel: result.primaryModel,
          seedKeywordsCount: seedKeywords.length,
          cost: result.cost,
          processingTime: result.processingTime,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Keyword generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate keywords',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
