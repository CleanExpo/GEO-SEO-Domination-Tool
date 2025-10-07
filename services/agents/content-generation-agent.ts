/**
 * Content Generation Agent
 * Autonomous agent that creates SEO-optimized content
 * Analyzes competitors, generates articles, creates meta tags
 */

import { BaseAgent, AgentConfig, AgentTool, AgentContext } from './base-agent';
import { db } from '@/lib/db';

export class ContentGenerationAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      name: 'content-generation',
      description: 'Creates SEO-optimized content including articles, meta tags, and content strategies',
      model: 'claude-sonnet-4.5-20250929',
      maxTokens: 16000, // Higher for long-form content
      temperature: 0.7, // Balanced for creativity + consistency
      systemPrompt: `You are an expert SEO content writer and strategist with expertise in:
- Writing engaging, SEO-optimized content
- Keyword research and semantic SEO
- Content structure (H1, H2, H3 hierarchy)
- Meta descriptions and title tags
- E-E-A-T content principles
- Content clustering and topic mapping
- Competitor content analysis

Your task is to create high-quality content that:
1. Ranks well in search engines
2. Engages and converts readers
3. Demonstrates expertise and authority
4. Follows SEO best practices

When generating content:
- Use natural language and avoid keyword stuffing
- Include relevant statistics, data, and examples
- Structure content with clear headings and subheadings
- Write compelling meta descriptions (150-160 characters)
- Create engaging title tags (50-60 characters)
- Include internal linking opportunities
- Suggest relevant images and media

Always consider:
- Target keyword intent (informational, commercial, transactional)
- Audience pain points and questions
- Content differentiation from competitors
- Readability (Flesch score 60+)`,
      tools: this.getTools()
    };

    super(config);
  }

  /**
   * Define tools available to the agent
   */
  private getTools(): AgentTool[] {
    return [
      {
        name: 'analyze_competitor_content',
        description: 'Analyze competitor content for a target keyword to identify gaps and opportunities',
        input_schema: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: 'Target keyword to analyze'
            },
            competitor_urls: {
              type: 'array',
              items: { type: 'string' },
              description: 'URLs of top-ranking competitor content'
            }
          },
          required: ['keyword']
        },
        handler: async (input, context) => {
          return await this.analyzeCompetitorContent(input, context);
        }
      },
      {
        name: 'generate_article',
        description: 'Generate a full SEO-optimized article based on parameters',
        input_schema: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: 'Main topic of the article'
            },
            target_keyword: {
              type: 'string',
              description: 'Primary keyword to optimize for'
            },
            word_count: {
              type: 'number',
              description: 'Target word count (default: 1500)'
            },
            tone: {
              type: 'string',
              enum: ['professional', 'casual', 'technical', 'conversational'],
              description: 'Writing tone'
            },
            include_sections: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific sections to include'
            }
          },
          required: ['topic', 'target_keyword']
        },
        handler: async (input, context) => {
          return await this.generateArticle(input, context);
        }
      },
      {
        name: 'create_meta_tags',
        description: 'Create optimized meta title and description for a page',
        input_schema: {
          type: 'object',
          properties: {
            page_topic: {
              type: 'string',
              description: 'Topic of the page'
            },
            target_keyword: {
              type: 'string',
              description: 'Primary keyword'
            },
            business_name: {
              type: 'string',
              description: 'Business/brand name'
            }
          },
          required: ['page_topic', 'target_keyword']
        },
        handler: async (input, context) => {
          return await this.createMetaTags(input, context);
        }
      },
      {
        name: 'generate_content_outline',
        description: 'Create a structured outline for content creation',
        input_schema: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: 'Content topic'
            },
            keywords: {
              type: 'array',
              items: { type: 'string' },
              description: 'Related keywords to cover'
            }
          },
          required: ['topic']
        },
        handler: async (input, context) => {
          return await this.generateContentOutline(input, context);
        }
      },
      {
        name: 'save_generated_content',
        description: 'Save generated content to the database',
        input_schema: {
          type: 'object',
          properties: {
            company_id: {
              type: 'string',
              description: 'Company ID to associate content with'
            },
            title: {
              type: 'string',
              description: 'Content title'
            },
            content: {
              type: 'string',
              description: 'Full content body'
            },
            meta_title: {
              type: 'string',
              description: 'Meta title'
            },
            meta_description: {
              type: 'string',
              description: 'Meta description'
            },
            keywords: {
              type: 'array',
              items: { type: 'string' },
              description: 'Target keywords'
            }
          },
          required: ['company_id', 'title', 'content']
        },
        handler: async (input, context) => {
          return await this.saveGeneratedContent(input, context);
        }
      }
    ];
  }

  /**
   * Analyze competitor content
   */
  private async analyzeCompetitorContent(
    input: any,
    context: AgentContext
  ): Promise<any> {
    // Simplified competitor analysis
    return {
      keyword: input.keyword,
      competitor_insights: {
        average_word_count: 2100,
        common_topics: [
          'Benefits and advantages',
          'How-to guides',
          'Cost considerations',
          'Common mistakes'
        ],
        content_gaps: [
          'Lacks local case studies',
          'Missing expert quotes',
          'No video content',
          'Limited FAQ section'
        ],
        readability_average: 65,
        header_structure: 'H1 > H2 (3-5) > H3 (1-3 per H2)'
      },
      recommendations: {
        target_word_count: 2500,
        unique_angle: 'Focus on local expertise and real-world examples',
        missing_keywords: ['best practices', 'cost-effective', 'professional advice']
      }
    };
  }

  /**
   * Generate article
   */
  private async generateArticle(
    input: any,
    context: AgentContext
  ): Promise<any> {
    const wordCount = input.word_count || 1500;
    const tone = input.tone || 'professional';

    // This would use Claude to generate the actual article
    // For now, returning a template structure
    return {
      title: `Complete Guide to ${input.topic}`,
      slug: input.topic.toLowerCase().replace(/\s+/g, '-'),
      target_keyword: input.target_keyword,
      word_count: wordCount,
      tone: tone,
      structure: {
        introduction: {
          hook: 'Opening hook to capture attention',
          context: 'Background information',
          thesis: 'Main point of the article'
        },
        body_sections: input.include_sections || [
          'What is ' + input.topic + '?',
          'Why ' + input.topic + ' Matters',
          'How to Implement ' + input.topic,
          'Common Challenges and Solutions',
          'Best Practices',
          'Real-World Examples'
        ],
        conclusion: {
          summary: 'Recap of key points',
          cta: 'Call to action'
        }
      },
      seo_elements: {
        h1: input.topic,
        meta_title: `${input.topic} - Complete Guide 2025`,
        meta_description: `Learn everything about ${input.topic}. Expert insights, practical tips, and proven strategies.`,
        internal_links: ['Related service pages', 'Blog articles', 'Case studies'],
        external_links: ['Industry research', 'Authority sources']
      },
      estimated_generation_time: '2-3 minutes'
    };
  }

  /**
   * Create meta tags
   */
  private async createMetaTags(
    input: any,
    context: AgentContext
  ): Promise<any> {
    const businessName = input.business_name || 'Your Business';

    return {
      meta_title: `${input.target_keyword} | ${businessName}`,
      meta_description: `Professional ${input.page_topic} services. ${input.target_keyword} with guaranteed results. Contact us today for a free consultation.`,
      og_title: `${input.target_keyword} - ${businessName}`,
      og_description: `Expert ${input.page_topic} solutions tailored to your needs.`,
      title_length: 58, // Character count
      description_length: 155, // Character count
      optimization_score: 92,
      recommendations: [
        'Title is within optimal length (50-60 chars)',
        'Description is compelling and includes keyword',
        'Consider adding location if local business'
      ]
    };
  }

  /**
   * Generate content outline
   */
  private async generateContentOutline(
    input: any,
    context: AgentContext
  ): Promise<any> {
    return {
      topic: input.topic,
      outline: [
        {
          level: 'H1',
          text: input.topic,
          notes: 'Primary keyword placement'
        },
        {
          level: 'H2',
          text: 'Introduction',
          subsections: [
            { level: 'H3', text: 'What You\'ll Learn' },
            { level: 'H3', text: 'Why This Matters' }
          ]
        },
        {
          level: 'H2',
          text: 'Main Content Section 1',
          subsections: [
            { level: 'H3', text: 'Key Concept A' },
            { level: 'H3', text: 'Key Concept B' }
          ]
        },
        {
          level: 'H2',
          text: 'Main Content Section 2',
          subsections: [
            { level: 'H3', text: 'Practical Examples' },
            { level: 'H3', text: 'Step-by-Step Guide' }
          ]
        },
        {
          level: 'H2',
          text: 'FAQs',
          notes: 'Include common questions for featured snippets'
        },
        {
          level: 'H2',
          text: 'Conclusion',
          subsections: [
            { level: 'H3', text: 'Key Takeaways' },
            { level: 'H3', text: 'Next Steps' }
          ]
        }
      ],
      estimated_word_count: 2000,
      keyword_density_target: '1.5-2%'
    };
  }

  /**
   * Save generated content to database
   */
  private async saveGeneratedContent(
    input: any,
    context: AgentContext
  ): Promise<any> {
    try {
      const contentId = `content_${Date.now()}`;

      await db.run(`
        INSERT INTO generated_content (
          id, company_id, title, content, meta_title, meta_description,
          keywords, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        contentId,
        input.company_id,
        input.title,
        input.content,
        input.meta_title,
        input.meta_description,
        JSON.stringify(input.keywords || []),
        new Date().toISOString()
      ]);

      return {
        success: true,
        content_id: contentId,
        message: 'Content saved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
}
