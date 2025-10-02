/**
 * API Service Manager
 * Centralized management for all external API integrations
 */

import { LighthouseService } from '@/services/api/lighthouse';
import { FirecrawlService } from '@/services/api/firecrawl';
import Anthropic from '@anthropic-ai/sdk';

export interface APIServiceConfig {
  googleApiKey?: string;
  firecrawlApiKey?: string;
  anthropicApiKey?: string;
  semrushApiKey?: string;
  perplexityApiKey?: string;
}

export class APIServiceManager {
  private static instance: APIServiceManager;
  private config: APIServiceConfig;

  // Service instances
  public lighthouse?: LighthouseService;
  public firecrawl?: FirecrawlService;
  public anthropic?: Anthropic;

  private constructor(config: APIServiceConfig) {
    this.config = config;
    this.initializeServices();
  }

  public static getInstance(config?: APIServiceConfig): APIServiceManager {
    if (!APIServiceManager.instance) {
      const defaultConfig: APIServiceConfig = {
        googleApiKey: process.env.GOOGLE_API_KEY,
        firecrawlApiKey: process.env.FIRECRAWL_API_KEY,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        semrushApiKey: process.env.SEMRUSH_API_KEY,
        perplexityApiKey: process.env.PERPLEXITY_API_KEY,
      };
      APIServiceManager.instance = new APIServiceManager(config || defaultConfig);
    }
    return APIServiceManager.instance;
  }

  private initializeServices(): void {
    // Initialize Lighthouse (Google PageSpeed Insights)
    if (this.config.googleApiKey) {
      try {
        this.lighthouse = new LighthouseService(this.config.googleApiKey);
        console.log('✓ Lighthouse service initialized');
      } catch (error) {
        console.warn('⚠ Failed to initialize Lighthouse service:', error);
      }
    } else {
      console.warn('⚠ GOOGLE_API_KEY not set - Lighthouse features disabled');
    }

    // Initialize Firecrawl
    if (this.config.firecrawlApiKey) {
      try {
        this.firecrawl = new FirecrawlService({ apiKey: this.config.firecrawlApiKey });
        console.log('✓ Firecrawl service initialized');
      } catch (error) {
        console.warn('⚠ Failed to initialize Firecrawl service:', error);
      }
    } else {
      console.warn('⚠ FIRECRAWL_API_KEY not set - Advanced scraping disabled');
    }

    // Initialize Anthropic Claude
    if (this.config.anthropicApiKey) {
      try {
        this.anthropic = new Anthropic({
          apiKey: this.config.anthropicApiKey,
        });
        console.log('✓ Anthropic Claude service initialized');
      } catch (error) {
        console.warn('⚠ Failed to initialize Anthropic service:', error);
      }
    } else {
      console.warn('⚠ ANTHROPIC_API_KEY not set - AI analysis features disabled');
    }
  }

  // Service availability checks
  public isLighthouseAvailable(): boolean {
    return !!this.lighthouse;
  }

  public isFirecrawlAvailable(): boolean {
    return !!this.firecrawl;
  }

  public isAnthropicAvailable(): boolean {
    return !!this.anthropic;
  }

  public isSEMrushAvailable(): boolean {
    return !!this.config.semrushApiKey;
  }

  public isPerplexityAvailable(): boolean {
    return !!this.config.perplexityApiKey;
  }

  // Get service status
  public getServiceStatus() {
    return {
      lighthouse: {
        available: this.isLighthouseAvailable(),
        description: 'Google PageSpeed Insights for performance audits',
      },
      firecrawl: {
        available: this.isFirecrawlAvailable(),
        description: 'Advanced web scraping and content extraction',
      },
      anthropic: {
        available: this.isAnthropicAvailable(),
        description: 'AI-powered content analysis and recommendations',
      },
      semrush: {
        available: this.isSEMrushAvailable(),
        description: 'Competitor analysis and keyword research',
      },
      perplexity: {
        available: this.isPerplexityAvailable(),
        description: 'AI-powered search and citations',
      },
    };
  }

  // Anthropic Claude helpers
  public async analyzeContentWithClaude(
    content: string,
    prompt: string,
    maxTokens: number = 1024
  ): Promise<string> {
    if (!this.anthropic) {
      throw new Error('Anthropic service not available. Set ANTHROPIC_API_KEY.');
    }

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\nContent to analyze:\n${content}`,
          },
        ],
      });

      return message.content[0].type === 'text' ? message.content[0].text : '';
    } catch (error) {
      console.error('Claude analysis error:', error);
      throw new Error(`Failed to analyze content: ${error}`);
    }
  }

  public async generateSEORecommendations(auditData: any): Promise<string[]> {
    if (!this.anthropic) {
      // Fallback to rule-based recommendations
      return this.generateBasicRecommendations(auditData);
    }

    try {
      const prompt = `Based on this SEO audit data, provide 5-7 specific, actionable recommendations to improve search engine rankings:

${JSON.stringify(auditData, null, 2)}

Format your response as a JSON array of strings, where each string is a specific recommendation.`;

      const response = await this.analyzeContentWithClaude(
        '',
        prompt,
        2048
      );

      // Parse JSON response
      try {
        return JSON.parse(response);
      } catch {
        // If not valid JSON, split by newlines
        return response.split('\n').filter(line => line.trim().length > 0);
      }
    } catch (error) {
      console.error('Failed to generate AI recommendations:', error);
      return this.generateBasicRecommendations(auditData);
    }
  }

  private generateBasicRecommendations(auditData: any): string[] {
    const recommendations: string[] = [];

    if (auditData.performance_score < 80) {
      recommendations.push('Optimize images and enable lazy loading to improve page speed');
    }

    if (auditData.seo_score < 90) {
      recommendations.push('Review and optimize meta titles and descriptions');
    }

    if (auditData.accessibility_score < 90) {
      recommendations.push('Add alt text to all images and ensure proper heading hierarchy');
    }

    if (!auditData.https_enabled) {
      recommendations.push('Enable HTTPS for better security and SEO');
    }

    if (!auditData.mobile_friendly) {
      recommendations.push('Implement responsive design for mobile compatibility');
    }

    return recommendations;
  }

  // SEMrush integration (placeholder for future implementation)
  public async getSEMrushKeywordData(keyword: string) {
    if (!this.config.semrushApiKey) {
      throw new Error('SEMrush API key not configured');
    }

    // TODO: Implement SEMrush API integration
    return {
      keyword,
      volume: 0,
      difficulty: 0,
      cpc: 0,
      trends: [],
    };
  }

  // Perplexity integration (placeholder for future implementation)
  public async searchWithPerplexity(query: string) {
    if (!this.config.perplexityApiKey) {
      throw new Error('Perplexity API key not configured');
    }

    // TODO: Implement Perplexity API integration
    return {
      query,
      results: [],
      citations: [],
    };
  }
}

// Export singleton instance
export const apiServices = APIServiceManager.getInstance();
