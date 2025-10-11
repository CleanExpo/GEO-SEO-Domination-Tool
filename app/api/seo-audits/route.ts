import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { EnhancedSEOAuditor } from '@/lib/seo-audit-enhanced';
import { auditLimiter } from '@/lib/rate-limiter';

// Simple in-memory cache for audit results (5 minute TTL)
const auditCache = new Map<string, { data: any; expires: number }>();

// GET /api/seo-audits - List all SEO audits (with caching)
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('company_id');

    // Check cache
    const cacheKey = `audits:${companyId || 'all'}`;
    const cached = auditCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json(cached.data, {
        headers: { 'X-Cache': 'HIT' },
      });
    }

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
      created_at: audit.created_at,
      score: audit.overall_score,
      seo_score: audit.seo_score,
      performance_score: audit.performance_score,
      accessibility_score: audit.accessibility_score,
      title: audit.metadata?.title,
      meta_description: audit.metadata?.meta_description,
      h1_tags: audit.metadata?.h1_tags || [],
      issues: audit.issues || [],
      critical_issues: audit.metadata?.critical_issues || [],
      warnings: audit.metadata?.warnings || [],
      recommendations: audit.recommendations || [],
    }));

    const responseData = { audits };

    // Cache for 5 minutes
    auditCache.set(cacheKey, {
      data: responseData,
      expires: Date.now() + 5 * 60 * 1000,
    });

    return NextResponse.json(responseData, {
      headers: { 'X-Cache': 'MISS' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch SEO audits' },
      { status: 500 }
    );
  }
}

// POST /api/seo-audits - Create a new SEO audit (with rate limiting)
export async function POST(request: NextRequest) {
  try {
    // Use admin client to bypass RLS for server-side audit operations
    const supabase = createAdminClient();
    const body = await request.json();
    const { company_id, url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'url is required' },
        { status: 400 }
      );
    }

    // Rate limiting: 5 audits per minute per company
    const rateLimitKey = company_id || 'anonymous';
    if (!auditLimiter.check(rateLimitKey)) {
      const info = auditLimiter.getInfo(rateLimitKey);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many audit requests. Please wait before trying again.',
          retryAfter: info ? Math.ceil((info.resetTime - Date.now()) / 1000) : 60,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(info ? Math.ceil((info.resetTime - Date.now()) / 1000) : 60),
          },
        }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    console.log(`[SEO Audits API] Starting audit for ${url}`);

    // Check API key availability (GOOGLE_SPEED_KEY is the primary Vercel key)
    const hasLighthouse = !!(process.env.GOOGLE_SPEED_KEY ||
                             process.env.GOOGLE_PAGESPEED_API_KEY ||
                             process.env.GOOGLE_API_KEY);
    const hasFirecrawl = !!process.env.FIRECRAWL_API_KEY;

    if (!hasLighthouse && !hasFirecrawl) {
      console.warn('[SEO Audits API] No API keys configured - using basic audit only');
    } else {
      console.log('[SEO Audits API] API keys available:', {
        lighthouse: hasLighthouse,
        firecrawl: hasFirecrawl
      });
    }

    // Run the enhanced SEO audit with Lighthouse and Firecrawl
    const auditor = new EnhancedSEOAuditor();
    let auditResults;

    try {
      auditResults = await auditor.auditWebsite(url, {
        includeLighthouse: hasLighthouse,
        includeFirecrawl: hasFirecrawl,
        strategy: 'mobile',
      });
    } catch (auditError: any) {
      console.error('[SEO Audits API] Audit execution failed:', auditError.message || auditError);
      return NextResponse.json(
        {
          error: 'Failed to complete SEO audit',
          details: auditError.message || 'Unknown error during audit execution',
          hasLighthouse,
          hasFirecrawl
        },
        { status: 500 }
      );
    }

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
        api_status: {
          lighthouse: hasLighthouse ? (auditResults.extended_data?.lighthouse_data ? 'success' : 'failed') : 'not_configured',
          firecrawl: hasFirecrawl ? (auditResults.extended_data?.crawl_data ? 'success' : 'failed') : 'not_configured',
        }
      }
    };

    // Save to database
    const { data, error } = await supabase
      .from('seo_audits')
      .insert([dbRecord])
      .select()
      .single();

    if (error) {
      console.error('[SEO Audits API] Database insert failed:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[SEO Audits API] Audit completed successfully for ${url}, ID: ${data.id}`);

    // Invalidate cache for this company
    if (company_id) {
      auditCache.delete(`audits:${company_id}`);
    }
    auditCache.delete('audits:all');

    // Trigger post-audit webhook asynchronously (don't wait for it)
    fetch(`${request.nextUrl.origin}/api/webhooks/audit-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auditId: data.id,
        companyId: company_id,
        score: data.overall_score,
        issues: data.issues || [],
        recommendations: data.recommendations || [],
      }),
    }).catch((err) => {
      console.error('[SEO Audits API] Failed to trigger webhook:', err);
    });

    return NextResponse.json({
      audit: data,
      integrations: {
        lighthouse: hasLighthouse,
        firecrawl: hasFirecrawl
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('[SEO Audits API] Unexpected error:', error.message || error);
    return NextResponse.json(
      { error: `Failed to create SEO audit: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
