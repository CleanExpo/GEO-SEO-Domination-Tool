/**
 * SERP Analysis API - Ranking Opportunity Detection
 *
 * POST /api/serp/analyze
 * Body: {
 *   companyId: string
 *   keyword: string
 *   searchVolume?: number
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { SerpAnalyzer } from '@/services/api/serp-analyzer';
import { createAdminClient } from '@/lib/auth/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, keyword, searchVolume = 0 } = body;

    if (!companyId || !keyword) {
      return NextResponse.json(
        { error: 'companyId and keyword are required' },
        { status: 400 }
      );
    }

    console.log(`[SERP Analysis] Analyzing SERP for: ${keyword}`);

    // Analyze SERP
    const analyzer = new SerpAnalyzer();
    const analysis = await analyzer.analyzeSERP(keyword, searchVolume);

    // Save to database
    const supabase = createAdminClient();

    // Save SERP analysis overview
    const serpAnalysisId = `${companyId}_${keyword.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

    await supabase.from('serp_analyses').insert({
      id: serpAnalysisId,
      company_id: companyId,
      keyword,
      search_volume: analysis.searchVolume,
      opportunity_score: analysis.rankingOpportunity.score,
      difficulty: analysis.rankingOpportunity.difficulty,
      estimated_effort: analysis.rankingOpportunity.estimatedEffort,
      estimated_timeframe: analysis.rankingOpportunity.estimatedTimeframe,
      avg_domain_rating: analysis.avgMetrics.domainRating,
      avg_backlinks: analysis.avgMetrics.backlinks,
      avg_word_count: analysis.avgMetrics.wordCount,
      avg_performance_score: analysis.avgMetrics.performanceScore,
      recommended_word_count: analysis.contentRequirements.recommendedWordCount,
      analyzed_at: new Date().toISOString(),
    });

    // Save SERP features
    for (const feature of analysis.features) {
      await supabase.from('serp_features').insert({
        id: `${serpAnalysisId}_${feature.type}_${Date.now()}`,
        serp_analysis_id: serpAnalysisId,
        feature_type: feature.type,
        present: feature.present,
        content: feature.content,
        difficulty: feature.difficulty,
      });
    }

    // Save top 10 results
    for (const result of analysis.topResults) {
      await supabase.from('serp_results').insert({
        id: `${serpAnalysisId}_${result.position}_${Date.now()}`,
        serp_analysis_id: serpAnalysisId,
        position: result.position,
        url: result.url,
        domain: result.domain,
        title: result.title,
        description: result.description,
        domain_rating: result.domainRating,
        backlinks: result.backlinks,
        performance_score: result.performanceScore,
        word_count: result.wordCount,
        has_schema: result.hasSchema,
        content_type: result.contentType,
      });
    }

    // Save AI recommendations
    for (let i = 0; i < analysis.aiRecommendations.length; i++) {
      await supabase.from('serp_recommendations').insert({
        id: `${serpAnalysisId}_rec_${i}_${Date.now()}`,
        serp_analysis_id: serpAnalysisId,
        recommendation: analysis.aiRecommendations[i],
        priority: i < 2 ? 'High' : i < 5 ? 'Medium' : 'Low',
        order_index: i,
      });
    }

    // Save ranking opportunity requirements
    for (const requirement of analysis.rankingOpportunity.requirements) {
      await supabase.from('ranking_requirements').insert({
        id: `${serpAnalysisId}_req_${Date.now()}`,
        serp_analysis_id: serpAnalysisId,
        requirement,
      });
    }

    return NextResponse.json({
      analysis,
      saved: {
        serp_analysis_id: serpAnalysisId,
        features: analysis.features.length,
        results: analysis.topResults.length,
        recommendations: analysis.aiRecommendations.length,
        requirements: analysis.rankingOpportunity.requirements.length,
      },
    });
  } catch (error: any) {
    console.error('[SERP Analysis] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze SERP' },
      { status: 500 }
    );
  }
}
