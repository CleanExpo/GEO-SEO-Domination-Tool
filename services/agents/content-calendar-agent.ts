/**
 * Content Calendar Agent
 *
 * Autonomous scheduling system for content generation and publishing.
 *
 * Features:
 * - Auto-generates weekly/monthly content calendars
 * - Schedules posts for optimal engagement times
 * - Balances content types (70% educational, 20% promotional, 10% news)
 * - Platform-specific optimal posting times
 * - Integration with content generation and deployment agents
 *
 * Platform Optimal Times:
 * - LinkedIn: Weekday mornings (7-9 AM), lunch (12-1 PM)
 * - Facebook: Evenings (7-9 PM), weekends
 * - Twitter: Weekday afternoons (1-3 PM)
 * - GMB: Business hours (9 AM - 5 PM)
 * - WordPress/Node.js: Weekday mornings (6-8 AM)
 */

import Database from 'better-sqlite3';
import path from 'path';
import { ContentGenerationAgent } from './content-generation-agent';
import { AutoDeployAgent } from './auto-deploy-agent';

const contentGenerationAgent = new ContentGenerationAgent();
const autoDeployAgent = new AutoDeployAgent();

// ============================================================================
// INTERFACES
// ============================================================================

export interface CalendarRequest {
  portfolioId: string;
  startDate: string; // ISO format
  endDate: string;   // ISO format
  platforms: CalendarPlatform[];
  contentMix?: ContentMix;
  autoGenerate?: boolean; // If true, generates content immediately
  frequency?: 'daily' | 'weekly' | 'bi-weekly';
}

export interface CalendarPlatform {
  platform: 'nodejs' | 'wordpress' | 'linkedin' | 'facebook' | 'twitter' | 'gmb';
  postsPerWeek: number;
  config: any; // Platform-specific config from auto-deploy-agent
}

export interface ContentMix {
  educational: number; // Percentage (default 70)
  promotional: number; // Percentage (default 20)
  news: number;        // Percentage (default 10)
}

export interface ScheduledPost {
  id?: number;
  portfolioId: string;
  scheduledFor: string; // ISO timestamp
  contentType: string;
  topic: string;
  platforms: string[]; // JSON array
  status: 'scheduled' | 'generating' | 'generated' | 'publishing' | 'published' | 'failed';
  contentId?: string; // Reference to content_empire table
  deploymentId?: string;
  generatedAt?: string;
  publishedAt?: string;
  error?: string;
  createdAt?: string;
}

export interface CalendarReport {
  success: boolean;
  scheduledPosts: ScheduledPost[];
  totalPosts: number;
  breakdown: {
    educational: number;
    promotional: number;
    news: number;
  };
  platformDistribution: Record<string, number>;
  estimatedCost: number;
  message?: string;
  error?: string;
}

// ============================================================================
// OPTIMAL POSTING TIMES
// ============================================================================

interface PostingWindow {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  hour: number;
  score: number; // 1-10, higher = better engagement
}

const OPTIMAL_TIMES: Record<string, PostingWindow[]> = {
  linkedin: [
    { dayOfWeek: 1, hour: 7, score: 10 },  // Monday 7 AM
    { dayOfWeek: 1, hour: 8, score: 9 },   // Monday 8 AM
    { dayOfWeek: 2, hour: 7, score: 10 },  // Tuesday 7 AM
    { dayOfWeek: 2, hour: 12, score: 8 },  // Tuesday 12 PM
    { dayOfWeek: 3, hour: 7, score: 10 },  // Wednesday 7 AM
    { dayOfWeek: 3, hour: 12, score: 8 },  // Wednesday 12 PM
    { dayOfWeek: 4, hour: 7, score: 9 },   // Thursday 7 AM
    { dayOfWeek: 4, hour: 12, score: 8 },  // Thursday 12 PM
  ],
  facebook: [
    { dayOfWeek: 1, hour: 19, score: 9 },  // Monday 7 PM
    { dayOfWeek: 2, hour: 19, score: 9 },  // Tuesday 7 PM
    { dayOfWeek: 3, hour: 19, score: 10 }, // Wednesday 7 PM
    { dayOfWeek: 4, hour: 19, score: 9 },  // Thursday 7 PM
    { dayOfWeek: 5, hour: 19, score: 8 },  // Friday 7 PM
    { dayOfWeek: 6, hour: 14, score: 8 },  // Saturday 2 PM
    { dayOfWeek: 0, hour: 14, score: 7 },  // Sunday 2 PM
  ],
  twitter: [
    { dayOfWeek: 1, hour: 13, score: 9 },  // Monday 1 PM
    { dayOfWeek: 1, hour: 14, score: 8 },  // Monday 2 PM
    { dayOfWeek: 2, hour: 13, score: 10 }, // Tuesday 1 PM
    { dayOfWeek: 3, hour: 13, score: 10 }, // Wednesday 1 PM
    { dayOfWeek: 4, hour: 13, score: 9 },  // Thursday 1 PM
    { dayOfWeek: 5, hour: 13, score: 8 },  // Friday 1 PM
  ],
  gmb: [
    { dayOfWeek: 1, hour: 9, score: 9 },   // Monday 9 AM
    { dayOfWeek: 2, hour: 10, score: 9 },  // Tuesday 10 AM
    { dayOfWeek: 3, hour: 10, score: 10 }, // Wednesday 10 AM
    { dayOfWeek: 4, hour: 10, score: 9 },  // Thursday 10 AM
    { dayOfWeek: 5, hour: 9, score: 8 },   // Friday 9 AM
  ],
  wordpress: [
    { dayOfWeek: 1, hour: 6, score: 10 },  // Monday 6 AM
    { dayOfWeek: 2, hour: 6, score: 10 },  // Tuesday 6 AM
    { dayOfWeek: 3, hour: 6, score: 10 },  // Wednesday 6 AM
    { dayOfWeek: 4, hour: 6, score: 9 },   // Thursday 6 AM
    { dayOfWeek: 5, hour: 6, score: 8 },   // Friday 6 AM
  ],
  nodejs: [
    { dayOfWeek: 1, hour: 6, score: 10 },  // Monday 6 AM
    { dayOfWeek: 2, hour: 6, score: 10 },  // Tuesday 6 AM
    { dayOfWeek: 3, hour: 6, score: 10 },  // Wednesday 6 AM
    { dayOfWeek: 4, hour: 6, score: 9 },   // Thursday 6 AM
    { dayOfWeek: 5, hour: 6, score: 8 },   // Friday 6 AM
  ],
};

// ============================================================================
// CONTENT CALENDAR AGENT
// ============================================================================

export class ContentCalendarAgent {
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'geo-seo.db');
    this.ensureScheduledPostsTable();
  }

  /**
   * Create scheduled_posts table if it doesn't exist
   */
  private ensureScheduledPostsTable(): void {
    const db = new Database(this.dbPath);
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS scheduled_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          portfolio_id TEXT NOT NULL,
          scheduled_for TEXT NOT NULL,
          content_type TEXT NOT NULL,
          topic TEXT NOT NULL,
          platforms TEXT NOT NULL DEFAULT '[]',
          status TEXT NOT NULL DEFAULT 'scheduled',
          content_id TEXT,
          deployment_id TEXT,
          generated_at TEXT,
          published_at TEXT,
          error TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (portfolio_id) REFERENCES company_portfolios(id)
        );

        CREATE INDEX IF NOT EXISTS idx_scheduled_posts_portfolio ON scheduled_posts(portfolio_id);
        CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);
        CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
      `);
    } finally {
      db.close();
    }
  }

  /**
   * Generate a content calendar for a date range
   */
  async generateCalendar(request: CalendarRequest): Promise<CalendarReport> {
    console.log(`[Content Calendar] Generating calendar for portfolio ${request.portfolioId}`);
    console.log(`[Content Calendar] Date range: ${request.startDate} to ${request.endDate}`);

    const db = new Database(this.dbPath);
    try {
      // Get portfolio details
      const portfolio = db.prepare('SELECT * FROM company_portfolios WHERE id = ?').get(request.portfolioId) as any;
      if (!portfolio) {
        return {
          success: false,
          scheduledPosts: [],
          totalPosts: 0,
          breakdown: { educational: 0, promotional: 0, news: 0 },
          platformDistribution: {},
          estimatedCost: 0,
          error: 'Portfolio not found'
        };
      }

      // Set default content mix
      const contentMix: ContentMix = request.contentMix || {
        educational: 70,
        promotional: 20,
        news: 10
      };

      // Calculate total posts needed
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      const daysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const weeksInRange = Math.ceil(daysInRange / 7);

      let totalPostsNeeded = 0;
      const platformDistribution: Record<string, number> = {};

      request.platforms.forEach(platform => {
        const postsForPlatform = platform.postsPerWeek * weeksInRange;
        totalPostsNeeded += postsForPlatform;
        platformDistribution[platform.platform] = postsForPlatform;
      });

      console.log(`[Content Calendar] Total posts needed: ${totalPostsNeeded} over ${weeksInRange} weeks`);

      // Calculate content type breakdown
      const breakdown = {
        educational: Math.ceil(totalPostsNeeded * contentMix.educational / 100),
        promotional: Math.ceil(totalPostsNeeded * contentMix.promotional / 100),
        news: Math.floor(totalPostsNeeded * contentMix.news / 100)
      };

      // Generate scheduled posts
      const scheduledPosts: ScheduledPost[] = [];
      const contentTypes = [
        ...Array(breakdown.educational).fill('educational'),
        ...Array(breakdown.promotional).fill('promotional'),
        ...Array(breakdown.news).fill('news')
      ];

      // Shuffle content types for variety
      this.shuffleArray(contentTypes);

      // Generate topics based on portfolio industry
      const topics = await this.generateTopics(portfolio, contentTypes.length);

      // Schedule posts
      let postIndex = 0;
      for (const platform of request.platforms) {
        const postsForPlatform = platform.postsPerWeek * weeksInRange;
        const optimalTimes = OPTIMAL_TIMES[platform.platform] || OPTIMAL_TIMES.wordpress;

        for (let i = 0; i < postsForPlatform; i++) {
          if (postIndex >= contentTypes.length) break;

          const scheduledTime = this.findNextOptimalTime(startDate, endDate, optimalTimes, scheduledPosts);
          const contentType = contentTypes[postIndex];
          const topic = topics[postIndex] || `${contentType} content for ${portfolio.company_name}`;

          const post: ScheduledPost = {
            portfolioId: request.portfolioId,
            scheduledFor: scheduledTime.toISOString(),
            contentType,
            topic,
            platforms: [platform.platform],
            status: 'scheduled',
            createdAt: new Date().toISOString()
          };

          scheduledPosts.push(post);
          postIndex++;
        }
      }

      // Save scheduled posts to database
      const insertStmt = db.prepare(`
        INSERT INTO scheduled_posts (
          portfolio_id, scheduled_for, content_type, topic, platforms, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const post of scheduledPosts) {
        insertStmt.run(
          post.portfolioId,
          post.scheduledFor,
          post.contentType,
          post.topic,
          JSON.stringify(post.platforms),
          post.status,
          post.createdAt
        );
      }

      // Calculate estimated cost
      const estimatedCost = this.calculateEstimatedCost(scheduledPosts);

      console.log(`[Content Calendar] Successfully scheduled ${scheduledPosts.length} posts`);

      // If auto-generate is enabled, trigger immediate content generation
      if (request.autoGenerate) {
        console.log(`[Content Calendar] Auto-generate enabled, triggering immediate generation...`);
        // This would be handled by a separate cron job or worker
      }

      return {
        success: true,
        scheduledPosts,
        totalPosts: scheduledPosts.length,
        breakdown,
        platformDistribution,
        estimatedCost,
        message: `Successfully scheduled ${scheduledPosts.length} posts across ${request.platforms.length} platforms`
      };

    } catch (error: any) {
      console.error('[Content Calendar] Error generating calendar:', error);
      return {
        success: false,
        scheduledPosts: [],
        totalPosts: 0,
        breakdown: { educational: 0, promotional: 0, news: 0 },
        platformDistribution: {},
        estimatedCost: 0,
        error: error.message
      };
    } finally {
      db.close();
    }
  }

  /**
   * Get scheduled posts for a portfolio
   */
  getScheduledPosts(portfolioId: string, status?: string): ScheduledPost[] {
    const db = new Database(this.dbPath);
    try {
      let query = 'SELECT * FROM scheduled_posts WHERE portfolio_id = ?';
      const params: any[] = [portfolioId];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY scheduled_for ASC';

      const posts = db.prepare(query).all(...params) as any[];
      return posts.map(post => ({
        ...post,
        platforms: JSON.parse(post.platforms || '[]')
      }));
    } finally {
      db.close();
    }
  }

  /**
   * Process due posts (to be called by cron job)
   */
  async processDuePosts(): Promise<void> {
    console.log('[Content Calendar] Processing due posts...');

    const db = new Database(this.dbPath);
    try {
      const now = new Date().toISOString();
      const duePosts = db.prepare(`
        SELECT * FROM scheduled_posts
        WHERE status = 'scheduled' AND scheduled_for <= ?
        ORDER BY scheduled_for ASC
        LIMIT 10
      `).all(now) as any[];

      console.log(`[Content Calendar] Found ${duePosts.length} due posts`);

      for (const post of duePosts) {
        await this.processPost(post);
      }
    } finally {
      db.close();
    }
  }

  /**
   * Process a single scheduled post
   */
  private async processPost(post: any): Promise<void> {
    const db = new Database(this.dbPath);
    try {
      console.log(`[Content Calendar] Processing post ${post.id}: ${post.topic}`);

      // Update status to generating
      db.prepare('UPDATE scheduled_posts SET status = ? WHERE id = ?').run('generating', post.id);

      // Get portfolio details
      const portfolio = db.prepare('SELECT * FROM company_portfolios WHERE id = ?').get(post.portfolio_id) as any;
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      // Determine content format based on type
      let contentFormat: 'blog' | 'social_post' | 'white_paper' = 'blog';
      if (post.content_type === 'educational') {
        contentFormat = 'blog';
      } else if (post.content_type === 'promotional') {
        contentFormat = 'social_post';
      } else if (post.content_type === 'news') {
        contentFormat = 'blog';
      }

      // Generate content
      const contentPackage = await contentGenerationAgent.generateContent({
        portfolioId: post.portfolio_id,
        topic: post.topic,
        industry: portfolio.industry,
        contentType: contentFormat,
        targetAudience: 'Business decision makers',
        depth: 'comprehensive',
        includeCitations: true
      });

      if (!contentPackage) {
        throw new Error('Content generation failed');
      }

      // Update status to generated
      db.prepare('UPDATE scheduled_posts SET status = ?, content_id = ?, generated_at = ? WHERE id = ?')
        .run('generated', contentPackage.id || '', new Date().toISOString(), post.id);

      console.log(`[Content Calendar] Content generated for post ${post.id}`);

      // Deploy to platforms
      const platforms = JSON.parse(post.platforms || '[]');
      const platformConfigs: any = {};

      // Build platform configs from environment variables
      // (In production, these would be stored in database per portfolio)
      if (platforms.includes('nodejs')) {
        platformConfigs.nodejs = {
          endpoint: process.env.NODEJS_PUBLISH_ENDPOINT || 'http://localhost:3001/api/publish'
        };
      }
      if (platforms.includes('wordpress')) {
        platformConfigs.wordpress = {
          siteUrl: process.env.WORDPRESS_SITE_URL || '',
          username: process.env.WORDPRESS_USERNAME || '',
          applicationPassword: process.env.WORDPRESS_APP_PASSWORD || ''
        };
      }
      if (platforms.includes('linkedin')) {
        platformConfigs.linkedin = {
          accessToken: process.env.LINKEDIN_ACCESS_TOKEN || '',
          personUrn: process.env.LINKEDIN_PERSON_URN || ''
        };
      }
      if (platforms.includes('facebook')) {
        platformConfigs.facebook = {
          accessToken: process.env.FACEBOOK_ACCESS_TOKEN || '',
          pageId: process.env.FACEBOOK_PAGE_ID || ''
        };
      }
      if (platforms.includes('twitter')) {
        platformConfigs.twitter = {
          apiKey: process.env.TWITTER_API_KEY || '',
          apiSecret: process.env.TWITTER_API_SECRET || '',
          accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
          accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || ''
        };
      }
      if (platforms.includes('gmb')) {
        platformConfigs.gmb = {
          accessToken: process.env.GMB_ACCESS_TOKEN || '',
          accountId: process.env.GMB_ACCOUNT_ID || '',
          locationId: process.env.GMB_LOCATION_ID || ''
        };
      }

      // Update status to publishing
      db.prepare('UPDATE scheduled_posts SET status = ? WHERE id = ?').run('publishing', post.id);

      // Deploy content
      const deploymentReport = await autoDeployAgent.deployContent({
        contentId: contentPackage.id,
        content: contentPackage,
        platforms: platformConfigs,
        publishNow: true,
        portfolioId: post.portfolio_id
      });

      if (deploymentReport.successfulDeployments > 0) {
        db.prepare('UPDATE scheduled_posts SET status = ?, deployment_id = ?, published_at = ? WHERE id = ?')
          .run('published', deploymentReport.deploymentId || '', new Date().toISOString(), post.id);
        console.log(`[Content Calendar] Post ${post.id} published successfully to ${deploymentReport.successfulDeployments} platforms`);
      } else {
        throw new Error(deploymentReport.results[0]?.error || 'Deployment failed');
      }

    } catch (error: any) {
      console.error(`[Content Calendar] Error processing post ${post.id}:`, error);
      db.prepare('UPDATE scheduled_posts SET status = ?, error = ? WHERE id = ?')
        .run('failed', error.message, post.id);
    } finally {
      db.close();
    }
  }

  /**
   * Find next optimal posting time
   */
  private findNextOptimalTime(
    startDate: Date,
    endDate: Date,
    optimalTimes: PostingWindow[],
    existingPosts: ScheduledPost[]
  ): Date {
    let currentDate = new Date(startDate);
    const existingTimestamps = new Set(existingPosts.map(p => p.scheduledFor));

    // Sort optimal times by score (highest first)
    const sortedTimes = [...optimalTimes].sort((a, b) => b.score - a.score);

    while (currentDate <= endDate) {
      for (const window of sortedTimes) {
        const testDate = new Date(currentDate);

        // Find next occurrence of this day of week
        while (testDate.getDay() !== window.dayOfWeek) {
          testDate.setDate(testDate.getDate() + 1);
          if (testDate > endDate) break;
        }

        if (testDate > endDate) continue;

        // Set the hour
        testDate.setHours(window.hour, 0, 0, 0);

        // Check if this time is already taken
        const timestamp = testDate.toISOString();
        if (!existingTimestamps.has(timestamp) && testDate >= startDate && testDate <= endDate) {
          return testDate;
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fallback: just find next available slot
    return new Date(startDate.getTime() + (existingPosts.length * 60 * 60 * 1000)); // 1 hour increments
  }

  /**
   * Generate topics based on portfolio industry
   */
  private async generateTopics(portfolio: any, count: number): Promise<string[]> {
    const topics: string[] = [];
    const industry = portfolio.industry || 'general business';

    // Educational topics (70%)
    const educationalTopics = [
      `How to choose the right ${industry} solution`,
      `Top 10 mistakes in ${industry}`,
      `Understanding ${industry} regulations`,
      `${industry} best practices for 2024`,
      `Case study: Successful ${industry} implementation`,
      `The future of ${industry}`,
      `Common ${industry} myths debunked`,
      `${industry} cost-benefit analysis`,
    ];

    // Promotional topics (20%)
    const promotionalTopics = [
      `Why choose ${portfolio.company_name} for ${industry}`,
      `Special offer: ${industry} services`,
      `Meet our ${industry} experts`,
      `Customer success story with ${portfolio.company_name}`,
    ];

    // News topics (10%)
    const newsTopics = [
      `Latest ${industry} industry news`,
      `New ${industry} regulations announced`,
      `${industry} market trends`,
    ];

    // Combine and shuffle
    const allTopics = [...educationalTopics, ...promotionalTopics, ...newsTopics];
    this.shuffleArray(allTopics);

    return allTopics.slice(0, count);
  }

  /**
   * Calculate estimated cost for scheduled posts
   */
  private calculateEstimatedCost(posts: ScheduledPost[]): number {
    // Cost per post (content generation + deployment)
    const costPerBlog = 0.043; // From test results
    const costPerSocial = 0.001;
    const costPerWhitepaper = 0.002;

    let totalCost = 0;
    posts.forEach(post => {
      if (post.contentType === 'educational') {
        totalCost += costPerBlog;
      } else if (post.contentType === 'promotional') {
        totalCost += costPerSocial;
      } else {
        totalCost += costPerWhitepaper;
      }
    });

    return totalCost;
  }

  /**
   * Shuffle array in place (Fisher-Yates algorithm)
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Delete scheduled post
   */
  deleteScheduledPost(postId: number): boolean {
    const db = new Database(this.dbPath);
    try {
      const result = db.prepare('DELETE FROM scheduled_posts WHERE id = ?').run(postId);
      return result.changes > 0;
    } finally {
      db.close();
    }
  }

  /**
   * Update scheduled post
   */
  updateScheduledPost(postId: number, updates: Partial<ScheduledPost>): boolean {
    const db = new Database(this.dbPath);
    try {
      const setParts: string[] = [];
      const values: any[] = [];

      if (updates.scheduledFor) {
        setParts.push('scheduled_for = ?');
        values.push(updates.scheduledFor);
      }
      if (updates.topic) {
        setParts.push('topic = ?');
        values.push(updates.topic);
      }
      if (updates.contentType) {
        setParts.push('content_type = ?');
        values.push(updates.contentType);
      }
      if (updates.platforms) {
        setParts.push('platforms = ?');
        values.push(JSON.stringify(updates.platforms));
      }
      if (updates.status) {
        setParts.push('status = ?');
        values.push(updates.status);
      }

      if (setParts.length === 0) return false;

      values.push(postId);
      const query = `UPDATE scheduled_posts SET ${setParts.join(', ')} WHERE id = ?`;
      const result = db.prepare(query).run(...values);
      return result.changes > 0;
    } finally {
      db.close();
    }
  }
}

// Export singleton instance
export const contentCalendarAgent = new ContentCalendarAgent();
