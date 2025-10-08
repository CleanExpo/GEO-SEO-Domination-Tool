/**
 * POST /api/content-opportunities/discover
 * Discovers content opportunities by combining keyword data with community gap mining
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { findBestOpportunities, buildOpportunity } from '@/services/content-opportunity-engine';
import { getKeywordIdeas } from '@/services/api/dataforseo';

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

    const db = await getDatabase();
    const startTime = Date.now();

    // Create search record
    const searchResult = await db.run(
      `INSERT INTO opportunity_searches
       (seed_keyword, company_id, database_region, subreddits, status)
       VALUES (?, ?, ?, ?, ?)`,
      [seedKeyword, companyId || null, 'us', JSON.stringify(subreddits), 'running']
    );

    const searchId = searchResult.lastID;

    try {
      // Step 1: Get keyword ideas from DataForSEO
      const keywordData = await getKeywordIdeas(seedKeyword);

      if (!keywordData || keywordData.length === 0) {
        await db.run(
          `UPDATE opportunity_searches
           SET status = ?, error_message = ?, completed_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          ['failed', 'No keyword data found from DataForSEO', searchId]
        );

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
      const opportunityIds: number[] = [];

      for (const opp of opportunities) {
        const result = await db.run(
          `INSERT INTO content_opportunities
           (company_id, keyword, search_volume, keyword_difficulty, opportunity_score,
            reddit_mentions, repeated_questions, confusion_markers, dissatisfaction_markers, gap_weight,
            intents, top_questions, canonical_answer, key_bullets, citations,
            source_type, source_thread_ids, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            companyId || null,
            opp.keyword,
            opp.volume,
            opp.difficulty,
            opp.opportunityScore,
            opp.gap.redditMentions,
            opp.gap.repeatedQuestions,
            opp.gap.confusionMarkers,
            opp.gap.dissatisfactionMarkers,
            0, // gap_weight will be computed
            JSON.stringify(opp.intents),
            JSON.stringify(opp.topQuestions),
            opp.aeo?.canonicalAnswer || null,
            JSON.stringify(opp.aeo?.keyBullets || []),
            JSON.stringify(opp.aeo?.citations || []),
            'reddit',
            JSON.stringify(opp.sources.redditThreads || []),
            'discovered'
          ]
        );

        opportunityIds.push(result.lastID!);
      }

      // Step 4: Update search record
      const executionTime = Date.now() - startTime;
      const avgScore = opportunities.length > 0
        ? opportunities.reduce((sum, o) => sum + o.opportunityScore, 0) / opportunities.length
        : 0;

      await db.run(
        `UPDATE opportunity_searches
         SET status = ?, keywords_found = ?, opportunities_discovered = ?,
             avg_opportunity_score = ?, top_opportunity_id = ?,
             execution_time_ms = ?, completed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          'completed',
          keywordData.length,
          opportunities.length,
          avgScore,
          opportunityIds[0] || null,
          executionTime,
          searchId
        ]
      );

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
      await db.run(
        `UPDATE opportunity_searches
         SET status = ?, error_message = ?, completed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        ['failed', error.message, searchId]
      );

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
