import { NextRequest, NextResponse } from 'next/server';
import { deepseekSEO } from '@/services/api/deepseek-seo';

/**
 * POST /api/deepseek/competitors/analyze
 *
 * Comprehensive competitor analysis with keyword gaps and opportunities
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      competitorDomain,
      yourDomain,
      country = 'US'
    } = body;

    if (!competitorDomain) {
      return NextResponse.json(
        { error: 'competitorDomain is required' },
        { status: 400 }
      );
    }

    const analysis = await deepseekSEO.competitors.analyzeCompetitor(
      competitorDomain,
      yourDomain,
      country
    );

    return NextResponse.json({
      success: true,
      competitorDomain,
      yourDomain,
      country,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing competitor:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze competitor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
