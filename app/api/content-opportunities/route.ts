/**
 * GET /api/content-opportunities - List all content opportunities
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const minScore = searchParams.get('minScore');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createAdminClient();

    // Build query with filters
    let query = supabase
      .from('content_opportunities')
      .select('*, companies!inner(name)', { count: 'exact' });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (minScore) {
      query = query.gte('opportunity_score', parseFloat(minScore));
    }

    // Apply ordering, limit, and offset
    query = query
      .order('opportunity_score', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: opportunities, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch opportunities: ${error.message}`);
    }

    // Note: JSONB fields are already parsed by Supabase
    // No need to manually parse intents, top_questions, etc.

    return NextResponse.json({
      opportunities: opportunities || [],
      total: count || 0,
      limit,
      offset
    });

  } catch (error: any) {
    console.error('Failed to fetch content opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content opportunities', details: error.message },
      { status: 500 }
    );
  }
}
