/**
 * DeepSeek V3.2-Exp API Service via OpenRouter
 *
 * Provides cost-effective AI inference using DeepSeek's sparse attention architecture
 * Features:
 * - 50%+ cost reduction compared to GPT-4
 * - Long-context processing with efficient sparse attention
 * - Optimized for project generation, content creation, and SEO analysis
 *
 * Usage via OpenRouter: https://openrouter.ai/models/deepseek/deepseek-v3.2-exp
 */

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekRequestOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

export class DeepSeekService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';
  private defaultModel = 'deepseek/deepseek-v3.2-exp';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Query DeepSeek model via OpenRouter
   */
  async query(
    messages: DeepSeekMessage[],
    options: DeepSeekRequestOptions = {}
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://geo-seo.app',
          'X-Title': 'GEO-SEO Domination Tool',
        },
        body: JSON.stringify({
          model: options.model || this.defaultModel,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 4096,
          top_p: options.top_p ?? 0.95,
          stream: options.stream ?? false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`DeepSeek API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('DeepSeek API error:', error);
      throw error;
    }
  }

  /**
   * Generate SEO project structure and strategy
   * Primary use case: Cost-effective project initialization
   */
  async generateProjectStructure(
    domain: string,
    industry: string,
    location: string,
    goals: string[]
  ): Promise<string> {
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: `You are an expert SEO strategist and project architect. Create comprehensive, actionable project structures optimized for local SEO dominance. Focus on E-E-A-T signals, local pack optimization, and AI search visibility.`,
      },
      {
        role: 'user',
        content: `Generate a detailed SEO project structure for:

Domain: ${domain}
Industry: ${industry}
Location: ${location}
Goals: ${goals.join(', ')}

Provide:
1. Project overview and strategic objectives
2. Keyword research strategy (local + industry terms)
3. Content pillar architecture
4. Local SEO tactical checklist (GBP, citations, reviews)
5. Technical SEO priorities
6. Timeline with milestones (90-day plan)
7. KPI tracking framework
8. Competitor analysis approach
9. Budget allocation recommendations
10. Risk mitigation strategies

Format as structured JSON with clear sections and actionable tasks.`,
      },
    ];

    return this.query(messages, { max_tokens: 8192, temperature: 0.8 });
  }

  /**
   * Generate content outlines at scale
   * Use case: Bulk content planning with cost efficiency
   */
  async generateContentOutlines(
    topics: string[],
    industry: string,
    location: string,
    contentType: 'blog' | 'pillar' | 'service' | 'location'
  ): Promise<string> {
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: `You are an AI-first content strategist who creates SEO-optimized content outlines designed for both human readers and AI citation. Optimize for Claude, ChatGPT, Google AI Overview, and Perplexity citations.`,
      },
      {
        role: 'user',
        content: `Create detailed content outlines for ${topics.length} ${contentType} pages in the ${industry} industry (${location}):

Topics:
${topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

For each topic, provide:
- SEO-optimized H1 title
- H2/H3 heading structure
- Key facts and statistics (citeable by AI)
- First-hand experience angles
- Local relevance elements
- Internal linking opportunities
- FAQ section (AI-common questions)
- Unique data points to own
- E-E-A-T signal integration

Format as JSON array with one object per topic.`,
      },
    ];

    return this.query(messages, { max_tokens: 16384, temperature: 0.7 });
  }

  /**
   * Analyze competitor strategies at scale
   * Use case: Bulk competitor research with minimal cost
   */
  async analyzeCompetitors(
    competitors: string[],
    domain: string,
    industry: string,
    location: string
  ): Promise<string> {
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: `You are a competitive intelligence analyst specializing in local SEO and digital marketing. Provide actionable insights based on competitive gaps and opportunities.`,
      },
      {
        role: 'user',
        content: `Analyze ${competitors.length} competitors for ${domain} in the ${industry} industry (${location}):

Competitors:
${competitors.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Provide:
1. Competitive landscape overview
2. Content strategy comparison
3. Local SEO tactics analysis
4. Backlink profile insights
5. Social media presence
6. Review management approach
7. Key differentiators
8. Opportunity gaps for ${domain}
9. Threat assessment
10. Strategic recommendations

Format as structured analysis with specific, actionable insights.`,
      },
    ];

    return this.query(messages, { max_tokens: 12288, temperature: 0.6 });
  }

  /**
   * Generate keyword clusters and topical maps
   * Use case: Comprehensive keyword research foundation
   */
  async generateKeywordClusters(
    seedKeywords: string[],
    industry: string,
    location: string
  ): Promise<string> {
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: `You are a keyword research expert specializing in topic clustering, search intent analysis, and local SEO. Create comprehensive keyword maps optimized for content silos and internal linking.`,
      },
      {
        role: 'user',
        content: `Generate keyword clusters from seed keywords for ${industry} in ${location}:

Seed Keywords:
${seedKeywords.join(', ')}

Provide:
1. Primary topic clusters (5-8 clusters)
2. Supporting subtopics for each cluster
3. Long-tail keyword variations
4. Local intent modifiers
5. Question-based keywords
6. Commercial intent keywords
7. Search volume estimates (high/medium/low)
8. Difficulty assessment
9. Content mapping recommendations
10. Internal linking structure

Format as hierarchical JSON with parent topics and child keywords.`,
      },
    ];

    return this.query(messages, { max_tokens: 10240, temperature: 0.7 });
  }

  /**
   * Generate technical SEO audit checklist
   * Use case: Comprehensive site audit planning
   */
  async generateTechnicalAuditChecklist(
    domain: string,
    industry: string,
    siteType: 'ecommerce' | 'local-business' | 'saas' | 'content'
  ): Promise<string> {
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: `You are a technical SEO expert who creates comprehensive audit frameworks. Focus on Core Web Vitals, crawlability, indexation, and performance optimization.`,
      },
      {
        role: 'user',
        content: `Create a technical SEO audit checklist for ${domain} (${industry}, ${siteType}):

Include:
1. Crawl and indexation analysis
2. Site architecture and navigation
3. Core Web Vitals optimization
4. Mobile optimization
5. Schema markup implementation
6. XML sitemap and robots.txt
7. Canonical and hreflang tags
8. Page speed optimization
9. Security (HTTPS, security headers)
10. Structured data validation
11. Internal linking structure
12. Redirect chains and errors
13. Duplicate content issues
14. Image optimization
15. JavaScript rendering

Format as prioritized checklist with severity levels (critical/high/medium/low).`,
      },
    ];

    return this.query(messages, { max_tokens: 8192, temperature: 0.6 });
  }

  /**
   * Generate local citation building strategy
   * Use case: Scale local SEO across multiple locations
   */
  async generateCitationStrategy(
    businessName: string,
    industry: string,
    locations: string[]
  ): Promise<string> {
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: `You are a local SEO expert specializing in citation building, NAP consistency, and directory optimization across multiple locations.`,
      },
      {
        role: 'user',
        content: `Create a citation building strategy for ${businessName} in ${industry} across ${locations.length} locations:

Locations:
${locations.join(', ')}

Provide:
1. Top 30 citation sources (general + industry-specific)
2. NAP consistency guidelines
3. Priority order for submissions
4. Location-specific directories
5. Niche industry platforms
6. Review site strategy
7. Social profile optimization
8. Data aggregator submissions
9. Citation cleanup process
10. Monitoring and maintenance plan

Format as actionable implementation plan with timelines.`,
      },
    ];

    return this.query(messages, { max_tokens: 10240, temperature: 0.7 });
  }
}
