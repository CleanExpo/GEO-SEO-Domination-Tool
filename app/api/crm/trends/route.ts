/**
 * Trend Intelligence API Endpoint
 *
 * POST /api/crm/trends - Discover industry trends
 * GET /api/crm/trends?portfolioId={id} - Get discovered trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { trendIntelligenceAgent, TrendDiscoveryRequest } from '@/services/agents/trend-intelligence-agent';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'geo-seo.db');

// ============================================================================
// POST - Discover Trends
// ============================================================================

export async function POST(request: NextRequest) {
  const db = new Database(dbPath);
  try {
    const body = await request.json();

    const trendRequest: TrendDiscoveryRequest = {
      portfolioId: body.portfolioId,
      industry: body.industry,
      keywords: body.keywords,
      regions: body.regions,
      timeframe: body.timeframe || 'month',
      minMomentum: body.minMomentum || 50,
      maxCompetition: body.maxCompetition || 70
    };

    if (!trendRequest.portfolioId || !trendRequest.industry) {
      return NextResponse.json(
        { success: false, error: 'portfolioId and industry are required' },
        { status: 400 }
      );
    }

    // Verify portfolio exists
    const portfolio = db.prepare('SELECT * FROM company_portfolios WHERE id = ?').get(trendRequest.portfolioId);
    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    // Discover trends
    const report = await trendIntelligenceAgent.discoverTrends(trendRequest);

    return NextResponse.json(report);

  } catch (error: any) {
    console.error('[Trends API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}

// ============================================================================
// GET - Retrieve Trends
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');
    const status = searchParams.get('status') || undefined;

    if (!portfolioId) {
      return NextResponse.json(
        { success: false, error: 'portfolioId is required' },
        { status: 400 }
      );
    }

    const trends = trendIntelligenceAgent.getTrends(portfolioId, status);

    return NextResponse.json({
      success: true,
      trends,
      count: trends.length
    });

  } catch (error: any) {
    console.error('[Trends API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
