/**
 * Influence Strategy Agent
 *
 * Transforms discovered trends into strategic influence campaigns that position
 * your business as the industry thought leader.
 *
 * Core Strategy:
 * 1. BE FIRST - Publish authoritative content before competitors
 * 2. BE AUTHORITATIVE - Enhance E-E-A-T signals in every piece
 * 3. BE VISIBLE - Multi-platform amplification for maximum reach
 * 4. BE MEASURABLE - Track influence metrics (brand mentions, backlinks, CTAs)
 *
 * Influence Tactics:
 * - First-mover content on emerging trends
 * - Original research and data (NOT in AI training sets)
 * - Expert commentary and analysis
 * - Case studies and real-world applications
 * - Strategic keyword ownership (rank #1 for trend keywords)
 * - Social proof amplification (shares, mentions, citations)
 * - CTA optimization (convert awareness into leads)
 *
 * Metrics Tracked:
 * - Brand mention growth
 * - Keyword ranking improvements
 * - Backlink acquisition from authority sites
 * - Social media engagement (shares, comments, saves)
 * - Traffic increase to CTA pages
 * - Lead conversion rate
 * - Market share of voice (vs competitors)
 */

import Database from 'better-sqlite3';
import path from 'path';
import OpenAI from 'openai';
import { Trend } from './trend-intelligence-agent';
import { ContentGenerationAgent } from './content-generation-agent';
import { ContentCalendarAgent } from './content-calendar-agent';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.openai.com/v1'
});

const MODEL = process.env.DEEPSEEK_MODEL || 'gpt-4o-mini';

const contentGenerationAgent = new ContentGenerationAgent();
const contentCalendarAgent = new ContentCalendarAgent();

// ============================================================================
// INTERFACES
// ============================================================================

export interface InfluenceCampaignRequest {
  portfolioId: string;
  trendId: string;
  campaignGoal: 'thought_leadership' | 'lead_generation' | 'brand_awareness' | 'market_dominance';
  targetAudience: string;
  duration: number; // days
  platforms: string[]; // linkedin, wordpress, twitter, facebook, gmb
  ctaType?: 'consultation' | 'whitepaper_download' | 'webinar_signup' | 'contact_sales' | 'newsletter';
  budget?: number; // Optional: for paid amplification
}

export interface InfluenceCampaign {
  id?: string;
  portfolioId: string;
  trendId: string;
  campaignName: string;
  goal: string;
  status: 'planning' | 'content_creation' | 'publishing' | 'amplifying' | 'monitoring' | 'completed';
  strategyPhases: StrategyPhase[];
  contentPieces: CampaignContent[];
  targetMetrics: InfluenceMetrics;
  actualMetrics?: InfluenceMetrics;
  startDate: string;
  endDate: string;
  platforms: string[];
  cta: CallToAction;
  createdAt?: string;
}

export interface StrategyPhase {
  phase: number;
  name: string;
  description: string;
  duration: number; // days
  objectives: string[];
  tactics: string[];
  expectedImpact: 'high' | 'medium' | 'low';
}

export interface CampaignContent {
  contentType: 'pillar_article' | 'research_report' | 'expert_analysis' | 'case_study' | 'social_post' | 'video' | 'infographic';
  title: string;
  publishDate: string;
  platforms: string[];
  eeatEnhancements: string[];
  keywords: string[];
  estimatedReach: number;
  status: 'planned' | 'in_progress' | 'published';
  contentId?: string; // Reference to content_empire
}

export interface InfluenceMetrics {
  brandMentions: number;
  keywordRankings: Record<string, number>; // keyword -> position
  backlinks: number;
  authorityScore: number; // 0-100
  socialEngagement: number; // total engagements
  organicTraffic: number;
  ctaConversions: number;
  shareOfVoice: number; // % vs competitors
  estimatedReach: number;
}

export interface CallToAction {
  type: string;
  text: string;
  url: string;
  conversionGoal: number; // target conversions
}

export interface CampaignReport {
  success: boolean;
  campaign: InfluenceCampaign;
  executionPlan: string[];
  estimatedImpact: {
    reach: number;
    brandMentions: number;
    backlinks: number;
    ctaConversions: number;
    timeToMarketLeadership: string; // e.g., "3-6 months"
  };
  error?: string;
}

// ============================================================================
// INFLUENCE STRATEGY AGENT
// ============================================================================

export class InfluenceStrategyAgent {
  private dbPath: string;
  private dbInitialized: boolean = false;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'geo-seo.db');
  }

  /**
   * Create influence_campaigns table
   */
  private ensureCampaignsTable(): void {
    // Skip during build time
    if (typeof window !== 'undefined' || !process.env.NODE_ENV) {
      return;
    }

    if (this.dbInitialized) {
      return;
    }

    const db = new Database(this.dbPath);
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS influence_campaigns (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          portfolio_id TEXT NOT NULL,
          trend_id TEXT NOT NULL,
          campaign_name TEXT NOT NULL,
          goal TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'planning',
          strategy_phases TEXT NOT NULL DEFAULT '[]',
          content_pieces TEXT NOT NULL DEFAULT '[]',
          target_metrics TEXT NOT NULL DEFAULT '{}',
          actual_metrics TEXT DEFAULT '{}',
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          platforms TEXT NOT NULL DEFAULT '[]',
          cta TEXT NOT NULL DEFAULT '{}',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (portfolio_id) REFERENCES company_portfolios(id),
          FOREIGN KEY (trend_id) REFERENCES industry_trends(id)
        );

        CREATE INDEX IF NOT EXISTS idx_campaigns_portfolio ON influence_campaigns(portfolio_id);
        CREATE INDEX IF NOT EXISTS idx_campaigns_trend ON influence_campaigns(trend_id);
        CREATE INDEX IF NOT EXISTS idx_campaigns_status ON influence_campaigns(status);
      `);
      this.dbInitialized = true;
    } finally {
      db.close();
    }
  }

  /**
   * Create influence campaign from a trend
   */
  async createCampaign(request: InfluenceCampaignRequest): Promise<CampaignReport> {
    this.ensureCampaignsTable();

    console.log(`[Influence Strategy] Creating campaign for trend ${request.trendId}`);

    const db = new Database(this.dbPath);
    try {
      // Get portfolio and trend
      const portfolio = db.prepare('SELECT * FROM company_portfolios WHERE id = ?').get(request.portfolioId) as any;
      const trend = db.prepare('SELECT * FROM industry_trends WHERE id = ?').get(request.trendId) as any;

      if (!portfolio || !trend) {
        return {
          success: false,
          campaign: {} as InfluenceCampaign,
          executionPlan: [],
          estimatedImpact: { reach: 0, brandMentions: 0, backlinks: 0, ctaConversions: 0, timeToMarketLeadership: '' },
          error: 'Portfolio or trend not found'
        };
      }

      // Parse trend data
      const trendData: Trend = {
        ...trend,
        keywords: JSON.parse(trend.keywords || '[]'),
        sources: JSON.parse(trend.sources || '[]'),
        contentIdeas: JSON.parse(trend.content_ideas || '[]'),
        eeatOpportunities: JSON.parse(trend.eeat_opportunities || '[]')
      };

      // Generate campaign strategy
      const campaign = await this.generateCampaignStrategy(
        request,
        portfolio,
        trendData
      );

      // Save campaign to database
      const campaignId = this.generateCampaignId(campaign.campaignName);
      db.prepare(`
        INSERT INTO influence_campaigns (
          id, portfolio_id, trend_id, campaign_name, goal, status,
          strategy_phases, content_pieces, target_metrics,
          start_date, end_date, platforms, cta, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        campaignId,
        request.portfolioId,
        request.trendId,
        campaign.campaignName,
        campaign.goal,
        campaign.status,
        JSON.stringify(campaign.strategyPhases),
        JSON.stringify(campaign.contentPieces),
        JSON.stringify(campaign.targetMetrics),
        campaign.startDate,
        campaign.endDate,
        JSON.stringify(campaign.platforms),
        JSON.stringify(campaign.cta)
      );

      campaign.id = campaignId;

      // Generate execution plan
      const executionPlan = this.generateExecutionPlan(campaign);

      // Estimate impact
      const estimatedImpact = this.estimateImpact(campaign, trendData);

      // Log autonomous action
      db.prepare(`
        INSERT INTO autonomous_actions (
          portfolio_id, action_type, agent_name, description,
          input_data, output_data, status, cost, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        request.portfolioId,
        'influence_campaign_created',
        'influence-strategy-agent',
        `Created "${campaign.campaignName}" campaign with ${campaign.contentPieces.length} content pieces`,
        JSON.stringify(request),
        JSON.stringify({ campaignId, estimatedReach: estimatedImpact.reach }),
        'success',
        0.03
      );

      console.log(`[Influence Strategy] Campaign "${campaign.campaignName}" created with ${campaign.contentPieces.length} content pieces`);

      return {
        success: true,
        campaign,
        executionPlan,
        estimatedImpact
      };

    } catch (error: any) {
      console.error('[Influence Strategy] Error:', error);
      return {
        success: false,
        campaign: {} as InfluenceCampaign,
        executionPlan: [],
        estimatedImpact: { reach: 0, brandMentions: 0, backlinks: 0, ctaConversions: 0, timeToMarketLeadership: '' },
        error: error.message
      };
    } finally {
      db.close();
    }
  }

  /**
   * Generate campaign strategy using AI
   */
  private async generateCampaignStrategy(
    request: InfluenceCampaignRequest,
    portfolio: any,
    trend: Trend
  ): Promise<InfluenceCampaign> {
    const prompt = `Create a strategic influence campaign for ${portfolio.company_name} to dominate the "${trend.trendName}" conversation.

**Business Context:**
- Company: ${portfolio.company_name}
- Industry: ${portfolio.industry}
- Goal: ${request.campaignGoal}
- Target Audience: ${request.targetAudience}
- Campaign Duration: ${request.duration} days
- Platforms: ${request.platforms.join(', ')}

**Trend Details:**
- Trend: ${trend.trendName}
- Description: ${trend.description}
- Momentum: ${trend.momentum}/100
- Competition: ${trend.competition}/100
- Content Ideas: ${trend.contentIdeas.join(', ')}

**Strategic Objectives:**
1. Establish ${portfolio.company_name} as THE authority on "${trend.trendName}"
2. Rank #1 for all related keywords
3. Generate ${request.campaignGoal === 'lead_generation' ? '50+' : '100+'} qualified leads
4. Increase brand mentions by 300%

**Required Output:**

1. Campaign Name (catchy, memorable)

2. 3 Strategy Phases:
   - Phase 1: Foundation (first 30%)
   - Phase 2: Amplification (middle 40%)
   - Phase 3: Dominance (final 30%)
   Each phase needs objectives, tactics, duration

3. Content Pieces (6-10 pieces):
   - 1 Pillar Article (3000+ words, comprehensive)
   - 1 Research Report (original data, whitepaper)
   - 2-3 Expert Analysis pieces
   - 1 Case Study
   - 3-5 Social Posts
   Mix platforms strategically

4. E-E-A-T Enhancements for each piece:
   - Experience signals (real-world examples)
   - Expertise signals (credentials, certifications)
   - Authoritativeness (citations, data)
   - Trustworthiness (transparency, accuracy)

Return as JSON:
{
  "campaignName": "...",
  "strategyPhases": [{
    "phase": 1,
    "name": "...",
    "description": "...",
    "duration": 10,
    "objectives": ["...", "..."],
    "tactics": ["...", "..."],
    "expectedImpact": "high"
  }],
  "contentPieces": [{
    "contentType": "pillar_article",
    "title": "...",
    "platforms": ["wordpress", "linkedin"],
    "eeatEnhancements": ["...", "..."],
    "keywords": ["...", "..."],
    "estimatedReach": 5000
  }],
  "targetMetrics": {
    "brandMentions": 100,
    "backlinks": 25,
    "authorityScore": 85,
    "socialEngagement": 500,
    "organicTraffic": 10000,
    "ctaConversions": 50,
    "shareOfVoice": 40,
    "estimatedReach": 50000
  }
}`;

    const response = await deepseek.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 3500
    });

    const content = response.choices[0]?.message?.content || '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to generate campaign strategy');
    }

    const strategy = JSON.parse(jsonMatch[0]);

    // Build campaign object
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + request.duration * 24 * 60 * 60 * 1000);

    // Generate publish dates for content pieces
    const contentPieces: CampaignContent[] = strategy.contentPieces.map((piece: any, index: number) => {
      const phaseDuration = request.duration / strategy.strategyPhases.length;
      const phaseIndex = Math.floor((index / strategy.contentPieces.length) * strategy.strategyPhases.length);
      const daysOffset = phaseIndex * phaseDuration + (Math.random() * phaseDuration * 0.8);
      const publishDate = new Date(startDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);

      return {
        ...piece,
        publishDate: publishDate.toISOString(),
        status: 'planned' as const
      };
    });

    // Create CTA
    const cta: CallToAction = {
      type: request.ctaType || 'consultation',
      text: this.getCtaText(request.ctaType || 'consultation', portfolio.company_name),
      url: `${portfolio.website || 'https://example.com'}/contact`,
      conversionGoal: strategy.targetMetrics.ctaConversions || 50
    };

    return {
      portfolioId: request.portfolioId,
      trendId: request.trendId,
      campaignName: strategy.campaignName,
      goal: request.campaignGoal,
      status: 'planning',
      strategyPhases: strategy.strategyPhases,
      contentPieces,
      targetMetrics: strategy.targetMetrics,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      platforms: request.platforms,
      cta
    };
  }

  /**
   * Generate execution plan
   */
  private generateExecutionPlan(campaign: InfluenceCampaign): string[] {
    const plan: string[] = [];

    plan.push(`📋 CAMPAIGN: ${campaign.campaignName}`);
    plan.push(`🎯 GOAL: ${campaign.goal.replace(/_/g, ' ').toUpperCase()}`);
    plan.push('');

    campaign.strategyPhases.forEach(phase => {
      plan.push(`PHASE ${phase.phase}: ${phase.name.toUpperCase()} (${phase.duration} days)`);
      plan.push(`📖 ${phase.description}`);
      plan.push('Objectives:');
      phase.objectives.forEach(obj => plan.push(`  ✓ ${obj}`));
      plan.push('Tactics:');
      phase.tactics.forEach(tactic => plan.push(`  • ${tactic}`));
      plan.push('');
    });

    plan.push('📝 CONTENT SCHEDULE:');
    campaign.contentPieces
      .sort((a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime())
      .forEach((content, index) => {
        const date = new Date(content.publishDate).toLocaleDateString();
        plan.push(`  ${index + 1}. ${date} - ${content.title}`);
        plan.push(`     Type: ${content.contentType.replace(/_/g, ' ')}`);
        plan.push(`     Platforms: ${content.platforms.join(', ')}`);
        plan.push(`     Est. Reach: ${content.estimatedReach.toLocaleString()}`);
      });

    plan.push('');
    plan.push(`🎯 CTA: ${campaign.cta.text}`);
    plan.push(`   Goal: ${campaign.cta.conversionGoal} conversions`);

    return plan;
  }

  /**
   * Estimate campaign impact
   */
  private estimateImpact(campaign: InfluenceCampaign, trend: Trend) {
    const totalReach = campaign.contentPieces.reduce((sum, piece) => sum + piece.estimatedReach, 0);

    return {
      reach: totalReach,
      brandMentions: Math.round(totalReach * 0.002), // 0.2% mention rate
      backlinks: Math.round(campaign.contentPieces.filter(p => p.contentType === 'pillar_article' || p.contentType === 'research_report').length * 10),
      ctaConversions: campaign.cta.conversionGoal,
      timeToMarketLeadership: trend.competition < 40 ? '2-3 months' : '4-6 months'
    };
  }

  /**
   * Get CTA text based on type
   */
  private getCtaText(ctaType: string, companyName: string): string {
    const ctaMap: Record<string, string> = {
      'consultation': `Schedule a Free Consultation with ${companyName}`,
      'whitepaper_download': 'Download Our Comprehensive Industry Report',
      'webinar_signup': 'Register for Our Expert Webinar',
      'contact_sales': `Contact ${companyName} Sales Team`,
      'newsletter': 'Subscribe for Industry Insights'
    };
    return ctaMap[ctaType] || `Learn More About ${companyName}`;
  }

  /**
   * Execute campaign (auto-generate and schedule content)
   */
  async executeCampaign(campaignId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    this.ensureCampaignsTable();

    console.log(`[Influence Strategy] Executing campaign ${campaignId}`);

    const db = new Database(this.dbPath);
    try {
      const campaign = db.prepare('SELECT * FROM influence_campaigns WHERE id = ?').get(campaignId) as any;
      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }

      const contentPieces: CampaignContent[] = JSON.parse(campaign.content_pieces || '[]');
      const trend = db.prepare('SELECT * FROM industry_trends WHERE id = ?').get(campaign.trend_id) as any;

      // Update campaign status
      db.prepare('UPDATE influence_campaigns SET status = ? WHERE id = ?').run('content_creation', campaignId);

      // Generate content for each piece
      for (const piece of contentPieces) {
        console.log(`[Influence Strategy] Generating content: ${piece.title}`);

        // Map content type to generation format
        const contentTypeMap: Record<string, 'blog' | 'white_paper' | 'social_post'> = {
          'pillar_article': 'blog',
          'research_report': 'white_paper',
          'expert_analysis': 'blog',
          'case_study': 'blog',
          'social_post': 'social_post',
          'video': 'blog',
          'infographic': 'blog'
        };

        const contentFormat = contentTypeMap[piece.contentType] || 'blog';

        // Generate content
        const contentPackage = await contentGenerationAgent.generateContent({
          portfolioId: campaign.portfolio_id,
          topic: piece.title,
          industry: trend.category,
          contentType: contentFormat,
          targetAudience: 'Business decision makers',
          depth: piece.contentType === 'pillar_article' || piece.contentType === 'research_report' ? 'comprehensive' : 'detailed',
          includeCitations: true
        });

        if (contentPackage?.id) {
          piece.contentId = contentPackage.id;
          piece.status = 'published';
        }
      }

      // Update campaign with generated content IDs
      db.prepare('UPDATE influence_campaigns SET content_pieces = ?, status = ? WHERE id = ?')
        .run(JSON.stringify(contentPieces), 'publishing', campaignId);

      // Schedule posts via calendar agent
      const scheduledPosts = contentPieces.map(piece => ({
        portfolioId: campaign.portfolio_id,
        scheduledFor: piece.publishDate,
        contentType: 'educational',
        topic: piece.title,
        platforms: piece.platforms,
        status: 'scheduled' as const,
        contentId: piece.contentId,
        createdAt: new Date().toISOString()
      }));

      // Save to scheduled_posts table
      const insertStmt = db.prepare(`
        INSERT INTO scheduled_posts (
          portfolio_id, scheduled_for, content_type, topic, platforms, status, content_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      scheduledPosts.forEach(post => {
        insertStmt.run(
          post.portfolioId,
          post.scheduledFor,
          post.contentType,
          post.topic,
          JSON.stringify(post.platforms),
          post.status,
          post.contentId || null,
          post.createdAt
        );
      });

      console.log(`[Influence Strategy] Campaign executed: ${contentPieces.length} content pieces generated and scheduled`);

      return {
        success: true,
        message: `Campaign executed: ${contentPieces.length} content pieces generated and scheduled for publication`
      };

    } catch (error: any) {
      console.error('[Influence Strategy] Execution error:', error);
      return { success: false, error: error.message };
    } finally {
      db.close();
    }
  }

  /**
   * Generate campaign ID
   */
  private generateCampaignId(campaignName: string): string {
    return campaignName.toLowerCase().replace(/[^\w]+/g, '-').substring(0, 50);
  }

  /**
   * Get campaigns for portfolio
   */
  getCampaigns(portfolioId: string): InfluenceCampaign[] {
    const db = new Database(this.dbPath);
    try {
      const campaigns = db.prepare('SELECT * FROM influence_campaigns WHERE portfolio_id = ? ORDER BY created_at DESC')
        .all(portfolioId) as any[];

      return campaigns.map(c => ({
        ...c,
        strategyPhases: JSON.parse(c.strategy_phases || '[]'),
        contentPieces: JSON.parse(c.content_pieces || '[]'),
        targetMetrics: JSON.parse(c.target_metrics || '{}'),
        actualMetrics: JSON.parse(c.actual_metrics || '{}'),
        platforms: JSON.parse(c.platforms || '[]'),
        cta: JSON.parse(c.cta || '{}')
      }));
    } finally {
      db.close();
    }
  }
}

// Export singleton instance
export const influenceStrategyAgent = new InfluenceStrategyAgent();
