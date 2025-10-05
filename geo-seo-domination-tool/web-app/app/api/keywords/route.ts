import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { keywordService } from '@/services/keyword-research';
import { z } from 'zod';

const keywordSchema = z.object({
  company_id: z.string().uuid(),
  keyword: z.string().min(1, 'Keyword is required'),
  location: z.string().optional(),
});

// GET /api/keywords - List all keywords
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('company_id');

    let query = supabase.from('keywords').select('*').order('created_at', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ keywords: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch keywords' },
      { status: 500 }
    );
  }
}

// POST /api/keywords - Create a new keyword with research data
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = keywordSchema.parse(body);

    // Fetch keyword data using multi-source fallback service
    const keywordData = await keywordService.getKeywordData(validatedData.keyword);

    const { data, error } = await supabase
      .from('keywords')
      .insert([
        {
          company_id: validatedData.company_id,
          keyword: keywordData.keyword,
          search_volume: keywordData.search_volume,
          difficulty: keywordData.difficulty,
          user_id: user.id,
          // Store additional data in metadata (cpc, competition, location, source)
          metadata: {
            cpc: keywordData.cpc,
            competition: keywordData.competition,
            location: validatedData.location,
            source: keywordData.source,
            fetched_at: new Date().toISOString(),
          },
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      keyword: data,
      meta: {
        source: keywordData.source,
        note: keywordData.source === 'mock' ? 'Using mock data - configure API keys for real data' : undefined,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create keyword' },
      { status: 500 }
    );
  }
}
