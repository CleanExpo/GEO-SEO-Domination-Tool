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

    // Run ranking check
    await rankingChecker.checkAllRankings(keyword_id, company_id);

    return NextResponse.json(
      { message: 'Ranking check completed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ranking check error:', error);
    return NextResponse.json(
      { error: `Failed to check rankings: ${error}` },
      { status: 500 }
    );
  }
}
