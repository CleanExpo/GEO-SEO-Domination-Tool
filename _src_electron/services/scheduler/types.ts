// Type definitions for the job scheduler system

export interface Job {
  name: string;
  schedule: string; // Cron pattern
  handler: () => Promise<void>;
  enabled: boolean;
  description?: string;
}

export interface JobExecution {
  id?: number;
  jobName: string;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  details?: any;
  errorMessage?: string;
}

export interface JobSchedule {
  id?: number;
  jobName: string;
  schedule: string;
  enabled: boolean;
  description?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JobStatistics {
  jobName: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgDurationMs: number;
  lastExecution?: Date;
  lastStatus?: string;
}

export interface AuditResult {
  companyId: number;
  companyName: string;
  lighthouseScore: LighthouseScore;
  eeatScore: EEATScore;
  recommendations: string[];
  status: 'success' | 'failed';
  error?: string;
}

export interface LighthouseScore {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
}

export interface EEATScore {
  experience: number;
  expertise: number;
  authoritativeness: number;
  trustworthiness: number;
}

export interface RankingResult {
  keywordId: number;
  keyword: string;
  location: string;
  previousRank?: number;
  currentRank: number;
  rankChange: number;
  status: 'success' | 'failed';
  error?: string;
}

export interface WeeklyMetrics {
  totalAudits: number;
  averageScore: number;
  rankingsTracked: number;
  averageRank: number;
  rankImprovements: number;
  rankDeclines: number;
  criticalIssues: number;
}

export interface ReportData {
  companyId: number;
  companyName: string;
  weekStart: Date;
  weekEnd: Date;
  auditsSummary: any;
  rankingsSummary: any;
  keyMetrics: WeeklyMetrics;
  recommendations: string[];
}

export interface JobAlert {
  id?: number;
  jobName: string;
  alertType: 'failure' | 'warning' | 'info';
  message: string;
  details?: any;
  resolved: boolean;
  resolvedAt?: Date;
  createdAt?: Date;
}

export interface CronPattern {
  pattern: string;
  description: string;
  examples?: string[];
}

export const COMMON_CRON_PATTERNS: CronPattern[] = [
  {
    pattern: '* * * * *',
    description: 'Every minute',
  },
  {
    pattern: '*/5 * * * *',
    description: 'Every 5 minutes',
  },
  {
    pattern: '*/15 * * * *',
    description: 'Every 15 minutes',
  },
  {
    pattern: '*/30 * * * *',
    description: 'Every 30 minutes',
  },
  {
    pattern: '0 * * * *',
    description: 'Every hour',
  },
  {
    pattern: '0 */2 * * *',
    description: 'Every 2 hours',
  },
  {
    pattern: '0 0 * * *',
    description: 'Daily at midnight',
  },
  {
    pattern: '0 2 * * *',
    description: 'Daily at 2:00 AM',
  },
  {
    pattern: '0 8 * * *',
    description: 'Daily at 8:00 AM',
  },
  {
    pattern: '0 12 * * *',
    description: 'Daily at noon',
  },
  {
    pattern: '0 0 * * 0',
    description: 'Every Sunday at midnight',
  },
  {
    pattern: '0 8 * * 1',
    description: 'Every Monday at 8:00 AM',
  },
  {
    pattern: '0 0 1 * *',
    description: 'First day of every month at midnight',
  },
];

export interface JobConfig {
  name: string;
  schedule: string;
  enabled: boolean;
  description: string;
  retryOnFailure?: boolean;
  maxRetries?: number;
  timeout?: number; // milliseconds
}

export const DEFAULT_JOB_CONFIGS: JobConfig[] = [
  {
    name: 'audit-runner',
    schedule: '0 2 * * *',
    enabled: true,
    description: 'Run automated SEO audits for companies with scheduled audits enabled',
    retryOnFailure: true,
    maxRetries: 2,
    timeout: 600000, // 10 minutes
  },
  {
    name: 'ranking-tracker',
    schedule: '0 3 * * *',
    enabled: true,
    description: 'Track keyword rankings for all active keywords daily',
    retryOnFailure: true,
    maxRetries: 2,
    timeout: 900000, // 15 minutes
  },
  {
    name: 'ranking-tracker-hourly',
    schedule: '0 * * * *',
    enabled: false,
    description: 'Track high-priority keyword rankings every hour',
    retryOnFailure: false,
    maxRetries: 1,
    timeout: 300000, // 5 minutes
  },
  {
    name: 'report-generator',
    schedule: '0 8 * * 1',
    enabled: true,
    description: 'Generate and send weekly performance reports every Monday',
    retryOnFailure: true,
    maxRetries: 1,
    timeout: 1200000, // 20 minutes
  },
];
