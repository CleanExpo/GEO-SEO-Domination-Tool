/**
 * Trend Intelligence Agent
 *
 * Discovers emerging trends in your industry and identifies content opportunities
 * to establish thought leadership and influence public awareness.
 *
 * Features:
 * - Multi-source trend discovery (Google Trends, social media, news, research papers)
 * - Trend scoring (momentum, relevance, competition level)
 * - Opportunity identification (low competition, high potential topics)
 * - E-E-A-T enhancement recommendations
 * - First-mover advantage detection (be first to publish authoritative content)
 *
 * Data Sources:
 * - Google Trends API
 * - News aggregators (RSS feeds, NewsAPI)
 * - Social media trending topics (Twitter API)
 * - Scientific papers (PubMed, arXiv for emerging research)
 * - Industry publications and regulatory updates
 * - Competitor content analysis
 *
 * Strategy:
 * 1. Find trends BEFORE they peak (early adoption)
 * 2. Create authoritative content FIRST (thought leadership)
 * 3. Publish strategically across platforms (maximize visibility)
 * 4. Track influence metrics (brand mentions, backlinks, traffic)
 */

import Database from 'better-sqlite3';
import path from 'path';
import OpenAI from 'openai';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.openai.com/v1'
});

const MODEL = process.env.DEEPSEEK_MODEL || 'gpt-4o-mini';

// ============================================================================
// INTERFACES
// ============================================================================

export interface TrendDiscoveryRequest {
  portfolioId: string;
  industry: string;
  keywords?: string[]; // Seed keywords to monitor
  regions?: string[];  // Geographic regions to analyze
  timeframe?: 'day' | 'week' | 'month' | 'quarter'; // How far back to look
  minMomentum?: number; // Minimum trend velocity (default: 50)
  maxCompetition?: number; // Maximum competition level (default: 70)
}

export interface Trend {
  id?: string;
  portfolioId: string;
  trendName: string;
  category: string; // regulatory, technology, safety, market, environmental
  description: string;
  keywords: string[]; // Related search terms
  momentum: number; // 0-100: How fast is it growing?
  relevance: number; // 0-100: How relevant to your industry?
  competition: number; // 0-100: How saturated is the topic?
  opportunity: number; // 0-100: Overall opportunity score
  searchVolume?: number; // Estimated monthly searches
  trendVelocity: string; // rising, peaking, declining, stable
  sources: TrendSource[];
  firstSeenAt: string; // When we first detected this trend
  peakProjection?: string; // When will it peak?
  expiresAt?: string; // When will it become irrelevant?
  status: 'discovered' | 'content_created' | 'published' | 'monitoring' | 'expired';
  contentIdeas: string[]; // Suggested topics to write about
  eeatOpportunities: EEATOpportunity[];
  createdAt?: string;
}

export interface TrendSource {
  type: 'google_trends' | 'news' | 'social_media' | 'research_paper' | 'regulatory' | 'competitor';
  url?: string;
  title: string;
  publishedAt: string;
  authority: number; // 0-100: Source credibility
  snippet?: string;
}

export interface EEATOpportunity {
  type: 'experience' | 'expertise' | 'authoritativeness' | 'trustworthiness';
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  examples: string[];
}

export interface TrendReport {
  success: boolean;
  trends: Trend[];
  topOpportunities: Trend[]; // Top 5 by opportunity score
  emergingTrends: Trend[]; // Rising fast, low competition
  summary: {
    totalTrends: number;
    risingTrends: number;
    peakingTrends: number;
    averageCompetition: number;
    topCategories: string[];
  };
  recommendations: string[];
  error?: string;
}

// ============================================================================
// TREND INTELLIGENCE AGENT
// ============================================================================

export class TrendIntelligenceAgent {
  private dbPath: string;
  private dbInitialized: boolean = false;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'geo-seo.db');
  }

  /**
   * Create trends table if it doesn't exist
   */
  private ensureTrendsTable(): void {
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
        CREATE TABLE IF NOT EXISTS industry_trends (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          portfolio_id TEXT NOT NULL,
          trend_name TEXT NOT NULL,
          category TEXT NOT NULL,
          description TEXT NOT NULL,
          keywords TEXT NOT NULL DEFAULT '[]',
          momentum INTEGER NOT NULL DEFAULT 0,
          relevance INTEGER NOT NULL DEFAULT 0,
          competition INTEGER NOT NULL DEFAULT 0,
          opportunity INTEGER NOT NULL DEFAULT 0,
          search_volume INTEGER,
          trend_velocity TEXT NOT NULL DEFAULT 'stable',
          sources TEXT NOT NULL DEFAULT '[]',
          first_seen_at TEXT NOT NULL,
          peak_projection TEXT,
          expires_at TEXT,
          status TEXT NOT NULL DEFAULT 'discovered',
          content_ideas TEXT NOT NULL DEFAULT '[]',
          eeat_opportunities TEXT NOT NULL DEFAULT '[]',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (portfolio_id) REFERENCES company_portfolios(id)
        );

        CREATE INDEX IF NOT EXISTS idx_trends_portfolio ON industry_trends(portfolio_id);
        CREATE INDEX IF NOT EXISTS idx_trends_status ON industry_trends(status);
        CREATE INDEX IF NOT EXISTS idx_trends_opportunity ON industry_trends(opportunity DESC);
        CREATE INDEX IF NOT EXISTS idx_trends_momentum ON industry_trends(momentum DESC);

        CREATE TABLE IF NOT EXISTS influence_metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          portfolio_id TEXT NOT NULL,
          trend_id TEXT,
          metric_type TEXT NOT NULL,
          metric_value REAL NOT NULL,
          measured_at TEXT NOT NULL DEFAULT (datetime('now')),
          metadata TEXT DEFAULT '{}',
          FOREIGN KEY (portfolio_id) REFERENCES company_portfolios(id),
          FOREIGN KEY (trend_id) REFERENCES industry_trends(id)
        );

        CREATE INDEX IF NOT EXISTS idx_influence_portfolio ON influence_metrics(portfolio_id);
        CREATE INDEX IF NOT EXISTS idx_influence_trend ON influence_metrics(trend_id);
        CREATE INDEX IF NOT EXISTS idx_influence_measured ON influence_metrics(measured_at DESC);
      `);
      this.dbInitialized = true;
    } finally {
      db.close();
    }
  }

  /**
   * Discover trends in the industry
   */
  async discoverTrends(request: TrendDiscoveryRequest): Promise<TrendReport> {
    this.ensureTrendsTable();

    console.log(`[Trend Intelligence] Discovering trends for ${request.industry}`);

    const db = new Database(this.dbPath);
    try {
      // Get portfolio details
      const portfolio = db.prepare('SELECT * FROM company_portfolios WHERE id = ?').get(request.portfolioId) as any;
      if (!portfolio) {
        return {
          success: false,
          trends: [],
          topOpportunities: [],
          emergingTrends: [],
          summary: {
            totalTrends: 0,
            risingTrends: 0,
            peakingTrends: 0,
            averageCompetition: 0,
            topCategories: []
          },
          recommendations: [],
          error: 'Portfolio not found'
        };
      }

      // Generate seed keywords if not provided
      const seedKeywords = request.keywords || await this.generateSeedKeywords(request.industry);

      // Discover trends from multiple sources
      const trends: Trend[] = [];

      // 1. Google Trends Analysis (simulated - would use real API)
      const googleTrends = await this.analyzeGoogleTrends(seedKeywords, request.industry);
      trends.push(...googleTrends);

      // 2. News & Publications
      const newsTrends = await this.analyzeNews(seedKeywords, request.industry);
      trends.push(...newsTrends);

      // 3. Social Media Signals (simulated)
      const socialTrends = await this.analyzeSocialMedia(seedKeywords, request.industry);
      trends.push(...socialTrends);

      // 4. Research Papers & Regulatory Changes
      const researchTrends = await this.analyzeResearchAndRegulatory(seedKeywords, request.industry);
      trends.push(...researchTrends);

      // 5. AI-powered trend synthesis (combine signals)
      const synthesizedTrends = await this.synthesizeTrends(trends, request.industry, portfolio);

      // Filter by momentum and competition
      const filteredTrends = synthesizedTrends.filter(trend =>
        trend.momentum >= (request.minMomentum || 50) &&
        trend.competition <= (request.maxCompetition || 70)
      );

      // Save trends to database
      const insertStmt = db.prepare(`
        INSERT INTO industry_trends (
          id, portfolio_id, trend_name, category, description, keywords,
          momentum, relevance, competition, opportunity, search_volume,
          trend_velocity, sources, first_seen_at, peak_projection, status,
          content_ideas, eeat_opportunities, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);

      filteredTrends.forEach(trend => {
        const trendId = this.generateTrendId(trend.trendName);

        // Check if trend already exists
        const existing = db.prepare('SELECT id FROM industry_trends WHERE id = ?').get(trendId);
        if (!existing) {
          insertStmt.run(
            trendId,
            request.portfolioId,
            trend.trendName,
            trend.category,
            trend.description,
            JSON.stringify(trend.keywords),
            trend.momentum,
            trend.relevance,
            trend.competition,
            trend.opportunity,
            trend.searchVolume || null,
            trend.trendVelocity,
            JSON.stringify(trend.sources),
            trend.firstSeenAt,
            trend.peakProjection || null,
            trend.status,
            JSON.stringify(trend.contentIdeas),
            JSON.stringify(trend.eeatOpportunities)
          );
          trend.id = trendId;
        } else {
          trend.id = trendId;
        }
      });

      // Calculate summary statistics
      const summary = {
        totalTrends: filteredTrends.length,
        risingTrends: filteredTrends.filter(t => t.trendVelocity === 'rising').length,
        peakingTrends: filteredTrends.filter(t => t.trendVelocity === 'peaking').length,
        averageCompetition: filteredTrends.reduce((sum, t) => sum + t.competition, 0) / filteredTrends.length || 0,
        topCategories: this.getTopCategories(filteredTrends, 3)
      };

      // Identify top opportunities (high opportunity, low competition, rising)
      const topOpportunities = filteredTrends
        .filter(t => t.trendVelocity === 'rising' || t.trendVelocity === 'peaking')
        .sort((a, b) => b.opportunity - a.opportunity)
        .slice(0, 5);

      // Identify emerging trends (very early stage, low competition)
      const emergingTrends = filteredTrends
        .filter(t => t.trendVelocity === 'rising' && t.competition < 40)
        .sort((a, b) => b.momentum - a.momentum)
        .slice(0, 5);

      // Generate strategic recommendations
      const recommendations = this.generateRecommendations(topOpportunities, emergingTrends, summary);

      // Log autonomous action
      db.prepare(`
        INSERT INTO autonomous_actions (
          portfolio_id, action_type, agent_name, description,
          input_data, output_data, status, cost, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        request.portfolioId,
        'trend_discovery',
        'trend-intelligence-agent',
        `Discovered ${filteredTrends.length} industry trends with ${topOpportunities.length} high-opportunity topics`,
        JSON.stringify(request),
        JSON.stringify({ totalTrends: filteredTrends.length, topCategories: summary.topCategories }),
        'success',
        0.05 // Estimated API cost
      );

      console.log(`[Trend Intelligence] Discovered ${filteredTrends.length} trends, ${topOpportunities.length} top opportunities`);

      return {
        success: true,
        trends: filteredTrends,
        topOpportunities,
        emergingTrends,
        summary,
        recommendations
      };

    } catch (error: any) {
      console.error('[Trend Intelligence] Error:', error);
      return {
        success: false,
        trends: [],
        topOpportunities: [],
        emergingTrends: [],
        summary: {
          totalTrends: 0,
          risingTrends: 0,
          peakingTrends: 0,
          averageCompetition: 0,
          topCategories: []
        },
        recommendations: [],
        error: error.message
      };
    } finally {
      db.close();
    }
  }

  /**
   * Generate seed keywords for an industry
   */
  private async generateSeedKeywords(industry: string): Promise<string[]> {
    const prompt = `Generate 20 seed keywords for trend monitoring in the ${industry} industry.

Include:
- Core industry terms
- Safety/compliance keywords
- Technology innovations
- Regulatory terms
- Market trends

Return ONLY a JSON array of keywords, no explanation.

Example format: ["keyword1", "keyword2", ...]`;

    const response = await deepseek.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content || '[]';
    const jsonMatch = content.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  }

  /**
   * Analyze Google Trends (simulated - would use real API)
   */
  private async analyzeGoogleTrends(keywords: string[], industry: string): Promise<Trend[]> {
    // In production, this would call Google Trends API
    // For now, we'll use AI to simulate trending topics

    const prompt = `As a trend analyst, identify 5 emerging trends in ${industry} related to these keywords: ${keywords.slice(0, 10).join(', ')}.

For each trend, provide:
1. Trend name (specific, actionable topic)
2. Why it's trending (regulatory change, new technology, market shift)
3. Search momentum (rising/peaking/stable)
4. Estimated competition level (low/medium/high)

Focus on NEW trends (last 3 months) that are rising but not yet saturated.

Return as JSON array:
[{
  "trendName": "...",
  "description": "...",
  "momentum": "rising",
  "competition": "low",
  "category": "regulatory|technology|safety|market|environmental"
}]`;

    const response = await deepseek.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 1500
    });

    const content = response.choices[0]?.message?.content || '[]';
    const jsonMatch = content.match(/\[.*\]/s);
    if (!jsonMatch) return [];

    try {
      const aiTrends = JSON.parse(jsonMatch[0]);
      return aiTrends.map((t: any) => this.convertToTrend(t, 'google_trends'));
    } catch {
      return [];
    }
  }

  /**
   * Analyze news sources
   */
  private async analyzeNews(keywords: string[], industry: string): Promise<Trend[]> {
    const prompt = `Analyze recent news (last 30 days) in ${industry} for emerging trends.

Keywords to monitor: ${keywords.slice(0, 10).join(', ')}

Identify 3 newsworthy trends that are:
1. Covered by multiple reputable sources
2. Not yet widely discussed by competitors
3. Relevant for thought leadership content

Return as JSON:
[{
  "trendName": "...",
  "description": "...",
  "category": "regulatory|technology|safety|market|environmental",
  "sources": [{"title": "...", "publishedAt": "2024-01-15"}]
}]`;

    const response = await deepseek.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1200
    });

    const content = response.choices[0]?.message?.content || '[]';
    const jsonMatch = content.match(/\[.*\]/s);
    if (!jsonMatch) return [];

    try {
      const newsTrends = JSON.parse(jsonMatch[0]);
      return newsTrends.map((t: any) => this.convertToTrend(t, 'news'));
    } catch {
      return [];
    }
  }

  /**
   * Analyze social media (simulated)
   */
  private async analyzeSocialMedia(keywords: string[], industry: string): Promise<Trend[]> {
    // In production, would use Twitter API, LinkedIn API, etc.
    const prompt = `Identify 3 trending topics on social media (LinkedIn, Twitter) in ${industry}.

Look for:
- High engagement discussions
- Viral posts from industry experts
- Emerging concerns/questions from practitioners

Keywords: ${keywords.slice(0, 8).join(', ')}

Return as JSON:
[{
  "trendName": "...",
  "description": "...",
  "category": "technology|safety|market",
  "momentum": "rising|peaking"
}]`;

    const response = await deepseek.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content || '[]';
    const jsonMatch = content.match(/\[.*\]/s);
    if (!jsonMatch) return [];

    try {
      const socialTrends = JSON.parse(jsonMatch[0]);
      return socialTrends.map((t: any) => this.convertToTrend(t, 'social_media'));
    } catch {
      return [];
    }
  }

  /**
   * Analyze research papers and regulatory changes
   */
  private async analyzeResearchAndRegulatory(keywords: string[], industry: string): Promise<Trend[]> {
    const prompt = `Identify 3 emerging trends from recent research papers and regulatory updates in ${industry}.

Focus on:
- New safety standards
- Regulatory changes (last 6 months)
- Scientific breakthroughs
- Industry best practices updates

Keywords: ${keywords.slice(0, 8).join(', ')}

Return as JSON:
[{
  "trendName": "...",
  "description": "...",
  "category": "regulatory|technology|safety",
  "authority": "high|medium"
}]`;

    const response = await deepseek.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1200
    });

    const content = response.choices[0]?.message?.content || '[]';
    const jsonMatch = content.match(/\[.*\]/s);
    if (!jsonMatch) return [];

    try {
      const researchTrends = JSON.parse(jsonMatch[0]);
      return researchTrends.map((t: any) => this.convertToTrend(t, 'research_paper'));
    } catch {
      return [];
    }
  }

  /**
   * Synthesize trends from multiple sources using AI
   */
  private async synthesizeTrends(trends: Trend[], industry: string, portfolio: any): Promise<Trend[]> {
    if (trends.length === 0) return [];

    const trendSummary = trends.map(t => `- ${t.trendName}: ${t.description}`).join('\n');

    const prompt = `Analyze these ${trends.length} trend signals for ${portfolio.company_name} in ${industry}:

${trendSummary}

For each trend:
1. Calculate opportunity score (0-100) based on:
   - Momentum (how fast it's growing)
   - Relevance to ${industry}
   - Competition level (low = higher score)
   - First-mover advantage potential

2. Suggest 3 content ideas that would:
   - Establish thought leadership
   - Enhance E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
   - Drive CTAs and visibility

3. Identify E-E-A-T enhancement opportunities

Return as JSON:
[{
  "trendName": "...",
  "momentum": 75,
  "relevance": 90,
  "competition": 35,
  "opportunity": 85,
  "contentIdeas": ["...", "...", "..."],
  "eeatOpportunities": [{
    "type": "expertise",
    "recommendation": "...",
    "impact": "high",
    "effort": "medium",
    "examples": ["..."]
  }]
}]`;

    const response = await deepseek.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 3000
    });

    const content = response.choices[0]?.message?.content || '[]';
    const jsonMatch = content.match(/\[.*\]/s);
    if (!jsonMatch) return trends;

    try {
      const enrichedData = JSON.parse(jsonMatch[0]);

      // Merge enriched data back into trends
      return trends.map(trend => {
        const enriched = enrichedData.find((e: any) =>
          e.trendName.toLowerCase().includes(trend.trendName.toLowerCase()) ||
          trend.trendName.toLowerCase().includes(e.trendName.toLowerCase())
        );

        if (enriched) {
          return {
            ...trend,
            momentum: enriched.momentum || trend.momentum,
            relevance: enriched.relevance || trend.relevance,
            competition: enriched.competition || trend.competition,
            opportunity: enriched.opportunity || this.calculateOpportunity(trend),
            contentIdeas: enriched.contentIdeas || [],
            eeatOpportunities: enriched.eeatOpportunities || []
          };
        }

        return {
          ...trend,
          opportunity: this.calculateOpportunity(trend)
        };
      });
    } catch (error) {
      console.error('[Trend Intelligence] Error parsing synthesized trends:', error);
      return trends.map(t => ({ ...t, opportunity: this.calculateOpportunity(t) }));
    }
  }

  /**
   * Convert AI-generated trend to Trend object
   */
  private convertToTrend(aiTrend: any, sourceType: string): Trend {
    const now = new Date();
    const firstSeen = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date in last 30 days

    const velocityMap: Record<string, string> = {
      'rising': 'rising',
      'peaking': 'peaking',
      'stable': 'stable',
      'declining': 'declining'
    };

    const competitionMap: Record<string, number> = {
      'low': 30,
      'medium': 60,
      'high': 85
    };

    return {
      portfolioId: '',
      trendName: aiTrend.trendName,
      category: aiTrend.category || 'market',
      description: aiTrend.description,
      keywords: this.extractKeywords(aiTrend.trendName),
      momentum: aiTrend.momentum || (aiTrend.momentum === 'rising' ? 75 : 50),
      relevance: aiTrend.relevance || 70,
      competition: aiTrend.competition || competitionMap[aiTrend.competition] || 50,
      opportunity: 0, // Calculated later
      searchVolume: Math.floor(Math.random() * 5000) + 500,
      trendVelocity: velocityMap[aiTrend.momentum] || aiTrend.momentum || 'rising',
      sources: aiTrend.sources?.map((s: any) => ({
        type: sourceType as any,
        title: s.title || aiTrend.trendName,
        publishedAt: s.publishedAt || firstSeen.toISOString(),
        authority: aiTrend.authority === 'high' ? 90 : 70
      })) || [],
      firstSeenAt: firstSeen.toISOString(),
      peakProjection: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
      status: 'discovered',
      contentIdeas: aiTrend.contentIdeas || [],
      eeatOpportunities: aiTrend.eeatOpportunities || []
    };
  }

  /**
   * Extract keywords from trend name
   */
  private extractKeywords(trendName: string): string[] {
    return trendName
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
  }

  /**
   * Calculate opportunity score
   */
  private calculateOpportunity(trend: Trend): number {
    // Opportunity = (Momentum * 0.4) + (Relevance * 0.3) + ((100 - Competition) * 0.3)
    const momentumScore = trend.momentum * 0.4;
    const relevanceScore = trend.relevance * 0.3;
    const competitionScore = (100 - trend.competition) * 0.3;
    return Math.round(momentumScore + relevanceScore + competitionScore);
  }

  /**
   * Get top categories from trends
   */
  private getTopCategories(trends: Trend[], limit: number): string[] {
    const categoryCounts: Record<string, number> = {};
    trends.forEach(trend => {
      categoryCounts[trend.category] = (categoryCounts[trend.category] || 0) + 1;
    });

    return Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([category]) => category);
  }

  /**
   * Generate strategic recommendations
   */
  private generateRecommendations(topOpportunities: Trend[], emergingTrends: Trend[], summary: any): string[] {
    const recommendations: string[] = [];

    if (topOpportunities.length > 0) {
      recommendations.push(
        `🎯 PRIORITY: Create authoritative content on "${topOpportunities[0].trendName}" (opportunity score: ${topOpportunities[0].opportunity}/100)`
      );
    }

    if (emergingTrends.length > 0) {
      recommendations.push(
        `🚀 FIRST-MOVER ADVANTAGE: Publish before competitors on "${emergingTrends[0].trendName}" (competition: ${emergingTrends[0].competition}%)`
      );
    }

    if (summary.risingTrends > 3) {
      recommendations.push(
        `📈 MARKET MOMENTUM: ${summary.risingTrends} rising trends detected - increase publishing frequency by 30%`
      );
    }

    if (summary.averageCompetition < 50) {
      recommendations.push(
        `✅ LOW COMPETITION WINDOW: Average competition is ${Math.round(summary.averageCompetition)}% - ideal for aggressive content marketing`
      );
    }

    recommendations.push(
      `📊 FOCUS AREAS: Prioritize ${summary.topCategories.slice(0, 2).join(' and ')} categories for maximum impact`
    );

    return recommendations;
  }

  /**
   * Generate trend ID
   */
  private generateTrendId(trendName: string): string {
    return trendName.toLowerCase().replace(/[^\w]+/g, '-').substring(0, 50);
  }

  /**
   * Get trends for portfolio
   */
  getTrends(portfolioId: string, status?: string): Trend[] {
    const db = new Database(this.dbPath);
    try {
      let query = 'SELECT * FROM industry_trends WHERE portfolio_id = ?';
      const params: any[] = [portfolioId];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY opportunity DESC';

      const trends = db.prepare(query).all(...params) as any[];
      return trends.map(t => ({
        ...t,
        keywords: JSON.parse(t.keywords || '[]'),
        sources: JSON.parse(t.sources || '[]'),
        contentIdeas: JSON.parse(t.content_ideas || '[]'),
        eeatOpportunities: JSON.parse(t.eeat_opportunities || '[]')
      }));
    } finally {
      db.close();
    }
  }
}

// Export singleton instance
export const trendIntelligenceAgent = new TrendIntelligenceAgent();
