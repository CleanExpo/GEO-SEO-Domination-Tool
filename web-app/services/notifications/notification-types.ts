/**
 * Notification System Type Definitions
 * Defines all notification types, preferences, and queue structures
 */

export type NotificationType =
  | 'weekly_report'
  | 'ranking_alert'
  | 'audit_complete'
  | 'system_notification'
  | 'keyword_ranking_change'
  | 'competitor_alert'
  | 'citation_issue'
  | 'scheduled_report';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'queued';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

/**
 * Base notification interface
 */
export interface BaseNotification {
  id?: string;
  type: NotificationType;
  priority: NotificationPriority;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  createdAt?: Date;
  scheduledFor?: Date;
}

/**
 * Weekly Report Notification
 */
export interface WeeklyReportNotification extends BaseNotification {
  type: 'weekly_report';
  data: {
    companyId: number;
    companyName: string;
    reportPeriod: {
      start: string;
      end: string;
    };
    metrics: {
      totalKeywords: number;
      rankingImprovements: number;
      rankingDecreases: number;
      averagePosition: number;
      topKeywords: Array<{
        keyword: string;
        position: number;
        change: number;
      }>;
    };
    audits: {
      total: number;
      criticalIssues: number;
      improvements: number;
    };
    competitors: {
      total: number;
      gainedPositions: number;
      lostPositions: number;
    };
    reportUrl?: string;
  };
}

/**
 * Ranking Alert Notification
 */
export interface RankingAlertNotification extends BaseNotification {
  type: 'ranking_alert';
  data: {
    companyId: number;
    companyName: string;
    keyword: string;
    location: string;
    oldPosition: number;
    newPosition: number;
    change: number;
    date: string;
    competitorData?: Array<{
      name: string;
      position: number;
    }>;
  };
}

/**
 * Audit Complete Notification
 */
export interface AuditCompleteNotification extends BaseNotification {
  type: 'audit_complete';
  data: {
    companyId: number;
    companyName: string;
    auditId: number;
    auditDate: string;
    lighthouseScores: {
      performance: number;
      accessibility: number;
      bestPractices: number;
      seo: number;
      pwa?: number;
    };
    eeatScores: {
      experience: number;
      expertise: number;
      authoritativeness: number;
      trustworthiness: number;
    };
    criticalIssues: number;
    highPriorityIssues: number;
    mediumPriorityIssues: number;
    totalIssues: number;
    auditUrl?: string;
  };
}

/**
 * System Notification
 */
export interface SystemNotification extends BaseNotification {
  type: 'system_notification';
  data: {
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
    metadata?: Record<string, any>;
  };
}

/**
 * Keyword Ranking Change Notification
 */
export interface KeywordRankingChangeNotification extends BaseNotification {
  type: 'keyword_ranking_change';
  data: {
    companyId: number;
    companyName: string;
    keyword: string;
    location: string;
    oldPosition: number;
    newPosition: number;
    change: number;
    date: string;
  };
}

/**
 * Competitor Alert Notification
 */
export interface CompetitorAlertNotification extends BaseNotification {
  type: 'competitor_alert';
  data: {
    title: string;
    message: string;
    competitorName: string;
    actionUrl?: string;
    actionText?: string;
    metadata?: Record<string, any>;
  };
}

/**
 * Citation Issue Notification
 */
export interface CitationIssueNotification extends BaseNotification {
  type: 'citation_issue';
  data: {
    title: string;
    message: string;
    citationSource?: string;
    actionUrl?: string;
    actionText?: string;
    metadata?: Record<string, any>;
  };
}

/**
 * Scheduled Report Notification
 */
export interface ScheduledReportNotification extends BaseNotification {
  type: 'scheduled_report';
  data: {
    companyId: number;
    companyName: string;
    reportPeriod: {
      start: string;
      end: string;
    };
    reportType: string;
    reportUrl?: string;
    metrics?: Record<string, any>;
  };
}

/**
 * Union type for all notifications
 */
export type Notification =
  | WeeklyReportNotification
  | RankingAlertNotification
  | AuditCompleteNotification
  | SystemNotification
  | KeywordRankingChangeNotification
  | CompetitorAlertNotification
  | CitationIssueNotification
  | ScheduledReportNotification;

/**
 * Notification Preferences
 */
export interface NotificationPreferences {
  userId?: string;
  email: string;
  enabled: boolean;
  channels: {
    email: boolean;
    sms?: boolean;
    push?: boolean;
    inApp?: boolean;
  };
  types: {
    weekly_report: boolean;
    ranking_alert: boolean;
    audit_complete: boolean;
    system_notification: boolean;
    keyword_ranking_change: boolean;
    competitor_alert: boolean;
    citation_issue: boolean;
    scheduled_report: boolean;
  };
  frequency: {
    weekly_report: 'weekly' | 'biweekly' | 'monthly';
    ranking_alert: 'immediate' | 'daily_digest' | 'weekly_digest';
    audit_complete: 'immediate' | 'daily_digest';
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
    timezone: string;
  };
  unsubscribeToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Notification Queue Entry
 */
export interface NotificationQueueEntry {
  id?: number;
  notificationType: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  recipientEmail: string;
  subject: string;
  payload: string; // JSON stringified notification data
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  errorMessage?: string;
  scheduledFor?: Date;
  sentAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Email Send Result
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryable?: boolean;
}

/**
 * Notification Service Configuration
 */
export interface NotificationServiceConfig {
  provider: 'resend' | 'sendgrid';
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  maxRetries: number;
  retryDelay: number; // milliseconds
  batchSize: number;
  enableQueue: boolean;
}

/**
 * Template Data for Email Rendering
 */
export interface EmailTemplateData {
  recipientName?: string;
  companyName?: string;
  unsubscribeUrl?: string;
  previewText?: string;
  [key: string]: any;
}

/**
 * Email Template Result
 */
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Unsubscribe Token Data
 */
export interface UnsubscribeTokenData {
  email: string;
  notificationTypes?: NotificationType[];
  expiresAt?: Date;
}
