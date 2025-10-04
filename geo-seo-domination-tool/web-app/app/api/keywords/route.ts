import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { SEMrushClient } from '@/lib/api-clients';
import { z } from 'zod';

const keywordSchema = z.object({
  company_id: z.string().uuid(),
  keyword: z.string().min(1, 'Keyword is required'),
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
    const body = await request.json();
    const validatedData = keywordSchema.parse(body);

    // Optionally fetch keyword data from SEMrush if API key is available
    let keywordData = {};
    const semrushApiKey = process.env.SEMRUSH_API_KEY;

    if (semrushApiKey) {
      try {
        const semrush = new SEMrushClient(semrushApiKey);
        const apiData = await semrush.getKeywordData(validatedData.keyword);

        // Parse SEMrush response (format: keyword;volume;cpc;difficulty)
        if (apiData) {
          const lines = apiData.split('\n');
          if (lines.length > 1) {
            const values = lines[1].split(';');
            keywordData = {
              search_volume: parseInt(values[1]) || undefined,
              cpc: parseFloat(values[2]) || undefined,
              difficulty: parseFloat(values[3]) || undefined,
            };
          }
        }
      } catch (err) {
        console.error('SEMrush API error:', err);
        // Continue without SEMrush data
      }
    }

    const { data, error } = await supabase
      .from('keywords')
      .insert([
        {
          ...validatedData,
          ...keywordData,
        },
      ])
      .select()
      .single();

    if (error) {
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
    return NextResponse.json(
      { error: 'Failed to create keyword' },
      { status: 500 }
    );
  }
}
