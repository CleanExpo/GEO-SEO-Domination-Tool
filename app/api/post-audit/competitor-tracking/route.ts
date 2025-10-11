import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { z } from 'zod';

const competitorSnapshotSchema = z.object({
  company_id: z.string().uuid('Valid company ID is required'),
  competitor_name: z.string().min(1, 'Competitor name is required'),
  competitor_website: z.string().url('Valid competitor website URL is required').optional(),
  ranking_data: z.record(z.any()).optional(),
  local_pack_position: z.number().int().min(1).max(100).optional(),
  review_count: z.number().int().min(0).optional(),
  avg_rating: z.number().min(0).max(5).optional(),
  review_velocity: z.number().int().optional(),
  domain_authority: z.number().int().min(0).max(100).optional(),
  page_authority: z.number().int().min(0).max(100).optional(),
  backlink_count: z.number().int().min(0).optional(),
  referring_domains: z.number().int().min(0).optional(),
  indexed_pages: z.number().int().min(0).optional(),
  blog_post_count: z.number().int().min(0).optional(),
  last_content_update: z.string().datetime().optional(),
  social_signals: z.record(z.any()).optional(),
  visibility_score: z.number().min(0).max(100).optional(),
  data_source: z.string().optional(),
});

/**
 * GET /api/post-audit/competitor-tracking
 *
 * Retrieves competitor snapshots for a specific company.
 *
 * Query params:
 * - company_id (required): UUID of the company
 * - limit (optional): Number of snapshots to return (default: 50)
 * - offset (optional): Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id query parameter is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch competitor snapshots
    const { data, error, count } = await supabase
      .from('competitor_snapshots')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .order('snapshot_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Competitor Tracking API] Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      snapshots: data || [],
      total: count || 0,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('[Competitor Tracking API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch competitor snapshots' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/post-audit/competitor-tracking
 *
 * Creates a new competitor snapshot for tracking.
 *
 * Body:
 * - company_id: UUID of the company being tracked
 * - competitor_name: Name of the competitor
 * - competitor_website: URL of competitor's website
 * - Additional metrics (optional): rankings, reviews, backlinks, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = competitorSnapshotSchema.parse(body);

    const supabase = createAdminClient();

    // Insert competitor snapshot
    const { data, error } = await supabase
      .from('competitor_snapshots')
      .insert([{
        ...validatedData,
        snapshot_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('[Competitor Tracking API] Insert error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { snapshot: data },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Competitor Tracking API] Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to create competitor snapshot' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/post-audit/competitor-tracking
 *
 * Updates an existing competitor snapshot.
 *
 * Body:
 * - id: UUID of the snapshot to update
 * - Updates to metrics (optional): rankings, reviews, etc.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Snapshot ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('competitor_snapshots')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Competitor Tracking API] Update error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Snapshot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ snapshot: data });
  } catch (error: any) {
    console.error('[Competitor Tracking API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update competitor snapshot' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/post-audit/competitor-tracking
 *
 * Deletes a competitor snapshot.
 *
 * Body:
 * - id: UUID of the snapshot to delete
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Snapshot ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('competitor_snapshots')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Competitor Tracking API] Delete error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Competitor Tracking API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete competitor snapshot' },
      { status: 500 }
    );
  }
}
