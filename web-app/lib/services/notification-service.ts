/**
 * Notification Service
 * Handles email, SMS, and in-app notifications
 */

import { supabase } from '@/lib/supabase';

export interface NotificationPayload {
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  recipientEmail: string;
  subject: string;
  data: Record<string, any>;
  scheduledFor?: Date;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class NotificationService {
  private resendApiKey?: string;

  constructor() {
    this.resendApiKey = process.env.RESEND_API_KEY;
  }

  /**
   * Queue a notification for delivery
   */
  async queueNotification(payload: NotificationPayload): Promise<void> {
    try {
      await supabase.from('notification_queue').insert([
        {
          notification_type: payload.type,
          priority: payload.priority,
          recipient_email: payload.recipientEmail,
          subject: payload.subject,
          payload: payload.data,
          scheduled_for: payload.scheduledFor?.toISOString() || null,
          status: 'queued',
        },
      ]);
    } catch (error) {
      console.error('Failed to queue notification:', error);
      throw error;
    }
  }

  /**
   * Send ranking change notification
   */
  async notifyRankingChange(params: {
    email: string;
    keyword: string;
    oldRank: number;
    newRank: number;
    url: string;
  }): Promise<void> {
    const { email, keyword, oldRank, newRank, url } = params;

    const change = newRank - oldRank;
    const direction = change > 0 ? 'dropped' : 'improved';
    const priority = Math.abs(change) >= 5 ? 'high' : 'medium';

    const subject = `Ranking ${direction} for "${keyword}" - ${Math.abs(change)} positions`;

    await this.queueNotification({
      type: 'ranking_change',
      priority,
      recipientEmail: email,
      subject,
      data: {
        keyword,
        oldRank,
        newRank,
        change,
        url,
      },
    });
  }

  /**
   * Send SEO audit completion notification
   */
  async notifyAuditCompleted(params: {
    email: string;
    companyName: string;
    url: string;
    score: number;
    criticalIssues: number;
  }): Promise<void> {
    const { email, companyName, url, score, criticalIssues } = params;

    const priority = criticalIssues > 5 ? 'high' : 'medium';
    const subject = `SEO Audit completed for ${companyName} - Score: ${score}/100`;

    await this.queueNotification({
      type: 'audit_completed',
      priority,
      recipientEmail: email,
      subject,
      data: {
        companyName,
        url,
        score,
        criticalIssues,
      },
    });
  }

  /**
   * Send weekly report notification
   */
  async notifyWeeklyReport(params: {
    email: string;
    companyName: string;
    rankingChanges: number;
    avgPosition: number;
    topKeywords: string[];
  }): Promise<void> {
    const { email, companyName, rankingChanges, avgPosition, topKeywords } = params;

    const subject = `Weekly SEO Report for ${companyName}`;

    await this.queueNotification({
      type: 'weekly_report',
      priority: 'low',
      recipientEmail: email,
      subject,
      data: {
        companyName,
        rankingChanges,
        avgPosition,
        topKeywords,
      },
    });
  }

  /**
   * Send task reminder notification
   */
  async notifyTaskDue(params: {
    email: string;
    taskTitle: string;
    dueDate: Date;
    priority: 'low' | 'medium' | 'high';
  }): Promise<void> {
    const { email, taskTitle, dueDate, priority } = params;

    const subject = `Task due: ${taskTitle}`;

    await this.queueNotification({
      type: 'task_due',
      priority,
      recipientEmail: email,
      subject,
      data: {
        taskTitle,
        dueDate: dueDate.toISOString(),
      },
    });
  }

  /**
   * Process queued notifications (called by cron job)
   */
  async processQueue(): Promise<void> {
    try {
      // Fetch pending notifications
      const { data: notifications, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('status', 'queued')
        .lte('scheduled_for', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(50);

      if (error || !notifications) {
        console.error('Failed to fetch notification queue:', error);
        return;
      }

      // Process each notification
      for (const notification of notifications) {
        try {
          await this.sendNotification(notification);

          // Mark as sent
          await supabase
            .from('notification_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', notification.id);

          // Add to history
          await supabase.from('notification_history').insert([
            {
              notification_type: notification.notification_type,
              priority: notification.priority,
              recipient_email: notification.recipient_email,
              subject: notification.subject,
              status: 'sent',
            },
          ]);
        } catch (error) {
          console.error(`Failed to send notification ${notification.id}:`, error);

          // Update attempt count
          const attempts = (notification.attempts || 0) + 1;
          const maxAttempts = notification.max_attempts || 3;

          if (attempts >= maxAttempts) {
            // Mark as failed
            await supabase
              .from('notification_queue')
              .update({
                status: 'failed',
                attempts,
                error_message: String(error),
                last_attempt_at: new Date().toISOString(),
              })
              .eq('id', notification.id);
          } else {
            // Retry later
            await supabase
              .from('notification_queue')
              .update({
                attempts,
                last_attempt_at: new Date().toISOString(),
              })
              .eq('id', notification.id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to process notification queue:', error);
    }
  }

  /**
   * Send notification via appropriate channel
   */
  private async sendNotification(notification: any): Promise<void> {
    // Check user preferences
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('email', notification.recipient_email)
      .single();

    if (!prefs || !prefs.enabled) {
      console.log(`Notifications disabled for ${notification.recipient_email}`);
      return;
    }

    // Check if this notification type is enabled
    const channels = prefs.channels as Record<string, boolean>;
    if (!channels.email) {
      console.log(`Email notifications disabled for ${notification.recipient_email}`);
      return;
    }

    // Send email
    await this.sendEmail({
      to: notification.recipient_email,
      subject: notification.subject,
      html: this.buildEmailHTML(notification),
      text: this.buildEmailText(notification),
    });
  }

  /**
   * Send email using Resend API
   */
  private async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.resendApiKey) {
      console.warn('RESEND_API_KEY not configured - email not sent');
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'SEO Tool <notifications@yourdomain.com>',
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Resend API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Build HTML email content
   */
  private buildEmailHTML(notification: any): string {
    const { notification_type, subject, payload } = notification;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>GEO-SEO Domination Tool</h1>
    </div>
    <div class="content">
      <h2>${subject}</h2>
      ${this.getNotificationContent(notification_type, payload)}
    </div>
    <div class="footer">
      <p>This is an automated notification from your SEO monitoring tool.</p>
      <p><a href="#">Manage notification preferences</a></p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Build plain text email content
   */
  private buildEmailText(notification: any): string {
    const { subject, payload } = notification;
    return `${subject}\n\n${JSON.stringify(payload, null, 2)}`;
  }

  /**
   * Get notification-specific content
   */
  private getNotificationContent(type: string, payload: any): string {
    switch (type) {
      case 'ranking_change':
        return `
          <p>Your keyword ranking has changed:</p>
          <ul>
            <li><strong>Keyword:</strong> ${payload.keyword}</li>
            <li><strong>Previous Position:</strong> ${payload.oldRank}</li>
            <li><strong>New Position:</strong> ${payload.newRank}</li>
            <li><strong>Change:</strong> ${payload.change > 0 ? '+' : ''}${payload.change} positions</li>
          </ul>`;

      case 'audit_completed':
        return `
          <p>SEO audit has been completed for ${payload.companyName}:</p>
          <ul>
            <li><strong>Overall Score:</strong> ${payload.score}/100</li>
            <li><strong>Critical Issues:</strong> ${payload.criticalIssues}</li>
            <li><strong>URL:</strong> ${payload.url}</li>
          </ul>`;

      default:
        return `<pre>${JSON.stringify(payload, null, 2)}</pre>`;
    }
  }
}

export const notificationService = new NotificationService();
