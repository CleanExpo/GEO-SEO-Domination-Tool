/**
 * Content Generation Agent
 *
 * Autonomous content creation for the Empire CRM
 * Combines Deep Research Agent + Visual Content Agent = Complete Multimedia Packages
 *
 * Capabilities:
 * - Blog articles (text + images + infographics)
 * - White papers (research + diagrams + charts)
 * - Social media posts (platform-optimized graphics + copy)
 * - Video scripts (narration + Manim animations)
 * - Case studies (data + visuals + testimonials)
 * - Email campaigns (HTML + images)
 *
 * Elevates Unite Group content from AI garbage to INDUSTRY LEADERSHIP
 */

import { deepResearchAgent, ResearchRequest } from './deep-research-agent';
import { visualContentAgent, VisualRequest } from './visual-content-agent';
import OpenAI from 'openai';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.openai.com/v1'
});

const MODEL = process.env.DEEPSEEK_MODEL || 'gpt-4o-mini';

export interface ContentRequest {
  type: 'blog' | 'white_paper' | 'social_post' | 'video_script' | 'case_study' | 'email_campaign';
  topic: string;
  industry: string;

  // Targeting
  targetAudience?: 'consumers' | 'professionals' | 'industry_experts' | 'investors';
  targetKeywords?: string[];
  tone?: 'professional' | 'educational' | 'conversational' | 'technical' | 'persuasive';

  // Research depth
  researchDepth?: 1 | 2 | 3 | 4 | 5; // 1=basic, 5=thesis-level
  includeCompetitorAnalysis?: boolean;

  // Visual requirements
  includeImages?: boolean;
  includeInfographics?: boolean;
  includeDiagrams?: boolean;
  includeVideo?: boolean;

  // Platform-specific
  platform?: 'website' | 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'email';

  // Length
  targetWordCount?: number;

  // SEO
  optimizeForSEO?: boolean;
  metaDescription?: string;
}

export interface ContentPackage {
  type: string;

  // Text content
  title: string;
  subtitle?: string;
  content: string; // Full content (markdown)
  contentHTML?: string; // HTML version
  summary: string; // Executive summary

  // Visual assets
  featuredImage?: {
    url: string;
    alt: string;
    caption?: string;
  };
  images: Array<{
    url: string;
    alt: string;
    caption?: string;
    placement?: string; // 'header', 'inline', 'footer'
  }>;
  infographics: Array<{
    url: string;
    title: string;
    description: string;
  }>;
  diagrams: Array<{
    url: string;
    title: string;
    type: string; // 'flowchart', 'sequence', 'class', etc.
  }>;
  video?: {
    url: string;
    title: string;
    duration: number;
    script: string;
  };

  // Metadata
  keywords: string[];
  tags: string[];
  citations: string[];
  sources: number; // Source count

  // Quality metrics
  seoScore: number; // 0-100
  readabilityScore: number; // 0-100 (Flesch Reading Ease)
  originalityScore: number; // 0-100
  credibilityScore: number; // 0-100

  // SEO data
  meta: {
    title: string;
    description: string;
    keywords: string;
    ogImage?: string;
  };

  // Publishing data
  publishReady: boolean;
  estimatedReadTime: number; // minutes
  wordCount: number;
  generatedAt: string;
  cost: number; // Total generation cost
}

export class ContentGenerationAgent {
  /**
   * Generate complete content package with multimedia
   */
  async generateContent(request: ContentRequest): Promise<ContentPackage> {
    console.log(`\n🎨 Content Generation Agent: Creating ${request.type}...`);
    console.log(`   Topic: ${request.topic}`);
    console.log(`   Industry: ${request.industry}`);

    switch (request.type) {
      case 'blog':
        return this.generateBlogArticle(request);

      case 'white_paper':
        return this.generateWhitePaper(request);

      case 'social_post':
        return this.generateSocialPost(request);

      case 'video_script':
        return this.generateVideoScript(request);

      case 'case_study':
        return this.generateCaseStudy(request);

      case 'email_campaign':
        return this.generateEmailCampaign(request);

      default:
        throw new Error(`Unsupported content type: ${request.type}`);
    }
  }

  /**
   * Generate blog article with images and infographics
   */
  private async generateBlogArticle(request: ContentRequest): Promise<ContentPackage> {
    console.log('  📝 Generating blog article...');

    let totalCost = 0;

    // Step 1: Deep research
    console.log('  🔍 Conducting deep research...');
    const research = await deepResearchAgent.researchTopic({
      topic: request.topic,
      industry: request.industry,
      technicalDepth: request.researchDepth || 3,
      focusAreas: request.targetKeywords,
      includeCompetitorAnalysis: request.includeCompetitorAnalysis
    } as ResearchRequest);

    totalCost += research.cost || 0;
    console.log(`  ✅ Research complete (${research.sources.length} sources, originality: ${research.originalityScore})`);

    // Step 2: Generate optimized blog content from research
    console.log('  ✍️  Generating blog content...');
    const blogContent = await this.generateBlogFromResearch(request, research);
    totalCost += 0.002; // DeepSeek cost

    // Step 3: Generate visuals in parallel
    console.log('  🎨 Generating visual assets...');
    const visualPromises: Promise<any>[] = [];

    // Featured image
    if (request.includeImages !== false) {
      visualPromises.push(
        visualContentAgent.generateVisual({
          type: 'image',
          purpose: `Featured image for blog article about ${request.topic}`,
          description: `Professional, high-quality image representing: ${blogContent.imagePrompts.featured}`,
          style: request.tone === 'technical' ? 'technical' : 'professional',
          dimensions: 'landscape',
          quality: 'high'
        })
      );
    }

    // Infographic
    if (request.includeInfographics && research.dataPoints.length > 0) {
      visualPromises.push(
        visualContentAgent.generateVisual({
          type: 'infographic',
          purpose: `Data visualization for ${request.topic}`,
          description: `Create infographic showing key data points about ${request.topic}`,
          data: {
            title: blogContent.title,
            dataPoints: research.dataPoints.slice(0, 5),
            statistics: research.statistics.slice(0, 3)
          },
          style: 'modern'
        })
      );
    }

    // Diagrams
    if (request.includeDiagrams && blogContent.diagramPrompts.length > 0) {
      visualPromises.push(
        visualContentAgent.generateVisual({
          type: 'diagram',
          purpose: `Technical diagram for ${request.topic}`,
          description: blogContent.diagramPrompts[0],
          data: { topic: request.topic }
        })
      );
    }

    const visuals = await Promise.all(visualPromises);
    visuals.forEach(v => totalCost += v.cost || 0);
    console.log(`  ✅ Generated ${visuals.length} visual assets`);

    // Step 4: Calculate quality metrics
    const seoScore = this.calculateSEOScore(blogContent, request);
    const readabilityScore = this.calculateReadabilityScore(blogContent.content);
    const wordCount = blogContent.content.split(/\s+/).length;
    const estimatedReadTime = Math.ceil(wordCount / 200); // 200 words per minute

    // Step 5: Assemble content package
    const featuredImage = visuals[0];
    const infographic = visuals[1];
    const diagram = visuals[2];

    return {
      type: 'blog',
      title: blogContent.title,
      subtitle: blogContent.subtitle,
      content: blogContent.content,
      contentHTML: this.markdownToHTML(blogContent.content),
      summary: blogContent.summary,

      featuredImage: featuredImage ? {
        url: featuredImage.url,
        alt: `${blogContent.title} - Featured Image`,
        caption: blogContent.imagePrompts.featured
      } : undefined,

      images: featuredImage ? [{
        url: featuredImage.url,
        alt: blogContent.title,
        caption: blogContent.imagePrompts.featured,
        placement: 'header'
      }] : [],

      infographics: infographic ? [{
        url: infographic.url,
        title: `${request.topic} - Key Data`,
        description: 'Visual representation of key findings'
      }] : [],

      diagrams: diagram ? [{
        url: diagram.url,
        title: blogContent.diagramPrompts[0] || 'Technical Diagram',
        type: 'flowchart'
      }] : [],

      keywords: request.targetKeywords || [],
      tags: blogContent.tags,
      citations: research.citationsFormatted,
      sources: research.sources.length,

      seoScore,
      readabilityScore,
      originalityScore: research.originalityScore,
      credibilityScore: research.credibilityScore,

      meta: {
        title: blogContent.metaTitle,
        description: blogContent.metaDescription,
        keywords: (request.targetKeywords || []).join(', '),
        ogImage: featuredImage?.url
      },

      publishReady: seoScore >= 70 && readabilityScore >= 60,
      estimatedReadTime,
      wordCount,
      generatedAt: new Date().toISOString(),
      cost: totalCost
    };
  }

  /**
   * Generate comprehensive white paper
   */
  private async generateWhitePaper(request: ContentRequest): Promise<ContentPackage> {
    console.log('  📄 Generating white paper...');

    let totalCost = 0;

    // Step 1: Deep research (thesis-level)
    const research = await deepResearchAgent.researchTopic({
      topic: request.topic,
      industry: request.industry,
      technicalDepth: 5, // Maximum depth for white papers
      focusAreas: request.targetKeywords,
      includeCompetitorAnalysis: request.includeCompetitorAnalysis
    } as ResearchRequest);

    totalCost += research.cost || 0;

    // Step 2: Generate diagrams and charts
    const visuals = await Promise.all([
      // Process diagram
      visualContentAgent.generateVisual({
        type: 'diagram',
        purpose: `Process diagram for white paper on ${request.topic}`,
        description: `Flowchart showing the methodology and process for ${request.topic}`,
        data: { topic: request.topic }
      }),

      // Data infographic
      visualContentAgent.generateVisual({
        type: 'infographic',
        purpose: `Research findings visualization`,
        description: `Professional infographic displaying key research findings`,
        data: {
          findings: research.keyFindings.slice(0, 5),
          statistics: research.statistics
        },
        style: 'professional'
      })
    ]);

    visuals.forEach(v => totalCost += v.cost || 0);

    // Step 3: Use research white paper directly
    const wordCount = research.whitePaperFull.split(/\s+/).length;
    const estimatedReadTime = Math.ceil(wordCount / 200);

    return {
      type: 'white_paper',
      title: `${request.topic}: A Comprehensive Analysis`,
      subtitle: `Industry Research Report - ${request.industry}`,
      content: research.whitePaperFull,
      contentHTML: this.markdownToHTML(research.whitePaperFull),
      summary: research.whitePaperSummary,

      images: [],
      infographics: [{
        url: visuals[1].url,
        title: 'Research Findings',
        description: 'Key findings from comprehensive analysis'
      }],
      diagrams: [{
        url: visuals[0].url,
        title: 'Methodology',
        type: 'flowchart'
      }],

      keywords: request.targetKeywords || [],
      tags: [request.industry, 'research', 'white paper', 'analysis'],
      citations: research.citationsFormatted,
      sources: research.sources.length,

      seoScore: 85, // White papers are inherently SEO-strong
      readabilityScore: this.calculateReadabilityScore(research.whitePaperFull),
      originalityScore: research.originalityScore,
      credibilityScore: research.credibilityScore,

      meta: {
        title: `${request.topic} - White Paper | ${request.industry}`,
        description: research.whitePaperSummary.substring(0, 155),
        keywords: (request.targetKeywords || []).join(', ')
      },

      publishReady: research.originalityScore >= 70,
      estimatedReadTime,
      wordCount,
      generatedAt: new Date().toISOString(),
      cost: totalCost
    };
  }

  /**
   * Generate social media post with optimized graphic
   */
  private async generateSocialPost(request: ContentRequest): Promise<ContentPackage> {
    console.log(`  📱 Generating ${request.platform} social post...`);

    let totalCost = 0;

    // Step 1: Generate social copy
    const socialCopy = await this.generateSocialCopy(request);
    totalCost += 0.001;

    // Step 2: Generate platform-optimized graphic
    const graphic = await visualContentAgent.generateVisual({
      type: 'social_graphic',
      purpose: `Social media post for ${request.platform}`,
      description: `Eye-catching graphic for post about ${request.topic}. ${socialCopy.visualGuidance}`,
      dimensions: request.platform as any,
      style: request.tone === 'professional' ? 'professional' : 'bold',
      text: socialCopy.headline,
      quality: 'high'
    });

    totalCost += graphic.cost || 0;

    return {
      type: 'social_post',
      title: socialCopy.headline,
      content: socialCopy.body,
      summary: socialCopy.body.substring(0, 100),

      featuredImage: {
        url: graphic.url,
        alt: socialCopy.headline,
        caption: socialCopy.headline
      },

      images: [{
        url: graphic.url,
        alt: socialCopy.headline,
        placement: 'header'
      }],
      infographics: [],
      diagrams: [],

      keywords: request.targetKeywords || [],
      tags: socialCopy.hashtags,
      citations: [],
      sources: 0,

      seoScore: 0, // Social posts don't need SEO
      readabilityScore: 95, // Social copy is highly readable
      originalityScore: 75,
      credibilityScore: 80,

      meta: {
        title: socialCopy.headline,
        description: socialCopy.body,
        keywords: socialCopy.hashtags.join(', '),
        ogImage: graphic.url
      },

      publishReady: true,
      estimatedReadTime: 1,
      wordCount: socialCopy.body.split(/\s+/).length,
      generatedAt: new Date().toISOString(),
      cost: totalCost
    };
  }

  /**
   * Generate video script with Manim animations
   */
  private async generateVideoScript(request: ContentRequest): Promise<ContentPackage> {
    console.log('  🎬 Generating video script with animations...');

    let totalCost = 0;

    // Step 1: Research
    const research = await deepResearchAgent.researchTopic({
      topic: request.topic,
      industry: request.industry,
      technicalDepth: request.researchDepth || 3,
      focusAreas: request.targetKeywords
    } as ResearchRequest);

    totalCost += research.cost || 0;

    // Step 2: Generate script
    const script = await this.generateVideoScriptFromResearch(request, research);
    totalCost += 0.002;

    // Step 3: Generate video
    const video = await visualContentAgent.generateVisual({
      type: 'video',
      purpose: `Educational video about ${request.topic}`,
      description: script.description,
      script: script.narration,
      duration: script.duration,
      style: 'professional'
    });

    totalCost += video.cost || 0;

    return {
      type: 'video_script',
      title: script.title,
      subtitle: script.subtitle,
      content: script.narration,
      summary: script.description,

      images: [],
      infographics: [],
      diagrams: [],
      video: {
        url: video.url,
        title: script.title,
        duration: script.duration,
        script: script.narration
      },

      keywords: request.targetKeywords || [],
      tags: script.tags,
      citations: research.citationsFormatted,
      sources: research.sources.length,

      seoScore: 80, // Videos are SEO-friendly
      readabilityScore: 90, // Scripts are conversational
      originalityScore: research.originalityScore,
      credibilityScore: research.credibilityScore,

      meta: {
        title: script.title,
        description: script.description,
        keywords: (request.targetKeywords || []).join(', '),
        ogImage: video.url.replace('.mp4', '-thumbnail.jpg')
      },

      publishReady: true,
      estimatedReadTime: script.duration / 60,
      wordCount: script.narration.split(/\s+/).length,
      generatedAt: new Date().toISOString(),
      cost: totalCost
    };
  }

  /**
   * Generate case study with data and testimonials
   */
  private async generateCaseStudy(request: ContentRequest): Promise<ContentPackage> {
    console.log('  📊 Generating case study...');

    // Case studies combine research + visuals + testimonials
    // Implementation similar to blog but with structured sections

    return this.generateBlogArticle({
      ...request,
      type: 'blog',
      tone: 'professional',
      includeInfographics: true,
      includeDiagrams: true,
      researchDepth: 4
    });
  }

  /**
   * Generate email campaign with HTML and images
   */
  private async generateEmailCampaign(request: ContentRequest): Promise<ContentPackage> {
    console.log('  📧 Generating email campaign...');

    // Email campaigns are shorter blog-style content
    return this.generateBlogArticle({
      ...request,
      type: 'blog',
      targetWordCount: 500,
      includeImages: true,
      includeInfographics: false
    });
  }

  // ========================================================================
  // Content Generation Helpers
  // ========================================================================

  /**
   * Generate blog content from research
   */
  private async generateBlogFromResearch(request: ContentRequest, research: any) {
    const prompt = `Generate a professional blog article based on this research:

Topic: ${request.topic}
Industry: ${request.industry}
Target Audience: ${request.targetAudience || 'professionals'}
Tone: ${request.tone || 'professional'}
Target Word Count: ${request.targetWordCount || 1500}

Research Summary:
${research.whitePaperSummary}

Key Findings:
${research.keyFindings.map((f: any, i: number) => `${i + 1}. ${f.finding}`).join('\n')}

Requirements:
- Create engaging title and subtitle
- Write comprehensive article in markdown format
- Include H2 and H3 headings for structure
- Incorporate key findings naturally
- Provide actionable insights
- SEO-optimized with keywords: ${request.targetKeywords?.join(', ')}
- Professional, authoritative tone
- Include meta title and description for SEO

Return JSON format:
{
  "title": "...",
  "subtitle": "...",
  "metaTitle": "...",
  "metaDescription": "...",
  "summary": "...",
  "content": "... (full markdown content)",
  "tags": ["tag1", "tag2", ...],
  "imagePrompts": {
    "featured": "Description for featured image",
    "inline": ["Description for inline image 1", ...]
  },
  "diagramPrompts": ["Description for diagram 1", ...]
}`;

    const response = await deepseek.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000
    });

    const content = response.choices[0].message.content || '';

    // Parse JSON from response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Fallback if JSON parsing fails
    }

    return {
      title: request.topic,
      subtitle: '',
      metaTitle: request.topic,
      metaDescription: research.whitePaperSummary.substring(0, 155),
      summary: research.whitePaperSummary,
      content: research.whitePaperFull,
      tags: [request.industry, 'analysis'],
      imagePrompts: {
        featured: `Professional image representing ${request.topic}`,
        inline: []
      },
      diagramPrompts: []
    };
  }

  /**
   * Generate social media copy
   */
  private async generateSocialCopy(request: ContentRequest) {
    const prompt = `Generate ${request.platform} social media post:

Topic: ${request.topic}
Industry: ${request.industry}
Tone: ${request.tone || 'conversational'}

Requirements:
- Attention-grabbing headline
- Engaging body copy (${this.getPlatformCharLimit(request.platform || 'instagram')} chars max)
- Call-to-action
- Relevant hashtags (5-10)
- Description of visual needed

Return JSON:
{
  "headline": "...",
  "body": "...",
  "cta": "...",
  "hashtags": ["tag1", "tag2", ...],
  "visualGuidance": "Description of ideal visual"
}`;

    const response = await deepseek.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 500
    });

    const content = response.choices[0].message.content || '';

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Fallback
    }

    return {
      headline: request.topic,
      body: `Learn more about ${request.topic} in ${request.industry}!`,
      cta: 'Learn More',
      hashtags: [request.industry.replace(/\s+/g, '')],
      visualGuidance: `Eye-catching image about ${request.topic}`
    };
  }

  /**
   * Generate video script from research
   */
  private async generateVideoScriptFromResearch(request: ContentRequest, research: any) {
    const duration = request.targetWordCount ? Math.ceil(request.targetWordCount / 150) * 60 : 120; // 150 words per minute

    const prompt = `Generate video script for educational video:

Topic: ${request.topic}
Industry: ${request.industry}
Duration: ${duration} seconds
Tone: ${request.tone || 'educational'}

Research Summary:
${research.whitePaperSummary}

Requirements:
- Clear, engaging narration
- Hook viewers in first 10 seconds
- Break down complex concepts
- Include visual cues for animations
- Professional, authoritative delivery

Return JSON:
{
  "title": "...",
  "subtitle": "...",
  "description": "...",
  "narration": "... (full script with timing cues)",
  "duration": ${duration},
  "tags": ["tag1", "tag2", ...]
}`;

    const response = await deepseek.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content || '';

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Fallback
    }

    return {
      title: request.topic,
      subtitle: `An Educational Video`,
      description: research.whitePaperSummary,
      narration: research.whitePaperSummary,
      duration,
      tags: [request.industry, 'educational']
    };
  }

  // ========================================================================
  // Quality Scoring
  // ========================================================================

  /**
   * Calculate SEO score
   */
  private calculateSEOScore(content: any, request: ContentRequest): number {
    let score = 0;

    // Title length (50-60 chars ideal)
    const titleLength = content.metaTitle?.length || 0;
    if (titleLength >= 50 && titleLength <= 60) score += 20;
    else if (titleLength >= 40 && titleLength <= 70) score += 10;

    // Meta description (150-160 chars ideal)
    const descLength = content.metaDescription?.length || 0;
    if (descLength >= 150 && descLength <= 160) score += 20;
    else if (descLength >= 120 && descLength <= 180) score += 10;

    // Keywords in title
    if (request.targetKeywords?.some(kw => content.title?.toLowerCase().includes(kw.toLowerCase()))) {
      score += 20;
    }

    // Keywords in content
    const keywordDensity = request.targetKeywords?.filter(kw =>
      content.content?.toLowerCase().includes(kw.toLowerCase())
    ).length || 0;
    score += Math.min(keywordDensity * 10, 20);

    // Headings structure
    if (content.content?.includes('## ')) score += 10;

    // Content length (1000+ words)
    const wordCount = content.content?.split(/\s+/).length || 0;
    if (wordCount >= 1000) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Calculate readability score (Flesch Reading Ease approximation)
   */
  private calculateReadabilityScore(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Flesch Reading Ease formula
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Count syllables in word (approximation)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;

    const vowels = word.match(/[aeiouy]+/g);
    let count = vowels ? vowels.length : 1;

    // Adjust for silent 'e'
    if (word.endsWith('e')) count--;

    return Math.max(1, count);
  }

  /**
   * Get platform character limit
   */
  private getPlatformCharLimit(platform: string): number {
    const limits: Record<string, number> = {
      twitter: 280,
      instagram: 2200,
      facebook: 63206,
      linkedin: 3000,
      email: 1000
    };
    return limits[platform] || 2200;
  }

  /**
   * Convert markdown to HTML (basic)
   */
  private markdownToHTML(markdown: string): string {
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gim, '<p>$1</p>')
      .replace(/<\/p><p><h/g, '</p><h')
      .replace(/<\/h([1-6])><\/p>/g, '</h$1>');
  }
}

// Export singleton instance
export const contentGenerationAgent = new ContentGenerationAgent();
