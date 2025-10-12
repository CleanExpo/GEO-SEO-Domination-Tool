/**
 * Free SERP Checker API - Public Tool
 *
 * POST /api/tools/serp-checker
 * Body: { keyword: string }
 *
 * Returns:
 * - Top 10 search results
 * - Basic DR and backlink counts for each
 * - SERP features detected
 * - Average metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { SerpAnalyzer } from '@/services/api/serp-analyzer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword } = body;

    if (!keyword) {
      return NextResponse.json(
        { error: 'keyword is required' },
        { status: 400 }
      );
    }

    console.log(`[Free SERP Checker] Checking: ${keyword}`);

    // Analyze SERP
    const analyzer = new SerpAnalyzer();
    const analysis = await analyzer.analyzeSERP(keyword);

    // Calculate average metrics
    const averageDR = Math.round(
      analysis.topResults.reduce((sum, r) => sum + r.domainRating, 0) /
        analysis.topResults.length
    );
    const averageBacklinks = Math.round(
      analysis.topResults.reduce((sum, r) => sum + r.backlinks, 0) /
        analysis.topResults.length
    );

    // Extract SERP feature names
    const serpFeatures = analysis.features
      .filter((f) => f.present)
      .map((f) => f.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()));

    // Return limited data for free tier (basic info only)
    const freeData = {
      keyword: analysis.keyword,
      searchVolume: analysis.searchVolume,
      results: analysis.topResults.map((result) => ({
        position: result.position,
        url: result.url,
        domain: result.domain,
        title: result.title,
        description: result.description,
        domainRating: result.domainRating,
        backlinks: result.backlinks,
        hasSchema: result.hasSchema,
      })),
      features: serpFeatures,
      averageDR,
      averageBacklinks,
    };

    return NextResponse.json({
      success: true,
      data: freeData,
    });
  } catch (error: any) {
    console.error('[Free SERP Checker] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check SERP' },
      { status: 500 }
    );
  }
}
