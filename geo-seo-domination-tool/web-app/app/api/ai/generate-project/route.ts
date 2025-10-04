/**
 * AI Project Generation API Route
 *
 * POST /api/ai/generate-project
 *
 * Generates comprehensive SEO project structure using AI orchestration:
 * - Primary: DeepSeek V3.2-Exp (cost-effective bulk generation)
 * - Enhancement: Claude Sonnet (engineering refinement)
 * - Real-time data: Perplexity (competitive research)
 */

import { NextRequest, NextResponse } from 'next/server';
import { AIOrchestrator } from '@/services/api/ai-orchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, industry, location, goals, enhance = false } = body;

    // Validation
    if (!domain || !industry || !location || !goals) {
      return NextResponse.json(
        { error: 'Missing required fields: domain, industry, location, goals' },
        { status: 400 }
      );
    }

    // Initialize AI orchestrator with available API keys
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const perplexityKey = process.env.PERPLEXITY_API_KEY;

    if (!openrouterKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY not configured. Please add to environment variables.' },
        { status: 500 }
      );
    }

    const orchestrator = new AIOrchestrator(openrouterKey, claudeKey, perplexityKey);

    // Generate project structure
    const result = await orchestrator.generateProject(domain, industry, location, goals, {
      enhance,
    });

    return NextResponse.json({
      success: true,
      data: {
        project: result.result,
        metadata: {
          primaryModel: result.primaryModel,
          enhancementModel: result.enhancementModel,
          cost: result.cost,
          processingTime: result.processingTime,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Project generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate project',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
