import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { SEMrushClient } from '@/lib/api-clients';
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

    // Optionally fetch keyword data from SEMrush if API key is available
    let keywordData = {};
    let enrichmentStatus = 'not_attempted';
    const semrushApiKey = process.env.SEMRUSH_API_KEY;

    if (!semrushApiKey) {
      console.warn('[Keywords API] SEMRUSH_API_KEY not configured - keyword will be created without enrichment data');
      enrichmentStatus = 'no_api_key';
    } else {
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
            enrichmentStatus = 'success';

          } else {
            console.warn(`[Keywords API] SEMrush returned no data for keyword "${validatedData.keyword}"`);
            enrichmentStatus = 'no_data';
          }
        }
      } catch (err: any) {
        console.error('[Keywords API] SEMrush enrichment failed:', {
          keyword: validatedData.keyword,
          error: err.message || 'Unknown error',
          code: err.response?.status,
        });
        enrichmentStatus = 'failed';
        // Continue without SEMrush data - this is a graceful fallback
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
      console.error('[Keywords API] Database insert failed:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Include enrichment status in response for debugging
    return NextResponse.json({
      keyword: data,
      enrichment: {
        status: enrichmentStatus,
        hasData: Object.keys(keywordData).length > 0,
      }
    }, { status: 201 });
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
