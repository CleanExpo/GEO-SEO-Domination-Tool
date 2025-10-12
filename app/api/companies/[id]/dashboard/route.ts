/**
 * Unified Dashboard API - Consolidates all SEO metrics
 *
 * GET /api/companies/[id]/dashboard
 *
 * Returns:
 * - Domain Rating with 30-day trend
 * - Backlinks overview (total, velocity, dofollow %)
 * - Keywords overview (tracked, opportunities)
 * - Rankings overview (top 10, changes)
 * - Competitors quick comparison
 * - Recent audit score
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id: companyId } = await params;

    // Fetch backlink profile (Domain Rating + backlinks)
    const { data: backlinkProfile } = await supabase
      .from('backlink_profiles')
      .select('*')
      .eq('company_id', companyId)
      .single();

    // Fetch Domain Rating history for 30-day trend
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: drHistory } = await supabase
      .from('domain_rating_history')
      .select('domain_rating, recorded_at')
      .eq('company_id', companyId)
      .gte('recorded_at', thirtyDaysAgo)
      .order('recorded_at', { ascending: true });

    // Calculate DR change
    const currentDR = backlinkProfile?.domain_rating || 0;
    const oldestDR = drHistory && drHistory.length > 0 ? drHistory[0].domain_rating : currentDR;
    const drChange = currentDR - oldestDR;

    // Generate trend data (last 30 days, sampled)
    const trendData = drHistory && drHistory.length > 0
      ? drHistory.map((record) => record.domain_rating)
      : [currentDR];

    // Fetch keywords
    const { data: keywords, count: keywordCount } = await supabase
      .from('keywords')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId);

    // Fetch keyword opportunities
    const { count: opportunitiesCount } = await supabase
      .from('keyword_opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('target_status', 'pending');

    // Fetch keyword gaps
    const { count: gapsCount } = await supabase
      .from('keyword_opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('priority', 'High');

    // Fetch rankings
    const { data: rankings } = await supabase
      .from('rankings')
      .select('*')
      .eq('company_id', companyId)
      .order('checked_at', { ascending: false })
      .limit(100);

    // Calculate ranking stats
    const topTenCount = rankings?.filter((r) => r.position && r.position <= 10).length || 0;
    const topThreeCount = rankings?.filter((r) => r.position && r.position <= 3).length || 0;

    // Calculate improved/declined (compare current position with previous)
    let improvedCount = 0;
    let declinedCount = 0;

    if (rankings && rankings.length > 0) {
      // Group by keyword_id and compare latest with previous
      const keywordGroups = rankings.reduce((acc, ranking) => {
        if (!acc[ranking.keyword_id]) {
          acc[ranking.keyword_id] = [];
        }
        acc[ranking.keyword_id].push(ranking);
        return acc;
      }, {} as Record<string, typeof rankings>);

      Object.values(keywordGroups).forEach((group) => {
        if (group.length >= 2) {
          const latest = group[0];
          const previous = group[1];
          if (latest.position && previous.position) {
            if (latest.position < previous.position) {
              improvedCount++;
            } else if (latest.position > previous.position) {
              declinedCount++;
            }
          }
        }
      });
    }

    // Fetch competitors (from competitor_analyses)
    const { data: competitors } = await supabase
      .from('competitor_analyses')
      .select('competitor_domain, overall_strength, backlink_gap')
      .eq('company_id', companyId)
      .order('analyzed_at', { ascending: false })
      .limit(5);

    // Map competitor data
    const competitorData = competitors?.map((comp) => {
      // Estimate competitor DR based on gap
      const estimatedDR = currentDR + (comp.backlink_gap || 0);
      return {
        domain: comp.competitor_domain,
        domainRating: Math.max(0, Math.min(100, estimatedDR)),
        gap: comp.backlink_gap || 0,
      };
    }) || [];

    // Fetch latest audit
    const { data: audit } = await supabase
      .from('audits')
      .select('score, critical_issues, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Construct dashboard data
    const dashboardData = {
      domainRating: {
        current: currentDR,
        change: Math.round(drChange),
        trend: trendData.slice(-30), // Last 30 data points
      },
      backlinks: {
        total: backlinkProfile?.total_backlinks || 0,
        referringDomains: backlinkProfile?.referring_domains || 0,
        dofollowPercentage: backlinkProfile?.total_backlinks
          ? Math.round((backlinkProfile.dofollow_links / backlinkProfile.total_backlinks) * 100)
          : 0,
        velocity: {
          gained: backlinkProfile?.link_velocity_gained || 0,
          lost: backlinkProfile?.link_velocity_lost || 0,
        },
      },
      keywords: {
        tracked: keywordCount || 0,
        opportunities: opportunitiesCount || 0,
        gaps: gapsCount || 0,
      },
      rankings: {
        topTen: topTenCount,
        topThree: topThreeCount,
        improved: improvedCount,
        declined: declinedCount,
      },
      competitors: competitorData,
      audit: {
        score: audit?.score || 0,
        lastRun: audit?.created_at || new Date().toISOString(),
        criticalIssues: audit?.critical_issues || 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error: any) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
