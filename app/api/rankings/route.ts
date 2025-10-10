import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { GoogleSearchClient } from '@/lib/api-clients';
import { z } from 'zod';

const rankingSchema = z.object({
  company_id: z.string().uuid(),
  keyword_id: z.string().uuid(),
  url: z.string().url(),
  location: z.string().default('us'),
  search_engine: z.enum(['google', 'bing']).default('google'),
});

// GET /api/rankings - List all rankings
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('company_id');
    const keywordId = searchParams.get('keyword_id');

    let query = supabase
      .from('rankings')
      .select('*, keywords(*)')
      .order('checked_at', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (keywordId) {
      query = query.eq('keyword_id', keywordId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rankings: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
}

// POST /api/rankings - Check ranking for a keyword
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const validatedData = rankingSchema.parse(body);

    // Get the keyword
    const { data: keyword, error: keywordError } = await supabase
      .from('keywords')
      .select('*')
      .eq('id', validatedData.keyword_id)
      .single();

    if (keywordError) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    let position = 0;

    // Try to get ranking from Google Search API if available
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (googleApiKey && validatedData.search_engine === 'google') {
      try {
        const googleSearch = new GoogleSearchClient(googleApiKey);
        const results = await googleSearch.search(keyword.keyword, validatedData.location);

        // Find position of the URL in search results
        if (results.items) {
          const foundIndex = results.items.findIndex((item: any) =>
            item.link.includes(new URL(validatedData.url).hostname)
          );
          position = foundIndex >= 0 ? foundIndex + 1 : 0;
        }
      } catch (err) {
        console.error('Google Search API error:', err);
        // Continue with position 0 if API fails
      }
    }

    const { data, error } = await supabase
      .from('rankings')
      .insert([
        {
          keyword_id: validatedData.keyword_id,
          company_id: validatedData.company_id,
          url: validatedData.url,
          position,
          checked_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ranking: data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create ranking' },
      { status: 500 }
    );
  }
}
