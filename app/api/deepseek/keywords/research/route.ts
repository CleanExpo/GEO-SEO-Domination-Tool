import { NextRequest, NextResponse } from 'next/server';
import { deepseekSEO } from '@/services/api/deepseek-seo';

/**
 * POST /api/deepseek/keywords/research
 *
 * AI-powered keyword research with volume estimation and difficulty scoring
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      seedKeyword,
      country = 'US',
      language = 'en',
      includeQuestions = true,
      includeLongTail = true,
      maxKeywords = 50
    } = body;

    if (!seedKeyword) {
      return NextResponse.json(
        { error: 'seedKeyword is required' },
        { status: 400 }
      );
    }

    const keywords = await deepseekSEO.keywords.researchKeywords(seedKeyword, {
      country,
      language,
      includeQuestions,
      includeLongTail,
      maxKeywords
    });

    return NextResponse.json({
      success: true,
      seedKeyword,
      country,
      language,
      totalKeywords: keywords.length,
      keywords
    });
  } catch (error) {
    console.error('Error in keyword research:', error);
    return NextResponse.json(
      {
        error: 'Failed to research keywords',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
