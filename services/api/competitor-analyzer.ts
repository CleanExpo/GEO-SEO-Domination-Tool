/**
 * Competitor Analyzer - Ahrefs Alternative
 *
 * Analyzes competitors to find opportunities:
 * - Backlink gap analysis
 * - Keyword gap analysis
 * - Content gap identification
 * - AI-powered competitive insights
 *
 * Uses existing BacklinkAnalyzer + KeywordResearch + Cascading AI
 */

import { BacklinkAnalyzer, BacklinkProfile } from './backlink-analyzer';
import { KeywordResearch, KeywordSuggestion } from './keyword-research';
import { cascadingAI } from './cascading-ai';

export interface CompetitorComparison {
  competitor: string;
  backlinks: {
    yours: BacklinkProfile;
    theirs: BacklinkProfile;
    gap: number;
    opportunities: BacklinkOpportunity[];
  };
  keywords: {
    yoursCount: number;
    theirsCount: number;
    sharedCount: number;
    gaps: KeywordSuggestion[];
    opportunities: KeywordOpportunity[];
  };
  content: {
    gaps: ContentGap[];
    topPages: CompetitorPage[];
  };
  insights: AIInsight[];
  overallStrength: 'Much Weaker' | 'Weaker' | 'Similar' | 'Stronger' | 'Much Stronger';
}

export interface BacklinkOpportunity {
  domain: string;
  domainRating: number;
  backlinksToCompetitor: number;
  linkType: string;
  reason: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface KeywordOpportunity {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  competitorRanking: number;
  yourRanking: number | null;
  gap: number;
  priority: 'High' | 'Medium' | 'Low';
}

export interface ContentGap {
  topic: string;
  keywords: string[];
  competitorPages: string[];
  estimatedTraffic: number;
  difficulty: number;
  priority: 'High' | 'Medium' | 'Low';
}

export interface CompetitorPage {
  url: string;
  title: string;
  estimatedTraffic: number;
  backlinks: number;
  domainRating: number;
  keywords: string[];
}

export interface AIInsight {
  category: 'Strategy' | 'Content' | 'Links' | 'Technical' | 'Local';
  insight: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  actionable: string[];
}

export class CompetitorAnalyzer {
  private backlinkAnalyzer: BacklinkAnalyzer;
  private keywordResearch: KeywordResearch;

  constructor() {
    this.backlinkAnalyzer = new BacklinkAnalyzer();
    this.keywordResearch = new KeywordResearch();
  }

  /**
   * Complete competitor analysis
   */
  async analyzeCompetitor(
    yourDomain: string,
    competitorDomain: string
  ): Promise<CompetitorComparison> {
    console.log(`[CompetitorAnalyzer] Analyzing ${yourDomain} vs ${competitorDomain}`);

    // 1. Backlink comparison
    const [yourBacklinks, theirBacklinks] = await Promise.all([
      this.backlinkAnalyzer.analyzeBacklinks(yourDomain),
      this.backlinkAnalyzer.analyzeBacklinks(competitorDomain),
    ]);

    const backlinkGap = theirBacklinks.totalBacklinks - yourBacklinks.totalBacklinks;
    const backlinkOpportunities = this.findBacklinkOpportunities(
      yourBacklinks,
      theirBacklinks
    );

    // 2. Keyword gap analysis
    const keywordGaps = await this.keywordResearch.findKeywordGaps(
      yourDomain,
      competitorDomain
    );

    const keywordOpportunities = this.prioritizeKeywordGaps(keywordGaps);

    // 3. Content gap analysis
    const contentGaps = await this.findContentGaps(
      yourDomain,
      competitorDomain,
      keywordGaps
    );

    // 4. Get competitor's top pages
    const topPages = await this.getCompetitorTopPages(competitorDomain);

    // 5. Generate AI insights
    const insights = await this.generateCompetitiveInsights({
      yourDomain,
      competitorDomain,
      yourBacklinks,
      theirBacklinks,
      keywordGaps,
      contentGaps,
    });

    // 6. Calculate overall competitive strength
    const overallStrength = this.calculateCompetitiveStrength(
      yourBacklinks,
      theirBacklinks,
      keywordGaps.length
    );

    return {
      competitor: competitorDomain,
      backlinks: {
        yours: yourBacklinks,
        theirs: theirBacklinks,
        gap: backlinkGap,
        opportunities: backlinkOpportunities,
      },
      keywords: {
        yoursCount: 0, // Would get from GSC
        theirsCount: 0, // Estimated
        sharedCount: 0,
        gaps: keywordGaps,
        opportunities: keywordOpportunities,
      },
      content: {
        gaps: contentGaps,
        topPages,
      },
      insights,
      overallStrength,
    };
  }

  /**
   * Find backlink opportunities (domains linking to competitor but not you)
   */
  private findBacklinkOpportunities(
    yours: BacklinkProfile,
    theirs: BacklinkProfile
  ): BacklinkOpportunity[] {
    const yourDomains = new Set(
      yours.topReferringDomains.map(d => d.domain)
    );

    const opportunities: BacklinkOpportunity[] = [];

    for (const domain of theirs.topReferringDomains) {
      if (!yourDomains.has(domain.domain)) {
        // This domain links to competitor but not you
        opportunities.push({
          domain: domain.domain,
          domainRating: domain.domainRating,
          backlinksToCompetitor: domain.backlinks,
          linkType: domain.linkType,
          reason: `Links to competitor with ${domain.backlinks} backlinks`,
          priority: domain.domainRating >= 50 ? 'High' :
                   domain.domainRating >= 30 ? 'Medium' : 'Low',
        });
      }
    }

    // Sort by domain rating and backlinks
    return opportunities
      .sort((a, b) => (b.domainRating * b.backlinksToCompetitor) -
                     (a.domainRating * a.backlinksToCompetitor))
      .slice(0, 50); // Top 50 opportunities
  }

  /**
   * Prioritize keyword gaps by opportunity
   */
  private prioritizeKeywordGaps(gaps: KeywordSuggestion[]): KeywordOpportunity[] {
    return gaps.map(gap => {
      // Calculate opportunity score
      const trafficPotential = gap.searchVolume * (1 - gap.difficulty / 100);
      const priority = gap.difficulty < 40 && gap.searchVolume > 500 ? 'High' :
                      gap.difficulty < 60 && gap.searchVolume > 200 ? 'Medium' : 'Low';

      return {
        keyword: gap.keyword,
        searchVolume: gap.searchVolume,
        difficulty: gap.difficulty,
        competitorRanking: 5, // Estimated (would get from SerpAPI)
        yourRanking: null,
        gap: gap.searchVolume,
        priority,
      };
    })
    .sort((a, b) => (b.searchVolume * (100 - b.difficulty)) -
                   (a.searchVolume * (100 - a.difficulty)))
    .slice(0, 50); // Top 50 opportunities
  }

  /**
   * Find content gaps using AI
   */
  private async findContentGaps(
    yourDomain: string,
    competitorDomain: string,
    keywordGaps: KeywordSuggestion[]
  ): Promise<ContentGap[]> {
    try {
      const prompt = `Analyze these keyword gaps and identify content topics that ${competitorDomain} covers but ${yourDomain} is missing.

Keyword gaps (${keywordGaps.length} keywords):
${keywordGaps.slice(0, 20).map(k => `- ${k.keyword} (${k.searchVolume} searches, difficulty: ${k.difficulty})`).join('\n')}

Identify 10 major content gaps as JSON array:
[
  {
    "topic": "Topic name",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "estimatedTraffic": total_monthly_traffic,
    "difficulty": 0-100,
    "priority": "High" | "Medium" | "Low"
  }
]

Group related keywords into topics and prioritize by traffic potential.`;

      const response = await cascadingAI(prompt, {
        temperature: 0.5,
        maxTokens: 1500,
      });

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const gaps = JSON.parse(jsonMatch[0]);
        return gaps.map((gap: any) => ({
          topic: gap.topic,
          keywords: gap.keywords,
          competitorPages: [], // Would populate with actual URLs
          estimatedTraffic: gap.estimatedTraffic,
          difficulty: gap.difficulty,
          priority: gap.priority,
        }));
      }

      return [];
    } catch (error) {
      console.error('[CompetitorAnalyzer] Content gap analysis failed:', error);
      return [];
    }
  }

  /**
   * Get competitor's top performing pages
   */
  private async getCompetitorTopPages(domain: string): Promise<CompetitorPage[]> {
    // In production, would use SerpAPI or crawl sitemap
    // For now, return structure showing what data we'd collect
    return [
      {
        url: `https://${domain}/top-page-1`,
        title: 'Top Performing Page',
        estimatedTraffic: 5000,
        backlinks: 150,
        domainRating: 45,
        keywords: ['keyword1', 'keyword2', 'keyword3'],
      },
      // ... more pages
    ];
  }

  /**
   * Generate AI-powered competitive insights
   */
  private async generateCompetitiveInsights(context: {
    yourDomain: string;
    competitorDomain: string;
    yourBacklinks: BacklinkProfile;
    theirBacklinks: BacklinkProfile;
    keywordGaps: KeywordSuggestion[];
    contentGaps: ContentGap[];
  }): Promise<AIInsight[]> {
    try {
      const prompt = `As an SEO expert, analyze this competitive landscape and provide strategic insights.

Your Domain: ${context.yourDomain}
Competitor: ${context.competitorDomain}

Metrics:
- Your Domain Rating: ${context.yourBacklinks.domainRating}
- Competitor Domain Rating: ${context.theirBacklinks.domainRating}
- Your Backlinks: ${context.yourBacklinks.totalBacklinks}
- Competitor Backlinks: ${context.theirBacklinks.totalBacklinks}
- Keyword Gaps: ${context.keywordGaps.length} keywords
- Content Gaps: ${context.contentGaps.length} topics

Provide 8-10 strategic insights across these categories:
- Strategy: Overall competitive strategy
- Content: Content creation priorities
- Links: Link building opportunities
- Technical: Technical improvements
- Local: Local SEO tactics

Return as JSON array:
[
  {
    "category": "Strategy" | "Content" | "Links" | "Technical" | "Local",
    "insight": "Strategic insight...",
    "priority": "Critical" | "High" | "Medium" | "Low",
    "actionable": ["Action 1", "Action 2", "Action 3"]
  }
]`;

      const response = await cascadingAI(prompt, {
        temperature: 0.6,
        maxTokens: 2000,
      });

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.generateFallbackInsights(context);
    } catch (error) {
      console.error('[CompetitorAnalyzer] AI insights failed:', error);
      return this.generateFallbackInsights(context);
    }
  }

  /**
   * Fallback insights when AI fails
   */
  private generateFallbackInsights(context: {
    yourBacklinks: BacklinkProfile;
    theirBacklinks: BacklinkProfile;
    keywordGaps: KeywordSuggestion[];
    contentGaps: ContentGap[];
  }): AIInsight[] {
    const insights: AIInsight[] = [];

    // Backlink gap insights
    if (context.theirBacklinks.domainRating > context.yourBacklinks.domainRating + 20) {
      insights.push({
        category: 'Links',
        insight: 'Significant domain authority gap - focus on high-quality backlinks',
        priority: 'Critical',
        actionable: [
          'Target domains with DR 50+ linking to competitor',
          'Create linkable assets (research, tools, guides)',
          'Guest post on industry-relevant websites',
        ],
      });
    }

    // Content gap insights
    if (context.contentGaps.length > 5) {
      insights.push({
        category: 'Content',
        insight: 'Multiple content gaps identified - competitor has broader coverage',
        priority: 'High',
        actionable: [
          `Create content for ${context.contentGaps.length} missing topics`,
          'Start with high-traffic, low-difficulty topics',
          'Use AI to scale content production',
        ],
      });
    }

    // Keyword gap insights
    if (context.keywordGaps.length > 10) {
      insights.push({
        category: 'Strategy',
        insight: 'Competitor targets more keywords - expand keyword strategy',
        priority: 'High',
        actionable: [
          'Research long-tail keyword variations',
          'Create topic clusters around main keywords',
          'Optimize existing pages for related keywords',
        ],
      });
    }

    return insights;
  }

  /**
   * Calculate overall competitive strength
   */
  private calculateCompetitiveStrength(
    yours: BacklinkProfile,
    theirs: BacklinkProfile,
    keywordGapCount: number
  ): 'Much Weaker' | 'Weaker' | 'Similar' | 'Stronger' | 'Much Stronger' {
    // Calculate score based on multiple factors
    const drDiff = yours.domainRating - theirs.domainRating;
    const backlinkRatio = yours.totalBacklinks / Math.max(theirs.totalBacklinks, 1);

    let score = 0;

    // Domain Rating comparison (40% weight)
    if (drDiff > 20) score += 40;
    else if (drDiff > 10) score += 30;
    else if (drDiff > 0) score += 20;
    else if (drDiff > -10) score += 10;
    else if (drDiff > -20) score += 5;

    // Backlink count comparison (30% weight)
    if (backlinkRatio > 2) score += 30;
    else if (backlinkRatio > 1.5) score += 22;
    else if (backlinkRatio > 1) score += 15;
    else if (backlinkRatio > 0.7) score += 10;
    else if (backlinkRatio > 0.5) score += 5;

    // Keyword coverage (30% weight)
    if (keywordGapCount < 10) score += 30;
    else if (keywordGapCount < 20) score += 20;
    else if (keywordGapCount < 50) score += 10;
    else if (keywordGapCount < 100) score += 5;

    // Categorize strength
    if (score >= 80) return 'Much Stronger';
    if (score >= 60) return 'Stronger';
    if (score >= 40) return 'Similar';
    if (score >= 20) return 'Weaker';
    return 'Much Weaker';
  }

  /**
   * Compare multiple competitors at once
   */
  async compareMultipleCompetitors(
    yourDomain: string,
    competitorDomains: string[]
  ): Promise<CompetitorComparison[]> {
    const comparisons = await Promise.all(
      competitorDomains.map(competitor =>
        this.analyzeCompetitor(yourDomain, competitor)
      )
    );

    // Sort by competitive strength
    const strengthOrder = {
      'Much Weaker': 0,
      'Weaker': 1,
      'Similar': 2,
      'Stronger': 3,
      'Much Stronger': 4,
    };

    return comparisons.sort((a, b) =>
      strengthOrder[b.overallStrength] - strengthOrder[a.overallStrength]
    );
  }

  /**
   * Generate outreach list for link building
   */
  async generateOutreachList(
    yourDomain: string,
    competitorDomain: string,
    limit: number = 50
  ): Promise<BacklinkOpportunity[]> {
    const comparison = await this.analyzeCompetitor(yourDomain, competitorDomain);

    // Filter for high-priority, reachable opportunities
    return comparison.backlinks.opportunities
      .filter(opp => opp.priority === 'High' && opp.domainRating >= 30)
      .slice(0, limit);
  }
}
