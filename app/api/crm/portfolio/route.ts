import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { z } from 'zod';
import type { PortfolioItem } from '@/types/crm';

const portfolioSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  contact_id: z.string().uuid().optional(),
  metrics: z.record(z.string()).optional(),
  images: z.array(z.string()).optional(),
  featured: z.boolean().default(false),
});

// GET /api/crm/portfolio - List all portfolio items
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    const contact_id = searchParams.get('contact_id');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('crm_portfolio')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (contact_id) {
      query = query.eq('contact_id', contact_id);
    }
    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[Portfolio API] Supabase error:', error);
      return NextResponse.json(
        { items: [], total: 0, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      items: data as PortfolioItem[] || [],
      total: count || 0,
    });
  } catch (error: any) {
    console.error('[Portfolio API] Fatal error:', error);
    return NextResponse.json(
      { items: [], total: 0, error: error.message || 'Failed to fetch portfolio items' },
      { status: 500 }
    );
  }
}

// POST /api/crm/portfolio - Create a new portfolio item
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    // Validate input
    const validatedData = portfolioSchema.parse(body);

    const { data, error } = await supabase
      .from('crm_portfolio')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      console.error('[Portfolio API] Insert error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ item: data as PortfolioItem }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[Portfolio API] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create portfolio item' },
      { status: 500 }
    );
  }
}
