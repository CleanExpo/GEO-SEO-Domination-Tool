import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';

// GET /api/analytics - Get aggregate analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const metric = searchParams.get('metric');

    // Fetch companies count
    const { count: companiesCount } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });

    // Fetch audits count
    let auditsQuery = supabase
      .from('audits')
      .select('*', { count: 'exact', head: true });

    if (start_date) {
      auditsQuery = auditsQuery.gte('created_at', start_date);
    }
    if (end_date) {
      auditsQuery = auditsQuery.lte('created_at', end_date);
    }

    const { count: auditsCount } = await auditsQuery;

    // Fetch average audit score
    const { data: audits } = await supabase
      .from('audits')
      .select('performance_score, accessibility_score, best_practices_score, seo_score');

    const avgScores = audits?.reduce(
      (acc, audit) => ({
        performance: acc.performance + (audit.performance_score || 0),
        accessibility: acc.accessibility + (audit.accessibility_score || 0),
        best_practices: acc.best_practices + (audit.best_practices_score || 0),
        seo: acc.seo + (audit.seo_score || 0),
      }),
      { performance: 0, accessibility: 0, best_practices: 0, seo: 0 }
    );

    const auditCount = audits?.length || 1;

    return NextResponse.json({
      summary: {
        total_companies: companiesCount || 0,
        total_audits: auditsCount || 0,
        avg_performance_score: Math.round((avgScores?.performance || 0) / auditCount),
        avg_accessibility_score: Math.round((avgScores?.accessibility || 0) / auditCount),
        avg_best_practices_score: Math.round((avgScores?.best_practices || 0) / auditCount),
        avg_seo_score: Math.round((avgScores?.seo || 0) / auditCount),
      },
      metrics: [], // TODO: Implement detailed metrics
    });
  } catch (error: any) {
    console.error('[Analytics API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
