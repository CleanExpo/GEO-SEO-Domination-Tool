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
// AHREFS-EQUIVALENT DATA TYPES
// ============================================================================

export interface DomainOverview {
  domain: string;
  // TRAFFIC DATA
  organicTraffic: number; // Monthly organic visitors
  paidTraffic: number; // Monthly paid visitors
  totalTraffic: number;
  trafficCost: number; // $ value of organic traffic
  trafficTrend: {
    month: string;
    traffic: number;
  }[];

  // AUTHORITY METRICS
  domainRating: number; // 0-100 (like Ahrefs DR)
  urlRating: number; // 0-100 (like Ahrefs UR)
  trustFlow: number; // 0-100
  citationFlow: number; // 0-100

  // BACKLINK DATA
  backlinks: {
    total: number;
    dofollow: number;
    nofollow: number;
    referring: {
      domains: number;
      ips: number;
      subnets: number;
    };
    newBacklinks: {
      last7days: number;
      last30days: number;
    };
    lostBacklinks: {
      last7days: number;
      last30days: number;
    };
  };

  // KEYWORD DATA
  keywords: {
    organic: number; // Total organic keywords ranking
    paid: number; // Total paid keywords
    top3: number; // Keywords in positions 1-3
    top10: number; // Keywords in positions 4-10
    top100: number; // Keywords in positions 11-100
  };

  // COMPETITORS
  topCompetitors: {
    domain: string;
    commonKeywords: number;
    traffic: number;
  }[];

  // SOCIAL SIGNALS
  socialSignals: {
    facebook: number;
    twitter: number;
    pinterest: number;
    reddit: number;
  };

  // TECHNICAL
  indexed: {
    google: number;
    bing: number;
  };
  technologies: string[];
  ssl: boolean;
  responsive: boolean;

  lastUpdated: Date;
}

export interface BacklinkProfile {
  totalBacklinks: number;
  referringDomains: number;

  // LINK TYPES
  dofollow: number;
  nofollow: number;
  ugc: number;
  sponsored: number;

  // LINK QUALITY
  qualityDistribution: {
    excellent: number; // DR 70-100
    good: number; // DR 40-69
    average: number; // DR 20-39
    poor: number; // DR 0-19
  };

  // ANCHOR TEXT
  anchorText: {
    text: string;
    count: number;
    percentage: number;
    type: 'Exact' | 'Partial' | 'Branded' | 'Generic' | 'Naked' | 'Image';
  }[];

  // TOP PAGES
  topPages: {
    url: string;
    backlinks: number;
    referringDomains: number;
    traffic: number;
  }[];

  // LINK VELOCITY
  linkVelocity: {
    newLinks: {
      daily: number;
      weekly: number;
      monthly: number;
    };
    lostLinks: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  };

  // REFERRING DOMAINS
  topReferringDomains: {
    domain: string;
    domainRating: number;
    backlinks: number;
    dofollow: number;
    firstSeen: Date;
    lastSeen: Date;
  }[];
}

export interface KeywordMetrics {
  keyword: string;
  searchVolume: {
    global: number;
    monthly: number[];
    country: Record<string, number>;
  };
  difficulty: {
    score: number; // 0-100
    level: 'Very Easy' | 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  };
  cpc: {
    min: number;
    max: number;
    average: number;
  };
  competition: {
    organic: number; // 0-100
    paid: number; // 0-100
  };
  clicks: {
    total: number;
    organic: number;
    paid: number;
  };
  serpFeatures: string[];
  parent: {
    keyword: string;
    volume: number;
  };
  relatedKeywords: {
    keyword: string;
    volume: number;
    difficulty: number;
  }[];
  trends: {
    month: string;
    volume: number;
  }[];
}

export interface SERPAnalysis {
  keyword: string;
  location: string;
  serpFeatures: {
    feature: string;
    position: number;
  }[];
  organicResults: {
    position: number;
    url: string;
    title: string;
    description: string;
    domain: string;
    domainRating: number;
    backlinks: number;
    traffic: number;
  }[];
  paidResults: {
    position: number;
    url: string;
    title: string;
    description: string;
  }[];
  paa: string[]; // People Also Ask
  relatedSearches: string[];
}

// ============================================================================
// DATA AGGREGATOR CLASS
// ============================================================================

export class DeepSeekDataAggregator {
  /**
   * Get comprehensive domain overview (like Ahrefs Domain Overview)
   */
  async getDomainOverview(domain: string): Promise<DomainOverview> {
    console.log(`🔍 Aggregating comprehensive data for ${domain}...`);

    const [
      trafficData,
      authorityMetrics,
      backlinkData,
      keywordData,
      competitorData,
      socialData,
      technicalData,
    ] = await Promise.all([
      this.estimateTrafficData(domain),
      this.calculateAuthorityMetrics(domain),
      this.getBacklinkSummary(domain),
      this.getKeywordSummary(domain),
      this.findTopCompetitors(domain),
      this.getSocialSignals(domain),
      this.getTechnicalData(domain),
    ]);

    return {
      domain,
      ...trafficData,
      ...authorityMetrics,
      backlinks: backlinkData,
      keywords: keywordData,
      topCompetitors: competitorData,
      socialSignals: socialData,
      ...technicalData,
      lastUpdated: new Date(),
    };
  }

  /**
   * Estimate traffic data using AI + DataForSEO
   */
  private async estimateTrafficData(domain: string): Promise<{
    organicTraffic: number;
    paidTraffic: number;
    totalTraffic: number;
    trafficCost: number;
    trafficTrend: { month: string; traffic: number }[];
  }> {
    try {
      // Method 1: DataForSEO for SERP data
      let dataForSEOTraffic = 0;
      if (DATAFORSEO_API_KEY) {
        dataForSEOTraffic = await this.getDataForSEOTraffic(domain);
      }

      // Method 2: AI estimation based on domain analysis
      const aiEstimate = await this.aiEstimateTraffic(domain);

      // Combine both sources for more accurate estimate
      const organicTraffic = Math.round((dataForSEOTraffic + aiEstimate.organic) / 2);

      return {
        organicTraffic,
        paidTraffic: aiEstimate.paid,
        totalTraffic: organicTraffic + aiEstimate.paid,
        trafficCost: aiEstimate.cost,
        trafficTrend: aiEstimate.trend,
      };
    } catch (error) {
      console.error('Traffic estimation error:', error);
      return {
        organicTraffic: 0,
        paidTraffic: 0,
        totalTraffic: 0,
        trafficCost: 0,
        trafficTrend: [],
      };
    }
  }

  /**
   * Get traffic from DataForSEO API
   */
  private async getDataForSEOTraffic(domain: string): Promise<number> {
    if (!DATAFORSEO_API_KEY) return 0;

    try {
      // DataForSEO API call (simplified - actual implementation would use their SDK)
      const response = await axios.post(
        'https://api.dataforseo.com/v3/dataforseo_labs/google/domain_metrics/live',
        [{ target: domain }],
        {
          auth: {
            username: DATAFORSEO_API_KEY.split(':')[0],
            password: DATAFORSEO_API_KEY.split(':')[1],
          },
        }
      );

      const data = response.data?.tasks?.[0]?.result?.[0];
      return data?.metrics?.organic?.etv || 0; // Estimated traffic value
    } catch (error) {
      return 0;
    }
  }

  /**
   * AI-based traffic estimation
   */
  private async aiEstimateTraffic(domain: string): Promise<{
    organic: number;
    paid: number;
    cost: number;
    trend: { month: string; traffic: number }[];
  }> {
    // Scrape website to analyze content
    const scrapedData = await getFirecrawl().scrapeUrl(`https://${domain}`, {
      formats: ['markdown'],
      onlyMainContent: true,
    }).catch(() => ({ markdown: '' }));

    const prompt = `Estimate monthly traffic for ${domain} based on analysis:

Content Sample:
${(scrapedData.markdown || '').substring(0, 2000)}

Consider:
1. Content quality and depth
2. Topic authority indicators
3. Brand mentions
4. Site structure (if visible)
5. Industry benchmarks
6. Domain age (if known)

Provide realistic estimates:
- Small sites: 100-10,000/month
- Medium sites: 10,000-100,000/month
- Large sites: 100,000-1M+/month

Return ONLY valid JSON:
{
  "organic": number,
  "paid": number,
  "cost": number (estimated $ value),
  "trend": [
    {"month": "2025-01", "traffic": number},
    {"month": "2025-02", "traffic": number},
    ... (12 months)
  ],
  "confidence": "high|medium|low",
  "reasoning": "brief explanation"
}`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a traffic estimation expert.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0]?.message?.content || '{"organic":0,"paid":0,"cost":0,"trend":[]}');
  }

  /**
   * Calculate authority metrics (DR, UR, TF, CF)
   */
  private async calculateAuthorityMetrics(domain: string): Promise<{
    domainRating: number;
    urlRating: number;
    trustFlow: number;
    citationFlow: number;
  }> {
    // Use AI + multiple signals to estimate authority
    const prompt = `Estimate SEO authority metrics for ${domain}:

Provide scores (0-100) for:
1. Domain Rating (DR): Overall domain authority
2. URL Rating (UR): Homepage authority
3. Trust Flow (TF): Link quality/trustworthiness
4. Citation Flow (CF): Link quantity

Consider:
- Domain age
- Backlink profile
- Content quality
- Industry authority
- Brand recognition

Return ONLY valid JSON:
{
  "domainRating": number 0-100,
  "urlRating": number 0-100,
  "trustFlow": number 0-100,
  "citationFlow": number 0-100,
  "reasoning": "brief explanation"
}`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO metrics analyst.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const metrics = JSON.parse(response.choices[0]?.message?.content || '{}');

    return {
      domainRating: metrics.domainRating || 50,
      urlRating: metrics.urlRating || 50,
      trustFlow: metrics.trustFlow || 50,
      citationFlow: metrics.citationFlow || 50,
    };
  }

  /**
   * Get backlink summary
   */
  private async getBacklinkSummary(domain: string): Promise<any> {
    // This would use Common Crawl data + AI estimation
    const prompt = `Estimate backlink profile for ${domain}:

Provide realistic estimates:
- Total backlinks
- Dofollow vs nofollow ratio
- Referring domains
- Referring IPs
- New backlinks (last 30 days)
- Lost backlinks (last 30 days)

Return ONLY valid JSON matching BacklinkProfile structure.`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a backlink analyst.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0]?.message?.content || '{}');
  }

  /**
   * Get keyword summary
   */
  private async getKeywordSummary(domain: string): Promise<any> {
    // Estimate keyword rankings
    const prompt = `Estimate keyword rankings for ${domain}:

Provide:
- Total organic keywords ranking
- Keywords in top 3
- Keywords in top 10
- Keywords in top 100
- Paid keywords (if applicable)

Return ONLY valid JSON.`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO analyst.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0]?.message?.content || '{}');
  }

  /**
   * Find top competitors
   */
  private async findTopCompetitors(domain: string): Promise<any[]> {
    // Use AI to identify competitors
    const prompt = `Identify top 10 organic competitors for ${domain}.

Return ONLY valid JSON array:
[
  {
    "domain": "string",
    "commonKeywords": number,
    "traffic": number
  }
]`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a competitive intelligence analyst.',
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

  /**
   * Get social signals
   */
  private async getSocialSignals(domain: string): Promise<any> {
    // Would use social APIs or scraping
    return {
      facebook: 0,
      twitter: 0,
      pinterest: 0,
      reddit: 0,
    };
  }

  /**
   * Get technical data
   */
  private async getTechnicalData(domain: string): Promise<any> {
    try {
      // Check SSL
      const response = await axios.get(`https://${domain}`, {
        timeout: 5000,
        validateStatus: () => true,
      });

      return {
        indexed: {
          google: 0, // Would use Google Search API
          bing: 0,
        },
        technologies: [],
        ssl: response.request.protocol === 'https:',
        responsive: true,
      };
    } catch (error) {
      return {
        indexed: { google: 0, bing: 0 },
        technologies: [],
        ssl: false,
        responsive: false,
      };
    }
  }

  /**
   * Get comprehensive keyword metrics (like Ahrefs Keywords Explorer)
   */
  async getKeywordMetrics(keyword: string, country: string = 'us'): Promise<KeywordMetrics> {
    console.log(`🔍 Getting comprehensive metrics for "${keyword}"...`);

    // Use AI + DataForSEO for comprehensive data
    const prompt = `Provide comprehensive keyword metrics for "${keyword}" in ${country}:

Include:
1. SEARCH VOLUME (monthly, by country, 12-month trend)
2. DIFFICULTY SCORE (0-100)
3. CPC (min, max, average)
4. COMPETITION (organic & paid)
5. CLICKS (total, organic %, paid %)
6. SERP FEATURES
7. PARENT KEYWORD (if applicable)
8. RELATED KEYWORDS (10-15)
9. MONTHLY TRENDS (12 months)

Return ONLY valid JSON matching KeywordMetrics structure.`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a keyword research expert with access to search data.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0]?.message?.content || '{}') as KeywordMetrics;
  }

  /**
   * Analyze SERP (like Ahrefs SERP Overview)
   */
  async analyzeSERP(keyword: string, location: string = 'United States'): Promise<SERPAnalysis> {
    console.log(`🔍 Analyzing SERP for "${keyword}" in ${location}...`);

    // This would ideally use DataForSEO SERP API
    // For now, use AI estimation
    const prompt = `Analyze SERP for "${keyword}" in ${location}:

Provide:
1. SERP FEATURES (Featured Snippet, Local Pack, PAA, etc.)
2. TOP 10 ORGANIC RESULTS (URL, domain, estimated DR, backlinks, traffic)
3. PAID RESULTS (if present)
4. PEOPLE ALSO ASK questions
5. RELATED SEARCHES

Return ONLY valid JSON matching SERPAnalysis structure.`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a SERP analyst.',
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

    return JSON.parse(response.choices[0]?.message?.content || '{}') as SERPAnalysis;
  }
}

export const deepseekDataAggregator = new DeepSeekDataAggregator();
