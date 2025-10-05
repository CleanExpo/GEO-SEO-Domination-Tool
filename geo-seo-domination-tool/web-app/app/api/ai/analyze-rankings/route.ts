import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { deepseekService } from '@/services/ai/deepseek-service';

// POST /api/ai/analyze-rankings - Get AI insights on ranking data
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { rankings, stats } = body;

    if (!rankings || !Array.isArray(rankings)) {
      return NextResponse.json(
        { error: 'rankings array is required' },
        { status: 400 }
      );
    }

    // Use DeepSeek to analyze the ranking data
    const insights = await deepseekService.analyzeRankingData({
      rankings,
      stats,
    });

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: `Failed to generate insights: ${error}` },
      { status: 500 }
    );
  }
}
