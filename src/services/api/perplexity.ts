import axios from 'axios'

const PERPLEXITY_API_BASE = 'https://api.perplexity.ai'

export class PerplexityService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async query(prompt: string, model = 'sonar-pro') {
    try {
      const response = await axios.post(
        `${PERPLEXITY_API_BASE}/chat/completions`,
        {
          model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )
      return response.data.choices[0].message.content
    } catch (error) {
      console.error('Perplexity API error:', error)
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

    return this.query(prompt)
  }

  async identifyContentGaps(domain: string, competitors: string[], industry: string) {
    const prompt = `Compare ${domain} with competitors ${competitors.join(', ')} in the ${industry} industry.
    Identify content gaps and opportunities where ${domain} could create valuable content that competitors are missing.
    Focus on topics that would improve local SEO and E-E-A-T signals.`

    return this.query(prompt)
  }

  async findCitationSources(industry: string, location: string) {
    const prompt = `List the top 20 most important citation sources and business directories for a ${industry} business in ${location}.
    Include both general directories (like Yelp, Yellow Pages) and industry-specific platforms.
    Provide the platform name and why it's important for local SEO.`

    return this.query(prompt)
  }

  async analyzeLocalMarket(industry: string, location: string) {
    const prompt = `Provide a comprehensive local market analysis for the ${industry} industry in ${location}:
    1. Key local search trends
    2. Common local SEO tactics used by top performers
    3. Local content opportunities (events, neighborhoods, local partnerships)
    4. Competitive landscape overview
    5. Recommended local SEO strategies`

    return this.query(prompt)
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

    return this.query(prompt)
  }
}
