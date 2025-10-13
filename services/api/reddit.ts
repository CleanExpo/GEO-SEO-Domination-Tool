/**
 * Reddit API Service - Community Gap Mining
 * Discovers unanswered questions and content gaps from Reddit discussions
 *
 * Using direct Reddit OAuth API with axios for security and maintainability
 * Replaces deprecated snoowrap package (had critical vulnerabilities)
 */

import axios, { AxiosInstance } from 'axios';

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
 * Reddit API Client using OAuth 2.0
 */
class RedditClient {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private config: RedditConfig;
  private apiClient: AxiosInstance;

  constructor(config: RedditConfig) {
    this.config = config;
    this.apiClient = axios.create({
      baseURL: 'https://oauth.reddit.com',
      headers: {
        'User-Agent': config.userAgent
      }
    });
  }

  /**
   * Authenticate with Reddit using password grant
   */
  async authenticate(): Promise<void> {
    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

    try {
      const response = await axios.post(
        'https://www.reddit.com/api/v1/access_token',
        new URLSearchParams({
          grant_type: 'password',
          username: this.config.username,
          password: this.config.password
        }),
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': this.config.userAgent
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
    } catch (error: any) {
      throw new Error(`Reddit authentication failed: ${error.message}`);
    }
  }

  /**
   * Ensure valid access token before API calls
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    await this.ensureAuthenticated();

    try {
      const response = await this.apiClient.get<T>(endpoint, {
        params,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Reddit API request failed: ${error.message}`);
    }
  }

  /**
   * Search for posts in subreddit(s)
   */
  async search(options: {
    query: string;
    subreddit?: string;
    limit?: number;
    sort?: string;
    time?: string;
  }): Promise<any> {
    const { query, subreddit = 'all', limit = 50, sort = 'relevance', time = 'year' } = options;
    const endpoint = subreddit === 'all' ? '/search' : `/r/${subreddit}/search`;

    return this.request(endpoint, {
      q: query,
      limit,
      sort,
      t: time,
      restrict_sr: subreddit !== 'all',
      type: 'link'
    });
  }

  /**
   * Get submission by ID
   */
  async getSubmission(id: string): Promise<any> {
    return this.request(`/comments/${id}`);
  }
}

/**
 * Initialize Reddit client
 */
export function createRedditClient(config?: RedditConfig): RedditClient {
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

  return new RedditClient({
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
  const subredditName = subreddits[0] === 'all' ? 'all' : subreddits.join('+');

  try {
    const response: any = await reddit.search({
      query,
      subreddit: subredditName,
      limit,
      sort: 'relevance',
      time: 'year' // last year for freshness
    });

    // Reddit API returns data.data.children array
    const posts = response.data?.children || [];

    return posts.map((item: any) => {
      const post = item.data;
      return {
        id: post.id,
        subreddit: post.subreddit_name_prefixed,
        title: post.title,
        url: `https://reddit.com${post.permalink}`,
        score: post.score,
        num_comments: post.num_comments,
        created_utc: post.created_utc
      };
    });
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
    const response: any = await reddit.getSubmission(threadId);

    // Reddit API returns [post_data, comments_data]
    const commentsListing = response[1]?.data?.children || [];
    const comments: RedditComment[] = [];

    const flattenComments = (items: any[]) => {
      for (const item of items) {
        if (!item || item.kind !== 't1') continue; // t1 = comment

        const commentData = item.data;
        if (!commentData || !commentData.body) continue;

        comments.push({
          id: commentData.id,
          body: String(commentData.body || ''),
          score: Number(commentData.score || 0),
          created_utc: Number(commentData.created_utc || 0),
          parent_id: String(commentData.parent_id || ''),
          link_id: String(commentData.link_id || '')
        });

        // Recursively process replies
        if (commentData.replies && commentData.replies.data?.children) {
          flattenComments(commentData.replies.data.children);
        }

        // Limit total comments
        if (comments.length >= limit) break;
      }
    };

    flattenComments(commentsListing);
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
  const response: any = await reddit.getSubmission(threadId);

  // Reddit API returns [post_data, comments_data]
  const postData = response[0]?.data?.children?.[0]?.data;

  if (!postData) {
    throw new Error('Failed to fetch submission data');
  }

  const thread: RedditThread = {
    id: postData.id,
    subreddit: postData.subreddit_name_prefixed,
    title: postData.title,
    url: `https://reddit.com${postData.permalink}`,
    score: postData.score,
    num_comments: postData.num_comments,
    created_utc: postData.created_utc
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
