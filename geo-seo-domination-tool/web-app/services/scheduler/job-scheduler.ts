import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { AuditRunner } from './jobs/audit-runner';
import { RankingTracker } from './jobs/ranking-tracker';
import { ReportGenerator } from './jobs/report-generator';

interface Job {
  name: string;
  schedule: string;
  task: ScheduledTask;
  handler: () => Promise<void>;
  enabled: boolean;
}

interface JobExecution {
  jobName: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'success' | 'failed';
  error?: string;
  details?: any;
}

export class JobScheduler {
  private jobs: Map<string, Job> = new Map();
  private executionHistory: JobExecution[] = [];
  private maxHistorySize = 100;
  private auditRunner: AuditRunner;
  private rankingTracker: RankingTracker;
  private reportGenerator: ReportGenerator;

  constructor() {
    this.auditRunner = new AuditRunner();
    this.rankingTracker = new RankingTracker();
    this.reportGenerator = new ReportGenerator();
    this.initializeJobs();
  }

  private initializeJobs(): void {
    // Audit Runner - Every day at 2 AM
    this.registerJob({
      name: 'audit-runner',
      schedule: '0 2 * * *',
      handler: async () => await this.auditRunner.execute(),
      enabled: true,
    });

    // Ranking Tracker - Every day at 3 AM
    this.registerJob({
      name: 'ranking-tracker',
      schedule: '0 3 * * *',
      handler: async () => await this.rankingTracker.execute(),
      enabled: true,
    });

    // Report Generator - Every Monday at 8 AM
    this.registerJob({
      name: 'report-generator',
      schedule: '0 8 * * 1',
      handler: async () => await this.reportGenerator.execute(),
      enabled: true,
    });

    // Hourly ranking check for high-priority keywords
    this.registerJob({
      name: 'ranking-tracker-hourly',
      schedule: '0 * * * *',
      handler: async () => await this.rankingTracker.executeHighPriority(),
      enabled: false, // Disabled by default
    });

    console.log('Job scheduler initialized with', this.jobs.size, 'jobs');
  }

  private registerJob(config: {
    name: string;
    schedule: string;
    handler: () => Promise<void>;
    enabled: boolean;
  }): void {
    const { name, schedule, handler, enabled } = config;

    const task = cron.schedule(
      schedule,
      async () => {
        await this.executeJob(name, handler);
      },
      {
        timezone: 'America/New_York', // Adjust to your timezone
      }
    );

    // Stop the task if not enabled
    if (!enabled) {
      task.stop();
    }

    this.jobs.set(name, {
      name,
      schedule,
      task,
      handler,
      enabled,
    });

    if (enabled) {
      task.start();
      console.log(`Job '${name}' scheduled with cron pattern: ${schedule}`);
    }
  }

  private async executeJob(
    jobName: string,
    handler: () => Promise<void>
  ): Promise<void> {
    const execution: JobExecution = {
      jobName,
      startTime: new Date(),
      status: 'running',
    };

    this.addExecutionHistory(execution);
    console.log(`[${execution.startTime.toISOString()}] Starting job: ${jobName}`);

    try {
      await handler();
      execution.status = 'success';
      execution.endTime = new Date();
      const duration = execution.endTime.getTime() - execution.startTime.getTime();
      console.log(
        `[${execution.endTime.toISOString()}] Job '${jobName}' completed successfully in ${duration}ms`
      );
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(
        `[${execution.endTime.toISOString()}] Job '${jobName}' failed:`,
        execution.error
      );
    }

    this.updateExecutionHistory(execution);
  }

  public async triggerJob(jobName: string): Promise<JobExecution> {
    const job = this.jobs.get(jobName);

    if (!job) {
      throw new Error(`Job '${jobName}' not found`);
    }

    const execution: JobExecution = {
      jobName,
      startTime: new Date(),
      status: 'running',
    };

    this.addExecutionHistory(execution);
    console.log(`[${execution.startTime.toISOString()}] Manually triggering job: ${jobName}`);

    try {
      await job.handler();
      execution.status = 'success';
      execution.endTime = new Date();
      const duration = execution.endTime.getTime() - execution.startTime.getTime();
      console.log(
        `[${execution.endTime.toISOString()}] Job '${jobName}' completed successfully in ${duration}ms`
      );
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(
        `[${execution.endTime.toISOString()}] Job '${jobName}' failed:`,
        execution.error
      );
    }

    this.updateExecutionHistory(execution);
    return execution;
  }

  public enableJob(jobName: string): void {
    const job = this.jobs.get(jobName);
    if (!job) {
      throw new Error(`Job '${jobName}' not found`);
    }

    if (!job.enabled) {
      job.task.start();
      job.enabled = true;
      console.log(`Job '${jobName}' enabled`);
    }
  }

  public disableJob(jobName: string): void {
    const job = this.jobs.get(jobName);
    if (!job) {
      throw new Error(`Job '${jobName}' not found`);
    }

    if (job.enabled) {
      job.task.stop();
      job.enabled = false;
      console.log(`Job '${jobName}' disabled`);
    }
  }

  public updateJobSchedule(jobName: string, newSchedule: string): void {
    const job = this.jobs.get(jobName);
    if (!job) {
      throw new Error(`Job '${jobName}' not found`);
    }

    // Validate cron pattern
    if (!cron.validate(newSchedule)) {
      throw new Error(`Invalid cron pattern: ${newSchedule}`);
    }

    // Stop the old task
    job.task.stop();

    // Create new task with updated schedule
    const newTask = cron.schedule(
      newSchedule,
      async () => {
        await this.executeJob(jobName, job.handler);
      },
      {
        timezone: 'America/New_York',
      }
    );

    job.task = newTask;
    job.schedule = newSchedule;

    // Start the task only if the job is enabled
    if (job.enabled) {
      newTask.start();
    } else {
      newTask.stop();
    }

    console.log(`Job '${jobName}' schedule updated to: ${newSchedule}`);
  }

  public getJobStatus(jobName?: string): any {
    if (jobName) {
      const job = this.jobs.get(jobName);
      if (!job) {
        throw new Error(`Job '${jobName}' not found`);
      }

      const recentExecutions = this.executionHistory
        .filter((e) => e.jobName === jobName)
        .slice(-5);

      return {
        name: job.name,
        schedule: job.schedule,
        enabled: job.enabled,
        recentExecutions,
      };
    }

    // Return all jobs
    const allJobs = Array.from(this.jobs.values()).map((job) => ({
      name: job.name,
      schedule: job.schedule,
      enabled: job.enabled,
      lastExecution: this.executionHistory
        .filter((e) => e.jobName === job.name)
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0],
    }));

    return allJobs;
  }

  public getExecutionHistory(limit: number = 20): JobExecution[] {
    return this.executionHistory
      .slice(-limit)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  private addExecutionHistory(execution: JobExecution): void {
    this.executionHistory.push(execution);

    // Trim history if it exceeds max size
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory = this.executionHistory.slice(-this.maxHistorySize);
    }
  }

  private updateExecutionHistory(execution: JobExecution): void {
    const index = this.executionHistory.findIndex(
      (e) =>
        e.jobName === execution.jobName &&
        e.startTime.getTime() === execution.startTime.getTime()
    );

    if (index !== -1) {
      this.executionHistory[index] = execution;
    }
  }

  public startAll(): void {
    this.jobs.forEach((job) => {
      if (job.enabled) {
        job.task.start();
      }
    });
    console.log('All enabled jobs started');
  }

  public stopAll(): void {
    this.jobs.forEach((job) => {
      job.task.stop();
    });
    console.log('All jobs stopped');
  }

  public getAvailableJobs(): string[] {
    return Array.from(this.jobs.keys());
  }
}

// Singleton instance
let schedulerInstance: JobScheduler | null = null;

export function getScheduler(): JobScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new JobScheduler();
  }
  return schedulerInstance;
}
