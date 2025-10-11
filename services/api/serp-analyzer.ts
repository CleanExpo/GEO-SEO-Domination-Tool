/**
 * SERP Analyzer - Ahrefs Alternative
 *
 * Analyzes Google SERP to find ranking opportunities:
 * - Top 10 competitor analysis
 * - SERP feature detection
 * - Ranking difficulty calculation
 * - Content requirements analysis
 * - Position tracking over time
 *
 * Uses SerpAPI (100 free searches/month, then $50/month for 5,000)
 */

import axios from 'axios';
import { BacklinkAnalyzer } from './backlink-analyzer';
import { LighthouseService } from './lighthouse';
import { cascadingAI } from './cascading-ai';

export interface SerpAnalysis {
  keyword: string;
  searchVolume: number;
  features: SerpFeature[];
  topResults: SerpResult[];
  rankingOpportunity: RankingOpportunity;
  contentRequirements: ContentRequirements;
  avgMetrics: {
    domainRating: number;
    backlinks: number;
    wordCount: number;
    performanceScore: number;
  };
  aiRecommendations: string[];
}

export interface SerpFeature {
  type: 'featured_snippet' | 'people_also_ask' | 'knowledge_panel' |
        'local_pack' | 'image_pack' | 'video_pack' | 'shopping' | 'news';
  present: boolean;
  content?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface SerpResult {
  position: number;
  url: string;
  domain: string;
  title: string;
  description: string;
  domainRating: number;
  backlinks: number;
  performanceScore: number;
  wordCount: number;
  hasSchema: boolean;
  contentType: string;
}

export interface RankingOpportunity {
  score: number; // 0-100 (higher = easier to rank)
  difficulty: 'Very Easy' | 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  reasoning: string[];
  estimatedEffort: 'Low' | 'Medium' | 'High';
  estimatedTimeframe: string;
  requirements: string[];
}

export interface ContentRequirements {
  minWordCount: number;
  maxWordCount: number;
  recommendedWordCount: number;
  requiredSections: string[];
  mediaRequirements: {
    images: number;
    videos: number;
  };
  schemaTypes: string[];
  readingLevel: string;
}

export class SerpAnalyzer {
  private serpApiKey: string;
  private backlinkAnalyzer: BacklinkAnalyzer;
  private lighthouseService: LighthouseService;

  constructor() {
    this.serpApiKey = process.env.SERP_API_KEY || '';
    this.backlinkAnalyzer = new BacklinkAnalyzer();
    this.lighthouseService = new LighthouseService();
  }

  /**
   * Complete SERP analysis for a keyword
   */
  async analyzeSERP(keyword: string, searchVolume: number = 0): Promise<SerpAnalysis> {
    console.log(`[SerpAnalyzer] Analyzing SERP for: ${keyword}`);

    if (!this.serpApiKey) {
      throw new Error('SERP API key not configured. Set SERP_API_KEY environment variable.');
    }

    // 1. Get SERP data
    const serpData = await this.fetchSerpData(keyword);

    // 2. Extract SERP features
    const features = this.extractFeatures(serpData);

    // 3. Analyze top 10 results
    const topResults = await this.analyzeTopResults(serpData.organic_results?.slice(0, 10) || []);

    // 4. Calculate average metrics
    const avgMetrics = this.calculateAverageMetrics(topResults);

    // 5. Determine content requirements
    const contentRequirements = this.determineContentRequirements(topResults);

    // 6. Calculate ranking opportunity
    const rankingOpportunity = this.calculateRankingOpportunity(
      features,
      topResults,
      avgMetrics
    );

    // 7. Generate AI recommendations
    const aiRecommendations = await this.generateRecommendations({
      keyword,
      features,
      topResults,
      avgMetrics,
      contentRequirements,
      rankingOpportunity,
    });

    return {
      keyword,
      searchVolume,
      features,
      topResults,
      rankingOpportunity,
      contentRequirements,
      avgMetrics,
      aiRecommendations,
    };
  }

  /**
   * Fetch SERP data from SerpAPI
   */
  private async fetchSerpData(keyword: string): Promise<any> {
    try {
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          api_key: this.serpApiKey,
          q: keyword,
          engine: 'google',
          num: 10,
          gl: 'au', // Australia
          hl: 'en',
        },
        timeout: 15000,
      });

      return response.data;
    } catch (error) {
      console.error('[SerpAnalyzer] SERP fetch failed:', error);
      throw new Error('Failed to fetch SERP data');
    }
  }

  /**
   * Extract SERP features
   */
  private extractFeatures(serpData: any): SerpFeature[] {
    const features: SerpFeature[] = [];

    // Featured Snippet
    if (serpData.answer_box) {
      features.push({
        type: 'featured_snippet',
        present: true,
        content: serpData.answer_box.snippet || serpData.answer_box.answer,
        difficulty: 'Medium',
      });
    }

    // People Also Ask
    if (serpData.related_questions) {
      features.push({
        type: 'people_also_ask',
        present: true,
        content: `${serpData.related_questions.length} questions`,
        difficulty: 'Easy',
      });
    }

    // Knowledge Panel
    if (serpData.knowledge_graph) {
      features.push({
        type: 'knowledge_panel',
        present: true,
        content: serpData.knowledge_graph.title,
        difficulty: 'Hard',
      });
    }

    // Local Pack
    if (serpData.local_results) {
      features.push({
        type: 'local_pack',
        present: true,
        content: `${serpData.local_results.places?.length || 0} businesses`,
        difficulty: 'Medium',
      });
    }

    // Image Pack
    if (serpData.inline_images) {
      features.push({
        type: 'image_pack',
        present: true,
        difficulty: 'Easy',
      });
    }

    // Video Pack
    if (serpData.inline_videos) {
      features.push({
        type: 'video_pack',
        present: true,
        difficulty: 'Easy',
      });
    }

    // Shopping Results
    if (serpData.shopping_results) {
      features.push({
        type: 'shopping',
        present: true,
        content: `${serpData.shopping_results.length} products`,
        difficulty: 'Hard',
      });
    }

    // News Results
    if (serpData.top_stories) {
      features.push({
        type: 'news',
        present: true,
        content: `${serpData.top_stories.length} news articles`,
        difficulty: 'Medium',
      });
    }

    return features;
  }

  /**
   * Analyze top 10 results in detail
   */
  private async analyzeTopResults(organicResults: any[]): Promise<SerpResult[]> {
    const results: SerpResult[] = [];

    for (const result of organicResults) {
      try {
        const domain = new URL(result.link).hostname.replace('www.', '');

        // Get backlink data (cached if recent)
        const backlinks = await this.backlinkAnalyzer.analyzeBacklinks(domain);

        // Get Lighthouse performance score
        let performanceScore = 75; // Default
        try {
          const lighthouse = await this.lighthouseService.getDetailedAudit(result.link);
          performanceScore = lighthouse.scores.performance;
        } catch {
          // Use default if Lighthouse fails
        }

        // Estimate word count from snippet
        const wordCount = Math.round((result.snippet?.length || 300) * 5);

        results.push({
          position: result.position,
          url: result.link,
          domain,
          title: result.title,
          description: result.snippet,
          domainRating: backlinks.domainRating,
          backlinks: backlinks.totalBacklinks,
          performanceScore,
          wordCount,
          hasSchema: result.rich_snippet_list ? true : false,
          contentType: this.detectContentType(result.title, result.snippet),
        });
      } catch (error) {
        console.error(`[SerpAnalyzer] Failed to analyze result: ${result.link}`, error);
      }
    }

    return results;
  }

  /**
   * Detect content type from title and snippet
   */
  private detectContentType(title: string, snippet: string): string {
    const text = `${title} ${snippet}`.toLowerCase();

    if (/guide|how to|tutorial|step by step/.test(text)) return 'Guide';
    if (/list|top \d+|best/.test(text)) return 'Listicle';
    if (/review|vs|comparison/.test(text)) return 'Review';
    if (/what is|definition|meaning/.test(text)) return 'Definition';
    if (/buy|price|cost|shop/.test(text)) return 'Commercial';
    if (/news|update|announced/.test(text)) return 'News';

    return 'Informational';
  }

  /**
   * Calculate average metrics across top results
   */
  private calculateAverageMetrics(results: SerpResult[]): {
    domainRating: number;
    backlinks: number;
    wordCount: number;
    performanceScore: number;
  } {
    if (results.length === 0) {
      return { domainRating: 0, backlinks: 0, wordCount: 0, performanceScore: 0 };
    }

    return {
      domainRating: Math.round(
        results.reduce((sum, r) => sum + r.domainRating, 0) / results.length
      ),
      backlinks: Math.round(
        results.reduce((sum, r) => sum + r.backlinks, 0) / results.length
      ),
      wordCount: Math.round(
        results.reduce((sum, r) => sum + r.wordCount, 0) / results.length
      ),
      performanceScore: Math.round(
        results.reduce((sum, r) => sum + r.performanceScore, 0) / results.length
      ),
    };
  }

  /**
   * Determine content requirements based on top performers
   */
  private determineContentRequirements(results: SerpResult[]): ContentRequirements {
    const wordCounts = results.map(r => r.wordCount).sort((a, b) => a - b);
    const minWordCount = wordCounts[0] || 500;
    const maxWordCount = wordCounts[wordCounts.length - 1] || 2000;
    const medianWordCount = wordCounts[Math.floor(wordCounts.length / 2)] || 1000;

    // Analyze schema usage
    const schemaTypes = new Set<string>();
    results.forEach(r => {
      if (r.hasSchema) {
        schemaTypes.add('Article');
        schemaTypes.add('Organization');
      }
    });

    // Determine required sections from content type
    const contentTypes = results.map(r => r.contentType);
    const requiredSections: string[] = [];

    if (contentTypes.includes('Guide')) {
      requiredSections.push('Introduction', 'Step-by-step instructions', 'Conclusion');
    }
    if (contentTypes.includes('Listicle')) {
      requiredSections.push('Introduction', 'Numbered list items', 'Summary');
    }
    if (contentTypes.includes('Review')) {
      requiredSections.push('Overview', 'Pros & Cons', 'Verdict');
    }

    return {
      minWordCount,
      maxWordCount,
      recommendedWordCount: Math.round(medianWordCount * 1.2), // 20% more than median
      requiredSections,
      mediaRequirements: {
        images: Math.max(3, Math.round(medianWordCount / 500)),
        videos: contentTypes.includes('Guide') ? 1 : 0,
      },
      schemaTypes: Array.from(schemaTypes),
      readingLevel: medianWordCount > 1500 ? 'Comprehensive' : 'Concise',
    };
  }

  /**
   * Calculate ranking opportunity score
   */
  private calculateRankingOpportunity(
    features: SerpFeature[],
    results: SerpResult[],
    avgMetrics: any
  ): RankingOpportunity {
    let score = 100;
    const reasoning: string[] = [];
    const requirements: string[] = [];

    // Reduce score based on SERP features
    const competitiveFeatures = features.filter(f =>
      ['knowledge_panel', 'shopping', 'featured_snippet'].includes(f.type)
    );

    if (competitiveFeatures.length > 0) {
      score -= competitiveFeatures.length * 15;
      reasoning.push(`${competitiveFeatures.length} competitive SERP features present`);
    }

    // Reduce score based on average domain rating
    if (avgMetrics.domainRating > 70) {
      score -= 30;
      reasoning.push('High average domain authority (70+)');
      requirements.push('Build domain authority to DR 60+');
    } else if (avgMetrics.domainRating > 50) {
      score -= 20;
      reasoning.push('Moderate average domain authority (50-70)');
      requirements.push('Build domain authority to DR 40+');
    } else {
      reasoning.push('Achievable domain authority requirements');
    }

    // Reduce score based on average backlinks
    if (avgMetrics.backlinks > 1000) {
      score -= 25;
      reasoning.push('Top results have 1000+ backlinks each');
      requirements.push('Acquire 500+ high-quality backlinks');
    } else if (avgMetrics.backlinks > 500) {
      score -= 15;
      reasoning.push('Top results have 500+ backlinks each');
      requirements.push('Acquire 300+ high-quality backlinks');
    } else {
      reasoning.push('Achievable backlink requirements');
    }

    // Add points for weak results
    const weakResults = results.filter(r => r.domainRating < 40 || r.backlinks < 100);
    if (weakResults.length >= 3) {
      score += 20;
      reasoning.push(`${weakResults.length} weak results in top 10`);
    }

    // Normalize score
    score = Math.max(0, Math.min(100, score));

    // Determine difficulty
    let difficulty: RankingOpportunity['difficulty'];
    if (score >= 80) difficulty = 'Very Easy';
    else if (score >= 60) difficulty = 'Easy';
    else if (score >= 40) difficulty = 'Medium';
    else if (score >= 20) difficulty = 'Hard';
    else difficulty = 'Very Hard';

    // Estimate effort and timeframe
    let estimatedEffort: 'Low' | 'Medium' | 'High';
    let estimatedTimeframe: string;

    if (score >= 60) {
      estimatedEffort = 'Low';
      estimatedTimeframe = '1-3 months';
    } else if (score >= 40) {
      estimatedEffort = 'Medium';
      estimatedTimeframe = '3-6 months';
    } else {
      estimatedEffort = 'High';
      estimatedTimeframe = '6-12 months';
    }

    return {
      score,
      difficulty,
      reasoning,
      estimatedEffort,
      estimatedTimeframe,
      requirements,
    };
  }

  /**
   * Generate AI recommendations
   */
  private async generateRecommendations(context: any): Promise<string[]> {
    try {
      const prompt = `As an SEO expert, provide specific recommendations to rank for this keyword.

Keyword: ${context.keyword}

SERP Analysis:
- Features: ${context.features.map((f: any) => f.type).join(', ')}
- Avg Domain Rating: ${context.avgMetrics.domainRating}
- Avg Backlinks: ${context.avgMetrics.backlinks}
- Avg Word Count: ${context.avgMetrics.wordCount}
- Ranking Difficulty: ${context.rankingOpportunity.difficulty}
- Estimated Effort: ${context.rankingOpportunity.estimatedEffort}

Content Requirements:
- Word Count: ${context.contentRequirements.recommendedWordCount} words
- Images: ${context.contentRequirements.mediaRequirements.images}
- Videos: ${context.contentRequirements.mediaRequirements.videos}

Provide 8-10 specific, actionable recommendations to rank in top 3 for this keyword.
Return as JSON array of strings.`;

      const response = await cascadingAI(prompt, {
        temperature: 0.5,
        maxTokens: 1000,
      });

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.generateFallbackRecommendations(context);
    } catch (error) {
      console.error('[SerpAnalyzer] AI recommendations failed:', error);
      return this.generateFallbackRecommendations(context);
    }
  }

  /**
   * Fallback recommendations
   */
  private generateFallbackRecommendations(context: any): string[] {
    const recs: string[] = [];

    recs.push(`Create comprehensive content with ${context.contentRequirements.recommendedWordCount}+ words`);
    recs.push(`Include ${context.contentRequirements.mediaRequirements.images} high-quality images`);

    if (context.avgMetrics.domainRating > 50) {
      recs.push('Focus on building domain authority through high-quality backlinks');
    }

    if (context.features.some((f: any) => f.type === 'featured_snippet')) {
      recs.push('Optimize for featured snippet with concise, direct answers');
    }

    if (context.features.some((f: any) => f.type === 'people_also_ask')) {
      recs.push('Answer related questions in FAQ section');
    }

    recs.push('Implement proper schema markup (Article, Organization)');
    recs.push('Optimize page speed to match top performers');
    recs.push('Build internal links from related high-authority pages');

    return recs;
  }
}
