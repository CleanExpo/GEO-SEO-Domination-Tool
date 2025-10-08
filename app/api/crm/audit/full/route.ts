import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/init';
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

    console.log(`\n🚀 Full Audit Started for Portfolio: ${portfolioId}`);
    console.log(`   Type: ${auditType}`);
    console.log(`   URL: ${websiteUrl}`);
    console.log(`   Social Platforms: ${Object.keys(socialAccounts).length}`);

    // Create swarm coordination session
    const sessionId = crypto.randomUUID();
    await db.run(`
      INSERT INTO swarm_coordination (
        portfolio_id, session_id, coordination_type, priority, agents_deployed, status, started_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      portfolioId,
      sessionId,
      'audit',
      auditType === 'initial' ? 'high' : 'medium',
      JSON.stringify([
        { agent: 'SEOAuditAgent', status: 'pending' },
        { agent: 'SocialMediaAuditAgent', status: 'pending' },
        { agent: 'GMBAuditAgent', status: 'pending' },
        { agent: 'ContentQualityAuditAgent', status: 'pending' }
      ]),
      'running'
    ]);

    // Execute audits in parallel
    console.log('\n📋 Deploying Audit Swarm Agents...\n');

    const [seoResults, socialResults] = await Promise.all([
      // SEO Audit Agent
      (async () => {
        try {
          console.log('  🔍 SEO Audit Agent: ACTIVE');
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
          console.log('  📱 Social Media Audit Agent: ACTIVE');
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

    const auditId = crypto.randomUUID();
    await db.run(`
      INSERT INTO portfolio_audits (
        id, portfolio_id, audit_type,
        overall_score, seo_score, social_score, gmb_score, content_quality_score, brand_authority_score,
        findings, recommendations, opportunities,
        audit_duration_seconds, data_sources_used,
        started_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' seconds'), datetime('now'))
    `, [
      auditId,
      portfolioId,
      auditType,
      overallScore,
      scores.seo,
      scores.social,
      scores.gmb,
      scores.content_quality,
      scores.brand_authority,
      JSON.stringify(findings),
      JSON.stringify(recommendations),
      JSON.stringify(opportunities),
      auditDuration,
      JSON.stringify(['DeepSeek SEO', 'DeepSeek Social Media']),
      auditDuration
    ]);

    // Update swarm coordination
    await db.run(`
      UPDATE swarm_coordination
      SET status = 'completed',
          completion_percentage = 100,
          combined_score = ?,
          completed_at = datetime('now'),
          results = ?
      WHERE session_id = ?
    `, [
      overallScore,
      JSON.stringify({ seo: seoResults, social: socialResults }),
      sessionId
    ]);

    console.log(`\n✅ Full Audit Complete!`);
    console.log(`   Overall Score: ${overallScore}/100`);
    console.log(`   SEO: ${scores.seo}/100`);
    console.log(`   Social: ${scores.social}/100`);
    console.log(`   Duration: ${auditDuration}s`);
    console.log(`   Recommendations: ${recommendations.length}`);
    console.log(`   Opportunities: ${opportunities.length}\n`);

    // Trigger autonomous actions for high-priority items
    if (overallScore < 70) {
      console.log('🤖 Triggering autonomous optimization agents...');
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

  for (const rec of urgent) {
    // Log autonomous action
    await db.run(`
      INSERT INTO autonomous_actions (
        portfolio_id, agent_name, action_type, action_category,
        action_description, status, scheduled_for
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+1 hour'))
    `, [
      portfolioId,
      'AutoOptimizationAgent',
      'optimize',
      rec.category,
      rec.action,
      'pending'
    ]);
  }

  console.log(`   📝 Scheduled ${urgent.length} autonomous optimization actions`);
}
