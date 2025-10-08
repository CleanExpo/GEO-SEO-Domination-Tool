// API: Create client subscription and initialize autopilot
// POST /api/clients/subscribe

import { NextRequest, NextResponse } from 'next/server';
import { getClientAutopilotAgent } from '@/services/agents/client-autopilot-agent';
import { db } from '@/database/init';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      companyId,
      tierName,
      contentTopics,
      targetKeywords,
      competitorUrls,
      notificationEmail
    } = body;

    // Validate inputs
    if (!companyId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: companyId'
      }, { status: 400 });
    }

    if (!tierName) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: tierName (starter, growth, scale, empire)'
      }, { status: 400 });
    }

    // Verify company exists
    const company = await db.get<any>(
      `SELECT id, name FROM companies WHERE id = ?`,
      [companyId]
    );

    if (!company) {
      return NextResponse.json({
        success: false,
        error: `Company with ID ${companyId} not found`
      }, { status: 404 });
    }

    // Check if subscription already exists
    const existingSubscription = await db.get<any>(
      `SELECT id, status FROM client_subscriptions WHERE company_id = ? AND status = 'active'`,
      [companyId]
    );

    if (existingSubscription) {
      return NextResponse.json({
        success: false,
        error: 'Company already has an active subscription',
        subscriptionId: existingSubscription.id
      }, { status: 409 });
    }

    // Get autopilot agent
    const autopilotAgent = await getClientAutopilotAgent();

    // Initialize subscription
    const result = await autopilotAgent.initializeSubscription(
      companyId,
      tierName.toLowerCase(),
      {
        contentTopics: contentTopics || [],
        targetKeywords: targetKeywords || [],
        competitorUrls: competitorUrls || [],
        notificationEmail: notificationEmail || null
      }
    );

    // Get created subscription details
    const subscription = await autopilotAgent.getSubscription(result.subscriptionId);

    return NextResponse.json({
      success: true,
      message: 'Subscription created and autopilot initialized',
      subscription: {
        id: subscription?.id,
        companyId: subscription?.companyId,
        companyName: company.name,
        tierName: subscription?.tierName,
        monthlySpend: subscription?.monthlySpend,
        tasksScheduled: result.tasksScheduled
      }
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// GET: List available tiers
export async function GET() {
  try {
    const tiers = await db.all<any>(
      `SELECT
        name,
        display_name,
        description,
        monthly_price_usd,
        seo_audits_per_month,
        blog_posts_per_month,
        social_posts_per_month,
        research_papers_per_month,
        gmb_posts_per_month,
        white_papers_per_month,
        competitor_monitoring_frequency,
        autopilot_enabled,
        auto_publish_enabled,
        ruler_quality_threshold
      FROM subscription_tiers
      WHERE is_active = 1
      ORDER BY display_order`
    );

    const formattedTiers = tiers.map(tier => ({
      name: tier.name,
      displayName: tier.display_name,
      description: tier.description,
      monthlyPrice: parseFloat(tier.monthly_price_usd),
      quotas: {
        seoAudits: tier.seo_audits_per_month,
        blogPosts: tier.blog_posts_per_month,
        socialPosts: tier.social_posts_per_month,
        researchPapers: tier.research_papers_per_month,
        gmbPosts: tier.gmb_posts_per_month,
        whitePapers: tier.white_papers_per_month
      },
      features: {
        competitorMonitoring: tier.competitor_monitoring_frequency,
        autopilotEnabled: tier.autopilot_enabled === 1,
        autoPublish: tier.auto_publish_enabled === 1,
        rulerThreshold: tier.ruler_quality_threshold
      }
    }));

    return NextResponse.json({
      success: true,
      tiers: formattedTiers
    });
  } catch (error: any) {
    console.error('Error fetching tiers:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
