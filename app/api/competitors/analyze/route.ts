/**
 * Competitor Analysis API - Ahrefs Competitor Alternative
 *
 * POST /api/competitors/analyze
 * Body: {
 *   companyId: string
 *   competitorDomain: string OR competitorDomains: string[]
 *   action?: 'full' | 'backlinks' | 'keywords' | 'content' | 'outreach'
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { CompetitorAnalyzer } from '@/services/api/competitor-analyzer';
import { createAdminClient } from '@/lib/auth/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      competitorDomain,
      competitorDomains,
      action = 'full',
      outreachLimit = 50
    } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    if (!competitorDomain && !competitorDomains) {
      return NextResponse.json(
        { error: 'competitorDomain or competitorDomains is required' },
        { status: 400 }
      );
    }

    // Get company domain
    const supabase = createAdminClient();
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('website')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    const yourDomain = company.website.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const analyzer = new CompetitorAnalyzer();

    // Multiple competitors comparison
    if (competitorDomains && Array.isArray(competitorDomains)) {
      console.log(`[Competitor Analysis] Comparing ${yourDomain} vs ${competitorDomains.length} competitors`);

      const comparisons = await analyzer.compareMultipleCompetitors(
        yourDomain,
        competitorDomains
      );

      // Save to database
      for (const comparison of comparisons) {
        await supabase.from('competitor_analyses').insert({
          id: `${companyId}_${comparison.competitor}_${Date.now()}`,
          company_id: companyId,
          competitor_domain: comparison.competitor,
          overall_strength: comparison.overallStrength,
          backlink_gap: comparison.backlinks.gap,
          keyword_gap_count: comparison.keywords.gaps.length,
          content_gap_count: comparison.content.gaps.length,
          analyzed_at: new Date().toISOString(),
        });
      }

      return NextResponse.json({
        action: 'multi-comparison',
        yourDomain,
        comparisons,
        competitorCount: comparisons.length,
      });
    }

    // Single competitor analysis
    const competitor = competitorDomain!;

    // Action: Outreach List Generation
    if (action === 'outreach') {
      console.log(`[Competitor Analysis] Generating outreach list: ${yourDomain} vs ${competitor}`);

      const outreachList = await analyzer.generateOutreachList(
        yourDomain,
        competitor,
        outreachLimit
      );

      return NextResponse.json({
        action: 'outreach',
        yourDomain,
        competitorDomain: competitor,
        opportunities: outreachList,
        count: outreachList.length,
      });
    }

    // Action: Full Competitor Analysis
    console.log(`[Competitor Analysis] Full analysis: ${yourDomain} vs ${competitor}`);
    const comparison = await analyzer.analyzeCompetitor(yourDomain, competitor);

    // Save to database
    await supabase.from('competitor_analyses').insert({
      id: `${companyId}_${competitor}_${Date.now()}`,
      company_id: companyId,
      competitor_domain: competitor,
      overall_strength: comparison.overallStrength,
      backlink_gap: comparison.backlinks.gap,
      keyword_gap_count: comparison.keywords.gaps.length,
      content_gap_count: comparison.content.gaps.length,
      analyzed_at: new Date().toISOString(),
    });

    // Save backlink opportunities
    for (const opp of comparison.backlinks.opportunities.slice(0, 100)) {
      await supabase.from('backlink_opportunities').insert({
        id: `${companyId}_${opp.domain}_${Date.now()}`,
        company_id: companyId,
        competitor_domain: competitor,
        opportunity_domain: opp.domain,
        domain_rating: opp.domainRating,
        backlinks_to_competitor: opp.backlinksToCompetitor,
        link_type: opp.linkType,
        priority: opp.priority,
        reason: opp.reason,
        identified_at: new Date().toISOString(),
      });
    }

    // Save keyword opportunities
    for (const opp of comparison.keywords.opportunities.slice(0, 100)) {
      await supabase.from('keyword_opportunities').insert({
        id: `${companyId}_${opp.keyword.replace(/\s+/g, '_')}_${Date.now()}`,
        company_id: companyId,
        competitor_domain: competitor,
        keyword: opp.keyword,
        search_volume: opp.searchVolume,
        difficulty: opp.difficulty,
        competitor_ranking: opp.competitorRanking,
        your_ranking: opp.yourRanking,
        gap: opp.gap,
        priority: opp.priority,
        identified_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      action: 'full',
      yourDomain,
      comparison,
      backlink_opportunities_saved: comparison.backlinks.opportunities.length,
      keyword_opportunities_saved: comparison.keywords.opportunities.length,
    });
  } catch (error: any) {
    console.error('[Competitor Analysis] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze competitor' },
      { status: 500 }
    );
  }
}
