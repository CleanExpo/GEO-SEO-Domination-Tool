/**
 * POST /api/content-opportunities/discover
 * Discovers content opportunities by combining keyword data with community gap mining
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { findBestOpportunities, buildOpportunity } from '@/services/content-opportunity-engine';
import { getKeywordIdeas } from '@/services/api/dataforseo';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      seedKeyword,
      companyId,
      subreddits = ['all'],
      topN = 10,
      minScore = 0,
      includeAEO = true
    } = body;

    if (!seedKeyword) {
      return NextResponse.json(
        { error: 'seedKeyword is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const startTime = Date.now();
    const searchId = randomUUID();

    // Create search record
    const { error: searchError } = await supabase
      .from('opportunity_searches')
      .insert([{
        id: searchId,
        seed_keyword: seedKeyword,
        company_id: companyId || null,
        database_region: 'us',
        subreddits: subreddits,
        status: 'running'
      }]);

    if (searchError) {
      throw new Error(`Failed to create search record: ${searchError.message}`);
    }

    try {
      // Step 1: Get keyword ideas from DataForSEO
      const keywordData = await getKeywordIdeas(seedKeyword);

      if (!keywordData || keywordData.length === 0) {
        await supabase
          .from('opportunity_searches')
          .update({
            status: 'failed',
            error_message: 'No keyword data found from DataForSEO',
            completed_at: new Date().toISOString()
          })
          .eq('id', searchId);

        return NextResponse.json(
          { error: 'No keyword data found' },
          { status: 404 }
        );
      }

      // Step 2: Find best opportunities using community gap mining
      const keywords = keywordData.map(kw => ({
        keyword: kw.keyword,
        volume: kw.search_volume || 0,
        difficulty: kw.keyword_difficulty || 0
      }));

      const opportunities = await findBestOpportunities(keywords, {
        topN,
        minScore,
        subreddits
      });

      // Step 3: Save opportunities to database
      const opportunityIds: string[] = [];

      for (const opp of opportunities) {
        const oppId = randomUUID();
        const { error: oppError } = await supabase
          .from('content_opportunities')
          .insert([{
            id: oppId,
            company_id: companyId || null,
            keyword: opp.keyword,
            search_volume: opp.volume,
            keyword_difficulty: opp.difficulty,
            opportunity_score: opp.opportunityScore,
            reddit_mentions: opp.gap.redditMentions,
            repeated_questions: opp.gap.repeatedQuestions,
            confusion_markers: opp.gap.confusionMarkers,
            dissatisfaction_markers: opp.gap.dissatisfactionMarkers,
            gap_weight: 0,
            intents: opp.intents,
            top_questions: opp.topQuestions,
            canonical_answer: opp.aeo?.canonicalAnswer || null,
            key_bullets: opp.aeo?.keyBullets || [],
            citations: opp.aeo?.citations || [],
            source_type: 'reddit',
            source_thread_ids: opp.sources.redditThreads || [],
            status: 'discovered'
          }]);

        if (!oppError) {
          opportunityIds.push(oppId);
        }
      }

      // Step 4: Update search record
      const executionTime = Date.now() - startTime;
      const avgScore = opportunities.length > 0
        ? opportunities.reduce((sum, o) => sum + o.opportunityScore, 0) / opportunities.length
        : 0;

      await supabase
        .from('opportunity_searches')
        .update({
          status: 'completed',
          keywords_found: keywordData.length,
          opportunities_discovered: opportunities.length,
          avg_opportunity_score: avgScore,
          top_opportunity_id: opportunityIds[0] || null,
          execution_time_ms: executionTime,
          completed_at: new Date().toISOString()
        })
        .eq('id', searchId);

      return NextResponse.json({
        success: true,
        searchId,
        opportunities,
        stats: {
          keywordsAnalyzed: keywordData.length,
          opportunitiesFound: opportunities.length,
          avgOpportunityScore: avgScore,
          executionTimeMs: executionTime
        }
      });

    } catch (error: any) {
      // Update search record with error
      await supabase
        .from('opportunity_searches')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', searchId);

      throw error;
    }

  } catch (error: any) {
    console.error('Content opportunity discovery error:', error);
    return NextResponse.json(
      {
        error: 'Failed to discover content opportunities',
        details: error.message
      },
      { status: 500 }
    );
  }
}
