// API: Get client subscription details
// GET /api/clients/[id]/subscription

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/init';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = parseInt(params.id);

    // Get active subscription
    const subscription = await db.get<any>(
      `SELECT
        s.*,
        c.name AS company_name
      FROM client_subscriptions s
      JOIN companies c ON s.company_id = c.id
      WHERE s.company_id = ? AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1`,
      [companyId]
    );

    if (!subscription) {
      return NextResponse.json({
        success: false,
        error: 'No active subscription found'
      }, { status: 404 });
    }

    // Format response
    const formattedSubscription = {
      id: subscription.id,
      companyId: subscription.company_id,
      companyName: subscription.company_name,
      tierName: subscription.tier_name,
      monthlySpend: parseFloat(subscription.monthly_spend_usd),
      status: subscription.status,
      autopilotStatus: subscription.autopilot_status,
      quotas: {
        seoAudits: subscription.seo_audits_quota,
        blogPosts: subscription.blog_posts_quota,
        socialPosts: subscription.social_posts_quota,
        researchPapers: subscription.research_papers_quota,
        gmbPosts: subscription.gmb_posts_quota
      },
      used: {
        seoAudits: subscription.seo_audits_used,
        blogPosts: subscription.blog_posts_used,
        socialPosts: subscription.social_posts_used,
        researchPapers: subscription.research_papers_used,
        gmbPosts: subscription.gmb_posts_used
      },
      performance: {
        totalTasksCompleted: subscription.total_tasks_completed,
        avgRulerScore: subscription.avg_ruler_score ? parseFloat(subscription.avg_ruler_score) : null,
        seoScoreChange: subscription.seo_score_change ? parseFloat(subscription.seo_score_change) : null
      },
      billing: {
        nextBillingDate: subscription.next_billing_date,
        lastBillingDate: subscription.last_billing_date
      },
      timestamps: {
        createdAt: subscription.created_at,
        activatedAt: subscription.activated_at
      }
    };

    return NextResponse.json({
      success: true,
      subscription: formattedSubscription
    });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
