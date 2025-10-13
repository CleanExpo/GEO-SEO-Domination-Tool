/**
 * Groq API Service
 *
 * Ultra-fast, cost-effective AI inference using Groq's LLM platform.
 * OpenAI-compatible API with significantly lower costs and higher throughput.
 *
 * Pricing (per 1M tokens):
 * - Llama 3.1 8B: $0.05 input / $0.08 output (560 tok/s)
 * - Llama 3.3 70B: $0.59 input / $0.79 output (280 tok/s)
 * - GPT-OSS 20B: $0.10 input / $0.50 output (1000 tok/s)
 *
 * Use Cases:
 * - Bulk keyword analysis
 * - SEO content generation
 * - Competitor analysis
 * - Local SEO recommendations
 */

import OpenAI from 'openai';

// Initialize Groq client with OpenAI SDK
export const groqClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

/**
 * Model selection based on use case
 */
export const GroqModels = {
  // Fast and cheap - for bulk processing
  LLAMA_8B_INSTANT: 'llama-3.1-8b-instant',

  // Balanced - quality + speed for most SEO tasks
  LLAMA_70B_VERSATILE: 'llama-3.3-70b-versatile',

  // Fastest - for simple classification tasks
  GPT_OSS_20B: 'openai/gpt-oss-20b',

  // Best quality - for complex analysis
  GPT_OSS_120B: 'openai/gpt-oss-120b',

  // Agent workflows - with built-in tools
  COMPOUND: 'groq-compound',
  COMPOUND_MINI: 'groq-compound-mini',
} as const;

export type GroqModel = typeof GroqModels[keyof typeof GroqModels];

/**
 * Common chat completion parameters
 */
interface ChatCompletionParams {
  model?: GroqModel;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

/**
 * Generic chat completion function
 */
export async function createChatCompletion({
  model = GroqModels.LLAMA_70B_VERSATILE,
  messages,
  temperature = 0.7,
  maxTokens = 2048,
  stream = false,
}: ChatCompletionParams) {
  try {
    const response = await groqClient.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream,
    });

    if (stream) {
      return response; // Return stream for client to handle
    }

    return {
      content: response.choices[0].message.content,
      usage: response.usage,
      model: response.model,
    };
  } catch (error: any) {
    console.error('Groq API Error:', error);
    throw new Error(`Groq API failed: ${error.message}`);
  }
}

/**
 * SEO-specific functions
 */

/**
 * Analyze competitor website for SEO insights
 */
export async function analyzeCompetitorSEO(url: string, htmlContent?: string) {
  const prompt = htmlContent
    ? `Analyze the SEO of this website HTML:\n\n${htmlContent.substring(0, 8000)}\n\nFocus on: title tags, meta descriptions, header structure (H1-H6), content quality, keyword usage, and technical SEO issues.`
    : `Analyze the SEO strategy of this website: ${url}. Based on the URL and domain, provide insights on likely SEO strengths and weaknesses.`;

  return createChatCompletion({
    model: GroqModels.LLAMA_70B_VERSATILE,
    messages: [
      {
        role: 'system',
        content: 'You are an expert SEO analyst with 10+ years experience. Provide actionable, specific recommendations backed by SEO best practices.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    maxTokens: 2048,
  });
}

/**
 * Generate local SEO content for a business
 */
export async function generateLocalSEOContent(business: {
  name: string;
  location: string;
  industry: string;
  targetKeywords?: string[];
  contentType?: 'homepage' | 'service-page' | 'blog-post' | 'about-page';
}) {
  const { name, location, industry, targetKeywords = [], contentType = 'homepage' } = business;

  const prompt = `Generate SEO-optimized ${contentType} content for:

Business: ${name}
Location: ${location}
Industry: ${industry}
${targetKeywords.length > 0 ? `Target Keywords: ${targetKeywords.join(', ')}` : ''}

Requirements:
- Natural incorporation of target keywords
- Local SEO optimization (mention city, landmarks, local context)
- Compelling, engaging writing style
- Clear call-to-action
- Mobile-friendly structure
- 300-500 words`;

  return createChatCompletion({
    model: GroqModels.LLAMA_8B_INSTANT, // Fast and cheap for content generation
    messages: [
      {
        role: 'system',
        content: 'You are a professional local SEO content writer. Write compelling, keyword-optimized content that ranks well and converts visitors.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.8, // Higher creativity for content
    maxTokens: 1024,
  });
}

/**
 * Analyze keywords and suggest SEO strategy
 */
export async function analyzeKeywords(keywords: string[], targetAudience?: string) {
  const prompt = `Analyze these keywords for SEO strategy:

Keywords: ${keywords.join(', ')}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}

Provide:
1. Primary vs secondary keyword classification
2. Search intent for each keyword (informational, transactional, navigational)
3. Estimated difficulty (low/medium/high)
4. Recommended content type for each keyword
5. Long-tail keyword suggestions`;

  return createChatCompletion({
    model: GroqModels.GPT_OSS_20B, // Fast bulk processing
    messages: [
      {
        role: 'system',
        content: 'You are an SEO keyword strategist. Analyze keywords and provide actionable insights for content strategy.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    maxTokens: 1500,
  });
}

/**
 * Generate meta tags (title, description) for a page
 */
export async function generateMetaTags(pageInfo: {
  pageType: string;
  primaryKeyword: string;
  secondaryKeywords?: string[];
  businessName: string;
  location?: string;
}) {
  const { pageType, primaryKeyword, secondaryKeywords = [], businessName, location } = pageInfo;

  const prompt = `Generate SEO-optimized meta tags for:

Page Type: ${pageType}
Primary Keyword: ${primaryKeyword}
${secondaryKeywords.length > 0 ? `Secondary Keywords: ${secondaryKeywords.join(', ')}` : ''}
Business: ${businessName}
${location ? `Location: ${location}` : ''}

Provide:
1. Meta Title (50-60 characters, include primary keyword)
2. Meta Description (150-160 characters, compelling, include CTA)
3. Alternative variations (3 options each)`;

  return createChatCompletion({
    model: GroqModels.LLAMA_8B_INSTANT,
    messages: [
      {
        role: 'system',
        content: 'You are an expert at writing SEO meta tags that maximize click-through rates while staying within character limits.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    maxTokens: 800,
  });
}

/**
 * Analyze and improve existing content for SEO
 */
export async function improveContentSEO(content: string, targetKeyword: string) {
  const prompt = `Improve this content for SEO targeting the keyword "${targetKeyword}":

${content.substring(0, 6000)}

Provide:
1. Keyword density analysis
2. Readability score estimate
3. Missing SEO elements (headers, internal links, etc.)
4. Specific improvement suggestions
5. Rewritten sections (if needed)`;

  return createChatCompletion({
    model: GroqModels.LLAMA_70B_VERSATILE,
    messages: [
      {
        role: 'system',
        content: 'You are an SEO content optimization expert. Analyze content and provide specific, actionable improvements.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.4,
    maxTokens: 2048,
  });
}

/**
 * Extract structured data from competitor pages
 */
export async function extractCompetitorInsights(htmlContent: string) {
  const prompt = `Extract SEO insights from this HTML:

${htmlContent.substring(0, 8000)}

Extract and analyze:
1. Title tag
2. Meta description
3. H1 and H2 headings
4. Primary keywords used
5. Content structure
6. Internal linking strategy
7. Schema.org markup (if present)
8. Unique SEO tactics`;

  return createChatCompletion({
    model: GroqModels.GPT_OSS_20B, // Fast extraction
    messages: [
      {
        role: 'system',
        content: 'You are an SEO researcher. Extract and analyze SEO elements from HTML content in a structured format.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.2, // Low temperature for factual extraction
    maxTokens: 1500,
  });
}

/**
 * Batch process multiple SEO tasks
 */
export async function batchAnalyzeKeywords(keywordBatches: string[][]) {
  const promises = keywordBatches.map((batch) => analyzeKeywords(batch));
  return Promise.all(promises);
}

/**
 * Calculate estimated cost for a Groq API call
 */
export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  model: GroqModel = GroqModels.LLAMA_70B_VERSATILE
): number {
  const pricing: Record<GroqModel, { input: number; output: number }> = {
    [GroqModels.LLAMA_8B_INSTANT]: { input: 0.05, output: 0.08 },
    [GroqModels.LLAMA_70B_VERSATILE]: { input: 0.59, output: 0.79 },
    [GroqModels.GPT_OSS_20B]: { input: 0.10, output: 0.50 },
    [GroqModels.GPT_OSS_120B]: { input: 0.15, output: 0.75 },
    [GroqModels.COMPOUND]: { input: 0.15, output: 0.75 }, // Estimate
    [GroqModels.COMPOUND_MINI]: { input: 0.10, output: 0.50 }, // Estimate
  };

  const rates = pricing[model];
  const inputCost = (inputTokens / 1_000_000) * rates.input;
  const outputCost = (outputTokens / 1_000_000) * rates.output;

  return inputCost + outputCost;
}

/**
 * Health check for Groq API
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await groqClient.chat.completions.create({
      model: GroqModels.LLAMA_8B_INSTANT,
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 5,
    });
    return true;
  } catch (error) {
    console.error('Groq health check failed:', error);
    return false;
  }
}

export default {
  createChatCompletion,
  analyzeCompetitorSEO,
  generateLocalSEOContent,
  analyzeKeywords,
  generateMetaTags,
  improveContentSEO,
  extractCompetitorInsights,
  batchAnalyzeKeywords,
  estimateCost,
  healthCheck,
  GroqModels,
};
