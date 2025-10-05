import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';

// GET /api/gsc/rankings - Get real Google Search Console rankings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const connectionId = searchParams.get('connection_id');
    const companyId = searchParams.get('company_id');
    const keyword = searchParams.get('keyword');
    const device = searchParams.get('device');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('gsc_rankings')
      .select('*')
      .eq('user_id', user.id)
      .order('check_date', { ascending: false })
      .order('position', { ascending: true })
      .limit(limit);

    if (connectionId) {
      query = query.eq('gsc_connection_id', connectionId);
    }

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (keyword) {
      query = query.ilike('keyword', `%${keyword}%`);
    }

    if (device) {
      query = query.eq('device', device);
    }

    const { data: rankings, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate summary stats
    const stats = {
      total_keywords: new Set(rankings.map(r => r.keyword)).size,
      avg_position: rankings.length > 0
        ? rankings.reduce((sum, r) => sum + parseFloat(r.position.toString()), 0) / rankings.length
        : 0,
      total_clicks: rankings.reduce((sum, r) => sum + r.clicks, 0),
      total_impressions: rankings.reduce((sum, r) => sum + r.impressions, 0),
      top_10_keywords: rankings.filter(r => parseFloat(r.position.toString()) <= 10).length,
      top_3_keywords: rankings.filter(r => parseFloat(r.position.toString()) <= 3).length,
    };

    return NextResponse.json({
      rankings,
      stats,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch GSC rankings' },
      { status: 500 }
    );
  }
}
