/**
 * Keyword Research API - Ahrefs Keywords Explorer Alternative
 *
 * POST /api/keywords/research
 * Body: {
 *   companyId: string
 *   keyword: string
 *   action?: 'research' | 'expand' | 'cluster' | 'gaps'
 *   competitor?: string (for gaps)
 *   keywords?: string[] (for cluster)
 *   count?: number (for expand, default 100)
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { KeywordResearch } from '@/services/api/keyword-research';
import { createAdminClient } from '@/lib/auth/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, keyword, action = 'research', competitor, keywords, count } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
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

    const domain = company.website.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const kr = new KeywordResearch();

    // Action: Keyword Gaps Analysis
    if (action === 'gaps') {
      if (!competitor) {
        return NextResponse.json(
          { error: 'competitor is required for gaps analysis' },
          { status: 400 }
        );
      }

      console.log(`[Keyword Research] Finding gaps: ${domain} vs ${competitor}`);
      const gaps = await kr.findKeywordGaps(domain, competitor);

      return NextResponse.json({
        action: 'gaps',
        yourDomain: domain,
        competitorDomain: competitor,
        gaps,
        gapCount: gaps.length,
      });
    }

    // Action: Keyword Expansion
    if (action === 'expand') {
      if (!keyword) {
        return NextResponse.json(
          { error: 'keyword is required for expansion' },
          { status: 400 }
        );
      }

      console.log(`[Keyword Research] Expanding: ${keyword} (${count || 100} keywords)`);
      const expanded = await kr.expandKeywords(keyword, count || 100);

      return NextResponse.json({
        action: 'expand',
        seed: keyword,
        keywords: expanded,
        count: expanded.length,
      });
    }

    // Action: Keyword Clustering
    if (action === 'cluster') {
      if (!keywords || !Array.isArray(keywords)) {
        return NextResponse.json(
          { error: 'keywords array is required for clustering' },
          { status: 400 }
        );
      }

      console.log(`[Keyword Research] Clustering ${keywords.length} keywords`);
      const clusters = await kr.clusterKeywords(keywords);

      return NextResponse.json({
        action: 'cluster',
        clusters,
        clusterCount: clusters.length,
        totalKeywords: keywords.length,
      });
    }

    // Action: Research Single Keyword (Default)
    if (!keyword) {
      return NextResponse.json(
        { error: 'keyword is required for research' },
        { status: 400 }
      );
    }

    console.log(`[Keyword Research] Researching: ${keyword} for ${domain}`);
    const keywordData = await kr.researchKeyword(keyword, domain);

    // Save to database for historical tracking
    await supabase.from('keyword_research').insert({
      id: `${companyId}_${keyword.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
      company_id: companyId,
      keyword,
      search_volume: keywordData.searchVolume,
      difficulty: keywordData.difficulty,
      competition: keywordData.competition,
      cpc: keywordData.cpc,
      trend: keywordData.trend,
      serp_features: keywordData.serpFeatures,
      current_ranking: keywordData.currentRanking,
      click_potential: keywordData.clickPotential,
      researched_at: new Date().toISOString(),
    });

    return NextResponse.json({
      action: 'research',
      keyword: keywordData,
      domain,
    });
  } catch (error: any) {
    console.error('[Keyword Research] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to research keyword' },
      { status: 500 }
    );
  }
}
