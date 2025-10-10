import { Pool } from 'pg';

interface Keyword {
  id: number;
  company_id: number;
  company_name: string;
  keyword: string;
  location: string;
  current_rank?: number;
  is_priority: boolean;
}

interface RankingResult {
  keywordId: number;
  keyword: string;
  location: string;
  previousRank?: number;
  currentRank: number;
  rankChange: number;
  status: 'success' | 'failed';
  error?: string;
}

export class RankingTracker {
  private pool: Pool;
  private isRunning = false;
  private isPriorityRunning = false;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'geo_seo_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }

  public async execute(): Promise<void> {
    if (this.isRunning) {

      return;
    }

    this.isRunning = true;
    const startTime = new Date();
    console.log(`[RankingTracker] Starting daily ranking check at ${startTime.toISOString()}`);

    try {
      await this.trackRankings(false);
      const endTime = new Date();

    } catch (error) {
      console.error('[RankingTracker] Job execution failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  public async executeHighPriority(): Promise<void> {
    if (this.isPriorityRunning) {

      return;
    }

    this.isPriorityRunning = true;
    const startTime = new Date();
    console.log(
      `[RankingTracker] Starting high-priority ranking check at ${startTime.toISOString()}`
    );

    try {
      await this.trackRankings(true);
      const endTime = new Date();

    } catch (error) {
      console.error('[RankingTracker] High-priority job execution failed:', error);
      throw error;
    } finally {
      this.isPriorityRunning = false;
    }
  }

  private async trackRankings(priorityOnly: boolean): Promise<void> {
    const startTime = new Date();

    try {
      // Get keywords to track
      const keywords = await this.getKeywordsForTracking(priorityOnly);
      const mode = priorityOnly ? 'high-priority' : 'all';

      if (keywords.length === 0) {

        return;
      }

      const results: RankingResult[] = [];

      // Process each keyword
      for (const keyword of keywords) {
        try {

          const result = await this.checkRanking(keyword);
          results.push(result);

          // Save ranking result
          await this.saveRankingResult(result);

          // Update keyword current rank
          await this.updateKeywordRank(keyword.id, result.currentRank);

          // Wait to avoid rate limiting
          await this.sleep(1500);
        } catch (error) {
          console.error(
            `[RankingTracker] Failed to check ranking for ${keyword.keyword}:`,
            error
          );
          results.push({
            keywordId: keyword.id,
            keyword: keyword.keyword,
            location: keyword.location,
            currentRank: 0,
            rankChange: 0,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Analyze and report significant changes
      await this.analyzeRankingChanges(results);

      // Log summary
      const successful = results.filter((r) => r.status === 'success').length;
      const failed = results.filter((r) => r.status === 'failed').length;
      const improved = results.filter((r) => r.rankChange < 0).length; // Negative = improved rank
      const declined = results.filter((r) => r.rankChange > 0).length; // Positive = declined rank
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();



      // Log to job execution table
      await this.logJobExecution(
        priorityOnly ? 'ranking-tracker-hourly' : 'ranking-tracker',
        startTime,
        endTime,
        'success',
        {
          keywordsProcessed: keywords.length,
          successful,
          failed,
          improved,
          declined,
        }
      );
    } catch (error) {
      const endTime = new Date();
      console.error('[RankingTracker] Job execution failed:', error);
      await this.logJobExecution(
        priorityOnly ? 'ranking-tracker-hourly' : 'ranking-tracker',
        startTime,
        endTime,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  private async getKeywordsForTracking(priorityOnly: boolean): Promise<Keyword[]> {
    let query = `
      SELECT
        k.id,
        k.company_id,
        c.name as company_name,
        k.keyword,
        k.location,
        k.current_rank,
        COALESCE((k.metadata->>'is_priority')::boolean, false) as is_priority
      FROM keywords k
      JOIN companies c ON k.company_id = c.id
      WHERE c.website IS NOT NULL
        AND c.website != ''
    `;

    if (priorityOnly) {
      query += ` AND (k.metadata->>'is_priority')::boolean = true`;
    }

    query += ` ORDER BY k.last_checked ASC LIMIT 100`;

    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('[RankingTracker] Error fetching keywords:', error);
      return [];
    }
  }

  private async checkRanking(keyword: Keyword): Promise<RankingResult> {
    // This would call the actual ranking API (SEMrush, Google Search API, etc.)
    // For now, simulate ranking check
    await this.sleep(1000);

    const previousRank = keyword.current_rank || 0;
    // Simulate rank with some variation
    let currentRank: number;

    if (previousRank === 0) {
      // New keyword, assign random rank
      currentRank = Math.floor(Math.random() * 50) + 1;
    } else {
      // Add some variation to existing rank (-5 to +5)
      const change = Math.floor(Math.random() * 11) - 5;
      currentRank = Math.max(1, Math.min(100, previousRank + change));
    }

    const rankChange = previousRank > 0 ? currentRank - previousRank : 0;

    return {
      keywordId: keyword.id,
      keyword: keyword.keyword,
      location: keyword.location,
      previousRank: previousRank > 0 ? previousRank : undefined,
      currentRank,
      rankChange,
      status: 'success',
    };
  }

  private async saveRankingResult(result: RankingResult): Promise<void> {
    const query = `
      INSERT INTO rankings (
        keyword_id,
        rank,
        rank_change,
        checked_at,
        metadata
      ) VALUES ($1, $2, $3, NOW(), $4)
    `;

    try {
      await this.pool.query(query, [
        result.keywordId,
        result.currentRank,
        result.rankChange,
        JSON.stringify({
          previousRank: result.previousRank,
          location: result.location,
        }),
      ]);

    } catch (error) {
      console.error(
        `[RankingTracker] Error saving ranking for keyword ID ${result.keywordId}:`,
        error
      );
      throw error;
    }
  }

  private async updateKeywordRank(keywordId: number, rank: number): Promise<void> {
    const query = `
      UPDATE keywords
      SET current_rank = $1, last_checked = NOW()
      WHERE id = $2
    `;

    try {
      await this.pool.query(query, [rank, keywordId]);
    } catch (error) {
      console.error('[RankingTracker] Error updating keyword rank:', error);
      // Don't throw - this is not critical
    }
  }

  private async analyzeRankingChanges(results: RankingResult[]): Promise<void> {
    // Find significant changes (>5 positions)
    const significantChanges = results.filter(
      (r) => r.status === 'success' && Math.abs(r.rankChange) >= 5
    );

    if (significantChanges.length > 0) {

      for (const change of significantChanges) {
        const direction = change.rankChange < 0 ? 'improved' : 'declined';
        const magnitude = Math.abs(change.rankChange);
        console.log(
          `[RankingTracker] "${change.keyword}" ${direction} by ${magnitude} positions (now at #${change.currentRank})`
        );

        // Could send notifications here for critical changes
        if (magnitude >= 10) {
          await this.createRankingAlert(change, direction);
        }
      }
    }
  }

  private async createRankingAlert(
    change: RankingResult,
    direction: string
  ): Promise<void> {
    // This would create an alert/notification for significant ranking changes

    // Could insert into alerts table, send email, Slack notification, etc.
  }

  private async logJobExecution(
    jobName: string,
    startTime: Date,
    endTime: Date,
    status: string,
    details: any
  ): Promise<void> {
    const query = `
      INSERT INTO job_executions (
        job_name,
        start_time,
        end_time,
        duration_ms,
        status,
        details
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `;

    const duration = endTime.getTime() - startTime.getTime();

    try {
      await this.pool.query(query, [
        jobName,
        startTime,
        endTime,
        duration,
        status,
        JSON.stringify(details),
      ]);
    } catch (error) {
      console.error('[RankingTracker] Error logging job execution:', error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async cleanup(): Promise<void> {
    await this.pool.end();
  }
}
