import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { seoAuditAgent } from '@/services/agents/seo-audit-agent';
import { socialMediaAuditAgent } from '@/services/agents/social-media-audit-agent';

/**
 * POST /api/crm/audit/full
 *
 * Execute full portfolio audit across all channels
 * This is the entry point for the Audit Swarm
 */

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const {
      portfolioId,
      auditType = 'scheduled',
      websiteUrl,
      socialAccounts = {},
      gmbId,
      industry,
      targetKeywords = [],
      competitors = []
    } = body;

    if (!portfolioId || !websiteUrl) {
      return NextResponse.json(
        { error: 'portfolioId and websiteUrl are required' },
        { status: 400 }
      );
    }



    console.log(`   Social Platforms: ${Object.keys(socialAccounts).length}`);

    // Create swarm coordination session
    const supabase = createAdminClient();
    const sessionId = crypto.randomUUID();
    const { error: coordError } = await supabase
      .from('swarm_coordination')
      .insert([{
        portfolio_id: portfolioId,
        session_id: sessionId,
        coordination_type: 'audit',
        priority: auditType === 'initial' ? 'high' : 'medium',
        agents_deployed: [
          { agent: 'SEOAuditAgent', status: 'pending' },
          { agent: 'SocialMediaAuditAgent', status: 'pending' },
          { agent: 'GMBAuditAgent', status: 'pending' },
          { agent: 'ContentQualityAuditAgent', status: 'pending' }
        ],
        status: 'running',
        started_at: new Date().toISOString()
      }]);

    if (coordError) {
      console.error('Failed to create coordination session:', coordError);
    }

    // Execute audits in parallel

    const [seoResults, socialResults] = await Promise.all([
      // SEO Audit Agent
      (async () => {
        try {

          const result = await seoAuditAgent.auditWebsite(websiteUrl, {
            includeLocal: !!gmbId,
            competitors,
            targetKeywords
          });
          console.log(`  ✅ SEO Audit Agent: COMPLETE (Score: ${result.overallScore}/100)`);
          return result;
        } catch (error) {
          console.error('  ❌ SEO Audit Agent: FAILED', error);
          return null;
        }
      })(),

      // Social Media Audit Agent
      (async () => {
        if (Object.keys(socialAccounts).length === 0) {
          console.log('  ⏭️  Social Media Audit Agent: SKIPPED (no accounts)');
          return null;
        }

        try {

          const result = await socialMediaAuditAgent.auditAllPlatforms(socialAccounts, {
            periodDays: 30,
            includeCompetitors: competitors.length > 0
          });
          console.log(`  ✅ Social Media Audit Agent: COMPLETE (Score: ${result.overallScore}/100)`);
          return result;
        } catch (error) {
          console.error('  ❌ Social Media Audit Agent: FAILED', error);
          return null;
        }
      })()
    ]);

    // Calculate overall scores
    const scores = {
      seo: seoResults?.overallScore || 0,
      social: socialResults?.overallScore || 0,
      gmb: 0, // TODO: Implement GMB audit
      content_quality: 0, // TODO: Implement content quality audit
      brand_authority: 0 // TODO: Calculate from combined metrics
    };

    scores.brand_authority = Math.round(
      (scores.seo * 0.4) + (scores.social * 0.3) + (scores.gmb * 0.2) + (scores.content_quality * 0.1)
    );

    const overallScore = Math.round(
      Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length
    );

    // Aggregate findings and recommendations
    const findings = {
      seo: seoResults ? {
        technical: seoResults.technicalSEO,
        onPage: seoResults.onPageSEO,
        offPage: seoResults.offPageSEO,
        local: seoResults.localSEO
      } : {},
      social: socialResults ? {
        platforms: socialResults.platformAnalysis,
        crossPlatform: socialResults.crossPlatformInsights,
        competitors: socialResults.competitorComparison
      } : {}
    };

    const recommendations = [
      ...(seoResults?.recommendations || []).map(r => ({ ...r, source: 'SEO' })),
      ...(socialResults?.recommendations || []).map(r => ({ ...r, source: 'Social' }))
    ].sort((a, b) => b.impact - a.impact);

    const opportunities = [
      ...(seoResults?.opportunities || []).map(o => ({ ...o, source: 'SEO' })),
      ...(socialResults?.opportunities || []).map(o => ({ ...o, source: 'Social' }))
    ].sort((a, b) => b.value - a.value);

    // Save audit results
    const auditDuration = Math.round((Date.now() - startTime) / 1000);
    const now = new Date().toISOString();
    const startedAt = new Date(Date.now() - auditDuration * 1000).toISOString();

    const auditId = crypto.randomUUID();
    const { error: auditError } = await supabase
      .from('portfolio_audits')
      .insert([{
        id: auditId,
        portfolio_id: portfolioId,
        audit_type: auditType,
        overall_score: overallScore,
        seo_score: scores.seo,
        social_score: scores.social,
        gmb_score: scores.gmb,
        content_quality_score: scores.content_quality,
        brand_authority_score: scores.brand_authority,
        findings: findings,
        recommendations: recommendations,
        opportunities: opportunities,
        audit_duration_seconds: auditDuration,
        data_sources_used: ['DeepSeek SEO', 'DeepSeek Social Media'],
        started_at: startedAt,
        completed_at: now
      }]);

    if (auditError) {
      console.error('Failed to save audit results:', auditError);
    }

    // Update swarm coordination
    await supabase
      .from('swarm_coordination')
      .update({
        status: 'completed',
        completion_percentage: 100,
        combined_score: overallScore,
        completed_at: new Date().toISOString(),
        results: { seo: seoResults, social: socialResults }
      })
      .eq('session_id', sessionId);







    // Trigger autonomous actions for high-priority items
    if (overallScore < 70) {

      triggerAutonomousOptimization(portfolioId, recommendations).catch(err =>
        console.error('Failed to trigger optimization:', err)
      );
    }

    return NextResponse.json({
      success: true,
      auditId,
      sessionId,
      portfolio_id: portfolioId,
      audit_type: auditType,
      scores: {
        overall: overallScore,
        seo: scores.seo,
        social: scores.social,
        gmb: scores.gmb,
        content_quality: scores.content_quality,
        brand_authority: scores.brand_authority
      },
      summary: {
        totalRecommendations: recommendations.length,
        criticalIssues: recommendations.filter(r => r.priority === 'critical').length,
        totalOpportunities: opportunities.length,
        highValueOpportunities: opportunities.filter(o => o.value > 80).length
      },
      recommendations: recommendations.slice(0, 10), // Top 10
      opportunities: opportunities.slice(0, 10), // Top 10
      duration_seconds: auditDuration,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Full audit failed:', error);

    return NextResponse.json(
      {
        error: 'Full audit failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Trigger autonomous optimization based on audit results
 */
async function triggerAutonomousOptimization(
  portfolioId: string,
  recommendations: any[]
) {
  // Get critical and high priority recommendations
  const urgent = recommendations.filter(
    r => r.priority === 'critical' || r.priority === 'high'
  ).slice(0, 5);

  const supabase = createAdminClient();
  const scheduledFor = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // +1 hour

  for (const rec of urgent) {
    // Log autonomous action
    await supabase
      .from('autonomous_actions')
      .insert([{
        portfolio_id: portfolioId,
        agent_name: 'AutoOptimizationAgent',
        action_type: 'optimize',
        action_category: rec.category,
        action_description: rec.action,
        status: 'pending',
        scheduled_for: scheduledFor
      }]);
  }
}
