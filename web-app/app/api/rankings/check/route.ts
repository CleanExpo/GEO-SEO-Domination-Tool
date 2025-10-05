import { NextRequest, NextResponse } from 'next/server';
import { rankingChecker } from '@/lib/services/ranking-checker';

// POST /api/rankings/check - Check ranking for a specific keyword
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword_id, company_id } = body;

    if (!keyword_id || !company_id) {
      return NextResponse.json(
        { error: 'keyword_id and company_id are required' },
        { status: 400 }
      );
    }

    console.log(`[Rankings Check API] Starting ranking check for keyword: ${keyword_id}, company: ${company_id}`);

    // Check Google API configuration
    const hasGoogleAPI = !!(
      (process.env.GOOGLE_API_KEY || process.env.GOOGLE_SEARCH_API_KEY) &&
      (process.env.GOOGLE_SEARCH_ENGINE_ID || process.env.GOOGLE_CSE_ID)
    );

    if (!hasGoogleAPI) {
      console.warn('[Rankings Check API] Google Custom Search API not configured - using web scraping (less reliable)');
      console.warn('[Rankings Check API] To configure: Set GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID in environment variables');
      console.warn('[Rankings Check API] Instructions: https://developers.google.com/custom-search/v1/introduction');
    }

    // Run ranking check
    try {
      await rankingChecker.checkAllRankings(keyword_id, company_id);
      console.log(`[Rankings Check API] Ranking check completed successfully for keyword: ${keyword_id}`);
    } catch (checkError: any) {
      console.error('[Rankings Check API] Ranking check execution failed:', {
        keyword_id,
        company_id,
        error: checkError.message || 'Unknown error'
      });

      // Return more specific error
      if (checkError.message?.includes('Keyword not found')) {
        return NextResponse.json(
          { error: 'Keyword not found', keyword_id },
          { status: 404 }
        );
      } else if (checkError.message?.includes('Company not found')) {
        return NextResponse.json(
          { error: 'Company not found', company_id },
          { status: 404 }
        );
      }

      throw checkError;
    }

    return NextResponse.json(
      {
        message: 'Ranking check completed successfully',
        api_status: {
          google_api: hasGoogleAPI ? 'configured' : 'not_configured',
          method: hasGoogleAPI ? 'api' : 'web_scraping'
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Rankings Check API] Unexpected error:', error.message || error);
    return NextResponse.json(
      { error: `Failed to check rankings: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
