import { NextRequest, NextResponse } from 'next/server';
import { deepseekSEO } from '@/services/api/deepseek-seo';

/**
 * POST /api/deepseek/competitors/find
 *
 * Discover top competitors based on keyword overlap and market positioning
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      domain,
      maxCompetitors = 10
    } = body;

    if (!domain) {
      return NextResponse.json(
        { error: 'domain is required' },
        { status: 400 }
      );
    }

    const competitors = await deepseekSEO.competitors.findCompetitors(
      domain,
      maxCompetitors
    );

    return NextResponse.json({
      success: true,
      domain,
      totalCompetitors: competitors.length,
      competitors
    });
  } catch (error) {
    console.error('Error finding competitors:', error);
    return NextResponse.json(
      {
        error: 'Failed to find competitors',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
