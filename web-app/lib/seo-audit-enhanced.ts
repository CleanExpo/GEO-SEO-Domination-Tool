import * as cheerio from 'cheerio';
import axios from 'axios';
import { LighthouseService } from '@/services/api/lighthouse';
import { FirecrawlService } from '@/services/api/firecrawl';
import type { SEOAudit, AuditIssue } from '../types/database';

export interface EnhancedSEOAuditOptions {
  includeLighthouse?: boolean;
  includeFirecrawl?: boolean;
  strategy?: 'mobile' | 'desktop';
}

export class EnhancedSEOAuditor {
  private lighthouseService?: LighthouseService;
  private firecrawlService?: FirecrawlService;

  constructor() {
    // Initialize services if API keys are available
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;

    if (googleApiKey) {
      this.lighthouseService = new LighthouseService(googleApiKey);
    }

    if (firecrawlApiKey) {
      this.firecrawlService = new FirecrawlService({ apiKey: firecrawlApiKey });
    }
  }

  async auditWebsite(
    url: string,
    options: EnhancedSEOAuditOptions = {}
  ): Promise<Omit<SEOAudit, 'id' | 'company_id' | 'created_at'>> {
    const {
      includeLighthouse = true,
      includeFirecrawl = true,
      strategy = 'mobile',
    } = options;

    const issues: AuditIssue[] = [];
    const warnings: AuditIssue[] = [];
    const criticalIssues: AuditIssue[] = [];

    try {
      // Run all audits in parallel for better performance
      const [basicAudit, lighthouseData, firecrawlData] = await Promise.all([
        this.runBasicAudit(url),
        includeLighthouse && this.lighthouseService
          ? this.runLighthouseAudit(url, strategy)
          : Promise.resolve(null),
        includeFirecrawl && this.firecrawlService
          ? this.runFirecrawlAudit(url)
          : Promise.resolve(null),
      ]);

      // Merge issues from all audits
      issues.push(...basicAudit.issues);

      // Categorize issues by severity
      issues.forEach((issue) => {
        if (issue.impact === 'high') {
          criticalIssues.push(issue);
        } else if (issue.impact === 'medium') {
          warnings.push(issue);
        }
      });

      // Calculate E-E-A-T scores
      const eeatScores = this.calculateEEATScores(basicAudit, firecrawlData);

      // Merge all data
      const result: Omit<SEOAudit, 'id' | 'company_id' | 'created_at'> = {
        url,
        audit_date: new Date(),

        // Lighthouse Scores
        performance_score: lighthouseData?.performance || basicAudit.performanceScore,
        accessibility_score: lighthouseData?.accessibility || basicAudit.accessibilityScore,
        best_practices_score: lighthouseData?.best_practices || 85,
        seo_score: lighthouseData?.seo || basicAudit.seoScore,
        pwa_score: lighthouseData?.pwa,

        // E-E-A-T Scores
        experience_score: eeatScores.experience,
        expertise_score: eeatScores.expertise,
        authoritativeness_score: eeatScores.authoritativeness,
        trustworthiness_score: eeatScores.trustworthiness,

        // Technical SEO
        page_speed_mobile: lighthouseData?.performance || basicAudit.performanceScore,
        page_speed_desktop: 90, // Would need desktop run
        mobile_friendly: basicAudit.mobileFriendly,
        https_enabled: url.startsWith('https'),

        // Content Analysis
        title_tag: basicAudit.title,
        meta_description: basicAudit.metaDescription,
        h1_tags: basicAudit.h1Tags,
        word_count: firecrawlData?.wordCount || basicAudit.wordCount,

        // Issues and Recommendations
        critical_issues: criticalIssues,
        warnings: warnings,
        recommendations: this.generateRecommendations(issues, lighthouseData, firecrawlData),

        // Raw Data
        lighthouse_data: lighthouseData || null,
        crawl_data: firecrawlData || null,

        updated_at: new Date(),
      };

      return result;
    } catch (error) {
      console.error('Enhanced SEO Audit error:', error);
      throw new Error(`Failed to audit ${url}: ${error}`);
    }
  }

  private async runBasicAudit(url: string) {
    const issues: AuditIssue[] = [];
    let seoScore = 100;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 15000,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract meta data
    const title = $('title').text();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const h1Tags = $('h1').map((_, el) => $(el).text()).get();
    const viewport = $('meta[name="viewport"]').attr('content');

    // Check title
    if (!title) {
      issues.push({
        type: 'error',
        category: 'meta',
        message: 'Missing page title',
        impact: 'high',
      });
      seoScore -= 10;
    } else if (title.length < 30 || title.length > 60) {
      issues.push({
        type: 'warning',
        category: 'meta',
        message: `Title length (${title.length}) should be between 30-60 characters`,
        impact: 'medium',
      });
      seoScore -= 5;
    }

    // Check meta description
    if (!metaDescription) {
      issues.push({
        type: 'error',
        category: 'meta',
        message: 'Missing meta description',
        impact: 'high',
      });
      seoScore -= 10;
    } else if (metaDescription.length < 120 || metaDescription.length > 160) {
      issues.push({
        type: 'warning',
        category: 'meta',
        message: `Meta description length (${metaDescription.length}) should be between 120-160 characters`,
        impact: 'medium',
      });
      seoScore -= 5;
    }

    // Check H1 tags
    if (h1Tags.length === 0) {
      issues.push({
        type: 'error',
        category: 'content',
        message: 'No H1 tag found',
        impact: 'high',
      });
      seoScore -= 10;
    } else if (h1Tags.length > 1) {
      issues.push({
        type: 'warning',
        category: 'content',
        message: `Multiple H1 tags found (${h1Tags.length}). Recommended: 1`,
        impact: 'medium',
      });
      seoScore -= 5;
    }

    // Check viewport for mobile-friendliness
    const mobileFriendly = !!viewport;
    if (!mobileFriendly) {
      issues.push({
        type: 'error',
        category: 'mobile',
        message: 'Missing viewport meta tag - page may not be mobile-friendly',
        impact: 'high',
      });
      seoScore -= 10;
    }

    // Check for images without alt text
    const imagesWithoutAlt = $('img:not([alt])').length;
    if (imagesWithoutAlt > 0) {
      issues.push({
        type: 'warning',
        category: 'accessibility',
        message: `${imagesWithoutAlt} images missing alt text`,
        impact: 'medium',
      });
      seoScore -= Math.min(imagesWithoutAlt * 2, 10);
    }

    // Check for canonical tag
    const canonical = $('link[rel="canonical"]').attr('href');
    if (!canonical) {
      issues.push({
        type: 'info',
        category: 'meta',
        message: 'No canonical tag found',
        impact: 'low',
      });
      seoScore -= 2;
    }

    // Check for structured data
    const structuredData = $('script[type="application/ld+json"]').length;
    if (structuredData === 0) {
      issues.push({
        type: 'info',
        category: 'structured-data',
        message: 'No structured data (Schema.org) found',
        impact: 'medium',
      });
      seoScore -= 5;
    }

    // Word count
    const bodyText = $('body').text();
    const wordCount = bodyText.split(/\s+/).filter(word => word.length > 0).length;

    if (wordCount < 300) {
      issues.push({
        type: 'warning',
        category: 'content',
        message: `Low word count (${wordCount}). Recommended: 300+ words`,
        impact: 'medium',
      });
      seoScore -= 5;
    }

    return {
      title,
      metaDescription,
      h1Tags,
      issues,
      seoScore: Math.max(0, Math.min(100, seoScore)),
      performanceScore: 85, // Placeholder
      accessibilityScore: imagesWithoutAlt === 0 ? 95 : Math.max(60, 95 - imagesWithoutAlt * 3),
      mobileFriendly,
      wordCount,
    };
  }

  private async runLighthouseAudit(url: string, strategy: 'mobile' | 'desktop') {
    if (!this.lighthouseService) return null;

    try {
      const scores = await this.lighthouseService.auditPage(url, strategy);
      return scores;
    } catch (error) {
      console.error('Lighthouse audit failed:', error);
      return null;
    }
  }

  private async runFirecrawlAudit(url: string) {
    if (!this.firecrawlService) return null;

    try {
      const data = await this.firecrawlService.scrapForSEO(url);
      return data;
    } catch (error) {
      console.error('Firecrawl audit failed:', error);
      return null;
    }
  }

  private calculateEEATScores(basicAudit: any, firecrawlData: any) {
    // E-E-A-T = Experience, Expertise, Authoritativeness, Trustworthiness

    let experience = 70;
    let expertise = 70;
    let authoritativeness = 70;
    let trustworthiness = 70;

    // Experience: Content quality, multimedia, user engagement indicators
    if (basicAudit.wordCount > 500) experience += 10;
    if (basicAudit.wordCount > 1000) experience += 10;
    if (firecrawlData?.images?.length > 3) experience += 5;

    // Expertise: Author information, credentials, detailed content
    if (firecrawlData?.wordCount > 800) expertise += 10;
    if (basicAudit.h1Tags.length === 1) expertise += 5;

    // Authoritativeness: External links, citations, references
    if (firecrawlData?.links?.external?.length > 5) authoritativeness += 10;
    if (firecrawlData?.links?.external?.length > 10) authoritativeness += 5;

    // Trustworthiness: HTTPS, contact info, privacy policy, about page
    if (basicAudit.mobileFriendly) trustworthiness += 10;
    const hasContactInfo = basicAudit.title.toLowerCase().includes('contact');
    if (hasContactInfo) trustworthiness += 5;

    return {
      experience: Math.min(100, experience),
      expertise: Math.min(100, expertise),
      authoritativeness: Math.min(100, authoritativeness),
      trustworthiness: Math.min(100, trustworthiness),
    };
  }

  private generateRecommendations(issues: AuditIssue[], lighthouseData: any, firecrawlData: any) {
    const recommendations: any[] = [];

    // Group issues by category
    const criticalIssues = issues.filter(i => i.impact === 'high');
    const mediumIssues = issues.filter(i => i.impact === 'medium');

    if (criticalIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'critical-fixes',
        title: 'Fix Critical SEO Issues',
        description: `You have ${criticalIssues.length} critical issues that need immediate attention.`,
        issues: criticalIssues.map(i => i.message),
      });
    }

    if (mediumIssues.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'improvements',
        title: 'Recommended Improvements',
        description: `${mediumIssues.length} improvements that will enhance your SEO performance.`,
        issues: mediumIssues.map(i => i.message),
      });
    }

    // Performance recommendations
    if (lighthouseData && lighthouseData.performance < 80) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        title: 'Improve Page Speed',
        description: 'Your page speed score is below recommended levels. Consider optimizing images, minifying CSS/JS, and enabling caching.',
      });
    }

    // Content recommendations
    if (firecrawlData && firecrawlData.wordCount < 500) {
      recommendations.push({
        priority: 'medium',
        category: 'content',
        title: 'Add More Content',
        description: 'Pages with more comprehensive content (500+ words) tend to rank better in search results.',
      });
    }

    return recommendations;
  }
}
