/**
 * Content Opportunity Engine
 * Combines DataForSEO keyword data with Reddit community gap mining
 * to identify high-value, low-competition content opportunities
 */

import { searchThreads, getComments, extractQuestions, confusionCount, dissatisfactionCount } from './api/reddit';

export interface GapSignals {
  redditMentions: number;
  repeatedQuestions: number;
  confusionMarkers: number;
  dissatisfactionMarkers: number;
}

export interface AEOHints {
  canonicalAnswer: string; // 1-3 sentence answer for AI engines
  keyBullets: string[]; // Actionable bullet points
  citations: string[]; // Source URLs
}

export interface ContentOpportunity {
  keyword: string;
  volume: number;
  difficulty: number; // 0-1 normalized
  gap: GapSignals;
  opportunityScore: number;
  intents: string[];
  topQuestions: string[];
  aeo?: AEOHints;
  sources: {
    redditThreads?: string[];
    dataForSeoTaskId?: string;
  };
}

/**
 * Normalize keyword difficulty from 0-100 scale to 0-1
 */
export function normalizeDifficulty(kd0to100: number): number {
  return Math.min(1, Math.max(0, kd0to100 / 100));
}

/**
 * Compute gap weight from community signals
 * Higher weight = more unmet demand in communities
 */
export function computeGapWeight(gap: GapSignals): number {
  const wMentions = 0.35; // Reddit discussion volume
  const wRepeat = 0.30;   // Repeated questions
  const wConf = 0.20;     // Confusion signals
  const wDiss = 0.15;     // Dissatisfaction signals

  const raw = (
    wMentions * Math.log1p(gap.redditMentions) +
    wRepeat * Math.log1p(gap.repeatedQuestions) +
    wConf * Math.log1p(gap.confusionMarkers) +
    wDiss * Math.log1p(gap.dissatisfactionMarkers)
  );

  // Normalize to 0-1 using exponential decay
  return 1 - Math.exp(-raw);
}

/**
 * Calculate opportunity score
 * Higher score = better content opportunity
 *
 * Formula: log10(volume) * (0.6 * inverseDifficulty + 0.4 * gapWeight)
 */
export function opportunityScore(
  volume: number,
  kd0to100: number,
  gap: GapSignals
): number {
  const difficulty = normalizeDifficulty(kd0to100);
  const inverseDifficulty = 1 - difficulty;
  const gapWeight = computeGapWeight(gap);

  const volumeScore = Math.log10(Math.max(10, volume));
  const compositeScore = 0.6 * inverseDifficulty + 0.4 * gapWeight;

  return Number((volumeScore * compositeScore).toFixed(4));
}

/**
 * Mine Reddit for content gaps around a keyword
 */
export async function mineRedditGaps(
  keyword: string,
  subreddits: string[] = ['all'],
  maxThreads = 25
): Promise<{
  gap: GapSignals;
  topQuestions: string[];
  threadIds: string[];
}> {
  const threads = await searchThreads(keyword, subreddits, maxThreads);

  let redditMentions = threads.length;
  let confusionMarkers = 0;
  let dissatisfactionMarkers = 0;

  const questionTally = new Map<string, number>();
  const threadIds: string[] = [];

  for (const thread of threads) {
    threadIds.push(thread.id);

    try {
      const comments = await getComments(thread.id, 120);

      for (const comment of comments) {
        const questions = extractQuestions(comment.body);
        questions.forEach(q => {
          questionTally.set(q, (questionTally.get(q) || 0) + 1);
        });

        confusionMarkers += confusionCount(comment.body);
        dissatisfactionMarkers += dissatisfactionCount(comment.body);
      }
    } catch (error: any) {
      console.warn(`Failed to fetch comments for thread ${thread.id}:`, error.message);
      // Continue with other threads
    }
  }

  // Find repeated questions (asked 3+ times)
  const topQuestions = Array.from(questionTally.entries())
    .sort((a, b) => b[1] - a[1])
    .filter(([, count]) => count >= 3)
    .slice(0, 10)
    .map(([question]) => question);

  const gap: GapSignals = {
    redditMentions,
    repeatedQuestions: topQuestions.length,
    confusionMarkers,
    dissatisfactionMarkers
  };

  return {
    gap,
    topQuestions,
    threadIds
  };
}

/**
 * Generate AEO hints for a content opportunity
 * Uses Claude AI to create answer-engine-optimized content structure
 */
export async function generateAEOHints(
  keyword: string,
  topQuestions: string[],
  claudeApiKey?: string
): Promise<AEOHints> {
  // Placeholder for Claude integration
  // You already have Anthropic service - we'll integrate it

  return {
    canonicalAnswer: `Direct, actionable answer for "${keyword}" based on community pain points. This should be 1-3 sentences that AI engines can extract and cite.`,
    keyBullets: [
      '1-3 actionable steps that solve the core problem',
      '1 compliance/safety note relevant to the industry',
      '1 measurable check ("if X happens, then Y is working")'
    ],
    citations: []
  };
}

/**
 * Build a content opportunity from keyword data and community signals
 */
export async function buildOpportunity(
  keyword: string,
  volume: number,
  difficulty: number, // 0-100 scale
  options: {
    subreddits?: string[];
    maxThreads?: number;
    includeAEO?: boolean;
  } = {}
): Promise<ContentOpportunity> {
  const {
    subreddits = ['all'],
    maxThreads = 25,
    includeAEO = true
  } = options;

  // Mine Reddit for gaps
  const { gap, topQuestions, threadIds } = await mineRedditGaps(
    keyword,
    subreddits,
    maxThreads
  );

  // Calculate opportunity score
  const oppScore = opportunityScore(volume, difficulty, gap);

  // Generate AEO hints if requested
  let aeo: AEOHints | undefined;
  if (includeAEO) {
    aeo = await generateAEOHints(keyword, topQuestions);
  }

  return {
    keyword,
    volume,
    difficulty: normalizeDifficulty(difficulty),
    gap,
    opportunityScore: oppScore,
    intents: [], // Will be populated from DataForSEO SERP features
    topQuestions,
    aeo,
    sources: {
      redditThreads: threadIds
    }
  };
}

/**
 * Batch process multiple keywords to find best opportunities
 */
export async function findBestOpportunities(
  keywords: Array<{ keyword: string; volume: number; difficulty: number }>,
  options: {
    topN?: number;
    minScore?: number;
    subreddits?: string[];
  } = {}
): Promise<ContentOpportunity[]> {
  const {
    topN = 10,
    minScore = 0,
    subreddits = ['all']
  } = options;

  const opportunities: ContentOpportunity[] = [];

  for (const kw of keywords) {
    try {
      const opp = await buildOpportunity(kw.keyword, kw.volume, kw.difficulty, {
        subreddits,
        maxThreads: 15 // Reduced for batch processing
      });

      if (opp.opportunityScore >= minScore) {
        opportunities.push(opp);
      }
    } catch (error: any) {
      console.warn(`Failed to analyze "${kw.keyword}":`, error.message);
      // Continue with other keywords
    }
  }

  // Sort by score descending and return top N
  return opportunities
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, topN);
}
