/**
 * DeepSeek V3 Backlink Analysis
 * AI-powered backlink discovery and quality scoring
 * Replaces: Ahrefs Backlink Checker, SEMrush Backlink Analytics
 */

import OpenAI from 'openai';
import { FirecrawlService } from './firecrawl';
import type { BacklinkData } from './deepseek-seo';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';

const deepseek = new OpenAI({
  apiKey: DEEPSEEK_API_KEY,
  baseURL: DEEPSEEK_BASE_URL,
});

const firecrawl = new FirecrawlService();

export class DeepSeekBacklinkAnalysis {
  /**
   * Discover backlinks for a domain using multiple methods
   * Replaces: Ahrefs Backlink Checker
   */
  async discoverBacklinks(
    domain: string,
    options: {
      maxBacklinks?: number;
      minQualityScore?: number;
    } = {}
  ): Promise<BacklinkData[]> {
    const { maxBacklinks = 100, minQualityScore = 30 } = options;

    console.log(`🔍 DeepSeek V3: Discovering backlinks for ${domain}...`);

    try {
      // Method 1: Use AI to suggest likely backlink sources
      const likelySources = await this.findLikelyBacklinkSources(domain);

      // Method 2: Scrape and verify backlinks
      const verifiedBacklinks: BacklinkData[] = [];

      for (const source of likelySources.slice(0, 20)) {
        try {
          const backlinks = await this.verifyBacklinksFromSource(source, domain);
          verifiedBacklinks.push(...backlinks);

          if (verifiedBacklinks.length >= maxBacklinks) {
            break;
          }
        } catch (error) {
          console.warn(`Could not verify backlinks from ${source}`);
        }
      }

      // Method 3: Score each backlink with AI
      const scoredBacklinks = await Promise.all(
        verifiedBacklinks.map((bl) => this.scoreBacklink(bl))
      );

      // Filter by quality score
      const qualityBacklinks = scoredBacklinks.filter(
        (bl) => bl.qualityScore >= minQualityScore
      );

      console.log(
        `✅ DeepSeek V3: Found ${qualityBacklinks.length} quality backlinks for ${domain}`
      );

      return qualityBacklinks.slice(0, maxBacklinks);
    } catch (error) {
      console.error(`❌ DeepSeek V3 Backlink Discovery Error for ${domain}:`, error);
      throw error;
    }
  }

  /**
   * Use AI to find likely backlink sources for a domain
   */
  private async findLikelyBacklinkSources(domain: string): Promise<string[]> {
    const prompt = `Identify likely websites that would link to ${domain}.

    Consider:
    1. Industry directories and listings
    2. Niche-specific resource pages
    3. Industry blogs and news sites
    4. Partner/supplier websites
    5. Guest post opportunities
    6. Review sites
    7. Social bookmarking sites
    8. Community forums
    9. Educational institutions (.edu)
    10. Government resources (.gov)

    Return ONLY a JSON array of 50 likely domains (without https://):
    ["source1.com", "source2.com", ...]

    Prioritize high-authority, relevant sources.`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO backlink research expert.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{"sources":[]}');
    return result.sources || [];
  }

  /**
   * Verify if a source actually links to the target domain
   */
  private async verifyBacklinksFromSource(
    sourceDomain: string,
    targetDomain: string
  ): Promise<BacklinkData[]> {
    const backlinks: BacklinkData[] = [];

    try {
      // Scrape the source page
      const scrapedData = await firecrawl.scrapeUrl(`https://${sourceDomain}`, {
        formats: ['html', 'markdown'],
        onlyMainContent: true,
      });

      const html = scrapedData.html || '';
      const markdown = scrapedData.markdown || '';

      // Check if target domain is mentioned
      if (!html.includes(targetDomain) && !markdown.includes(targetDomain)) {
        return backlinks; // No link found
      }

      // Extract links using regex
      const linkRegex = new RegExp(
        `<a[^>]*href=["']([^"']*${targetDomain}[^"']*)["'][^>]*>([^<]*)</a>`,
        'gi'
      );
      const matches = html.matchAll(linkRegex);

      for (const match of matches) {
        const targetUrl = match[1];
        const anchorText = match[2] || '';

        // Check if dofollow or nofollow
        const isNofollow = match[0].includes('rel="nofollow"') || match[0].includes("rel='nofollow'");

        backlinks.push({
          sourceUrl: `https://${sourceDomain}`,
          sourceDomain,
          targetUrl,
          anchorText: anchorText.trim(),
          linkType: isNofollow ? 'nofollow' : 'dofollow',
          qualityScore: 0, // Will be scored separately
          domainAuthority: 0, // Will be estimated
          relevanceScore: 0, // Will be calculated
          traffic: 0,
          contextualRelevance: '',
          firstSeen: new Date(),
          lastChecked: new Date(),
          status: 'active',
        });
      }

      return backlinks;
    } catch (error) {
      return backlinks; // Return empty if scraping fails
    }
  }

  /**
   * Score a backlink using AI analysis
   */
  private async scoreBacklink(backlink: BacklinkData): Promise<BacklinkData> {
    const prompt = `Score this backlink comprehensively:

Source: ${backlink.sourceDomain}
Target: ${backlink.targetUrl}
Anchor Text: ${backlink.anchorText}
Link Type: ${backlink.linkType}

Provide scores for:
1. DOMAIN AUTHORITY (0-100): Authority of the linking domain
2. RELEVANCE SCORE (0-100): Topical relevance between source and target
3. QUALITY SCORE (0-100): Overall backlink quality
4. ESTIMATED TRAFFIC: Monthly visitors to source domain

Consider:
- Domain age and reputation
- Content quality of linking page
- Anchor text relevance
- Link placement (footer, sidebar, main content)
- Dofollow vs nofollow
- Spam signals

Return ONLY valid JSON:
{
  "domainAuthority": number 0-100,
  "relevanceScore": number 0-100,
  "qualityScore": number 0-100,
  "traffic": number,
  "contextualRelevance": "string explanation"
}`;

    try {
      const response = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an SEO backlink quality analyst.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const scores = JSON.parse(response.choices[0]?.message?.content || '{}');

      return {
        ...backlink,
        domainAuthority: scores.domainAuthority || 50,
        relevanceScore: scores.relevanceScore || 50,
        qualityScore: scores.qualityScore || 50,
        traffic: scores.traffic || 0,
        contextualRelevance: scores.contextualRelevance || '',
      };
    } catch (error) {
      // Return backlink with default scores if AI scoring fails
      return {
        ...backlink,
        domainAuthority: 50,
        relevanceScore: 50,
        qualityScore: 50,
      };
    }
  }

  /**
   * Analyze anchor text distribution
   */
  async analyzeAnchorText(domain: string): Promise<{
    distribution: { anchorText: string; count: number; percentage: number }[];
    branded: number;
    exactMatch: number;
    partial: number;
    generic: number;
    naked: number;
  }> {
    // This would normally fetch actual backlinks
    // For now, provide AI-based estimation
    const prompt = `Analyze typical anchor text distribution for backlinks pointing to ${domain}.

    Provide realistic estimates for:
    1. Top 10 most common anchor texts
    2. Percentage breakdown:
       - Branded (company/brand name)
       - Exact match (target keyword)
       - Partial match (keyword variation)
       - Generic ("click here", "learn more")
       - Naked URL (domain.com)

    Return ONLY valid JSON:
    {
      "topAnchors": [
        {"anchorText": "string", "count": number, "percentage": number}
      ],
      "distribution": {
        "branded": number 0-100,
        "exactMatch": number 0-100,
        "partial": number 0-100,
        "generic": number 0-100,
        "naked": number 0-100
      }
    }`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO backlink analyst.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');

    return {
      distribution: result.topAnchors || [],
      branded: result.distribution?.branded || 0,
      exactMatch: result.distribution?.exactMatch || 0,
      partial: result.distribution?.partial || 0,
      generic: result.distribution?.generic || 0,
      naked: result.distribution?.naked || 0,
    };
  }

  /**
   * Find broken backlinks (404 errors)
   */
  async findBrokenBacklinks(domain: string): Promise<BacklinkData[]> {
    console.log(`🔍 DeepSeek V3: Finding broken backlinks for ${domain}...`);

    // Get all backlinks first
    const allBacklinks = await this.discoverBacklinks(domain, {
      maxBacklinks: 50,
      minQualityScore: 0, // Include all for broken link check
    });

    // Check each target URL for 404 errors
    const brokenBacklinks: BacklinkData[] = [];

    for (const backlink of allBacklinks) {
      try {
        const response = await fetch(backlink.targetUrl, { method: 'HEAD' });
        if (response.status === 404) {
          brokenBacklinks.push({
            ...backlink,
            status: 'broken',
          });
        }
      } catch (error) {
        // URL is unreachable
        brokenBacklinks.push({
          ...backlink,
          status: 'broken',
        });
      }
    }

    console.log(`✅ DeepSeek V3: Found ${brokenBacklinks.length} broken backlinks`);
    return brokenBacklinks;
  }

  /**
   * Suggest backlink opportunities
   */
  async suggestBacklinkOpportunities(
    domain: string,
    niche: string
  ): Promise<{
    domain: string;
    type: string;
    difficulty: number;
    potential: number;
    strategy: string;
  }[]> {
    const prompt = `Suggest 20 realistic backlink opportunities for ${domain} in the ${niche} niche.

    For each opportunity, provide:
    1. Target domain
    2. Opportunity type (Guest Post, Directory, Resource Page, Broken Link, etc.)
    3. Difficulty (0-100): How hard to acquire
    4. Potential (0-100): SEO value if acquired
    5. Strategy: How to approach/acquire

    Return ONLY valid JSON:
    {
      "opportunities": [
        {
          "domain": "string",
          "type": "string",
          "difficulty": number 0-100,
          "potential": number 0-100,
          "strategy": "string"
        }
      ]
    }`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO link building strategist.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{"opportunities":[]}');
    return result.opportunities || [];
  }
}

export const deepseekBacklinks = new DeepSeekBacklinkAnalysis();
