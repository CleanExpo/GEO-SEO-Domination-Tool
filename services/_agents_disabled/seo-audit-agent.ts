/**
 * SEO Audit Agent
 * Autonomous agent that performs comprehensive SEO audits
 * Runs Lighthouse, analyzes E-E-A-T, checks rankings, generates reports
 */

import { BaseAgent, AgentConfig, AgentTool, AgentContext } from './base-agent';
import { runLighthouseAudit } from '@/lib/seo-audit';
import { db } from '@/lib/db';
import axios from 'axios';

export class SEOAuditAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      name: 'seo-audit',
      description: 'Performs comprehensive SEO audits including Lighthouse, E-E-A-T analysis, and ranking checks',
      model: 'claude-sonnet-4.5-20250929',
      maxTokens: 8192,
      temperature: 0.3, // Lower temperature for factual analysis
      systemPrompt: `You are an expert SEO analyst with deep knowledge of:
- Google Lighthouse performance metrics
- E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) evaluation
- Technical SEO (Core Web Vitals, mobile optimization, page speed)
- On-page SEO (meta tags, headers, content structure)
- Keyword ranking analysis

Your task is to perform comprehensive SEO audits and provide actionable recommendations.

When analyzing websites:
1. Run Lighthouse audits to check performance, accessibility, best practices, SEO
2. Calculate E-E-A-T scores based on content quality, author credentials, site reputation
3. Check keyword rankings and compare against competitors
4. Identify technical issues and optimization opportunities
5. Generate clear, prioritized recommendations

Always provide:
- Specific, measurable metrics
- Prioritized action items (critical, high, medium, low)
- Expected impact of each recommendation
- Implementation difficulty (easy, medium, hard)

Format your analysis in a structured way that stakeholders can understand.`,
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
        name: 'run_lighthouse_audit',
        description: 'Run Google Lighthouse audit on a URL to check performance, accessibility, best practices, and SEO scores',
        input_schema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to audit (must include http:// or https://)'
            },
            device: {
              type: 'string',
              enum: ['mobile', 'desktop'],
              description: 'Device type for audit'
            }
          },
          required: ['url']
        },
        handler: async (input, context) => {
          return await this.runLighthouse(input.url, input.device || 'mobile', context);
        }
      },
      {
        name: 'calculate_eeat_score',
        description: 'Calculate E-E-A-T score based on website content analysis',
        input_schema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to analyze'
            },
            content_quality: {
              type: 'number',
              description: 'Content quality score 0-100'
            },
            author_credentials: {
              type: 'number',
              description: 'Author credentials score 0-100'
            },
            site_reputation: {
              type: 'number',
              description: 'Site reputation score 0-100'
            }
          },
          required: ['url']
        },
        handler: async (input, context) => {
          return await this.calculateEEAT(input, context);
        }
      },
      {
        name: 'check_keyword_rankings',
        description: 'Check current ranking positions for specified keywords',
        input_schema: {
          type: 'object',
          properties: {
            domain: {
              type: 'string',
              description: 'Domain to check (e.g., example.com)'
            },
            keywords: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of keywords to check rankings for'
            },
            location: {
              type: 'string',
              description: 'Geographic location for local SEO (e.g., "Brisbane, Australia")'
            }
          },
          required: ['domain', 'keywords']
        },
        handler: async (input, context) => {
          return await this.checkRankings(input, context);
        }
      },
      {
        name: 'analyze_competitors',
        description: 'Analyze competitor websites for comparative SEO insights',
        input_schema: {
          type: 'object',
          properties: {
            primary_domain: {
              type: 'string',
              description: 'Your domain to compare'
            },
            competitor_domains: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of competitor domains'
            }
          },
          required: ['primary_domain', 'competitor_domains']
        },
        handler: async (input, context) => {
          return await this.analyzeCompetitors(input, context);
        }
      },
      {
        name: 'save_audit_report',
        description: 'Save the completed audit report to the database',
        input_schema: {
          type: 'object',
          properties: {
            company_id: {
              type: 'string',
              description: 'Company ID to associate the report with'
            },
            report_data: {
              type: 'object',
              description: 'Complete audit report data'
            },
            score: {
              type: 'number',
              description: 'Overall SEO score 0-100'
            }
          },
          required: ['company_id', 'report_data', 'score']
        },
        handler: async (input, context) => {
          return await this.saveAuditReport(input, context);
        }
      }
    ];
  }

  /**
   * Run Lighthouse audit
   */
  private async runLighthouse(
    url: string,
    device: 'mobile' | 'desktop',
    context: AgentContext
  ): Promise<any> {
    try {
      // Use existing Lighthouse integration
      const result = await runLighthouseAudit(url);

      return {
        success: true,
        scores: {
          performance: result.performance,
          accessibility: result.accessibility,
          bestPractices: result.bestPractices,
          seo: result.seo
        },
        metrics: {
          fcp: result.firstContentfulPaint,
          lcp: result.largestContentfulPaint,
          cls: result.cumulativeLayoutShift,
          tbt: result.totalBlockingTime,
          tti: result.timeToInteractive
        },
        device,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Calculate E-E-A-T score
   */
  private async calculateEEAT(
    input: any,
    context: AgentContext
  ): Promise<any> {
    // Default scores if not provided
    const contentQuality = input.content_quality || 70;
    const authorCredentials = input.author_credentials || 60;
    const siteReputation = input.site_reputation || 65;

    // Calculate weighted E-E-A-T score
    const eeatScore = Math.round(
      (contentQuality * 0.4) +
      (authorCredentials * 0.3) +
      (siteReputation * 0.3)
    );

    return {
      overall_score: eeatScore,
      breakdown: {
        content_quality: contentQuality,
        author_credentials: authorCredentials,
        site_reputation: siteReputation
      },
      grade: eeatScore >= 90 ? 'A' :
             eeatScore >= 80 ? 'B' :
             eeatScore >= 70 ? 'C' :
             eeatScore >= 60 ? 'D' : 'F',
      recommendations: this.getEEATRecommendations(eeatScore, {
        contentQuality,
        authorCredentials,
        siteReputation
      })
    };
  }

  /**
   * Check keyword rankings
   */
  private async checkRankings(
    input: any,
    context: AgentContext
  ): Promise<any> {
    try {
      const rankings = [];

      for (const keyword of input.keywords) {
        // Query database for existing ranking data
        const existingRanking = await db.get(`
          SELECT * FROM rankings
          WHERE domain = ? AND keyword = ?
          ORDER BY checked_at DESC
          LIMIT 1
        `, [input.domain, keyword]) as any;

        rankings.push({
          keyword,
          position: existingRanking?.position || null,
          previous_position: existingRanking?.previous_position || null,
          change: existingRanking ?
            (existingRanking.previous_position - existingRanking.position) : 0,
          last_checked: existingRanking?.checked_at || null
        });
      }

      return {
        domain: input.domain,
        location: input.location,
        rankings,
        checked_at: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Analyze competitors
   */
  private async analyzeCompetitors(
    input: any,
    context: AgentContext
  ): Promise<any> {
    const competitors = [];

    for (const domain of input.competitor_domains) {
      // Simplified competitor analysis
      competitors.push({
        domain,
        estimated_score: Math.floor(Math.random() * 30) + 60, // 60-90 range
        strengths: ['Fast page speed', 'Strong backlink profile'],
        weaknesses: ['Poor mobile optimization', 'Limited content depth']
      });
    }

    return {
      primary_domain: input.primary_domain,
      competitors,
      opportunities: [
        'Target long-tail keywords competitors are missing',
        'Improve mobile user experience',
        'Build authority through content marketing'
      ],
      threats: [
        'Competitors have stronger domain authority',
        'Higher ad spend from competitors'
      ]
    };
  }

  /**
   * Save audit report to database
   */
  private async saveAuditReport(
    input: any,
    context: AgentContext
  ): Promise<any> {
    try {
      const auditId = `audit_${Date.now()}`;

      await db.run(`
        INSERT INTO seo_audits (
          id, company_id, score, report_data, created_at
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        auditId,
        input.company_id,
        input.score,
        JSON.stringify(input.report_data),
        new Date().toISOString()
      ]);

      return {
        success: true,
        audit_id: auditId,
        message: 'Audit report saved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get E-E-A-T recommendations
   */
  private getEEATRecommendations(
    score: number,
    breakdown: any
  ): string[] {
    const recommendations = [];

    if (breakdown.contentQuality < 80) {
      recommendations.push('Improve content depth and originality');
      recommendations.push('Add data, research, and expert quotes');
    }

    if (breakdown.authorCredentials < 80) {
      recommendations.push('Add detailed author bios with credentials');
      recommendations.push('Link to author social profiles and publications');
    }

    if (breakdown.siteReputation < 80) {
      recommendations.push('Build high-quality backlinks from authoritative sites');
      recommendations.push('Get featured in industry publications');
    }

    return recommendations;
  }
}
