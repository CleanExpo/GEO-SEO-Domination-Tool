/**
 * AI Strategy Campaigns API Endpoint
 * GET /api/ai-strategy/campaigns - Fetch campaigns for a company
 * POST /api/ai-strategy/campaigns - Create a new campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseClient } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('company_id');

  if (!companyId) {
    return NextResponse.json(
      { error: 'company_id parameter is required' },
      { status: 400 }
    );
  }

  const db = new DatabaseClient();

  try {
    await db.initialize();

    const query = `
      SELECT
        c.*,
        co.name as company_name
      FROM ai_search_campaigns c
      LEFT JOIN companies co ON c.company_id = co.id
      WHERE c.company_id = ?
      ORDER BY c.created_at DESC
    `;

    const campaigns = await db.all(query, [companyId]);

    // Parse JSON fields for each campaign
    const parsedCampaigns = campaigns.map((campaign: any) => ({
      ...campaign,
      target_ai_platforms: typeof campaign.target_ai_platforms === 'string'
        ? JSON.parse(campaign.target_ai_platforms)
        : campaign.target_ai_platforms || [],
    }));

    return NextResponse.json({
      success: true,
      campaigns: parsedCampaigns || [],
      count: parsedCampaigns?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching AI campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI campaigns' },
      { status: 500 }
    );
  } finally {
    await db.close();
  }
}

export async function POST(request: NextRequest) {
  const db = new DatabaseClient();

  try {
    const body = await request.json();
    const {
      company_id,
      campaign_name,
      objective,
      target_ai_platforms,
      start_date,
      end_date,
      status,
      budget,
    } = body;

    // Validation
    if (!company_id || !campaign_name || !objective || !target_ai_platforms) {
      return NextResponse.json(
        { error: 'company_id, campaign_name, objective, and target_ai_platforms are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(target_ai_platforms) || target_ai_platforms.length === 0) {
      return NextResponse.json(
        { error: 'target_ai_platforms must be a non-empty array' },
        { status: 400 }
      );
    }

    const validPlatforms = ['Perplexity', 'ChatGPT', 'Gemini', 'Claude'];
    const invalidPlatforms = target_ai_platforms.filter(
      (platform: string) => !validPlatforms.includes(platform)
    );
    if (invalidPlatforms.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid platforms: ${invalidPlatforms.join(', ')}. Valid platforms are: ${validPlatforms.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (status && !['planning', 'active', 'paused', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be one of: planning, active, paused, completed' },
        { status: 400 }
      );
    }

    if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
      return NextResponse.json(
        { error: 'start_date must be before end_date' },
        { status: 400 }
      );
    }

    await db.initialize();

    const query = `
      INSERT INTO ai_search_campaigns (
        company_id, campaign_name, objective, target_ai_platforms,
        start_date, end_date, status, budget
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.run(query, [
      company_id,
      campaign_name,
      objective,
      JSON.stringify(target_ai_platforms),
      start_date || new Date().toISOString().split('T')[0],
      end_date || null,
      status || 'planning',
      budget || 0,
    ]);

    return NextResponse.json(
      {
        success: true,
        message: 'AI campaign created successfully',
        campaign_id: result.lastID,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating AI campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create AI campaign' },
      { status: 500 }
    );
  } finally {
    await db.close();
  }
}
