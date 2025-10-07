import { ClaudeService } from './claude'

export interface AISearchStrategy {
  id?: number
  strategy_name: string
  category: 'content' | 'technical' | 'ai_optimization' | 'local' | 'citations' | 'eeat' | 'competitor'
  principle: string
  implementation_details: string
  tools_resources?: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface AISearchCampaign {
  id?: number
  company_id: number
  campaign_name: string
  objective?: string
  target_ai_platforms: string[]
  start_date?: string
  end_date?: string
  status: 'planning' | 'active' | 'paused' | 'completed'
  budget?: number
}

export interface AIVisibilityCheck {
  ai_platform: string
  query: string
  brand_mentioned: boolean
  position_in_response?: number
  context_sentiment?: 'positive' | 'neutral' | 'negative'
  citation_included: boolean
  citation_url?: string
  full_response: string
}

export class AISearchService {
  private claude: ClaudeService

  constructor(anthropicApiKey: string) {
    this.claude = new ClaudeService(anthropicApiKey)
  }

  // Strategy 1: AI Search Revolution - Check brand visibility in AI responses
  async checkAIVisibility(brandName: string, industry: string, queries: string[]): Promise<AIVisibilityCheck[]> {
    const results: AIVisibilityCheck[] = []

    for (const query of queries) {
      try {
        const response = await this.claude.query(
          `${query} in the ${industry} industry. Provide a comprehensive answer.`,
          'You are a helpful AI assistant providing detailed, accurate information about industries and businesses.'
        )

        const brandMentioned = response.toLowerCase().includes(brandName.toLowerCase())
        const position = brandMentioned ? response.toLowerCase().indexOf(brandName.toLowerCase()) : -1

        results.push({
          ai_platform: 'Claude',
          query,
          brand_mentioned: brandMentioned,
          position_in_response: position !== -1 ? position : undefined,
          citation_included: response.includes('http') && response.includes(brandName),
          full_response: response,
        })
      } catch (error) {
        console.error(`Error checking visibility for query: ${query}`, error)
      }
    }

    return results
  }

  // Strategy 2: Topic Cluster Analysis
  async analyzeTopicClusters(industry: string, mainTopic: string) {
    const prompt = `For a ${industry} business focusing on "${mainTopic}", identify:
    1. The main pillar topic and subtopics for a comprehensive content cluster
    2. Natural language questions users ask AI about this topic
    3. Supporting topics that should link to the pillar content
    4. Key facts and data points that AI tools value for citations

    Format as a structured content cluster strategy.`

    return this.claude.query(prompt, 'You are an expert SEO strategist specializing in topic clusters and content architecture.')
  }

  // Strategy 3: Buyer Journey & Psychographics
  async analyzeBuyerJourney(industry: string, productService: string) {
    const prompt = `For a ${industry} business selling ${productService}, analyze:
    1. The complete buyer journey stages from awareness to decision
    2. Psychographic profiles (motivations, fears, objections, values) - NOT just demographics
    3. Content topics needed for each journey stage
    4. Questions buyers ask at each stage that AI search tools answer
    5. Emotional triggers and decision factors

    Provide actionable psychographic insights for content strategy.`

    return this.claude.query(prompt, 'You are an expert SEO strategist specializing in topic clusters and content architecture.')
  }

  // Strategy 4: Seasonality Analysis
  async analyzeSeasonality(industry: string, keywords: string[]) {
    const prompt = `For the ${industry} industry with focus keywords: ${keywords.join(', ')}

    Analyze:
    1. Seasonal search behavior patterns throughout the year
    2. Peak seasons for each keyword/topic
    3. Content publishing calendar recommendations
    4. Seasonal content opportunities
    5. Historical trend patterns

    Provide a seasonal content strategy with specific timing recommendations.`

    return this.claude.query(prompt, 'You are an expert SEO strategist specializing in topic clusters and content architecture.')
  }

  // Strategy 5: Trust & Authority Building
  async identifyAuthorityOpportunities(industry: string, companyName: string) {
    const prompt = `For ${companyName} in the ${industry} industry, identify opportunities to build trust and authority:

    1. Types of proprietary data or surveys the company could create
    2. Expert positioning strategies (team credentials to highlight)
    3. Industry statistics worth owning/publishing
    4. Tool or calculator ideas that would demonstrate expertise
    5. First-party experience content angles
    6. Potential partnerships or collaborations for authority

    Focus on tactics that make the brand citeable by AI search tools.`

    return this.claude.query(prompt, 'You are an expert SEO strategist specializing in topic clusters and content architecture.')
  }

  // Strategy 6: Content-Driven Commerce
  async identifyContentCommerceOpportunities(industry: string, products: string[]) {
    const prompt = `For a ${industry} business with products/services: ${products.join(', ')}

    Identify content-driven commerce opportunities:
    1. Educational content topics that naturally lead to product consideration
    2. How to embed CTAs and product links contextually in content
    3. Problem-solution content that showcases products
    4. Comparison and buying guide opportunities
    5. Interactive content (calculators, quizzes) that drive conversions

    Focus on content that captures intent before users leave to AI answers.`

    return this.claude.query(prompt, 'You are an expert SEO strategist specializing in topic clusters and content architecture.')
  }

  // Perplexity Background Search Analysis
  async analyzePerplexityBackgroundSearches(topic: string) {
    const prompt = `When users search for "${topic}" on Perplexity, what are the common background searches and related topics that Perplexity uses to build comprehensive answers?

    Identify:
    1. Related subtopics Perplexity pulls in
    2. Common user follow-up questions
    3. Depth of coverage needed to be citation-worthy
    4. Factual angles that get cited most often
    5. Content structure that AI prefers

    Help me understand how to structure content for maximum AI visibility.`

    return this.claude.query(prompt, 'You are an expert SEO strategist specializing in topic clusters and content architecture.')
  }

  // AI Citation Worthiness Score
  async analyzeContentForAICitations(url: string, content: string, industry: string) {
    const prompt = `Analyze this content from the ${industry} industry for AI citation worthiness:

    URL: ${url}
    Content Preview: ${content.substring(0, 1500)}...

    Evaluate:
    1. Citation-worthiness score (0-100) and why
    2. Unique facts or data points AI tools would cite
    3. Content structure quality for AI parsing
    4. Authority signals present (expertise, experience, trust)
    5. Specific improvements to increase AI citations

    Provide a detailed assessment with actionable recommendations.`

    return this.claude.query(prompt, 'You are an expert SEO strategist specializing in topic clusters and content architecture.')
  }

  // Competitor AI Dominance Analysis
  async analyzeCompetitorAIDominance(
    industry: string,
    yourBrand: string,
    competitors: string[],
    testQueries: string[]
  ) {
    const results = []

    for (const query of testQueries) {
      const prompt = `${query} in the ${industry} industry`
      const response = await this.claude.query(prompt, 'You are an expert competitive analyst focusing on AI search visibility.')

      const mentions = {
        query,
        your_brand: response.toLowerCase().includes(yourBrand.toLowerCase()),
        competitor_mentions: competitors.map(comp => ({
          name: comp,
          mentioned: response.toLowerCase().includes(comp.toLowerCase()),
        })),
        response: response,
      }

      results.push(mentions)
    }

    return results
  }

  // AI-Optimized Content Generator
  async generateAIOptimizedContent(
    topic: string,
    industry: string,
    targetAudience: string,
    contentType: 'pillar' | 'supporting' | 'commercial'
  ) {
    const prompt = `Create a comprehensive content outline optimized for AI search visibility:

    Topic: ${topic}
    Industry: ${industry}
    Target Audience: ${targetAudience}
    Content Type: ${contentType}

    Provide:
    1. SEO-optimized title (for both traditional and AI search)
    2. Content structure with H2/H3 headings
    3. Key facts and statistics to include (citeable by AI)
    4. Expert insights and first-hand experience angles
    5. Internal linking opportunities
    6. Conversion opportunities (CTAs, product mentions)
    7. FAQ section with AI-common questions
    8. Unique data points to own in this topic space

    Optimize for Perplexity, ChatGPT, and Google AI Overview citations.`

    return this.claude.query(prompt, 'You are an expert SEO strategist specializing in topic clusters and content architecture.')
  }
}
