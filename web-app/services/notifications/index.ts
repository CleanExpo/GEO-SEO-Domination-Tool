/**
 * Notification Service - Main Export
 * Central export point for all notification-related functionality
 */

// Core Service
export { EmailService, createEmailService } from './email-service';

// Types
export type {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationChannel,
  BaseNotification,
  WeeklyReportNotification,
  RankingAlertNotification,
  AuditCompleteNotification,
  SystemNotification,
  Notification,
  NotificationPreferences,
  NotificationQueueEntry,
  EmailSendResult,
  NotificationServiceConfig,
  EmailTemplateData,
  EmailTemplate,
  UnsubscribeTokenData,
} from './notification-types';

// Template generators
export { generateWeeklyReportTemplate } from './templates/weekly-report';
export { generateRankingAlertTemplate } from './templates/ranking-alert';
export { generateAuditCompleteTemplate } from './templates/audit-complete';
export { generateSystemNotificationTemplate } from './templates/system-notification';
export { generateSupportContactTemplate } from './templates/support-contact';

/**
 * Example Usage:
 *
 * // Create email service
 * import { createEmailService } from '@/services/notifications';
 * const emailService = createEmailService(db);
 *
 * // Send a notification
 * const result = await emailService.sendNotification({
 *   type: 'ranking_alert',
 *   priority: 'high',
 *   recipientEmail: 'user@example.com',
 *   recipientName: 'John Doe',
 *   subject: 'Ranking Alert',
 *   data: {
 *     companyId: 1,
 *     companyName: 'Acme Corp',
 *     keyword: 'plumber near me',
 *     location: 'New York, NY',
 *     oldPosition: 5,
 *     newPosition: 2,
 *     change: 3,
 *     date: '2025-10-02',
 *   },
 * });
 *
 * // Process notification queue
 * await emailService.processQueue();
 */
