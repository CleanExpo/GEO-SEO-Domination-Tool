import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';

// GET /api/analytics/export - Export analytics data
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    const format = searchParams.get('format') || 'json';
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    // Fetch companies with audit data
    let query = supabase
      .from('companies')
      .select(`
        id,
        name,
        website,
        created_at,
        audits (
          id,
          performance_score,
          accessibility_score,
          best_practices_score,
          seo_score,
          created_at
        )
      `);

    const { data: companies, error } = await query;

    if (error) {
      console.error('[Analytics Export API] Error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (format === 'csv') {
      // Generate CSV
      const csvRows = [
        'Company,Website,Performance Score,Accessibility Score,Best Practices Score,SEO Score,Audit Date'
      ];

      companies?.forEach((company: any) => {
        company.audits?.forEach((audit: any) => {
          csvRows.push([
            company.name,
            company.website,
            audit.performance_score || 0,
            audit.accessibility_score || 0,
            audit.best_practices_score || 0,
            audit.seo_score || 0,
            audit.created_at,
          ].join(','));
        });
      });

      const csv = csvRows.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="analytics-export.csv"',
        },
      });
    }

    // Return JSON format
    return NextResponse.json({ data: companies || [] });
  } catch (error: any) {
    console.error('[Analytics Export API] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export analytics' },
      { status: 500 }
    );
  }
}
