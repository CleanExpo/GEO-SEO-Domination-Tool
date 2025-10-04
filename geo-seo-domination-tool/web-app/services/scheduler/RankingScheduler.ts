import cron from 'node-cron';
import { createClient } from '@/lib/auth/supabase-server';

interface ScheduledJob {
  id: string;
  job_type: string;
  name: string;
  schedule: string;
  is_active: boolean;
  config: {
    keywords?: string[];
    search_engine?: string;
    location?: string;
    company_id?: string;
  };
}

interface CronTask {
  task: cron.ScheduledTask;
  jobId: string;
}

export class RankingScheduler {
  private activeTasks: Map<string, CronTask> = new Map();
  private initialized: boolean = false;

  /**
   * Initialize the scheduler by loading all active jobs from database
   */
  async initialize() {
    if (this.initialized) {
      console.log('RankingScheduler already initialized');
      return;
    }

    try {
      // Skip initialization during build time
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        console.log('Skipping scheduler initialization during build');
        return;
      }

      const supabase = await createClient();
      const { data: jobs, error } = await supabase
        .from('scheduled_jobs')
        .select('*')
        .eq('is_active', true)
        .eq('job_type', 'ranking_check');

      if (error) {
        console.error('Failed to load scheduled jobs:', error);
        return;
      }

      console.log(`Loading ${jobs?.length || 0} active ranking check jobs...`);

      for (const job of jobs || []) {
        this.scheduleJob(job as ScheduledJob);
      }

      this.initialized = true;
      console.log('RankingScheduler initialized successfully');
    } catch (error) {
      console.error('RankingScheduler initialization error:', error);
    }
  }

  /**
   * Schedule a new job
   */
  scheduleJob(job: ScheduledJob) {
    // Remove existing task if any
    this.unscheduleJob(job.id);

    // Validate cron expression
    if (!cron.validate(job.schedule)) {
      console.error(`Invalid cron expression for job ${job.id}: ${job.schedule}`);
      return;
    }

    try {
      const task = cron.schedule(
        job.schedule,
        async () => {
          await this.executeRankingCheck(job);
        },
        {
          timezone: 'America/New_York', // Can be made configurable
        }
      );

      // Start the task
      task.start();

      this.activeTasks.set(job.id, { task, jobId: job.id });
      console.log(`Scheduled job: ${job.name} (${job.id}) with schedule: ${job.schedule}`);
    } catch (error) {
      console.error(`Failed to schedule job ${job.id}:`, error);
    }
  }

  /**
   * Unschedule a job
   */
  unscheduleJob(jobId: string) {
    const cronTask = this.activeTasks.get(jobId);
    if (cronTask) {
      cronTask.task.stop();
      this.activeTasks.delete(jobId);
      console.log(`Unscheduled job: ${jobId}`);
    }
  }

  /**
   * Execute a ranking check job
   */
  private async executeRankingCheck(job: ScheduledJob) {
    console.log(`Executing ranking check job: ${job.name} (${job.id})`);

    const supabase = await createClient();
    const startTime = Date.now();

    try {
      // Record job execution start
      const { data: execution } = await supabase
        .from('job_executions')
        .insert([
          {
            job_id: job.id,
            status: 'running',
            started_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      const executionId = execution?.id;

      // Fetch keywords for the company or from job config
      const keywords = job.config.keywords || [];
      const results: any[] = [];

      // TODO: Actual ranking check implementation
      // This is a placeholder - in production, you would:
      // 1. Fetch keywords from database if company_id is provided
      // 2. Use SERPApi/DataForSEO to check actual rankings
      // 3. Compare with previous rankings
      // 4. Store results in rankings table

      for (const keyword of keywords) {
        // Simulated ranking check
        const simulatedRanking = Math.floor(Math.random() * 100) + 1;

        results.push({
          keyword,
          position: simulatedRanking,
          search_engine: job.config.search_engine || 'google',
          location: job.config.location || 'United States',
          checked_at: new Date().toISOString(),
        });
      }

      // Update last_run_at for the job
      await supabase
        .from('scheduled_jobs')
        .update({
          last_run_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      // Mark execution as successful
      if (executionId) {
        await supabase
          .from('job_executions')
          .update({
            status: 'success',
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            result: { keywords_checked: keywords.length, results },
          })
          .eq('id', executionId);
      }

      console.log(`Ranking check completed successfully: ${job.name}`);
    } catch (error) {
      console.error(`Ranking check failed for job ${job.id}:`, error);

      // Record failure
      await supabase
        .from('job_executions')
        .insert([
          {
            job_id: job.id,
            status: 'failed',
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        ]);
    }
  }

  /**
   * Get status of all active tasks
   */
  getStatus() {
    return {
      initialized: this.initialized,
      activeTasksCount: this.activeTasks.size,
      activeTasks: Array.from(this.activeTasks.values()).map((t) => ({
        jobId: t.jobId,
        isRunning: true, // node-cron doesn't expose status easily
      })),
    };
  }

  /**
   * Stop all tasks and cleanup
   */
  shutdown() {
    console.log('Shutting down RankingScheduler...');

    for (const [jobId, cronTask] of this.activeTasks) {
      cronTask.task.stop();
    }

    this.activeTasks.clear();
    this.initialized = false;

    console.log('RankingScheduler shutdown complete');
  }
}

// Singleton instance
let schedulerInstance: RankingScheduler | null = null;

export function getRankingScheduler(): RankingScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new RankingScheduler();
  }
  return schedulerInstance;
}
