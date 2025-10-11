import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { z } from 'zod';
import type { Deal } from '@/types/crm';

const dealUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  value: z.number().optional(),
  stage: z.enum(['lead', 'qualified', 'proposal', 'won', 'lost']).optional(),
  contact_id: z.string().uuid().optional(),
  expected_close_date: z.string().optional(),
});

// GET /api/crm/deals/[id] - Get single deal
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    const { data, error } = await supabase
      .from('crm_deals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Deals API] Get error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    return NextResponse.json({ deal: data as Deal });
  } catch (error: any) {
    console.error('[Deals API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch deal' },
      { status: 500 }
    );
  }
}

// PUT /api/crm/deals/[id] - Update deal
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;
    const body = await request.json();

    // Validate input
    const validatedData = dealUpdateSchema.parse(body);

    const { data, error } = await supabase
      .from('crm_deals')
      .update({ ...validatedData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Deals API] Update error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    return NextResponse.json({ deal: data as Deal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[Deals API] Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update deal' },
      { status: 500 }
    );
  }
}

// DELETE /api/crm/deals/[id] - Delete deal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    const { error } = await supabase
      .from('crm_deals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Deals API] Delete error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Deals API] Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete deal' },
      { status: 500 }
    );
  }
}
