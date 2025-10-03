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

    // Map database records to frontend format
    const audits = data.map((audit: any) => ({
      id: audit.id,
      company_id: audit.company_id,
      url: audit.url,
      audit_date: audit.created_at,
      seo_score: audit.overall_score,
      critical_issues: audit.metadata?.critical_issues || [],
      warnings: audit.metadata?.warnings || [],
      recommendations: audit.recommendations || [],
    }));

    return NextResponse.json({ audits });
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

    if (!url) {
      return NextResponse.json(
        { error: 'url is required' },
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

    // Map the audit results to database schema
    const dbRecord = {
      company_id: company_id || null,
      url: auditResults.url,
      overall_score: auditResults.score,
      performance_score: auditResults.performance_score,
      seo_score: auditResults.seo_score,
      accessibility_score: auditResults.accessibility_score,
      best_practices_score: auditResults.extended_data?.best_practices_score || null,
      issues: auditResults.issues || [],
      recommendations: auditResults.extended_data?.recommendations || [],
      metadata: {
        title: auditResults.title,
        meta_description: auditResults.meta_description,
        h1_tags: auditResults.h1_tags,
        eeat_scores: auditResults.extended_data?.eeat_scores,
        lighthouse_data: auditResults.extended_data?.lighthouse_data,
        crawl_data: auditResults.extended_data?.crawl_data,
        critical_issues: auditResults.extended_data?.critical_issues,
        warnings: auditResults.extended_data?.warnings,
      }
    };

    // Save to database
    const { data, error } = await supabase
      .from('seo_audits')
      .insert([dbRecord])
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
