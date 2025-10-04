import { NextRequest, NextResponse } from 'next/server';
import { rankingChecker } from '@/lib/services/ranking-checker';

// POST /api/rankings/check-company - Check all rankings for a company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company_id } = body;

    if (!company_id) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      );
    }

    // Run batch ranking check for all company keywords
    await rankingChecker.checkCompanyKeywords(company_id);

    return NextResponse.json(
      { message: 'All keyword rankings checked successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Company ranking check error:', error);
    return NextResponse.json(
      { error: `Failed to check company rankings: ${error}` },
      { status: 500 }
    );
  }
}
