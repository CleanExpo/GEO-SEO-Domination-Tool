/**
 * AI-Powered Domain Authority Calculator
 *
 * Replaces OpenPageRank API with AI-based domain authority estimation
 * using Qwen (primary) or Groq (fallback) for cost-effective analysis
 *
 * Cost: $0.40/M tokens (Qwen) vs. $10/month for OpenPageRank API
 */

import { cascadingAI } from './cascading-ai';
import axios from 'axios';

export interface DomainAuthorityResult {
  domain: string;
  domainRating: number; // 0-100 (like Ahrefs DR)
  trustScore: number; // 0-100
  authorityLevel: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  confidence: number; // 0-100 (how confident AI is in the rating)
  reasoning: string[];
  metrics: {
    estimatedBacklinks: number;
    estimatedReferringDomains: number;
    topicalAuthority: number; // 0-100
    contentQuality: number; // 0-100
    technicalSEO: number; // 0-100
  };
}

export interface DomainSignals {
  domain: string;
  age?: number; // Domain age in years
  hasHTTPS: boolean;
  responseTime: number; // ms
  hasValidSSL: boolean;
  titleTag?: string;
  metaDescription?: string;
  h1Tags: string[];
  schemaMarkup: boolean;
  contentLength: number; // characters
  externalLinks: number;
  internalLinks: number;
  imageCount: number;
  hasSitemap: boolean;
  hasRobotsTxt: boolean;
  socialPresence: {
    facebook?: boolean;
    twitter?: boolean;
    linkedin?: boolean;
    instagram?: boolean;
  };
}

/**
 * Calculate domain authority using AI analysis
 */
export async function calculateDomainAuthority(
  domain: string,
  signals?: Partial<DomainSignals>
): Promise<DomainAuthorityResult> {
  console.log(`[AI Domain Authority] Analyzing ${domain}`);

  // 1. Gather domain signals if not provided
  const domainSignals = signals || await gatherDomainSignals(domain);

  // 2. Use AI to analyze and rate the domain
  const aiAnalysis = await analyzeWithAI(domain, domainSignals);

  return aiAnalysis;
}

/**
 * Gather observable domain signals without external APIs
 */
async function gatherDomainSignals(domain: string): Promise<DomainSignals> {
  const signals: DomainSignals = {
    domain,
    hasHTTPS: false,
    responseTime: 0,
    hasValidSSL: false,
    h1Tags: [],
    schemaMarkup: false,
    contentLength: 0,
    externalLinks: 0,
    internalLinks: 0,
    imageCount: 0,
    hasSitemap: false,
    hasRobotsTxt: false,
    socialPresence: {},
  };

  try {
    // Try HTTPS first
    const startTime = Date.now();
    const httpsUrl = `https://${domain}`;

    const response = await axios.get(httpsUrl, {
      timeout: 10000,
      validateStatus: (status) => status < 500, // Accept all non-5xx
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GEO-SEO-Bot/1.0)',
      },
    });

    signals.responseTime = Date.now() - startTime;
    signals.hasHTTPS = true;
    signals.hasValidSSL = true;

    // Parse HTML for signals
    const html = response.data;
    signals.contentLength = html.length;

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) signals.titleTag = titleMatch[1];

    // Extract meta description
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (metaMatch) signals.metaDescription = metaMatch[1];

    // Extract H1 tags
    const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || [];
    signals.h1Tags = h1Matches.map(h => h.replace(/<[^>]*>/g, '').trim());

    // Check for schema markup
    signals.schemaMarkup = html.includes('application/ld+json') || html.includes('schema.org');

    // Count links
    const externalLinkMatches = html.match(/href=["']https?:\/\/(?!${domain})[^"']+["']/gi) || [];
    signals.externalLinks = externalLinkMatches.length;

    const internalLinkMatches = html.match(/href=["'][^"']*["']/gi) || [];
    signals.internalLinks = Math.max(0, internalLinkMatches.length - signals.externalLinks);

    // Count images
    const imageMatches = html.match(/<img[^>]*>/gi) || [];
    signals.imageCount = imageMatches.length;

    // Check for sitemap
    try {
      const sitemapResponse = await axios.head(`${httpsUrl}/sitemap.xml`, { timeout: 5000 });
      signals.hasSitemap = sitemapResponse.status === 200;
    } catch {
      signals.hasSitemap = false;
    }

    // Check for robots.txt
    try {
      const robotsResponse = await axios.head(`${httpsUrl}/robots.txt`, { timeout: 5000 });
      signals.hasRobotsTxt = robotsResponse.status === 200;
    } catch {
      signals.hasRobotsTxt = false;
    }

    // Check social presence (look for meta tags)
    signals.socialPresence.facebook = html.includes('og:') || html.includes('facebook.com');
    signals.socialPresence.twitter = html.includes('twitter:') || html.includes('twitter.com');
    signals.socialPresence.linkedin = html.includes('linkedin.com');
    signals.socialPresence.instagram = html.includes('instagram.com');

  } catch (error) {
    console.error(`[AI Domain Authority] Failed to gather signals for ${domain}:`, error);
    // Return minimal signals
  }

  return signals;
}

/**
 * Analyze domain signals with AI to estimate authority
 */
async function analyzeWithAI(
  domain: string,
  signals: Partial<DomainSignals>
): Promise<DomainAuthorityResult> {
  const prompt = `As an SEO expert, analyze this domain and estimate its Domain Authority (0-100 scale, like Ahrefs DR).

Domain: ${domain}

Observable Signals:
- HTTPS: ${signals.hasHTTPS ? 'Yes' : 'No'}
- SSL Valid: ${signals.hasValidSSL ? 'Yes' : 'No'}
- Response Time: ${signals.responseTime}ms
- Title Tag: ${signals.titleTag || 'Not found'}
- Meta Description: ${signals.metaDescription ? 'Present' : 'Missing'}
- H1 Tags: ${signals.h1Tags?.length || 0} found
- Schema Markup: ${signals.schemaMarkup ? 'Implemented' : 'Not found'}
- Content Length: ${signals.contentLength?.toLocaleString() || 0} characters
- External Links: ${signals.externalLinks || 0}
- Internal Links: ${signals.internalLinks || 0}
- Images: ${signals.imageCount || 0}
- Sitemap: ${signals.hasSitemap ? 'Found' : 'Not found'}
- Robots.txt: ${signals.hasRobotsTxt ? 'Found' : 'Not found'}
- Social Presence: ${Object.entries(signals.socialPresence || {}).filter(([k, v]) => v).map(([k]) => k).join(', ') || 'None detected'}

Based on these signals, estimate:
1. Domain Rating (0-100) - Overall authority
2. Trust Score (0-100) - Trustworthiness
3. Authority Level (Very Low/Low/Medium/High/Very High)
4. Estimated Backlinks (number)
5. Estimated Referring Domains (number)
6. Topical Authority (0-100) - How well-established in its niche
7. Content Quality (0-100) - Based on content length, structure
8. Technical SEO (0-100) - Based on HTTPS, schema, sitemap, etc.
9. Confidence (0-100) - How confident you are in these estimates
10. Reasoning (3-5 bullet points explaining the ratings)

Return ONLY valid JSON:
{
  "domainRating": 45,
  "trustScore": 67,
  "authorityLevel": "Medium",
  "confidence": 75,
  "reasoning": [
    "Strong technical SEO foundation with HTTPS and schema markup",
    "Moderate content quality based on structure and length",
    "..."
  ],
  "metrics": {
    "estimatedBacklinks": 1200,
    "estimatedReferringDomains": 85,
    "topicalAuthority": 55,
    "contentQuality": 62,
    "technicalSEO": 78
  }
}`;

  try {
    const response = await cascadingAI(prompt, {
      temperature: 0.3, // Lower temperature for more consistent estimates
      maxTokens: 1000,
    });

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI did not return valid JSON');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      domain,
      domainRating: analysis.domainRating,
      trustScore: analysis.trustScore,
      authorityLevel: analysis.authorityLevel,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
      metrics: analysis.metrics,
    };
  } catch (error) {
    console.error('[AI Domain Authority] AI analysis failed:', error);

    // Fallback: Use heuristic-based estimation
    return calculateHeuristicAuthority(domain, signals);
  }
}

/**
 * Fallback heuristic-based authority calculation
 */
function calculateHeuristicAuthority(
  domain: string,
  signals: Partial<DomainSignals>
): DomainAuthorityResult {
  let score = 0;
  const reasoning: string[] = [];

  // HTTPS and SSL (10 points)
  if (signals.hasHTTPS && signals.hasValidSSL) {
    score += 10;
    reasoning.push('Secure HTTPS connection with valid SSL');
  }

  // Response time (5 points)
  if (signals.responseTime && signals.responseTime < 1000) {
    score += 5;
    reasoning.push('Fast server response time');
  }

  // Technical SEO (20 points)
  if (signals.schemaMarkup) score += 7;
  if (signals.hasSitemap) score += 7;
  if (signals.hasRobotsTxt) score += 6;
  if (signals.schemaMarkup || signals.hasSitemap || signals.hasRobotsTxt) {
    reasoning.push('Good technical SEO foundation');
  }

  // Content quality (20 points)
  if (signals.contentLength && signals.contentLength > 5000) {
    score += 10;
  } else if (signals.contentLength && signals.contentLength > 2000) {
    score += 5;
  }
  if (signals.h1Tags && signals.h1Tags.length > 0) score += 5;
  if (signals.metaDescription) score += 5;
  if (signals.contentLength && signals.contentLength > 2000) {
    reasoning.push('Comprehensive content with good structure');
  }

  // Link structure (15 points)
  if (signals.internalLinks && signals.internalLinks > 20) {
    score += 10;
    reasoning.push('Strong internal linking structure');
  } else if (signals.internalLinks && signals.internalLinks > 10) {
    score += 5;
  }
  if (signals.externalLinks && signals.externalLinks > 5 && signals.externalLinks < 50) {
    score += 5; // Balanced external linking
  }

  // Social presence (10 points)
  const socialCount = Object.values(signals.socialPresence || {}).filter(Boolean).length;
  score += Math.min(10, socialCount * 3);
  if (socialCount > 0) {
    reasoning.push(`Active on ${socialCount} social platform(s)`);
  }

  // Estimate backlinks and referring domains based on score
  const estimatedBacklinks = Math.floor(score * 50);
  const estimatedReferringDomains = Math.floor(score * 3);

  // Determine authority level
  let authorityLevel: DomainAuthorityResult['authorityLevel'];
  if (score >= 70) authorityLevel = 'Very High';
  else if (score >= 50) authorityLevel = 'High';
  else if (score >= 30) authorityLevel = 'Medium';
  else if (score >= 15) authorityLevel = 'Low';
  else authorityLevel = 'Very Low';

  // Trust score (based on technical factors)
  const trustScore = Math.min(100, Math.round(
    (signals.hasHTTPS ? 30 : 0) +
    (signals.hasValidSSL ? 20 : 0) +
    (signals.schemaMarkup ? 15 : 0) +
    (signals.hasSitemap ? 15 : 0) +
    (signals.hasRobotsTxt ? 10 : 0) +
    (socialCount * 2)
  ));

  if (reasoning.length === 0) {
    reasoning.push('Limited signals available for analysis');
  }

  return {
    domain,
    domainRating: Math.min(100, score),
    trustScore,
    authorityLevel,
    confidence: 60, // Lower confidence for heuristic
    reasoning,
    metrics: {
      estimatedBacklinks,
      estimatedReferringDomains,
      topicalAuthority: Math.round(score * 0.8),
      contentQuality: Math.min(100, Math.round((signals.contentLength || 0) / 100)),
      technicalSEO: Math.min(100, Math.round(
        ((signals.hasHTTPS ? 1 : 0) +
        (signals.schemaMarkup ? 1 : 0) +
        (signals.hasSitemap ? 1 : 0) +
        (signals.hasRobotsTxt ? 1 : 0)) * 25
      )),
    },
  };
}

/**
 * Batch calculate domain authority for multiple domains
 */
export async function batchCalculateDomainAuthority(
  domains: string[]
): Promise<DomainAuthorityResult[]> {
  const results = await Promise.allSettled(
    domains.map(domain => calculateDomainAuthority(domain))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      // Return minimal result for failed domains
      return {
        domain: domains[index],
        domainRating: 0,
        trustScore: 0,
        authorityLevel: 'Very Low' as const,
        confidence: 0,
        reasoning: ['Failed to analyze domain'],
        metrics: {
          estimatedBacklinks: 0,
          estimatedReferringDomains: 0,
          topicalAuthority: 0,
          contentQuality: 0,
          technicalSEO: 0,
        },
      };
    }
  });
}
