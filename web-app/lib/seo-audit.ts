import * as cheerio from 'cheerio';
import axios from 'axios';
import type { SEOAudit, AuditIssue } from '../types/database';

export class SEOAuditor {
  async auditWebsite(url: string): Promise<Omit<SEOAudit, 'id' | 'company_id' | 'created_at'>> {
    const issues: AuditIssue[] = [];
    let score = 100;

    try {
      // Fetch the webpage
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract meta data
      const title = $('title').text();
      const metaDescription = $('meta[name="description"]').attr('content') || '';
      const h1Tags = $('h1')
        .map((_, el) => $(el).text())
        .get();

      // Check title
      if (!title) {
        issues.push({
          type: 'error',
          category: 'meta',
          message: 'Missing page title',
          impact: 'high',
        });
        score -= 10;
      } else if (title.length < 30 || title.length > 60) {
        issues.push({
          type: 'warning',
          category: 'meta',
          message: `Title length (${title.length}) should be between 30-60 characters`,
          impact: 'medium',
        });
        score -= 5;
      }

      // Check meta description
      if (!metaDescription) {
        issues.push({
          type: 'error',
          category: 'meta',
          message: 'Missing meta description',
          impact: 'high',
        });
        score -= 10;
      } else if (metaDescription.length < 120 || metaDescription.length > 160) {
        issues.push({
          type: 'warning',
          category: 'meta',
          message: `Meta description length (${metaDescription.length}) should be between 120-160 characters`,
          impact: 'medium',
        });
        score -= 5;
      }

      // Check H1 tags
      if (h1Tags.length === 0) {
        issues.push({
          type: 'error',
          category: 'content',
          message: 'No H1 tag found',
          impact: 'high',
        });
        score -= 10;
      } else if (h1Tags.length > 1) {
        issues.push({
          type: 'warning',
          category: 'content',
          message: `Multiple H1 tags found (${h1Tags.length}). Recommended: 1`,
          impact: 'medium',
        });
        score -= 5;
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
        score -= Math.min(imagesWithoutAlt * 2, 10);
      }

      // Check for meta robots
      const metaRobots = $('meta[name="robots"]').attr('content');
      if (metaRobots && metaRobots.includes('noindex')) {
        issues.push({
          type: 'error',
          category: 'indexing',
          message: 'Page is set to noindex',
          impact: 'high',
        });
        score -= 15;
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
        score -= 2;
      }

      // Check for Open Graph tags
      const ogTitle = $('meta[property="og:title"]').attr('content');
      const ogDescription = $('meta[property="og:description"]').attr('content');
      const ogImage = $('meta[property="og:image"]').attr('content');

      if (!ogTitle || !ogDescription || !ogImage) {
        issues.push({
          type: 'warning',
          category: 'social',
          message: 'Missing Open Graph tags for social sharing',
          impact: 'low',
        });
        score -= 3;
      }

      // Extract all meta tags
      const metaTags: Record<string, any> = {};
      $('meta').each((_, el) => {
        const name = $(el).attr('name') || $(el).attr('property');
        const content = $(el).attr('content');
        if (name && content) {
          metaTags[name] = content;
        }
      });

      // Calculate scores (simplified)
      const seoScore = Math.max(0, Math.min(100, score));
      const performanceScore = 85; // Placeholder - would need PageSpeed API
      const accessibilityScore = imagesWithoutAlt === 0 ? 95 : Math.max(60, 95 - imagesWithoutAlt * 3);

      return {
        url,
        score: seoScore,
        title,
        meta_description: metaDescription,
        h1_tags: h1Tags,
        meta_tags: metaTags,
        performance_score: performanceScore,
        accessibility_score: accessibilityScore,
        seo_score: seoScore,
        issues,
      };
    } catch (error) {
      console.error('SEO Audit error:', error);
      throw new Error(`Failed to audit ${url}: ${error}`);
    }
  }
}
