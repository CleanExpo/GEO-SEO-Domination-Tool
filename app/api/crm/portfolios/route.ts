import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

const db = getDatabase();

/**
 * POST /api/crm/portfolios
 *
 * Create a new company portfolio and trigger initial audit
 *
 * This is the entry point to EMPIRE MODE - creating a portfolio
 * automatically triggers the autonomous swarm to begin work.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      companyId,
      companyName,
      industry,
      services = [],
      targetAudience,
      websiteUrl,
      gmbId,
      socialAccounts = {},
      expertiseAreas = [],
      contentTopics = [],
      competitiveAdvantages = [],
      targetKeywords = [],
      autopilotEnabled = false,
      automationLevel = 'basic',
      contentFrequency = {}
    } = body;

    // Validation
    if (!companyName || !industry) {
      return NextResponse.json(
        { error: 'companyName and industry are required' },
        { status: 400 }
      );
    }

    // Create portfolio
    const result = await db.query(`
      INSERT INTO company_portfolios (
        company_id,
        company_name,
        industry,
        services,
        target_audience,
        website_url,
        gmb_id,
        social_accounts,
        expertise_areas,
        content_topics,
        competitive_advantages,
        target_keywords,
        autopilot_enabled,
        automation_level,
        content_frequency,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      RETURNING *
    `, [
      companyId || null,
      companyName,
      industry,
      JSON.stringify(services),
      targetAudience || null,
      websiteUrl || null,
      gmbId || null,
      JSON.stringify(socialAccounts),
      JSON.stringify(expertiseAreas),
      JSON.stringify(contentTopics),
      JSON.stringify(competitiveAdvantages),
      JSON.stringify(targetKeywords),
      autopilotEnabled ? 1 : 0,
      automationLevel,
      JSON.stringify(contentFrequency)
    ]);

    const portfolio = result.rows[0];

    // Trigger initial audit (async - don't wait)
    if (websiteUrl) {
      triggerInitialAudit(portfolio.id, {
        websiteUrl,
        socialAccounts,
        gmbId,
        industry
      }).catch(err => console.error('Initial audit failed:', err));
    }

    return NextResponse.json({
      success: true,
      portfolio: parsePortfolio(portfolio),
      message: autopilotEnabled
        ? 'Portfolio created. Empire Mode activated! Initial audit in progress...'
        : 'Portfolio created. Enable autopilot to activate swarm agents.'
    });
  } catch (error) {
    console.error('Error creating portfolio:', error);
    return NextResponse.json(
      {
        error: 'Failed to create portfolio',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/crm/portfolios
 *
 * List all company portfolios with current scores
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const autopilotOnly = searchParams.get('autopilot') === 'true';
    const industry = searchParams.get('industry');

    let query = 'SELECT * FROM company_portfolios WHERE 1=1';
    const params: any[] = [];

    if (autopilotOnly) {
      query += ' AND autopilot_enabled = ?';
      params.push(1);
    }

    if (industry) {
      query += ' AND industry = ?';
      params.push(industry);
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    const portfolios = result.rows;

    return NextResponse.json({
      success: true,
      total: portfolios.length,
      portfolios: portfolios.map(parsePortfolio)
    });
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch portfolios',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function parsePortfolio(row: any) {
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: row.company_name,
    industry: row.industry,
    services: JSON.parse(row.services || '[]'),
    targetAudience: row.target_audience,
    websiteUrl: row.website_url,
    gmbId: row.gmb_id,
    socialAccounts: JSON.parse(row.social_accounts || '{}'),
    expertiseAreas: JSON.parse(row.expertise_areas || '[]'),
    contentTopics: JSON.parse(row.content_topics || '[]'),
    competitiveAdvantages: JSON.parse(row.competitive_advantages || '[]'),
    targetKeywords: JSON.parse(row.target_keywords || '[]'),
    autopilotEnabled: row.autopilot_enabled === 1,
    automationLevel: row.automation_level,
    contentFrequency: JSON.parse(row.content_frequency || '{}'),
    lastFullAudit: row.last_full_audit,
    auditFrequency: row.audit_frequency,
    scores: {
      overall: row.audit_score,
      seo: row.seo_score,
      social: row.social_score,
      gmb: row.gmb_score,
      contentQuality: row.content_quality_score,
      brandAuthority: row.brand_authority_score
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function triggerInitialAudit(
  portfolioId: string,
  data: {
    websiteUrl: string;
    socialAccounts: Record<string, string>;
    gmbId?: string;
    industry: string;
  }
) {
  // Call the audit swarm orchestrator
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crm/audit/full`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      portfolioId,
      auditType: 'initial',
      ...data
    })
  });

  if (!response.ok) {
    throw new Error(`Initial audit failed: ${response.statusText}`);
  }

  return response.json();
}
