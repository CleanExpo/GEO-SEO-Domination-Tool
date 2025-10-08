/**
 * Influence Campaign API Endpoint
 *
 * POST /api/crm/influence - Create influence campaign from trend
 * POST /api/crm/influence/execute - Execute campaign (generate & schedule content)
 * GET /api/crm/influence?portfolioId={id} - Get campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { influenceStrategyAgent, InfluenceCampaignRequest } from '@/services/agents/influence-strategy-agent';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'geo-seo.db');

// ============================================================================
// POST - Create or Execute Campaign
// ============================================================================

export async function POST(request: NextRequest) {
  const db = new Database(dbPath);
  try {
    const body = await request.json();

    // Check if this is an execute request
    if (body.action === 'execute') {
      const campaignId = body.campaignId;
      if (!campaignId) {
        return NextResponse.json(
          { success: false, error: 'campaignId is required for execute action' },
          { status: 400 }
        );
      }

      const result = await influenceStrategyAgent.executeCampaign(campaignId);
      return NextResponse.json(result);
    }

    // Create new campaign
    const campaignRequest: InfluenceCampaignRequest = {
      portfolioId: body.portfolioId,
      trendId: body.trendId,
      campaignGoal: body.campaignGoal || 'thought_leadership',
      targetAudience: body.targetAudience || 'Business decision makers',
      duration: body.duration || 90,
      platforms: body.platforms || ['wordpress', 'linkedin'],
      ctaType: body.ctaType || 'consultation',
      budget: body.budget
    };

    if (!campaignRequest.portfolioId || !campaignRequest.trendId) {
      return NextResponse.json(
        { success: false, error: 'portfolioId and trendId are required' },
        { status: 400 }
      );
    }

    // Verify portfolio and trend exist
    const portfolio = db.prepare('SELECT * FROM company_portfolios WHERE id = ?').get(campaignRequest.portfolioId);
    const trend = db.prepare('SELECT * FROM industry_trends WHERE id = ?').get(campaignRequest.trendId);

    if (!portfolio || !trend) {
      return NextResponse.json(
        { success: false, error: 'Portfolio or trend not found' },
        { status: 404 }
      );
    }

    // Create campaign
    const report = await influenceStrategyAgent.createCampaign(campaignRequest);

    return NextResponse.json(report);

  } catch (error: any) {
    console.error('[Influence API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}

// ============================================================================
// GET - Retrieve Campaigns
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');

    if (!portfolioId) {
      return NextResponse.json(
        { success: false, error: 'portfolioId is required' },
        { status: 400 }
      );
    }

    const campaigns = influenceStrategyAgent.getCampaigns(portfolioId);

    return NextResponse.json({
      success: true,
      campaigns,
      count: campaigns.length
    });

  } catch (error: any) {
    console.error('[Influence API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
