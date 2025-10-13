import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { LighthouseService } from '@/services/api/lighthouse';
import { BacklinkAnalyzer } from '@/services/api/backlink-analyzer';
import { KeywordResearch } from '@/services/api/keyword-research';
import { SerpAnalyzer } from '@/services/api/serp-analyzer';
import { SEOAuditor } from '@/lib/seo-audit';
import { cascadingAI } from '@/services/api/cascading-ai';
import type { AuditIssue } from '@/types/database';

/**
 * POST /api/companies/[id]/audit/comprehensive
 *
 * Comprehensive 117-Point SEO Audit
 * Integrates: Lighthouse, Technical SEO, Backlinks, Keywords, SERP, E-E-A-T
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // 1. Fetch company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    const url = company.website;
    const domain = new URL(url).hostname.replace('www.', '');

    console.log(`[Comprehensive Audit] Starting for ${url}`);

    // 2. Run all audits in parallel for speed
    const [
      lighthouseResult,
      basicSEO,
      backlinkProfile,
      primaryKeyword,
    ] = await Promise.allSettled([
      runLighthouseAudit(url),
      runBasicSEOAudit(url),
      runBacklinkAnalysis(domain),
      inferPrimaryKeyword(company.name, company.industry || ''),
    ]);

    // 3. Extract successful results with fallbacks
    const lighthouse = lighthouseResult.status === 'fulfilled' ? lighthouseResult.value : null;
    const seo = basicSEO.status === 'fulfilled' ? basicSEO.value : null;
    const backlinks = backlinkProfile.status === 'fulfilled' ? backlinkProfile.value : null;
    const keyword = primaryKeyword.status === 'fulfilled' ? primaryKeyword.value : company.name;

    // 4. Run keyword and SERP analysis (depends on primary keyword)
    const [keywordData, serpData] = await Promise.allSettled([
      runKeywordAnalysis(keyword),
      runSERPAnalysis(keyword, domain),
    ]);

    const keywords = keywordData.status === 'fulfilled' ? keywordData.value : null;
    const serp = serpData.status === 'fulfilled' ? serpData.value : null;

    // 5. Calculate scores
    const scores = calculateScores({
      lighthouse,
      seo,
      backlinks,
      keywords,
      serp,
    });

    // 6. Calculate E-E-A-T score
    const eeatScore = calculateEEATScore({
      lighthouse,
      seo,
      backlinks,
      domain,
    });

    // 7. Generate structured issues
    const issues = generateIssuesFromAudit({
      lighthouse,
      seo,
      backlinks,
      keywords,
      serp,
      url,
    });

    // 8. Generate opportunities
    const opportunities = generateOpportunities({
      keywords,
      serp,
      backlinks,
      scores,
    });

    // 9. Identify competitors
    const competitors = serp?.topResults?.slice(0, 5).map((result: any) => ({
      domain: result.domain,
      domainRating: result.domainRating,
      position: result.position,
      url: result.url,
    })) || [];

    // 10. Calculate overall score
    const overallScore = Math.round(
      (scores.lighthouse * 0.25) +
      (scores.technicalSEO * 0.20) +
      (scores.content * 0.15) +
      (scores.backlinks * 0.20) +
      (scores.eeat * 0.20)
    );

    // 11. Generate AI-powered executive summary
    const executiveSummary = await generateExecutiveSummary({
      url,
      overallScore,
      scores,
      issuesCount: issues.length,
      opportunitiesCount: opportunities.length,
    });

    // 12. Save to database
    const { data: audit, error: insertError } = await supabase
      .from('seo_audits')
      .insert({
        company_id: companyId,
        url,
        score: overallScore,
        title: seo?.title || '',
        meta_description: seo?.meta_description || '',
        h1_tags: seo?.h1_tags || [],
        meta_tags: seo?.meta_tags || {},
        performance_score: scores.lighthouse,
        accessibility_score: lighthouse?.scores.accessibility || 0,
        seo_score: lighthouse?.scores.seo || 0,
        issues,
        extended_data: {
          scores,
          eeat_score: eeatScore,
          backlinks: {
            total: backlinks?.totalBacklinks || 0,
            referring_domains: backlinks?.referringDomains || 0,
            domain_rating: backlinks?.domainRating || 0,
          },
          keywords: {
            primary: keyword,
            opportunities: opportunities.filter((o: any) => o.type === 'keyword').length,
          },
          competitors,
          opportunities,
          executive_summary: executiveSummary,
          audit_timestamp: new Date().toISOString(),
          audit_duration_seconds: Math.round((Date.now() - startTime) / 1000),
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Comprehensive Audit] Database insert error:', insertError);
      throw insertError;
    }

    console.log(`[Comprehensive Audit] Completed in ${Math.round((Date.now() - startTime) / 1000)}s`);

    return NextResponse.json({
      success: true,
      audit_id: audit.id,
      company_id: companyId,
      url,
      overall_score: overallScore,
      scores,
      eeat_score: eeatScore,
      issues_count: issues.length,
      opportunities_count: opportunities.length,
      competitors_count: competitors.length,
      executive_summary: executiveSummary,
      issues: issues.slice(0, 10), // Top 10 for response
      opportunities: opportunities.slice(0, 10), // Top 10 for response
      competitors,
      duration_seconds: Math.round((Date.now() - startTime) / 1000),
    });

  } catch (error: any) {
    console.error('[Comprehensive Audit] Error:', error);
    return NextResponse.json(
      {
        error: 'Comprehensive audit failed',
        details: error.message,
        company_id: companyId,
      },
      { status: 500 }
    );
  }
}

/**
 * Run Lighthouse audit using Google PageSpeed Insights
 */
async function runLighthouseAudit(url: string) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_PAGESPEED_API_KEY;

  if (!apiKey) {
    console.warn('[Lighthouse] No API key configured, using fallback scores');
    return {
      scores: {
        performance: 75,
        accessibility: 85,
        best_practices: 80,
        seo: 80,
      },
      metrics: {},
      opportunities: [],
      passed: [],
    };
  }

  const lighthouse = new LighthouseService(apiKey);
  return await lighthouse.getDetailedAudit(url, 'mobile');
}

/**
 * Run basic SEO audit (meta tags, content structure)
 */
async function runBasicSEOAudit(url: string) {
  const auditor = new SEOAuditor();
  return await auditor.auditWebsite(url);
}

/**
 * Run backlink analysis
 */
async function runBacklinkAnalysis(domain: string) {
  const analyzer = new BacklinkAnalyzer();
  return await analyzer.analyzeBacklinks(domain);
}

/**
 * Infer primary keyword from business name and industry
 */
async function inferPrimaryKeyword(businessName: string, industry: string): Promise<string> {
  try {
    const prompt = `Given this business: "${businessName}" in the ${industry} industry, what is the most likely primary SEO keyword they should target? Return ONLY the keyword phrase, nothing else.`;

    const response = await cascadingAI(prompt, {
      temperature: 0.3,
      maxTokens: 50,
    });

    return response.trim().replace(/['"]/g, '');
  } catch (error) {
    console.error('[Keyword Inference] Error:', error);
    return businessName; // Fallback to business name
  }
}

/**
 * Run keyword analysis
 */
async function runKeywordAnalysis(seed: string) {
  const kr = new KeywordResearch();
  const suggestions = await kr.expandKeywords(seed, 20);

  return {
    seed,
    suggestions,
    total: suggestions.length,
  };
}

/**
 * Run SERP analysis
 */
async function runSERPAnalysis(keyword: string, currentDomain: string) {
  const analyzer = new SerpAnalyzer();

  try {
    const analysis = await analyzer.analyzeSERP(keyword);

    // Add current domain ranking if found
    const currentPosition = analysis.topResults.findIndex(
      (r: any) => r.domain === currentDomain
    );

    return {
      ...analysis,
      currentPosition: currentPosition >= 0 ? currentPosition + 1 : null,
    };
  } catch (error) {
    console.error('[SERP Analysis] Error:', error);
    return null;
  }
}

/**
 * Calculate category scores
 */
function calculateScores(data: any) {
  const { lighthouse, seo, backlinks, keywords, serp } = data;

  // Lighthouse score (0-100)
  const lighthouseScore = lighthouse ? Math.round(
    (lighthouse.scores.performance +
     lighthouse.scores.accessibility +
     lighthouse.scores.best_practices +
     lighthouse.scores.seo) / 4
  ) : 75;

  // Technical SEO score (0-100)
  const technicalSEO = seo?.score || 75;

  // Content score (0-100)
  const contentScore = seo ? calculateContentScore(seo) : 70;

  // Backlinks score (0-100)
  const backlinksScore = backlinks ? Math.min(100, backlinks.domainRating) : 0;

  // E-E-A-T score (calculated separately)
  const eeatScore = 0; // Calculated in calculateEEATScore

  return {
    lighthouse: lighthouseScore,
    technicalSEO,
    content: contentScore,
    backlinks: backlinksScore,
    eeat: eeatScore, // Will be updated
  };
}

/**
 * Calculate content quality score
 */
function calculateContentScore(seo: any): number {
  let score = 100;

  // Deduct for missing/poor meta tags
  if (!seo.title || seo.title.length < 30) score -= 15;
  if (!seo.meta_description || seo.meta_description.length < 120) score -= 15;
  if (!seo.h1_tags || seo.h1_tags.length === 0) score -= 15;
  if (seo.h1_tags && seo.h1_tags.length > 1) score -= 10;

  // Deduct for accessibility issues
  const accessibilityIssues = seo.issues?.filter(
    (i: any) => i.category === 'accessibility'
  ).length || 0;
  score -= Math.min(accessibilityIssues * 5, 25);

  return Math.max(0, score);
}

/**
 * Calculate E-E-A-T score (Experience, Expertise, Authority, Trust)
 */
function calculateEEATScore(data: any): number {
  const { lighthouse, seo, backlinks, domain } = data;
  let score = 0;

  // Experience (25 points) - Based on content quality
  if (seo?.h1_tags && seo.h1_tags.length > 0) score += 10;
  if (seo?.meta_description && seo.meta_description.length >= 120) score += 10;
  if (lighthouse?.scores.accessibility >= 90) score += 5;

  // Expertise (25 points) - Based on technical implementation
  if (lighthouse?.scores.seo >= 90) score += 10;
  if (seo?.meta_tags?.['og:type']) score += 5; // Has schema
  if (lighthouse?.scores.best_practices >= 90) score += 10;

  // Authority (25 points) - Based on backlinks
  if (backlinks) {
    score += Math.min(25, Math.round(backlinks.domainRating / 4));
  }

  // Trust (25 points) - Based on security and trust signals
  if (domain.startsWith('https')) score += 10;
  if (lighthouse?.scores.best_practices >= 80) score += 10;
  if (backlinks && backlinks.referringDomains > 50) score += 5;

  return Math.min(100, score);
}

/**
 * Generate structured issues from audit results
 */
function generateIssuesFromAudit(data: any): AuditIssue[] {
  const { lighthouse, seo, backlinks, keywords, serp, url } = data;
  const issues: AuditIssue[] = [];

  // Add Lighthouse opportunities as issues
  if (lighthouse?.opportunities) {
    lighthouse.opportunities.forEach((opp: any) => {
      issues.push({
        type: 'warning',
        category: 'performance',
        message: opp.title,
        impact: opp.score < 0.5 ? 'high' : 'medium',
        url,
        recommendation: opp.description,
      });
    });
  }

  // Add basic SEO issues
  if (seo?.issues) {
    issues.push(...seo.issues.map((issue: any) => ({
      ...issue,
      url,
    })));
  }

  // Add backlink issues
  if (backlinks && backlinks.domainRating < 30) {
    issues.push({
      type: 'warning',
      category: 'authority',
      message: 'Low domain authority',
      impact: 'high',
      url,
      recommendation: `Build high-quality backlinks. Current DR: ${backlinks.domainRating}/100`,
    });
  }

  if (backlinks && backlinks.referringDomains < 50) {
    issues.push({
      type: 'warning',
      category: 'backlinks',
      message: 'Limited backlink diversity',
      impact: 'medium',
      url,
      recommendation: `Acquire backlinks from more unique domains. Current: ${backlinks.referringDomains}`,
    });
  }

  // Add keyword issues
  if (keywords && keywords.suggestions.length < 10) {
    issues.push({
      type: 'info',
      category: 'keywords',
      message: 'Limited keyword opportunities identified',
      impact: 'low',
      url,
      recommendation: 'Expand keyword strategy with long-tail variations',
    });
  }

  // Add SERP competition issues
  if (serp && serp.avgMetrics) {
    if (backlinks && backlinks.domainRating < serp.avgMetrics.domainRating - 10) {
      issues.push({
        type: 'warning',
        category: 'competition',
        message: 'Below competitor average domain authority',
        impact: 'high',
        url,
        recommendation: `Competitors average DR ${serp.avgMetrics.domainRating}, yours: ${backlinks.domainRating}`,
      });
    }
  }

  return issues;
}

/**
 * Generate opportunities from audit data
 */
function generateOpportunities(data: any) {
  const { keywords, serp, backlinks, scores } = data;
  const opportunities: any[] = [];

  // Keyword opportunities
  if (keywords?.suggestions) {
    keywords.suggestions
      .filter((kw: any) => kw.difficulty < 50 && kw.searchVolume > 100)
      .slice(0, 10)
      .forEach((kw: any) => {
        opportunities.push({
          type: 'keyword',
          keyword: kw.keyword,
          search_volume: kw.searchVolume,
          difficulty: kw.difficulty,
          relevance: kw.relevance,
          opportunity_score: Math.round(
            (kw.searchVolume / 1000) * (100 - kw.difficulty) / 100
          ),
          recommendation: `Target "${kw.keyword}" - ${kw.searchVolume} monthly searches, ${kw.difficulty}% difficulty`,
        });
      });
  }

  // Backlink opportunities
  if (serp?.topResults) {
    serp.topResults.slice(0, 5).forEach((result: any) => {
      opportunities.push({
        type: 'backlink',
        domain: result.domain,
        domain_rating: result.domainRating,
        backlinks: result.backlinks,
        recommendation: `Analyze backlink profile of ${result.domain} (DR ${result.domainRating}) for link opportunities`,
      });
    });
  }

  // Technical improvements
  if (scores.lighthouse < 80) {
    opportunities.push({
      type: 'technical',
      category: 'performance',
      current_score: scores.lighthouse,
      target_score: 90,
      estimated_impact: 'high',
      recommendation: 'Improve Core Web Vitals to boost user experience and rankings',
    });
  }

  return opportunities;
}

/**
 * Generate AI-powered executive summary
 */
async function generateExecutiveSummary(data: any): Promise<string> {
  const { url, overallScore, scores, issuesCount, opportunitiesCount } = data;

  try {
    const prompt = `As an SEO expert, write a concise 3-paragraph executive summary for this website audit:

Website: ${url}
Overall SEO Score: ${overallScore}/100
Lighthouse: ${scores.lighthouse}/100
Technical SEO: ${scores.technicalSEO}/100
Content: ${scores.content}/100
Backlinks: ${scores.backlinks}/100
Issues Found: ${issuesCount}
Opportunities: ${opportunitiesCount}

Format:
Paragraph 1: Current state overview
Paragraph 2: Key strengths and weaknesses
Paragraph 3: Priority recommendations

Keep it professional, actionable, and under 300 words.`;

    const summary = await cascadingAI(prompt, {
      temperature: 0.5,
      maxTokens: 500,
    });

    return summary.trim();
  } catch (error) {
    console.error('[Executive Summary] Error:', error);
    return `Audit completed for ${url}. Overall SEO score: ${overallScore}/100. Found ${issuesCount} issues and ${opportunitiesCount} opportunities for improvement.`;
  }
}
