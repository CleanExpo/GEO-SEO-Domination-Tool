import Anthropic from '@anthropic-ai/sdk'

const CLAUDE_MODEL = 'claude-sonnet-4-20250514'

export class ClaudeService {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
    })
  }

  async query(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const message = await this.client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      const content = message.content[0]
      if (content.type === 'text') {
        return content.text
      }
      throw new Error('Unexpected response format')
    } catch (error) {
      console.error('Claude API error:', error)
      throw error
    }
  }

  async analyzeCompetitor(competitorDomain: string, industry: string) {
    const prompt = `Analyze the SEO and local search strategy of ${competitorDomain} in the ${industry} industry. Provide insights on:
    1. Their content strategy and key topics
    2. Their local SEO approach
    3. Their E-E-A-T signals (experience, expertise, authoritativeness, trustworthiness)
    4. Key strengths and weaknesses
    Please be specific and actionable.`

    return this.query(prompt, 'You are an expert SEO analyst with deep knowledge of local search and AI-driven SEO strategies.')
  }

  async identifyContentGaps(domain: string, competitors: string[], industry: string) {
    const prompt = `Compare ${domain} with competitors ${competitors.join(', ')} in the ${industry} industry.
    Identify content gaps and opportunities where ${domain} could create valuable content that competitors are missing.
    Focus on topics that would improve local SEO and E-E-A-T signals.`

    return this.query(prompt, 'You are an expert content strategist specializing in SEO and competitive analysis.')
  }

  async findCitationSources(industry: string, location: string) {
    const prompt = `List the top 20 most important citation sources and business directories for a ${industry} business in ${location}.
    Include both general directories (like Yelp, Yellow Pages) and industry-specific platforms.
    Provide the platform name and why it's important for local SEO.`

    return this.query(prompt, 'You are a local SEO expert with extensive knowledge of citation building and directory optimization.')
  }

  async analyzeLocalMarket(industry: string, location: string) {
    const prompt = `Provide a comprehensive local market analysis for the ${industry} industry in ${location}:
    1. Key local search trends
    2. Common local SEO tactics used by top performers
    3. Local content opportunities (events, neighborhoods, local partnerships)
    4. Competitive landscape overview
    5. Recommended local SEO strategies`

    return this.query(prompt, 'You are a local market research expert specializing in SEO and geographic targeting.')
  }

  async generateLocalContent(topic: string, location: string, industry: string) {
    const prompt = `Generate a detailed content outline for a blog post about "${topic}" for a ${industry} business in ${location}.
    The content should:
    1. Include local relevance and geographical context
    2. Demonstrate first-hand experience and expertise
    3. Be optimized for local search
    4. Include relevant local keywords
    5. Build E-E-A-T signals
    Provide the title, H2 sections, and key points for each section.`

    return this.query(prompt, 'You are an expert content writer specializing in local SEO and E-E-A-T optimization.')
  }

  async analyzeForAICitations(url: string, content: string, industry: string) {
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

    return this.query(prompt, 'You are an AI search optimization expert who understands how LLMs parse and cite content.')
  }

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

    Optimize for Claude, ChatGPT, and Google AI Overview citations.`

    return this.query(prompt, 'You are an AI-first content strategist who creates content optimized for both human readers and AI citation.')
  }
}
