/**
 * DeepSeek V3 AI Service
 *
 * Cost-effective AI reasoning and analysis using DeepSeek V3
 * - deepseek-reasoner: $0.55/M input, $2.19/M output tokens
 * - deepseek-chat: $0.27/M input, $1.10/M output tokens
 *
 * ~90% cheaper than OpenAI GPT-4
 */

interface DeepSeekResponse {
  text: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
  };
}

interface LocalRankingResult {
  business_position: number | null;
  local_pack_position: number | null;
  organic_position: number | null;
  competitors: Array<{
    name: string;
    position: number;
    rating: number;
    reviews: number;
  }>;
  search_date: string;
  serp_features: string[];
}

interface CitationResult {
  directory: string;
  url: string;
  name_found: string;
  address_found: string;
  phone_found: string;
  name_matches: boolean;
  address_matches: boolean;
  phone_matches: boolean;
}

interface SEOProposal {
  change_type: 'meta_title' | 'meta_description' | 'h1' | 'alt_text' | 'content';
  current_value: string;
  proposed_value: string;
  reasoning: string;
  estimated_score_improvement: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

class DeepSeekService {
  private apiKey: string;
  private baseURL: string;
  private useOpenRouter: boolean;

  constructor() {
    // Try OpenRouter first (provides DeepSeek via unified API)
    this.apiKey = process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY || '';
    this.useOpenRouter = !!process.env.OPENROUTER_API_KEY;
    this.baseURL = this.useOpenRouter
      ? 'https://openrouter.ai/api/v1'
      : 'https://api.deepseek.com/v1';

    if (!this.apiKey) {
      console.warn('No API key found. Set OPENROUTER_API_KEY or DEEPSEEK_API_KEY in environment variables');
    }

    if (this.useOpenRouter) {
      console.log('Using OpenRouter for DeepSeek V3 access');
    }
  }

  /**
   * Call DeepSeek API (OpenAI-compatible)
   * Works with both OpenRouter and direct DeepSeek API
   */
  private async call(
    model: 'deepseek-reasoner' | 'deepseek-chat',
    prompt: string,
    temperature = 0.7,
    maxTokens = 2000
  ): Promise<DeepSeekResponse> {
    if (!this.apiKey) {
      throw new Error('API key not configured. Set OPENROUTER_API_KEY or DEEPSEEK_API_KEY');
    }

    // OpenRouter uses different model names
    const modelName = this.useOpenRouter
      ? model === 'deepseek-reasoner'
        ? 'deepseek/deepseek-r1'
        : 'deepseek/deepseek-chat'
      : model;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };

    // OpenRouter-specific headers
    if (this.useOpenRouter) {
      headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_SITE_URL || 'https://geo-seo-domination-tool.vercel.app';
      headers['X-Title'] = 'GEO-SEO Domination Tool';
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${error}`);
    }

    const data = await response.json();

    return {
      text: data.choices[0].message.content,
      usage: data.usage ? {
        input_tokens: data.usage.prompt_tokens,
        output_tokens: data.usage.completion_tokens,
        cost_usd: this.calculateCost(model, data.usage.prompt_tokens, data.usage.completion_tokens),
      } : undefined,
    };
  }

  /**
   * Calculate API cost
   * OpenRouter pricing may differ slightly from direct DeepSeek
   */
  private calculateCost(
    model: 'deepseek-reasoner' | 'deepseek-chat',
    inputTokens: number,
    outputTokens: number
  ): number {
    // OpenRouter pricing (as of 2025)
    const pricing = this.useOpenRouter
      ? {
          'deepseek-reasoner': { input: 0.55, output: 2.19 }, // DeepSeek R1 via OpenRouter
          'deepseek-chat': { input: 0.27, output: 1.10 }, // DeepSeek Chat via OpenRouter
        }
      : {
          'deepseek-reasoner': { input: 0.55, output: 2.19 },
          'deepseek-chat': { input: 0.27, output: 1.10 },
        };

    const rates = pricing[model];
    const inputCost = (inputTokens / 1_000_000) * rates.input;
    const outputCost = (outputTokens / 1_000_000) * rates.output;

    return inputCost + outputCost;
  }

  /**
   * Use DeepSeek reasoner for complex SEO analysis
   */
  async analyzeRankingData(rankingData: any): Promise<string> {
    const prompt = `
You are an SEO expert analyzing Google Search Console ranking data.

Data:
${JSON.stringify(rankingData, null, 2)}

Provide strategic insights:
1. What keywords are performing well? (high CTR, improving position)
2. What keywords need attention? (high impressions, low CTR, declining position)
3. Which pages are top performers?
4. What content gaps exist?
5. Specific action items to improve rankings

Be concise and actionable.
`;

    const result = await this.call('deepseek-reasoner', prompt, 0.3, 1500);
    return result.text;
  }

  /**
   * Find local rankings via web search
   * NOTE: This uses DeepSeek's web search capability
   */
  async getLocalRankings(
    keyword: string,
    location: string,
    businessName: string
  ): Promise<LocalRankingResult> {
    const prompt = `
Search Google for "${keyword}" in "${location}" and analyze the local pack results.

Find the position of "${businessName}" in:
1. Local Pack (top 3 map results)
2. Organic results (positions 1-20)

Also identify the top 3 competitors in the local pack.

Return ONLY valid JSON (no markdown, no explanation):
{
  "business_position": number or null,
  "local_pack_position": number or null,
  "organic_position": number or null,
  "competitors": [
    {"name": "...", "position": number, "rating": number, "reviews": number}
  ],
  "search_date": "ISO date string",
  "serp_features": ["local_pack", "people_also_ask", etc]
}
`;

    const result = await this.call('deepseek-chat', prompt, 0.1, 1000);

    try {
      // Extract JSON from response (in case there's markdown)
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse DeepSeek local ranking response:', result.text);
      throw new Error('Failed to parse ranking data from DeepSeek');
    }
  }

  /**
   * Find business citations using web search
   */
  async findCitations(
    businessName: string,
    address: string,
    phone: string
  ): Promise<CitationResult[]> {
    const prompt = `
Search for online citations/listings for this business:
Name: ${businessName}
Address: ${address}
Phone: ${phone}

Find listings on these directories:
- Google Business Profile
- Yelp
- Facebook
- Yellow Pages (Australia)
- True Local
- Start Local
- Hotfrog

For each citation found, return ONLY valid JSON (no markdown):
[
  {
    "directory": "...",
    "url": "...",
    "name_found": "...",
    "address_found": "...",
    "phone_found": "...",
    "name_matches": true/false,
    "address_matches": true/false,
    "phone_matches": true/false
  }
]
`;

    const result = await this.call('deepseek-chat', prompt, 0.1, 2000);

    try {
      const jsonMatch = result.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse DeepSeek citation response:', result.text);
      throw new Error('Failed to parse citation data from DeepSeek');
    }
  }

  /**
   * Generate SEO-optimized GBP post
   */
  async generateGBPPost(
    businessContext: { name: string; industry: string; location: string },
    postType: 'update' | 'offer' | 'event'
  ): Promise<{
    title: string;
    content: string;
    call_to_action: 'LEARN_MORE' | 'CALL' | 'BOOK' | 'ORDER' | 'SIGN_UP';
    hashtags: string[];
  }> {
    const prompt = `
Generate a Google Business Profile post for:
Business: ${businessContext.name}
Industry: ${businessContext.industry}
Location: ${businessContext.location}
Post type: ${postType}

Requirements:
- Engaging, natural tone
- 100-300 words
- Include a call-to-action
- Use relevant local keywords
- Add 3-5 relevant hashtags

Return ONLY valid JSON:
{
  "title": "...",
  "content": "...",
  "call_to_action": "LEARN_MORE|CALL|BOOK|ORDER|SIGN_UP",
  "hashtags": ["...", "..."]
}
`;

    const result = await this.call('deepseek-chat', prompt, 0.8, 800);

    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse DeepSeek GBP post response:', result.text);
      throw new Error('Failed to generate GBP post');
    }
  }

  /**
   * Generate review response
   */
  async generateReviewResponse(
    review: { rating: number; comment: string },
    businessContext: { name: string; industry: string }
  ): Promise<string> {
    const prompt = `
Generate a professional response to this ${review.rating}-star review for ${businessContext.name}, a ${businessContext.industry} business.

Review: "${review.comment}"

Response should:
- Thank the reviewer
- Be empathetic and professional
- ${review.rating <= 3 ? 'Apologize and offer to resolve the issue' : 'Reinforce the positive experience'}
- Include business name naturally
- Be 50-150 words
- Sound natural, not robotic

Return ONLY the response text (no JSON, no quotes, no explanation).
`;

    const result = await this.call('deepseek-chat', prompt, 0.7, 300);
    return result.text.trim();
  }

  /**
   * Generate SEO improvement proposals from audit data
   */
  async generateSEOProposals(auditData: {
    seo_score: number;
    performance_score: number;
    accessibility_score: number;
    issues: any[];
    metadata: {
      title: string;
      meta_description: string;
      h1_tags: string[];
    };
  }, websiteUrl: string): Promise<SEOProposal[]> {
    const prompt = `
Analyze this SEO audit data for ${websiteUrl}:

Current scores:
- SEO Score: ${auditData.seo_score}/100
- Performance: ${auditData.performance_score}/100
- Accessibility: ${auditData.accessibility_score}/100

Issues found:
${JSON.stringify(auditData.issues, null, 2)}

Meta data:
- Title: ${auditData.metadata.title} (${auditData.metadata.title.length} chars)
- Description: ${auditData.metadata.meta_description} (${auditData.metadata.meta_description?.length || 0} chars)
- H1 tags: ${auditData.metadata.h1_tags.join(', ')}

Generate 5-10 actionable SEO improvement proposals. Return ONLY valid JSON array:
[
  {
    "change_type": "meta_title|meta_description|h1|alt_text|content",
    "current_value": "...",
    "proposed_value": "...",
    "reasoning": "Why this improves SEO (one sentence)",
    "estimated_score_improvement": 1-10,
    "priority": "low|medium|high|critical"
  }
]
`;

    const result = await this.call('deepseek-reasoner', prompt, 0.3, 2000);

    try {
      const jsonMatch = result.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse DeepSeek SEO proposals response:', result.text);
      throw new Error('Failed to generate SEO proposals');
    }
  }

  /**
   * Analyze competitor website
   */
  async analyzeCompetitor(competitorUrl: string, yourUrl: string): Promise<string> {
    const prompt = `
Compare these two websites for SEO:
Your site: ${yourUrl}
Competitor: ${competitorUrl}

Analyze:
1. Title tags and meta descriptions
2. H1 and content structure
3. Estimated backlink profile
4. Content quality and E-E-A-T signals
5. Technical SEO (page speed, mobile friendliness)
6. Local SEO signals (if applicable)

Provide:
- Key strengths of competitor
- Gaps in your site
- Top 3 actionable opportunities to outrank them

Be specific and actionable.
`;

    const result = await this.call('deepseek-reasoner', prompt, 0.3, 1500);
    return result.text;
  }
}

export const deepseekService = new DeepSeekService();
