import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SEOAuditor } from '@/lib/seo-audit';

// GET /api/seo-audits - List all SEO audits
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('company_id');

    let query = supabase.from('seo_audits').select('*').order('created_at', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ audits: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch SEO audits' },
      { status: 500 }
    );
  }
}

// POST /api/seo-audits - Create a new SEO audit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company_id, url } = body;

    if (!company_id || !url) {
      return NextResponse.json(
        { error: 'company_id and url are required' },
        { status: 400 }
      );
    }

    // Run the SEO audit
    const auditor = new SEOAuditor();
    const auditResults = await auditor.auditWebsite(url);

    // Save to database
    const { data, error } = await supabase
      .from('seo_audits')
      .insert([
        {
          company_id,
          ...auditResults,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ audit: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to create SEO audit: ${error}` },
      { status: 500 }
    );
  }
}
