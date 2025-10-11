import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { z } from 'zod';
import type { PortfolioItem } from '@/types/crm';

const portfolioUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  contact_id: z.string().uuid().optional(),
  metrics: z.record(z.string()).optional(),
  images: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
});

// GET /api/crm/portfolio/[id] - Get single portfolio item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    const { data, error } = await supabase
      .from('crm_portfolio')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Portfolio API] Get error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    return NextResponse.json({ item: data as PortfolioItem });
  } catch (error: any) {
    console.error('[Portfolio API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch portfolio item' },
      { status: 500 }
    );
  }
}

// PUT /api/crm/portfolio/[id] - Update portfolio item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;
    const body = await request.json();

    // Validate input
    const validatedData = portfolioUpdateSchema.parse(body);

    const { data, error } = await supabase
      .from('crm_portfolio')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Portfolio API] Update error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    return NextResponse.json({ item: data as PortfolioItem });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[Portfolio API] Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update portfolio item' },
      { status: 500 }
    );
  }
}

// DELETE /api/crm/portfolio/[id] - Delete portfolio item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    const { error } = await supabase
      .from('crm_portfolio')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Portfolio API] Delete error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Portfolio API] Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete portfolio item' },
      { status: 500 }
    );
  }
}
