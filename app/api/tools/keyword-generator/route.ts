/**
 * Free Keyword Generator API - Public Tool
 *
 * POST /api/tools/keyword-generator
 * Body: { seed: string }
 *
 * Returns:
 * - 20 keyword suggestions (free tier)
 * - Full data (volume, difficulty) for top 5 keywords
 * - Limited data for remaining 15 keywords
 */

import { NextRequest, NextResponse } from 'next/server';
import { KeywordResearch } from '@/services/api/keyword-research';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seed } = body;

    if (!seed) {
      return NextResponse.json(
        { error: 'seed keyword is required' },
        { status: 400 }
      );
    }

    console.log(`[Free Keyword Generator] Generating from: ${seed}`);

    // Generate keyword suggestions
    const kr = new KeywordResearch();
    const allKeywords = await kr.expandKeywords(seed, 20); // Generate 20 for free tier

    // Sort by relevance
    allKeywords.sort((a, b) => b.relevance - a.relevance);

    // Top 5 get full data, rest get limited data
    const freeKeywords = allKeywords.map((kw, idx) => {
      if (idx < 5) {
        // Full data for top 5
        return {
          keyword: kw.keyword,
          searchVolume: kw.searchVolume,
          difficulty: kw.difficulty,
          relevance: kw.relevance,
        };
      } else {
        // Limited data for rest
        return {
          keyword: kw.keyword,
          relevance: kw.relevance,
          // Omit searchVolume and difficulty to encourage upgrade
        };
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        seed,
        keywords: freeKeywords,
        totalFound: 100, // Hint that paid version has 100+
      },
    });
  } catch (error: any) {
    console.error('[Free Keyword Generator] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate keywords' },
      { status: 500 }
    );
  }
}
