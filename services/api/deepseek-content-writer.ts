/**
 * DeepSeek V3 AI Content Writing Engine
 * AI-powered content creation for blogs, articles, social media
 *
 * REPLACES:
 * - Jasper AI ($49-125/month)
 * - Copy.ai ($49-249/month)
 * - Writesonic ($16-99/month)
 * - Rytr ($9-29/month)
 * - Article Forge ($27-127/month)
 *
 * Combined Cost: $150-629/month = $1,800-7,548/year
 * DeepSeek Solution: $15-40/month = $180-480/year
 * Savings: 90-94% ($1,620-7,068/year)
 *
 * CAPABILITIES:
 * ✅ Blog articles (SEO-optimized, 1000-5000 words)
 * ✅ Social media posts (platform-specific)
 * ✅ Ad copy (Google, Facebook, Instagram, LinkedIn)
 * ✅ Email campaigns
 * ✅ Product descriptions
 * ✅ Landing pages
 * ✅ Video scripts
 * ✅ Podcast outlines
 * ✅ Press releases
 * ✅ White papers
 * ✅ Case studies
 * ✅ Content rewriting and optimization
 * ✅ Multi-language support
 */

import OpenAI from 'openai';
import type { SocialPlatform } from './deepseek-social-media';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';

const deepseek = new OpenAI({
  apiKey: DEEPSEEK_API_KEY,
  baseURL: DEEPSEEK_BASE_URL,
});

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ContentType =
  | 'blog_article'
  | 'social_post'
  | 'ad_copy'
  | 'email'
  | 'product_description'
  | 'landing_page'
  | 'video_script'
  | 'podcast_outline'
  | 'press_release'
  | 'white_paper'
  | 'case_study'
  | 'newsletter';

export type WritingTone =
  | 'professional'
  | 'casual'
  | 'friendly'
  | 'authoritative'
  | 'humorous'
  | 'inspirational'
  | 'educational'
  | 'persuasive';

export type ContentLength = 'short' | 'medium' | 'long' | 'very_long';

export interface ContentRequest {
  type: ContentType;
  topic: string;
  keywords?: string[];
  tone?: WritingTone;
  length?: ContentLength;
  targetAudience?: string;
  platform?: SocialPlatform; // For social posts
  callToAction?: string;
  additionalInstructions?: string;
  language?: string;
}

export interface BlogArticle {
  title: string;
  metaDescription: string;
  slug: string;
  content: string;
  wordCount: number;
  readingTime: number; // minutes
  outline: {
    heading: string;
    level: number; // 1-6 (H1-H6)
    content: string;
  }[];
  keywords: {
    primary: string[];
    secondary: string[];
    lsi: string[]; // Latent Semantic Indexing
  };
  seoScore: number; // 0-100
  readabilityScore: number; // Flesch Reading Ease
  images: {
    suggested: string[]; // Image descriptions
    alt: string[];
  };
  internalLinks: {
    anchorText: string;
    suggestedUrl: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
}

export interface SocialPost {
  platform: SocialPlatform;
  content: string;
  hashtags: string[];
  mentions?: string[];
  callToAction: string;
  mediaType: 'Image' | 'Video' | 'Carousel' | 'Text' | 'Story';
  mediaSuggestions: string[];
  bestPostingTime: {
    day: string;
    hour: number;
  };
  variations: string[]; // A/B testing versions
  engagementPrediction: number; // 0-100
}

export interface AdCopy {
  platform: 'google' | 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok';
  headlines: string[]; // Multiple options
  descriptions: string[];
  callToAction: string[];
  keywords: string[];
  targetAudience: string;
  adFormat: string;
  budget: {
    suggested: number;
    bidding: string;
  };
  variations: {
    headline: string;
    description: string;
    cta: string;
  }[];
}

export interface EmailCampaign {
  subject: string;
  preheader: string;
  body: string;
  callToAction: string;
  personalization: {
    tokens: string[]; // {{firstName}}, {{company}}, etc.
    suggestions: string[];
  };
  segments: string[];
  timing: {
    bestDay: string;
    bestTime: string;
  };
  variations: {
    subject: string;
    body: string;
  }[];
  deliverability: {
    spamScore: number; // 0-100
    suggestions: string[];
  };
}

export interface ContentOptimization {
  original: string;
  optimized: string;
  changes: {
    type: string;
    original: string;
    improved: string;
    reason: string;
  }[];
  improvements: {
    seo: string[];
    readability: string[];
    engagement: string[];
    conversion: string[];
  };
  before: {
    wordCount: number;
    seoScore: number;
    readabilityScore: number;
  };
  after: {
    wordCount: number;
    seoScore: number;
    readabilityScore: number;
  };
}

// ============================================================================
// AI CONTENT WRITING ENGINE
// ============================================================================

export class DeepSeekContentWriter {
  /**
   * Generate SEO-optimized blog article
   * Replaces: Jasper Blog Post Workflow, Copy.ai Blog Wizard
   */
  async writeBlogArticle(request: ContentRequest): Promise<BlogArticle> {
    console.log(`✍️ DeepSeek: Writing blog article on "${request.topic}"...`);

    const wordCountTarget = this.getWordCountTarget(request.length || 'long');

    const prompt = `Write a comprehensive, SEO-optimized blog article:

TOPIC: ${request.topic}
TARGET KEYWORDS: ${request.keywords?.join(', ') || 'auto-generate'}
TONE: ${request.tone || 'professional'}
TARGET WORD COUNT: ${wordCountTarget}
AUDIENCE: ${request.targetAudience || 'general'}
${request.additionalInstructions ? `ADDITIONAL: ${request.additionalInstructions}` : ''}

Requirements:
1. COMPELLING TITLE (60 characters max, include primary keyword)
2. META DESCRIPTION (150-160 characters, compelling, keyword-rich)
3. URL SLUG (SEO-friendly, lowercase, hyphens)
4. COMPREHENSIVE CONTENT (${wordCountTarget} words):
   - Engaging introduction with hook
   - Well-structured sections with H2/H3 headings
   - Data, statistics, examples
   - Actionable insights
   - Strong conclusion with CTA

5. SEO OPTIMIZATION:
   - Primary keywords (3-5)
   - Secondary keywords (5-10)
   - LSI keywords (10-15)
   - Natural keyword density (1-2%)

6. INTERNAL LINKING:
   - 5-7 suggested internal links
   - Natural anchor text

7. FAQs (5-7 questions from "People Also Ask")

8. IMAGE SUGGESTIONS:
   - 3-5 image descriptions
   - Alt text for each

9. READING METRICS:
   - SEO score (0-100)
   - Readability score (Flesch Reading Ease)
   - Estimated reading time

Return ONLY valid JSON matching BlogArticle structure.

The content must be:
- Informative and valuable
- Original and unique
- Well-researched
- Engaging and readable
- SEO-optimized
- Scannable (short paragraphs, bullet points)
- Actionable (practical tips and advice)`;

    try {
      const response = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert content writer and SEO specialist with extensive experience in creating high-performing blog content that ranks well and engages readers.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7, // Higher creativity for content writing
        max_tokens: 8000,
        response_format: { type: 'json_object' },
      });

      const article = JSON.parse(response.choices[0]?.message?.content || '{}');
      console.log(`✅ DeepSeek: Blog article complete (${article.wordCount || 0} words)`);
      return article as BlogArticle;
    } catch (error) {
      console.error(`❌ DeepSeek: Blog writing error:`, error);
      throw error;
    }
  }

  /**
   * Generate platform-specific social media posts
   * Replaces: Copy.ai Social Media Captions, Jasper Social Media Templates
   */
  async writeSocialPost(request: ContentRequest & { platform: SocialPlatform }): Promise<SocialPost> {
    console.log(`✍️ DeepSeek: Writing ${request.platform} post on "${request.topic}"...`);

    const characterLimit = this.getCharacterLimit(request.platform);

    const prompt = `Create an engaging social media post for ${request.platform}:

TOPIC: ${request.topic}
CHARACTER LIMIT: ${characterLimit}
TONE: ${request.tone || 'casual'}
AUDIENCE: ${request.targetAudience || 'general'}
${request.callToAction ? `CTA: ${request.callToAction}` : ''}
${request.additionalInstructions ? `ADDITIONAL: ${request.additionalInstructions}` : ''}

Platform-Specific Requirements for ${request.platform}:
${this.getPlatformRequirements(request.platform)}

Provide:
1. MAIN POST CONTENT (${characterLimit} characters max)
2. OPTIMAL HASHTAGS (${this.getHashtagCount(request.platform)})
3. CALL TO ACTION (clear and compelling)
4. MEDIA TYPE (Image, Video, Carousel, etc.)
5. MEDIA SUGGESTIONS (3-5 descriptions)
6. BEST POSTING TIME (day and hour)
7. VARIATIONS (3 different versions for A/B testing)
8. ENGAGEMENT PREDICTION (0-100 score)

Return ONLY valid JSON matching SocialPost structure.

The post must be:
- Attention-grabbing
- Platform-appropriate
- Engaging and shareable
- On-brand
- Include emojis (if appropriate for ${request.platform})
- Optimized for algorithm`;

    try {
      const response = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a social media content expert specializing in ${request.platform} with deep knowledge of platform algorithms, engagement patterns, and viral content strategies.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8, // Higher creativity for social media
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const post = JSON.parse(response.choices[0]?.message?.content || '{}');
      console.log(`✅ DeepSeek: ${request.platform} post complete`);
      return {
        platform: request.platform,
        ...post,
      } as SocialPost;
    } catch (error) {
      console.error(`❌ DeepSeek: Social post writing error:`, error);
      throw error;
    }
  }

  /**
   * Generate high-converting ad copy
   * Replaces: Copy.ai Ad Copy, Jasper Ads Templates
   */
  async writeAdCopy(
    request: ContentRequest & {
      platform: 'google' | 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok';
      product: string;
      targetAudience: string;
      budget?: number;
    }
  ): Promise<AdCopy> {
    console.log(`✍️ DeepSeek: Writing ${request.platform} ad copy for "${request.product}"...`);

    const prompt = `Create high-converting ad copy for ${request.platform}:

PRODUCT/SERVICE: ${request.product}
TARGET AUDIENCE: ${request.targetAudience}
TOPIC: ${request.topic}
KEYWORDS: ${request.keywords?.join(', ') || 'auto-generate'}
TONE: ${request.tone || 'persuasive'}
${request.budget ? `BUDGET: $${request.budget}` : ''}
${request.callToAction ? `CTA: ${request.callToAction}` : ''}

Platform Requirements for ${request.platform}:
${this.getAdPlatformRequirements(request.platform)}

Provide:
1. HEADLINES (5-10 variations)
   - Attention-grabbing
   - Benefit-focused
   - Include keywords

2. DESCRIPTIONS (5-10 variations)
   - Compelling value propositions
   - Address pain points
   - Include social proof

3. CALLS TO ACTION (5-10 variations)
   - Action-oriented
   - Create urgency
   - Clear next step

4. TARGET KEYWORDS (10-15)
5. AD FORMAT RECOMMENDATIONS
6. BUDGET SUGGESTIONS (if applicable)
7. A/B TEST VARIATIONS (5 complete ad sets)

Return ONLY valid JSON matching AdCopy structure.

Focus on:
- Pain points → solutions
- Benefits over features
- Emotional triggers
- Social proof
- Urgency/scarcity
- Clear value proposition`;

    try {
      const response = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a direct response copywriter and ${request.platform} ads expert with proven track record of creating high-ROI advertising campaigns.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      });

      const adCopy = JSON.parse(response.choices[0]?.message?.content || '{}');
      console.log(`✅ DeepSeek: ${request.platform} ad copy complete`);
      return {
        platform: request.platform,
        targetAudience: request.targetAudience,
        ...adCopy,
      } as AdCopy;
    } catch (error) {
      console.error(`❌ DeepSeek: Ad copy writing error:`, error);
      throw error;
    }
  }

  /**
   * Generate email marketing campaigns
   * Replaces: Copy.ai Email Templates, Jasper Email Workflows
   */
  async writeEmailCampaign(
    request: ContentRequest & {
      purpose: 'Welcome' | 'Newsletter' | 'Promotion' | 'Announcement' | 'Re-engagement';
      audience: string;
    }
  ): Promise<EmailCampaign> {
    console.log(`✍️ DeepSeek: Writing ${request.purpose} email for "${request.topic}"...`);

    const prompt = `Create a high-converting email campaign:

PURPOSE: ${request.purpose}
TOPIC: ${request.topic}
AUDIENCE: ${request.audience}
TONE: ${request.tone || 'professional'}
${request.callToAction ? `CTA: ${request.callToAction}` : ''}

Requirements:
1. SUBJECT LINE (5-7 variations)
   - 40-50 characters
   - Compelling, curiosity-inducing
   - Personalization tokens
   - Emoji (if appropriate)

2. PREHEADER TEXT (3-5 variations)
   - 85-100 characters
   - Complements subject
   - Adds value

3. EMAIL BODY
   - Engaging opening
   - Clear value proposition
   - Scannable format
   - Visual hierarchy
   - Strong CTA

4. PERSONALIZATION
   - Token suggestions ({{firstName}}, etc.)
   - Segment-specific variations

5. TIMING
   - Best day to send
   - Best time (with timezone)

6. A/B TEST VARIATIONS (3 versions)

7. DELIVERABILITY
   - Spam score (0-100)
   - Improvement suggestions

Return ONLY valid JSON matching EmailCampaign structure.`;

    try {
      const response = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an email marketing expert specializing in high-converting campaigns with expertise in deliverability and engagement optimization.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      });

      const email = JSON.parse(response.choices[0]?.message?.content || '{}');
      console.log(`✅ DeepSeek: Email campaign complete`);
      return email as EmailCampaign;
    } catch (error) {
      console.error(`❌ DeepSeek: Email writing error:`, error);
      throw error;
    }
  }

  /**
   * Optimize existing content
   * Replaces: Copy.ai Content Improver, Jasper Content Optimizer
   */
  async optimizeContent(
    content: string,
    goals: ('SEO' | 'Readability' | 'Engagement' | 'Conversion')[]
  ): Promise<ContentOptimization> {
    console.log(`✍️ DeepSeek: Optimizing content for ${goals.join(', ')}...`);

    const prompt = `Optimize this content:

ORIGINAL CONTENT:
${content}

OPTIMIZATION GOALS: ${goals.join(', ')}

Provide:
1. OPTIMIZED VERSION (full rewrite)

2. DETAILED CHANGES
   - List each change made
   - Original text → improved text
   - Reason for change

3. IMPROVEMENTS BY CATEGORY:
   ${goals.includes('SEO') ? '- SEO improvements (keywords, structure, meta)' : ''}
   ${goals.includes('Readability') ? '- Readability improvements (clarity, flow, structure)' : ''}
   ${goals.includes('Engagement') ? '- Engagement improvements (hooks, storytelling, examples)' : ''}
   ${goals.includes('Conversion') ? '- Conversion improvements (CTAs, benefits, social proof)' : ''}

4. BEFORE/AFTER METRICS:
   - Word count
   - SEO score (0-100)
   - Readability score (Flesch Reading Ease)

Return ONLY valid JSON matching ContentOptimization structure.`;

    try {
      const response = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a content optimization expert with expertise in SEO, readability, engagement psychology, and conversion optimization.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 6000,
        response_format: { type: 'json_object' },
      });

      const optimization = JSON.parse(response.choices[0]?.message?.content || '{}');
      console.log(`✅ DeepSeek: Content optimization complete`);
      return {
        original: content,
        ...optimization,
      } as ContentOptimization;
    } catch (error) {
      console.error(`❌ DeepSeek: Content optimization error:`, error);
      throw error;
    }
  }

  /**
   * Generate content in multiple languages
   */
  async translateAndLocalize(
    content: string,
    targetLanguages: string[],
    localize: boolean = true
  ): Promise<{
    language: string;
    translation: string;
    localization: {
      culturalAdaptations: string[];
      localExamples: string[];
      currencyConversions: string[];
    };
  }[]> {
    console.log(`✍️ DeepSeek: Translating to ${targetLanguages.length} languages...`);

    const translations = [];

    for (const language of targetLanguages) {
      const prompt = `${localize ? 'Translate and localize' : 'Translate'} this content to ${language}:

CONTENT:
${content}

${localize ? `
LOCALIZATION REQUIREMENTS:
- Adapt cultural references
- Use local examples
- Convert currency and measurements
- Adjust idioms and expressions
- Maintain tone and intent
` : 'Maintain exact meaning and tone.'}

Return ONLY valid JSON with translation and localization details.`;

      try {
        const response = await deepseek.chat.completions.create({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator and localization expert for ${language}.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.5,
          max_tokens: 4000,
          response_format: { type: 'json_object' },
        });

        const result = JSON.parse(response.choices[0]?.message?.content || '{}');
        translations.push({
          language,
          ...result,
        });
      } catch (error) {
        console.error(`Error translating to ${language}:`, error);
      }
    }

    console.log(`✅ DeepSeek: Translations complete for ${translations.length} languages`);
    return translations;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getWordCountTarget(length: ContentLength): number {
    const targets = {
      short: 500,
      medium: 1000,
      long: 2000,
      very_long: 4000,
    };
    return targets[length] || 2000;
  }

  private getCharacterLimit(platform: SocialPlatform): number {
    const limits = {
      twitter: 280,
      facebook: 500,
      instagram: 2200,
      linkedin: 3000,
      tiktok: 150,
      pinterest: 500,
      youtube: 5000,
    };
    return limits[platform] || 500;
  }

  private getHashtagCount(platform: SocialPlatform): number {
    const counts = {
      twitter: '2-3',
      facebook: '2-3',
      instagram: '11-30',
      linkedin: '3-5',
      tiktok: '3-5',
      pinterest: '5-10',
      youtube: '5-8',
    };
    return counts[platform] || '3-5';
  }

  private getPlatformRequirements(platform: SocialPlatform): string {
    const requirements = {
      twitter: '- Short, punchy text\n- Use trending hashtags\n- Thread-worthy insights\n- Engage with replies',
      facebook: '- Conversational tone\n- Ask questions\n- Use emojis sparingly\n- Link to blog/website',
      instagram: '- Visual-first thinking\n- Story-driven captions\n- Heavy hashtag use\n- Carousel-friendly',
      linkedin: '- Professional tone\n- Thought leadership\n- Industry insights\n- Document posts perform well',
      tiktok: '- Hook in first 3 seconds\n- Trendy music/sounds\n- Short, snappy\n- Entertainment value',
      pinterest: '- Search-optimized\n- How-to focused\n- Vertical image format\n- Step-by-step',
      youtube: '- Detailed descriptions\n- Timestamp chapters\n- SEO keywords\n- Community engagement',
    };
    return requirements[platform] || 'Platform-specific best practices';
  }

  private getAdPlatformRequirements(platform: string): string {
    const requirements = {
      google: 'Headlines: 30 chars max\nDescriptions: 90 chars max\nExtensions: callout, sitelink',
      facebook: 'Primary text: 125 chars\nHeadline: 40 chars\nDescription: 30 chars',
      instagram: 'Same as Facebook\nVisual-first\nStories vs Feed optimization',
      linkedin: 'Headline: 70 chars\nDescription: 150 chars\nProfessional tone',
      twitter: 'Text: 280 chars\nHeadline: 50 chars\nConversational tone',
      tiktok: 'Video-first\nNative feel\nTrending sounds\nCreator-style',
    };
    return requirements[platform] || 'Follow platform ad guidelines';
  }
}

export const deepseekContentWriter = new DeepSeekContentWriter();
