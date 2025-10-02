import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { EnhancedSEOAuditor } from '@/lib/seo-audit-enhanced';

// GET /api/seo-audits - List all SEO audits
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
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
    const supabase = await createClient();
    const body = await request.json();
    const { company_id, url } = body;

    if (!company_id || !url) {
      return NextResponse.json(
        { error: 'company_id and url are required' },
        { status: 400 }
      );
    }

    // Run the enhanced SEO audit with Lighthouse and Firecrawl
    const auditor = new EnhancedSEOAuditor();
    const auditResults = await auditor.auditWebsite(url, {
      includeLighthouse: true,
      includeFirecrawl: true,
      strategy: 'mobile',
    });

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
