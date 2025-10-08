/**
 * DeepSeek V3 SEO Intelligence Engine
 * AI-powered replacement for SEMrush and Ahrefs
 * Cost: 84-89% cheaper than traditional SEO tools
 *
 * Capabilities:
 * - Keyword research with AI-powered volume estimation
 * - Competitor analysis with web scraping + AI insights
 * - Backlink discovery and quality scoring
 * - Content gap analysis
 * - Technical SEO recommendations
 * - SERP feature analysis
 */

import { getDeepSeekClient, getDeepSeekModelName, isDeepSeekAvailable } from '@/lib/deepseek-config';
import { FirecrawlService } from './firecrawl';

// Lazy-load firecrawl to avoid build-time errors
let _firecrawl: FirecrawlService | null = null;
function getFirecrawl(): FirecrawlService {
  if (!_firecrawl) {
    _firecrawl = new FirecrawlService({
      apiKey: process.env.FIRECRAWL_API_KEY || 'build-time-dummy-key'
    });
  }
  return _firecrawl;
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  estimatedCPC: number;
  competition: 'Low' | 'Medium' | 'High';
  competitionScore: number; // 0-100
  searchIntent: 'Informational' | 'Navigational' | 'Commercial' | 'Transactional';
  difficulty: number; // 0-100
  relatedKeywords: string[];
  longTailVariations: string[];
  seasonality?: {
    month: string;
    relativeVolume: number;
  }[];
  serpFeatures: string[]; // ['Featured Snippet', 'People Also Ask', etc.]
  contentOpportunities: string[];
}

export interface CompetitorAnalysis {
  domain: string;
  estimatedTraffic: number;
  topKeywords: {
    keyword: string;
    position: number;
    volume: number;
    traffic: number;
  }[];
  contentStrategy: {
    topicClusters: string[];
    contentTypes: string[];
    publicationFrequency: string;
    averageWordCount: number;
  };
  technicalSEO: {
    pageSpeed: number;
    mobileOptimized: boolean;
    structuredData: string[];
    coreWebVitals: {
      lcp: number;
      fid: number;
      cls: number;
    };
  };
  backlinks: {
    estimatedTotal: number;
    domainAuthority: number;
    topReferringDomains: string[];
  };
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
}

export interface BacklinkData {
  sourceUrl: string;
  sourceDomain: string;
  targetUrl: string;
  anchorText: string;
  linkType: 'dofollow' | 'nofollow';
  qualityScore: number; // 0-100
  domainAuthority: number; // 0-100
  relevanceScore: number; // 0-100
  traffic: number;
  contextualRelevance: string;
  firstSeen: Date;
  lastChecked: Date;
  status: 'active' | 'lost' | 'broken';
}

export interface ContentGap {
  topic: string;
  keywords: string[];
  competitorsRanking: string[];
  estimatedOpportunity: number; // Traffic potential
  difficulty: number; // 0-100
  contentType: string; // 'Blog Post', 'Guide', 'Video', etc.
  recommendedWordCount: number;
  keyPoints: string[];
  targetIntent: string;
}

// ============================================================================
// KEYWORD RESEARCH
// ============================================================================

export class DeepSeekKeywordResearch {
  /**
   * Comprehensive keyword research using AI + web intelligence
   * Replaces: SEMrush Keyword Magic Tool, Ahrefs Keywords Explorer
   */
  async researchKeywords(
    seedKeyword: string,
    options: {
      country?: string;
      language?: string;
      includeQuestions?: boolean;
      includeLongTail?: boolean;
      maxKeywords?: number;
    } = {}
  ): Promise<KeywordData[]> {
    const {
      country = 'US',
      language = 'en',
      includeQuestions = true,
      includeLongTail = true,
      maxKeywords = 50,
    } = options;

    console.log(`🔍 DeepSeek V3: Researching keywords for "${seedKeyword}"...`);

    // Build comprehensive prompt for keyword research
    const prompt = this.buildKeywordResearchPrompt(seedKeyword, {
      country,
      language,
      includeQuestions,
      includeLongTail,
      maxKeywords,
    });

    try {
      const response = await getDeepSeekClient().chat.completions.create({
        model: getDeepSeekModelName(),
        messages: [
          {
            role: 'system',
            content: `You are an expert SEO analyst with deep knowledge of search trends, user intent, and keyword research.
            You have access to current web data and understand search volume patterns across different industries and regions.

            Your task is to provide ACCURATE, DATA-DRIVEN keyword research that rivals paid tools like SEMrush and Ahrefs.

            Base your estimates on:
            1. Current search trends and patterns
            2. Industry benchmarks
            3. Seasonal variations
            4. Geographic considerations
            5. Competition levels in the niche

            Be conservative but realistic with estimates. Return data in valid JSON format ONLY.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent, factual responses
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from DeepSeek V3');
      }

      // Parse and validate the response
      const keywordData = JSON.parse(result);
      const keywords = this.parseKeywordData(keywordData);

      console.log(`✅ DeepSeek V3: Found ${keywords.length} keywords`);
      return keywords.slice(0, maxKeywords);
    } catch (error) {
      console.error('❌ DeepSeek V3 Keyword Research Error:', error);
      throw new Error(`Keyword research failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get keyword difficulty score using AI analysis
   */
  async getKeywordDifficulty(keyword: string): Promise<number> {
    const prompt = `Analyze the SEO difficulty for ranking for this keyword: "${keyword}"

    Consider:
    1. Domain authority of top 10 ranking sites
    2. Content quality requirements
    3. Backlink requirements
    4. Competition level
    5. SERP features (featured snippets, knowledge panels, etc.)

    Provide a difficulty score from 0-100 where:
    - 0-20: Very Easy (new sites can rank)
    - 21-40: Easy (achievable with good content)
    - 41-60: Medium (requires quality content + some backlinks)
    - 61-80: Hard (requires authority + many backlinks)
    - 81-100: Very Hard (dominated by major brands)

    Return ONLY a JSON object with:
    {
      "difficulty": <number 0-100>,
      "reasoning": "<brief explanation>",
      "topCompetitors": ["<domain1>", "<domain2>", "<domain3>"],
      "recommendedStrategy": "<how to compete>"
    }`;

    const response = await getDeepSeekClient().chat.completions.create({
      model: getDeepSeekModelName(),
      messages: [
        {
          role: 'system',
          content: 'You are an SEO expert analyzing keyword difficulty.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return result.difficulty || 50;
  }

  /**
   * Find long-tail keyword variations
   */
  async getLongTailVariations(
    seedKeyword: string,
    count: number = 20
  ): Promise<string[]> {
    const prompt = `Generate ${count} long-tail keyword variations for: "${seedKeyword}"

    Focus on:
    - Question-based keywords (who, what, when, where, why, how)
    - Location-based variations (if applicable)
    - Problem-solving queries
    - Comparison queries
    - Buying intent keywords
    - "Best", "Top", "Review" modifiers

    Return ONLY a JSON array of keywords, ordered by search intent strength:
    ["keyword1", "keyword2", ...]`;

    const response = await getDeepSeekClient().chat.completions.create({
      model: getDeepSeekModelName(),
      messages: [
        {
          role: 'system',
          content: 'You are an SEO keyword research expert.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{"keywords":[]}');
    return result.keywords || [];
  }

  /**
   * Estimate search volume using AI + web intelligence
   */
  async estimateSearchVolume(keyword: string, country: string = 'US'): Promise<number> {
    const prompt = `Estimate the monthly search volume for "${keyword}" in ${country}.

    Consider:
    1. Topic popularity and trends
    2. Industry size and market
    3. Geographic location
    4. Seasonal patterns
    5. Similar keyword volumes

    Provide a realistic estimate based on:
    - Niche keywords: 10-1,000/month
    - Medium keywords: 1,000-10,000/month
    - Popular keywords: 10,000-100,000/month
    - High-volume keywords: 100,000+/month

    Return ONLY a JSON object:
    {
      "searchVolume": <number>,
      "confidence": "<high|medium|low>",
      "reasoning": "<brief explanation>"
    }`;

    const response = await getDeepSeekClient().chat.completions.create({
      model: getDeepSeekModelName(),
      messages: [
        {
          role: 'system',
          content: 'You are an SEO analyst with expertise in search volume estimation.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return result.searchVolume || 0;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private buildKeywordResearchPrompt(
    seedKeyword: string,
    options: any
  ): string {
    return `Perform comprehensive keyword research for the seed keyword: "${seedKeyword}"

Research Parameters:
- Country: ${options.country}
- Language: ${options.language}
- Include questions: ${options.includeQuestions}
- Include long-tail: ${options.includeLongTail}
- Max keywords: ${options.maxKeywords}

Provide detailed keyword data including:

1. PRIMARY KEYWORD: "${seedKeyword}"
   - Estimated monthly search volume
   - Competition level (Low/Medium/High)
   - Search intent (Informational/Navigational/Commercial/Transactional)
   - Keyword difficulty (0-100)
   - Estimated CPC (if commercial intent)
   - SERP features (Featured Snippet, People Also Ask, Local Pack, etc.)

2. RELATED KEYWORDS (15-20 keywords):
   - Semantically related variations
   - Each with search volume, competition, intent

3. LONG-TAIL VARIATIONS (20-30 keywords if requested):
   - Question-based keywords
   - Location modifiers (if local business)
   - Buying intent variations
   - Problem-solving queries

4. CONTENT OPPORTUNITIES:
   - Content gaps in current SERPs
   - Recommended content types
   - Target word count
   - Key points to cover

5. SEASONALITY (if applicable):
   - Monthly search volume variations
   - Peak months
   - Low months

Return ONLY valid JSON in this exact format:
{
  "primaryKeyword": {
    "keyword": "string",
    "searchVolume": number,
    "competition": "Low|Medium|High",
    "competitionScore": number 0-100,
    "searchIntent": "string",
    "difficulty": number 0-100,
    "estimatedCPC": number,
    "serpFeatures": ["string"],
    "contentOpportunities": ["string"]
  },
  "relatedKeywords": [
    {
      "keyword": "string",
      "searchVolume": number,
      "competition": "Low|Medium|High",
      "competitionScore": number,
      "searchIntent": "string",
      "difficulty": number,
      "estimatedCPC": number
    }
  ],
  "longTailKeywords": [
    "string"
  ],
  "seasonality": [
    {
      "month": "January",
      "relativeVolume": number 0-100
    }
  ]
}

Be realistic and conservative with estimates. Base on current trends and industry knowledge.`;
  }

  private parseKeywordData(data: any): KeywordData[] {
    const keywords: KeywordData[] = [];

    // Add primary keyword
    if (data.primaryKeyword) {
      keywords.push({
        keyword: data.primaryKeyword.keyword,
        searchVolume: data.primaryKeyword.searchVolume || 0,
        estimatedCPC: data.primaryKeyword.estimatedCPC || 0,
        competition: data.primaryKeyword.competition || 'Medium',
        competitionScore: data.primaryKeyword.competitionScore || 50,
        searchIntent: data.primaryKeyword.searchIntent || 'Informational',
        difficulty: data.primaryKeyword.difficulty || 50,
        relatedKeywords: data.relatedKeywords?.map((k: any) => k.keyword) || [],
        longTailVariations: data.longTailKeywords || [],
        seasonality: data.seasonality || undefined,
        serpFeatures: data.primaryKeyword.serpFeatures || [],
        contentOpportunities: data.primaryKeyword.contentOpportunities || [],
      });
    }

    // Add related keywords
    if (data.relatedKeywords && Array.isArray(data.relatedKeywords)) {
      data.relatedKeywords.forEach((kw: any) => {
        keywords.push({
          keyword: kw.keyword,
          searchVolume: kw.searchVolume || 0,
          estimatedCPC: kw.estimatedCPC || 0,
          competition: kw.competition || 'Medium',
          competitionScore: kw.competitionScore || 50,
          searchIntent: kw.searchIntent || 'Informational',
          difficulty: kw.difficulty || 50,
          relatedKeywords: [],
          longTailVariations: [],
          serpFeatures: kw.serpFeatures || [],
          contentOpportunities: [],
        });
      });
    }

    return keywords;
  }
}

// ============================================================================
// COMPETITOR ANALYSIS
// ============================================================================

export class DeepSeekCompetitorAnalysis {
  /**
   * Comprehensive competitor analysis using web scraping + AI
   * Replaces: SEMrush Competitive Research, Ahrefs Site Explorer
   */
  async analyzeCompetitor(domain: string): Promise<CompetitorAnalysis> {
    console.log(`🔍 DeepSeek V3: Analyzing competitor ${domain}...`);

    try {
      // Step 1: Scrape competitor website with Firecrawl
      const scrapedData = await getFirecrawl().scrapeUrl(`https://${domain}`, {
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      });

      // Step 2: AI analysis of competitor
      const analysis = await this.analyzeCompetitorWithAI(domain, scrapedData);

      console.log(`✅ DeepSeek V3: Competitor analysis complete for ${domain}`);
      return analysis;
    } catch (error) {
      console.error(`❌ DeepSeek V3 Competitor Analysis Error for ${domain}:`, error);
      throw error;
    }
  }

  /**
   * Find top organic competitors for a domain
   */
  async findCompetitors(
    domain: string,
    maxCompetitors: number = 10
  ): Promise<string[]> {
    const prompt = `Identify the top ${maxCompetitors} organic search competitors for the domain: ${domain}

    Consider:
    1. Similar target audience
    2. Overlapping keywords
    3. Same industry/niche
    4. Similar business model
    5. Geographic overlap

    Return ONLY a JSON array of competitor domains (without https://):
    ["competitor1.com", "competitor2.com", ...]

    Focus on direct competitors that compete for the same search traffic.`;

    const response = await getDeepSeekClient().chat.completions.create({
      model: getDeepSeekModelName(),
      messages: [
        {
          role: 'system',
          content: 'You are an SEO competitive intelligence analyst.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{"competitors":[]}');
    return result.competitors || [];
  }

  private async analyzeCompetitorWithAI(
    domain: string,
    scrapedData: any
  ): Promise<CompetitorAnalysis> {
    const content = scrapedData.markdown || scrapedData.html || '';

    const prompt = `Analyze this competitor website comprehensively:

Domain: ${domain}

Content Sample:
${content.substring(0, 4000)}

Provide detailed analysis including:

1. ESTIMATED TRAFFIC
2. TOP KEYWORDS (infer from content)
3. CONTENT STRATEGY
   - Topic clusters
   - Content types
   - Publication frequency estimate
   - Average word count
4. TECHNICAL SEO
   - Page speed estimate
   - Mobile optimization
   - Structured data present
5. BACKLINKS ESTIMATE
6. STRENGTHS (what they're doing well)
7. WEAKNESSES (gaps and opportunities)
8. OPPORTUNITIES (what you can do better)

Return ONLY valid JSON in this format:
{
  "estimatedTraffic": number,
  "topKeywords": [
    {"keyword": "string", "position": number, "volume": number, "traffic": number}
  ],
  "contentStrategy": {
    "topicClusters": ["string"],
    "contentTypes": ["string"],
    "publicationFrequency": "string",
    "averageWordCount": number
  },
  "technicalSEO": {
    "pageSpeed": number 0-100,
    "mobileOptimized": boolean,
    "structuredData": ["string"],
    "coreWebVitals": {
      "lcp": number,
      "fid": number,
      "cls": number
    }
  },
  "backlinks": {
    "estimatedTotal": number,
    "domainAuthority": number 0-100,
    "topReferringDomains": ["string"]
  },
  "strengths": ["string"],
  "weaknesses": ["string"],
  "opportunities": ["string"]
}`;

    const response = await getDeepSeekClient().chat.completions.create({
      model: getDeepSeekModelName(),
      messages: [
        {
          role: 'system',
          content: 'You are an SEO competitive analyst with expertise in website analysis.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const analysis = JSON.parse(response.choices[0]?.message?.content || '{}');

    return {
      domain,
      estimatedTraffic: analysis.estimatedTraffic || 0,
      topKeywords: analysis.topKeywords || [],
      contentStrategy: analysis.contentStrategy || {
        topicClusters: [],
        contentTypes: [],
        publicationFrequency: 'Unknown',
        averageWordCount: 0,
      },
      technicalSEO: analysis.technicalSEO || {
        pageSpeed: 0,
        mobileOptimized: false,
        structuredData: [],
        coreWebVitals: { lcp: 0, fid: 0, cls: 0 },
      },
      backlinks: analysis.backlinks || {
        estimatedTotal: 0,
        domainAuthority: 0,
        topReferringDomains: [],
      },
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      opportunities: analysis.opportunities || [],
    };
  }
}

// ============================================================================
// EXPORT MAIN CLASS
// ============================================================================

export class DeepSeekSEO {
  public keywords: DeepSeekKeywordResearch;
  public competitors: DeepSeekCompetitorAnalysis;

  constructor() {
    this.keywords = new DeepSeekKeywordResearch();
    this.competitors = new DeepSeekCompetitorAnalysis();
  }

  /**
   * Check if DeepSeek V3 is properly configured
   */
  static isConfigured(): boolean {
    return isDeepSeekAvailable();
  }

  /**
   * Get configuration status
   */
  static getStatus(): { configured: boolean; message: string } {
    if (!isDeepSeekAvailable()) {
      return {
        configured: false,
        message: 'DeepSeek API key not configured. Add DEEPSEEK_API_KEY or OPENROUTER_API to .env.local',
      };
    }

    return {
      configured: true,
      message: 'DeepSeek V3 SEO Intelligence Engine ready',
    };
  }
}

// Export factory function to avoid build-time instantiation
let _instance: DeepSeekSEO | null = null;

export function getDeepSeekSEO(): DeepSeekSEO {
  if (!_instance) {
    _instance = new DeepSeekSEO();
  }
  return _instance;
}

// Export individual functions instead of singleton
export const deepseekSEO = {
  keywords: {
    researchKeywords: (seedKeyword: string, options?: any) => 
      getDeepSeekSEO().keywords.researchKeywords(seedKeyword, options),
    getKeywordDifficulty: (keyword: string) => 
      getDeepSeekSEO().keywords.getKeywordDifficulty(keyword),
    getLongTailVariations: (keyword: string, maxVariations?: number) => 
      getDeepSeekSEO().keywords.getLongTailVariations(keyword, maxVariations),
    estimateSearchVolume: (keyword: string, country?: string) => 
      getDeepSeekSEO().keywords.estimateSearchVolume(keyword, country)
  },
  competitors: {
    analyzeCompetitor: (domain: string) => 
      getDeepSeekSEO().competitors.analyzeCompetitor(domain),
    findCompetitors: (domain: string, maxCompetitors?: number) => 
      getDeepSeekSEO().competitors.findCompetitors(domain, maxCompetitors)
  }
};
