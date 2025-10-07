// Job Scheduler Entry Point
// Export main scheduler and job types

export { JobScheduler, getScheduler } from './job-scheduler';
export { AuditRunner } from './jobs/audit-runner';
export { RankingTracker } from './jobs/ranking-tracker';
export { ReportGenerator } from './jobs/report-generator';

export type {
  Job,
  JobExecution,
  JobSchedule,
  JobStatistics,
  AuditResult,
  LighthouseScore,
  EEATScore,
  RankingResult,
  WeeklyMetrics,
  ReportData,
  JobAlert,
  CronPattern,
  JobConfig,
} from './types';

export { COMMON_CRON_PATTERNS, DEFAULT_JOB_CONFIGS } from './types';

// Example usage:
//
// import { getScheduler } from './src/services/scheduler';
//
// const scheduler = getScheduler();
// scheduler.startAll();
//
// // Trigger a job manually
// await scheduler.triggerJob('audit-runner');
//
// // Get job status
// const status = scheduler.getJobStatus('audit-runner');
