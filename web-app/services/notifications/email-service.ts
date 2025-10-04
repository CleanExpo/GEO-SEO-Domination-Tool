/**
 * Email Service
 * Handles sending emails via Resend or SendGrid with queue support
 */

import {
  Notification,
  NotificationQueueEntry,
  EmailSendResult,
  NotificationServiceConfig,
  EmailTemplate,
  NotificationPreferences,
  UnsubscribeTokenData,
} from './notification-types';

/**
 * Email Service Class
 */
export class EmailService {
  private config: NotificationServiceConfig;
  private db: any; // Database connection

  constructor(config: NotificationServiceConfig, db?: any) {
    this.config = config;
    this.db = db;
  }

  /**
   * Send a notification email
   */
  async sendNotification(notification: Notification): Promise<EmailSendResult> {
    try {
      // Check if recipient has unsubscribed or disabled this notification type
      const preferences = await this.getNotificationPreferences(notification.recipientEmail);

      if (!this.canSendNotification(notification, preferences)) {
        return {
          success: false,
          error: 'Recipient has disabled this notification type',
          retryable: false,
        };
      }

      // Generate email template
      const template = await this.generateEmailTemplate(notification, preferences);

      // Send email via provider
      const result = await this.sendEmail({
        to: notification.recipientEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      return result;
    } catch (error) {
      console.error('Error sending notification:', error);

      // Queue the notification if enabled and error is retryable
      if (this.config.enableQueue) {
        await this.queueNotification(notification, error);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: this.isRetryableError(error),
      };
    }
  }

  /**
   * Send email via configured provider (public method for direct use)
   */
  async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<EmailSendResult> {
    if (this.config.provider === 'resend') {
      return this.sendViaResend(params);
    } else if (this.config.provider === 'sendgrid') {
      return this.sendViaSendGrid(params);
    }

    throw new Error(`Unsupported email provider: ${this.config.provider}`);
  }

  /**
   * Send email via Resend
   */
  private async sendViaResend(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<EmailSendResult> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          from: `${this.config.fromName} <${this.config.fromEmail}>`,
          to: params.to,
          subject: params.subject,
          html: params.html,
          text: params.text,
          reply_to: this.config.replyToEmail,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email via Resend');
      }

      const data = await response.json();

      return {
        success: true,
        messageId: data.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      };
    }
  }

  /**
   * Send email via SendGrid
   */
  private async sendViaSendGrid(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<EmailSendResult> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: params.to }],
            },
          ],
          from: {
            email: this.config.fromEmail,
            name: this.config.fromName,
          },
          reply_to: this.config.replyToEmail ? {
            email: this.config.replyToEmail,
          } : undefined,
          subject: params.subject,
          content: [
            {
              type: 'text/plain',
              value: params.text,
            },
            {
              type: 'text/html',
              value: params.html,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0]?.message || 'Failed to send email via SendGrid');
      }

      const messageId = response.headers.get('x-message-id');

      return {
        success: true,
        messageId: messageId || undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      };
    }
  }

  /**
   * Generate email template based on notification type
   */
  private async generateEmailTemplate(
    notification: Notification,
    preferences?: NotificationPreferences
  ): Promise<EmailTemplate> {
    const unsubscribeUrl = preferences?.unsubscribeToken
      ? `${process.env.NEXT_PUBLIC_APP_URL}/notifications/unsubscribe?token=${preferences.unsubscribeToken}`
      : undefined;

    // Import the appropriate template module
    switch (notification.type) {
      case 'weekly_report':
        const { generateWeeklyReportTemplate } = await import('./templates/weekly-report');
        return generateWeeklyReportTemplate(notification, unsubscribeUrl);

      case 'ranking_alert':
        const { generateRankingAlertTemplate } = await import('./templates/ranking-alert');
        return generateRankingAlertTemplate(notification, unsubscribeUrl);

      case 'audit_complete':
        const { generateAuditCompleteTemplate } = await import('./templates/audit-complete');
        return generateAuditCompleteTemplate(notification, unsubscribeUrl);

      case 'system_notification':
        const { generateSystemNotificationTemplate } = await import('./templates/system-notification');
        return generateSystemNotificationTemplate(notification, unsubscribeUrl);

      case 'keyword_ranking_change':
        // Reuse ranking alert template for keyword changes
        const { generateRankingAlertTemplate: generateKeywordTemplate } = await import('./templates/ranking-alert');
        return generateKeywordTemplate(notification, unsubscribeUrl);

      case 'competitor_alert':
        // Reuse system notification template for competitor alerts
        const { generateSystemNotificationTemplate: generateCompetitorTemplate } = await import('./templates/system-notification');
        return generateCompetitorTemplate(notification, unsubscribeUrl);

      case 'citation_issue':
        // Reuse system notification template for citation issues
        const { generateSystemNotificationTemplate: generateCitationTemplate } = await import('./templates/system-notification');
        return generateCitationTemplate(notification, unsubscribeUrl);

      case 'scheduled_report':
        // Reuse weekly report template for scheduled reports
        const { generateWeeklyReportTemplate: generateScheduledTemplate } = await import('./templates/weekly-report');
        return generateScheduledTemplate(notification, unsubscribeUrl);
    }
  }

  /**
   * Check if notification can be sent based on preferences
   */
  private canSendNotification(
    notification: Notification,
    preferences?: NotificationPreferences
  ): boolean {
    if (!preferences) {
      return true; // Default to allowing if no preferences found
    }

    // Check if notifications are globally enabled
    if (!preferences.enabled) {
      return false;
    }

    // Check if email channel is enabled
    if (!preferences.channels.email) {
      return false;
    }

    // Check if this notification type is enabled
    if (preferences.types[notification.type] === false) {
      return false;
    }

    // Check quiet hours
    if (preferences.quietHours?.enabled) {
      if (this.isInQuietHours(preferences.quietHours)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if current time is within quiet hours
   */
  private isInQuietHours(quietHours: NonNullable<NotificationPreferences['quietHours']>): boolean {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      timeZone: quietHours.timezone,
    });

    return currentTime >= quietHours.start && currentTime <= quietHours.end;
  }

  /**
   * Queue a notification for later delivery
   */
  private async queueNotification(notification: Notification, error: any): Promise<void> {
    if (!this.db) {
      console.error('Database not configured for notification queue');
      return;
    }

    const queueEntry: NotificationQueueEntry = {
      notificationType: notification.type,
      priority: notification.priority,
      status: 'queued',
      recipientEmail: notification.recipientEmail,
      subject: notification.subject,
      payload: JSON.stringify(notification),
      attempts: 0,
      maxAttempts: this.config.maxRetries,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      scheduledFor: notification.scheduledFor || new Date(),
      createdAt: new Date(),
    };

    await this.db.run(
      `INSERT INTO notification_queue (
        notification_type, priority, status, recipient_email, subject,
        payload, attempts, max_attempts, error_message, scheduled_for, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        queueEntry.notificationType,
        queueEntry.priority,
        queueEntry.status,
        queueEntry.recipientEmail,
        queueEntry.subject,
        queueEntry.payload,
        queueEntry.attempts,
        queueEntry.maxAttempts,
        queueEntry.errorMessage,
        queueEntry.scheduledFor?.toISOString(),
        queueEntry.createdAt?.toISOString(),
      ]
    );
  }

  /**
   * Process queued notifications
   */
  async processQueue(): Promise<void> {
    if (!this.db) {
      console.error('Database not configured for notification queue');
      return;
    }

    const queuedNotifications = (await this.db.all(
      `SELECT * FROM notification_queue
       WHERE status = 'queued'
       AND attempts < max_attempts
       AND (scheduled_for IS NULL OR scheduled_for <= datetime('now'))
       ORDER BY priority DESC, created_at ASC
       LIMIT ?`,
      [this.config.batchSize]
    )) as NotificationQueueEntry[];

    for (const entry of queuedNotifications) {
      try {
        const notification: Notification = JSON.parse(entry.payload);
        const result = await this.sendNotification(notification);

        if (result.success) {
          // Mark as sent
          await this.db.run(
            `UPDATE notification_queue
             SET status = 'sent', sent_at = datetime('now'), updated_at = datetime('now')
             WHERE id = ?`,
            [entry.id]
          );
        } else if (!result.retryable || entry.attempts >= entry.maxAttempts - 1) {
          // Mark as failed
          await this.db.run(
            `UPDATE notification_queue
             SET status = 'failed', error_message = ?, updated_at = datetime('now')
             WHERE id = ?`,
            [result.error, entry.id]
          );
        } else {
          // Increment attempts
          await this.db.run(
            `UPDATE notification_queue
             SET attempts = attempts + 1, last_attempt_at = datetime('now'),
                 error_message = ?, updated_at = datetime('now')
             WHERE id = ?`,
            [result.error, entry.id]
          );
        }
      } catch (error) {
        console.error(`Error processing queued notification ${entry.id}:`, error);
      }
    }
  }

  /**
   * Get notification preferences for a user
   */
  private async getNotificationPreferences(email: string): Promise<NotificationPreferences | undefined> {
    if (!this.db) {
      return undefined;
    }

    try {
      const row = await this.db.get(
        'SELECT * FROM notification_preferences WHERE email = ?',
        [email]
      );

      if (!row) {
        return undefined;
      }

      return {
        ...row,
        channels: JSON.parse(row.channels),
        types: JSON.parse(row.types),
        frequency: JSON.parse(row.frequency),
        quietHours: row.quiet_hours ? JSON.parse(row.quiet_hours) : undefined,
      };
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return undefined;
    }
  }

  /**
   * Determine if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Network errors are typically retryable
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }

    // Rate limit errors are retryable
    if (error?.status === 429) {
      return true;
    }

    // Server errors are retryable
    if (error?.status >= 500) {
      return true;
    }

    return false;
  }

  /**
   * Generate unsubscribe token
   */
  generateUnsubscribeToken(email: string): string {
    const tokenData: UnsubscribeTokenData = {
      email,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    };

    // In production, use proper JWT or crypto signing
    const token = Buffer.from(JSON.stringify(tokenData)).toString('base64url');
    return token;
  }

  /**
   * Verify unsubscribe token
   */
  verifyUnsubscribeToken(token: string): UnsubscribeTokenData | null {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf-8');
      const data: UnsubscribeTokenData = JSON.parse(decoded);

      if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
        return null; // Token expired
      }

      return data;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Create default email service instance
 */
export function createEmailService(db?: any): EmailService {
  const config: NotificationServiceConfig = {
    provider: (process.env.EMAIL_PROVIDER as 'resend' | 'sendgrid') || 'resend',
    apiKey: process.env.EMAIL_API_KEY || '',
    fromEmail: process.env.EMAIL_FROM || 'noreply@geoseodomination.com',
    fromName: process.env.EMAIL_FROM_NAME || 'GEO-SEO Domination',
    replyToEmail: process.env.EMAIL_REPLY_TO,
    maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY || '60000'), // 1 minute
    batchSize: parseInt(process.env.EMAIL_BATCH_SIZE || '10'),
    enableQueue: process.env.EMAIL_ENABLE_QUEUE === 'true',
  };

  return new EmailService(config, db);
}
