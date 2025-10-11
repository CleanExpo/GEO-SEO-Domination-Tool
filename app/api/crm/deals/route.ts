import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { z } from 'zod';
import type { Deal } from '@/types/crm';

const dealSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  value: z.number().optional(),
  stage: z.enum(['lead', 'qualified', 'proposal', 'won', 'lost']),
  contact_id: z.string().uuid().optional(),
  expected_close_date: z.string().optional(),
});

// GET /api/crm/deals - List all deals
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    const stage = searchParams.get('stage');
    const contact_id = searchParams.get('contact_id');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('crm_deals')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (stage) {
      query = query.eq('stage', stage);
    }
    if (contact_id) {
      query = query.eq('contact_id', contact_id);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[Deals API] Supabase error:', error);
      return NextResponse.json(
        { deals: [], total: 0, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      deals: data as Deal[] || [],
      total: count || 0,
    });
  } catch (error: any) {
    console.error('[Deals API] Fatal error:', error);
    return NextResponse.json(
      { deals: [], total: 0, error: error.message || 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}

// POST /api/crm/deals - Create a new deal
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    // Validate input
    const validatedData = dealSchema.parse(body);

    const { data, error } = await supabase
      .from('crm_deals')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      console.error('[Deals API] Insert error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ deal: data as Deal }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[Deals API] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create deal' },
      { status: 500 }
    );
  }
}
