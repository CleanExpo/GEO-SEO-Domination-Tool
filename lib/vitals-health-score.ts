// Vitals Health Score Calculator
// Calculates overall SEO & GEO health score (0-100) from baseline metrics

import type {
  OnboardingVitals,
  GoogleSearchConsoleMetrics,
  GoogleMyBusinessMetrics,
  BingWebmasterMetrics,
  TechnicalSEOMetrics,
  EEATScores,
  CitationMetrics,
  VitalsHealthScoreBreakdown,
} from '@/types/onboarding-vitals';

// Default category weights (must sum to 100)
const DEFAULT_WEIGHTS = {
  gsc: 25, // Google Search Console
  gmb: 25, // Google My Business
  bing: 10, // Bing Webmaster Tools
  technical: 20, // Technical SEO
  eeat: 15, // E-E-A-T
  citations: 5, // Local Citations
};

/**
 * Calculate Google Search Console category score (0-100)
 */
export function calculateGSCScore(gsc?: GoogleSearchConsoleMetrics): number {
  if (!gsc) return 0;

  let score = 0;
  let maxScore = 100;

  // Impressions (20 points)
  // > 10,000/month = 20, > 5,000 = 15, > 1,000 = 10, > 100 = 5
  if (gsc.impressions > 10000) score += 20;
  else if (gsc.impressions > 5000) score += 15;
  else if (gsc.impressions > 1000) score += 10;
  else if (gsc.impressions > 100) score += 5;

  // Clicks (20 points)
  // > 1,000/month = 20, > 500 = 15, > 100 = 10, > 10 = 5
  if (gsc.clicks > 1000) score += 20;
  else if (gsc.clicks > 500) score += 15;
  else if (gsc.clicks > 100) score += 10;
  else if (gsc.clicks > 10) score += 5;

  // CTR (15 points)
  // > 5% = 15, > 3% = 10, > 1% = 5
  if (gsc.ctr > 5) score += 15;
  else if (gsc.ctr > 3) score += 10;
  else if (gsc.ctr > 1) score += 5;

  // Average Position (15 points)
  // Top 3 = 15, Top 10 = 10, Top 20 = 5
  if (gsc.avgPosition <= 3) score += 15;
  else if (gsc.avgPosition <= 10) score += 10;
  else if (gsc.avgPosition <= 20) score += 5;

  // Indexed Pages (10 points)
  // > 100 = 10, > 50 = 7, > 10 = 5
  if (gsc.indexedPages > 100) score += 10;
  else if (gsc.indexedPages > 50) score += 7;
  else if (gsc.indexedPages > 10) score += 5;

  // Coverage Issues (10 points - deduct for issues)
  if (gsc.coverageIssues === 0) score += 10;
  else if (gsc.coverageIssues < 5) score += 7;
  else if (gsc.coverageIssues < 20) score += 3;

  // HTTPS & Mobile (5 points each)
  if (gsc.httpsStatus) score += 5;
  if (gsc.mobileFriendly) score += 5;

  return Math.round((score / maxScore) * 100);
}

/**
 * Calculate Google My Business category score (0-100)
 */
export function calculateGMBScore(gmb?: GoogleMyBusinessMetrics): number {
  if (!gmb) return 0;

  let score = 0;
  let maxScore = 100;

  // Profile Completeness (20 points)
  score += (gmb.profileCompleteness / 100) * 20;

  // NAP Consistency (15 points)
  if (gmb.napConsistency) score += 15;

  // Reviews Count (15 points)
  // > 50 = 15, > 25 = 10, > 10 = 5
  if (gmb.totalReviews > 50) score += 15;
  else if (gmb.totalReviews > 25) score += 10;
  else if (gmb.totalReviews > 10) score += 5;

  // Average Rating (15 points)
  // 4.5+ = 15, 4.0+ = 10, 3.5+ = 5
  if (gmb.avgRating >= 4.5) score += 15;
  else if (gmb.avgRating >= 4.0) score += 10;
  else if (gmb.avgRating >= 3.5) score += 5;

  // Review Response Rate (10 points)
  score += (gmb.reviewResponseRate / 100) * 10;

  // Photos Count (5 points)
  // > 50 = 5, > 20 = 3, > 5 = 1
  if (gmb.photosCount > 50) score += 5;
  else if (gmb.photosCount > 20) score += 3;
  else if (gmb.photosCount > 5) score += 1;

  // Search Views (10 points)
  // > 1,000 = 10, > 500 = 7, > 100 = 3
  if (gmb.searchViews > 1000) score += 10;
  else if (gmb.searchViews > 500) score += 7;
  else if (gmb.searchViews > 100) score += 3;

  // Map Views (5 points)
  // > 500 = 5, > 200 = 3, > 50 = 1
  if (gmb.mapViews > 500) score += 5;
  else if (gmb.mapViews > 200) score += 3;
  else if (gmb.mapViews > 50) score += 1;

  // Engagement (5 points total - calls, directions, clicks)
  const totalEngagement = gmb.phoneCalls + gmb.directionRequests + gmb.websiteClicks;
  if (totalEngagement > 100) score += 5;
  else if (totalEngagement > 50) score += 3;
  else if (totalEngagement > 10) score += 1;

  return Math.round((score / maxScore) * 100);
}

/**
 * Calculate Bing Webmaster Tools category score (0-100)
 */
export function calculateBingScore(bing?: BingWebmasterMetrics): number {
  if (!bing) return 0;

  let score = 0;
  let maxScore = 100;

  // Bing SEO Score (40 points)
  // Bing provides a 0-100 score, map directly
  score += (bing.seoScore / 100) * 40;

  // Pages Indexed (20 points)
  // > 50 = 20, > 20 = 15, > 5 = 10
  if (bing.pagesIndexed > 50) score += 20;
  else if (bing.pagesIndexed > 20) score += 15;
  else if (bing.pagesIndexed > 5) score += 10;

  // Backlinks (20 points)
  // > 100 = 20, > 50 = 15, > 10 = 10, > 1 = 5
  if (bing.backlinks > 100) score += 20;
  else if (bing.backlinks > 50) score += 15;
  else if (bing.backlinks > 10) score += 10;
  else if (bing.backlinks > 1) score += 5;

  // Crawl Errors (10 points - deduct for errors)
  if (bing.crawlErrors === 0) score += 10;
  else if (bing.crawlErrors < 5) score += 7;
  else if (bing.crawlErrors < 20) score += 3;

  // Mobile Friendly (5 points)
  if (bing.mobileFriendly) score += 5;

  // Impressions & Clicks (5 points)
  if (bing.impressions > 1000) score += 3;
  if (bing.clicks > 50) score += 2;

  return Math.round((score / maxScore) * 100);
}

/**
 * Calculate Technical SEO category score (0-100)
 */
export function calculateTechnicalScore(technical?: TechnicalSEOMetrics): number {
  if (!technical) return 0;

  let score = 0;
  let maxScore = 100;

  // Page Speed Mobile (15 points)
  score += (technical.pageSpeed.mobile / 100) * 15;

  // Page Speed Desktop (10 points)
  score += (technical.pageSpeed.desktop / 100) * 10;

  // Title Tags Coverage (15 points)
  score += (technical.seoFundamentals.titleTagsCoverage / 100) * 15;

  // Meta Description Coverage (10 points)
  score += (technical.seoFundamentals.metaDescCoverage / 100) * 10;

  // H1 Tags Coverage (10 points)
  score += (technical.seoFundamentals.h1TagsCoverage / 100) * 10;

  // Alt Text Coverage (10 points)
  score += (technical.seoFundamentals.altTextCoverage / 100) * 10;

  // SSL Certificate (10 points)
  if (technical.hasSsl) score += 10;

  // Robots.txt (5 points)
  if (technical.hasRobotsTxt) score += 5;

  // XML Sitemap (5 points)
  if (technical.hasXmlSitemap) score += 5;

  // Thin Content Penalty (deduct up to -10 points)
  const thinContentPct = technical.totalPages > 0
    ? (technical.thinContentPages / technical.totalPages) * 100
    : 0;
  if (thinContentPct < 10) score += 10;
  else if (thinContentPct < 25) score += 5;

  return Math.round((score / maxScore) * 100);
}

/**
 * Calculate E-E-A-T category score (0-100)
 */
export function calculateEEATScore(eeat?: EEATScores): number {
  if (!eeat) return 0;

  // E-E-A-T score is already 0-100, take weighted average
  const weights = {
    experience: 25,
    expertise: 25,
    authoritativeness: 25,
    trustworthiness: 25,
  };

  const score =
    (eeat.experience * weights.experience +
      eeat.expertise * weights.expertise +
      eeat.authoritativeness * weights.authoritativeness +
      eeat.trustworthiness * weights.trustworthiness) /
    100;

  return Math.round(score);
}

/**
 * Calculate Citations category score (0-100)
 */
export function calculateCitationScore(citations?: CitationMetrics): number {
  if (!citations) return 0;

  let score = 0;
  let maxScore = 100;

  // Total Citations (40 points)
  // > 50 = 40, > 25 = 30, > 10 = 20, > 5 = 10
  if (citations.total > 50) score += 40;
  else if (citations.total > 25) score += 30;
  else if (citations.total > 10) score += 20;
  else if (citations.total > 5) score += 10;

  // Consistency Percentage (60 points)
  score += (citations.consistentPct / 100) * 60;

  return Math.round((score / maxScore) * 100);
}

/**
 * Calculate overall vitals health score with breakdown
 */
export function calculateVitalsHealthScore(
  vitals: OnboardingVitals,
  customWeights?: Partial<typeof DEFAULT_WEIGHTS>
): VitalsHealthScoreBreakdown {
  const weights = { ...DEFAULT_WEIGHTS, ...customWeights };

  // Calculate individual category scores
  const categoryScores = {
    gsc: calculateGSCScore(vitals.gsc),
    gmb: calculateGMBScore(vitals.gmb),
    bing: calculateBingScore(vitals.bing),
    technical: calculateTechnicalScore(vitals.technical),
    eeat: calculateEEATScore(vitals.eeat),
    citations: calculateCitationScore(vitals.citations),
  };

  // Calculate weighted overall score
  const overall = Math.round(
    (categoryScores.gsc * weights.gsc +
      categoryScores.gmb * weights.gmb +
      categoryScores.bing * weights.bing +
      categoryScores.technical * weights.technical +
      categoryScores.eeat * weights.eeat +
      categoryScores.citations * weights.citations) /
      100
  );

  return {
    overall,
    categories: categoryScores,
    weights,
  };
}

/**
 * Get health status label based on score
 */
export function getHealthStatus(score: number): {
  label: string;
  color: string;
  priority: string;
} {
  if (score >= 86) {
    return { label: 'Excellent', color: 'green', priority: 'Maintenance mode' };
  } else if (score >= 76) {
    return { label: 'Good', color: 'blue', priority: 'Low priority refinement' };
  } else if (score >= 61) {
    return { label: 'Fair', color: 'yellow', priority: 'Medium priority optimization' };
  } else if (score >= 41) {
    return { label: 'Poor', color: 'orange', priority: 'High priority improvements' };
  } else {
    return { label: 'Critical', color: 'red', priority: 'Immediate fixes needed' };
  }
}

/**
 * Compare vitals to identify improvements/declines
 */
export function compareVitals(
  current: OnboardingVitals,
  baseline: OnboardingVitals
): {
  category: string;
  change: number;
  direction: 'up' | 'down' | 'stable';
}[] {
  const currentScores = calculateVitalsHealthScore(current);
  const baselineScores = calculateVitalsHealthScore(baseline);

  const categories = ['gsc', 'gmb', 'bing', 'technical', 'eeat', 'citations'] as const;

  return categories.map(category => {
    const change = currentScores.categories[category] - baselineScores.categories[category];
    const direction = change > 2 ? 'up' : change < -2 ? 'down' : 'stable';

    return {
      category,
      change: Math.round(change),
      direction,
    };
  });
}
