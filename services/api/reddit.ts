/**
 * Reddit API Service - Community Gap Mining
 * Discovers unanswered questions and content gaps from Reddit discussions
 */

import snoowrap from 'snoowrap';

export interface RedditThread {
  id: string;
  subreddit: string;
  title: string;
  url: string;
  score: number;
  num_comments: number;
  created_utc: number;
}

export interface RedditComment {
  id: string;
  body: string;
  score: number;
  created_utc: number;
  parent_id: string;
  link_id: string;
}

export interface RedditConfig {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  userAgent: string;
}

/**
 * Initialize Reddit client
 */
export function createRedditClient(config?: RedditConfig): snoowrap {
  const {
    REDDIT_CLIENT_ID: clientId,
    REDDIT_CLIENT_SECRET: clientSecret,
    REDDIT_USERNAME: username,
    REDDIT_PASSWORD: password,
    REDDIT_USER_AGENT: userAgent
  } = process.env;

  if (!clientId || !clientSecret || !username || !password || !userAgent) {
    throw new Error('Missing required Reddit environment variables (REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD, REDDIT_USER_AGENT)');
  }

  return new snoowrap({
    userAgent: config?.userAgent || userAgent,
    clientId: config?.clientId || clientId,
    clientSecret: config?.clientSecret || clientSecret,
    username: config?.username || username,
    password: config?.password || password
  });
}

/**
 * Search Reddit threads for a keyword
 * @param keyword - Search term
 * @param subreddits - Array of subreddit names (or ['all'] for all)
 * @param limit - Max results (default 50)
 */
export async function searchThreads(
  keyword: string,
  subreddits: string[] = ['all'],
  limit = 50
): Promise<RedditThread[]> {
  const reddit = createRedditClient();

  // Search for self-posts (text posts, not links)
  const query = `${keyword} self:yes`;
  const subredditName = subreddits[0] === 'all' ? undefined : subreddits.join('+');

  try {
    const results = await reddit.search({
      query,
      subreddit: subredditName,
      limit,
      sort: 'relevance',
      time: 'year' // last year for freshness
    });

    return results.map((post: any) => ({
      id: post.id,
      subreddit: post.subreddit_name_prefixed,
      title: post.title,
      url: `https://reddit.com${post.permalink}`,
      score: post.score,
      num_comments: post.num_comments,
      created_utc: post.created_utc
    }));
  } catch (error: any) {
    console.error('Reddit search error:', error.message);
    throw new Error(`Reddit search failed: ${error.message}`);
  }
}

/**
 * Get comments from a Reddit thread
 * @param threadId - Reddit post ID (without t3_ prefix)
 * @param limit - Max comments to fetch
 */
export async function getComments(
  threadId: string,
  limit = 200
): Promise<RedditComment[]> {
  const reddit = createRedditClient();

  try {
    const submission = await reddit.getSubmission(threadId).expandReplies({
      limit,
      depth: 1
    });

    const comments: RedditComment[] = [];

    const flattenComments = (items: any[]) => {
      for (const item of items) {
        if (!item || item.body === undefined) continue;

        comments.push({
          id: item.id,
          body: String(item.body || ''),
          score: Number(item.score || 0),
          created_utc: Number(item.created_utc || 0),
          parent_id: String(item.parent_id || ''),
          link_id: String(item.link_id || '')
        });

        // Recursively process replies
        if (Array.isArray(item.replies)) {
          flattenComments(item.replies);
        } else if (item.replies && item.replies.comments) {
          flattenComments(item.replies.comments);
        }
      }
    };

    flattenComments(submission.comments || []);
    return comments;
  } catch (error: any) {
    console.error('Reddit comments fetch error:', error.message);
    throw new Error(`Failed to fetch comments: ${error.message}`);
  }
}

/**
 * Extract questions from text using NLP patterns
 */
export function extractQuestions(text: string): string[] {
  return text
    .split(/[.!?\n]/)
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s =>
      /(^|\s)(how|what|why|where|when|which|do|does|can|should|is|are|will|would|could)\b/i.test(s)
    )
    .slice(0, 10); // Top 10 questions
}

/**
 * Count confusion markers in text
 */
export function confusionCount(text: string): number {
  const patterns = [
    /confus(ed|ing)/i,
    /not\s+(sure|clear)/i,
    /anyone\s+know/i,
    /can\s+someone\s+explain/i,
    /don'?t\s+understand/i,
    /help\s+me\s+understand/i
  ];

  return patterns.reduce((count, pattern) =>
    count + (pattern.test(text) ? 1 : 0), 0
  );
}

/**
 * Count dissatisfaction markers in text
 */
export function dissatisfactionCount(text: string): number {
  const patterns = [
    /didn'?t\s+work/i,
    /no\s+answer/i,
    /still\s+stuck/i,
    /tried\s+everything/i,
    /doesn'?t\s+help/i,
    /waste\s+of\s+time/i,
    /frustrated/i
  ];

  return patterns.reduce((count, pattern) =>
    count + (pattern.test(text) ? 1 : 0), 0
  );
}

/**
 * Analyze a thread for content gaps
 */
export interface ThreadAnalysis {
  thread: RedditThread;
  comments: RedditComment[];
  questions: string[];
  confusionMarkers: number;
  dissatisfactionMarkers: number;
  questionCount: number;
}

export async function analyzeThread(threadId: string): Promise<ThreadAnalysis> {
  const reddit = createRedditClient();
  const submission = await reddit.getSubmission(threadId);

  const thread: RedditThread = {
    id: submission.id,
    subreddit: submission.subreddit_name_prefixed,
    title: submission.title,
    url: `https://reddit.com${submission.permalink}`,
    score: submission.score,
    num_comments: submission.num_comments,
    created_utc: submission.created_utc
  };

  const comments = await getComments(threadId);

  let allQuestions: string[] = [];
  let totalConfusion = 0;
  let totalDissatisfaction = 0;

  for (const comment of comments) {
    const questions = extractQuestions(comment.body);
    allQuestions.push(...questions);
    totalConfusion += confusionCount(comment.body);
    totalDissatisfaction += dissatisfactionCount(comment.body);
  }

  return {
    thread,
    comments,
    questions: allQuestions,
    confusionMarkers: totalConfusion,
    dissatisfactionMarkers: totalDissatisfaction,
    questionCount: allQuestions.length
  };
}
