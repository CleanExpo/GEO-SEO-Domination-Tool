/**
 * AI Competitor Analysis API Route
 *
 * POST /api/ai/analyze-competitors
 *
 * Analyzes competitive landscape using Perplexity + DeepSeek
 */

import { NextRequest, NextResponse } from 'next/server';
import { AIOrchestrator } from '@/services/api/ai-orchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { competitors, domain, industry, location } = body;

    // Validation
    if (!competitors || !Array.isArray(competitors) || competitors.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid competitors array' },
        { status: 400 }
      );
    }

    if (!domain || !industry || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: domain, industry, location' },
        { status: 400 }
      );
    }

    // Initialize AI orchestrator
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const perplexityKey = process.env.PERPLEXITY_API_KEY;

    if (!openrouterKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY not configured' },
        { status: 500 }
      );
    }

    const orchestrator = new AIOrchestrator(openrouterKey, undefined, perplexityKey);

    // Analyze competition
    const result = await orchestrator.analyzeCompetition(
      competitors,
      domain,
      industry,
      location
    );

    return NextResponse.json({
      success: true,
      data: {
        analysis: result.result,
        metadata: {
          primaryModel: result.primaryModel,
          competitorsCount: competitors.length,
          cost: result.cost,
          processingTime: result.processingTime,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Competitor analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze competitors',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
