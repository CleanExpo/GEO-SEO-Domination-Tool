import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { z } from 'zod';

const keywordSchema = z.object({
  company_id: z.string().uuid(),
  keyword: z.string().min(1, 'Keyword is required'),
});

// GET /api/keywords - List all keywords
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
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
    const supabase = createAdminClient();
    const body = await request.json();
    const validatedData = keywordSchema.parse(body);

    // Note: Keyword enrichment data (search volume, CPC, difficulty) can be added
    // via Google Keyword Planner API or other sources if needed in the future.
    // For now, keywords are created without enrichment data.

    const { data, error} = await supabase
      .from('keywords')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      console.error('[Keywords API] Database insert failed:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ keyword: data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[Keywords API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to create keyword' },
      { status: 500 }
    );
  }
}
