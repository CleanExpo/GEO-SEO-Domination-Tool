/**
 * Notification System Usage Examples
 * Copy these examples to integrate notifications into your application
 */

import { createEmailService } from './email-service';
import type {
  WeeklyReportNotification,
  RankingAlertNotification,
  AuditCompleteNotification,
  SystemNotification,
} from './notification-types';

/**
 * Example 1: Send Weekly Report
 */
export async function sendWeeklyReport(db: any, companyId: number) {
  const emailService = createEmailService(db);

  // Fetch company and metrics data (replace with actual queries)
  const company = await db.get('SELECT * FROM companies WHERE id = ?', [companyId]);

  const notification: WeeklyReportNotification = {
    type: 'weekly_report',
    priority: 'medium',
    recipientEmail: company.email,
    recipientName: company.contact_name,
    subject: `Weekly SEO Report for ${company.name}`,
    data: {
      companyId: company.id,
      companyName: company.name,
      reportPeriod: {
        start: '2025-09-25',
        end: '2025-10-02',
      },
      metrics: {
        totalKeywords: 45,
        rankingImprovements: 12,
        rankingDecreases: 5,
        averagePosition: 8.3,
        topKeywords: [
          { keyword: 'plumber near me', position: 2, change: 3 },
          { keyword: 'emergency plumber', position: 4, change: 1 },
          { keyword: 'plumbing services', position: 6, change: -1 },
        ],
      },
      audits: {
        total: 2,
        criticalIssues: 1,
        improvements: 8,
      },
      competitors: {
        total: 10,
        gainedPositions: 7,
        lostPositions: 3,
      },
      reportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reports/weekly/${companyId}`,
    },
  };

  const result = await emailService.sendNotification(notification);
  return result;
}

/**
 * Example 2: Send Ranking Alert
 */
export async function sendRankingAlert(
  db: any,
  companyId: number,
  keywordId: number,
  oldPosition: number,
  newPosition: number
) {
  const emailService = createEmailService(db);

  const company = await db.get('SELECT * FROM companies WHERE id = ?', [companyId]);
  const keyword = await db.get('SELECT * FROM keywords WHERE id = ?', [keywordId]);

  const change = oldPosition - newPosition; // Positive = improvement

  const notification: RankingAlertNotification = {
    type: 'ranking_alert',
    priority: Math.abs(change) >= 5 ? 'high' : 'medium',
    recipientEmail: company.email,
    recipientName: company.contact_name,
    subject: `${change > 0 ? '📈' : '📉'} Ranking ${change > 0 ? 'Up' : 'Down'}: "${keyword.keyword}"`,
    data: {
      companyId: company.id,
      companyName: company.name,
      keyword: keyword.keyword,
      location: keyword.location,
      oldPosition,
      newPosition,
      change,
      date: new Date().toISOString().split('T')[0],
      competitorData: [
        { name: 'Competitor A', position: 1 },
        { name: 'Competitor B', position: 3 },
        { name: 'Competitor C', position: 5 },
      ],
    },
  };

  const result = await emailService.sendNotification(notification);
  return result;
}

/**
 * Example 3: Send Audit Complete Notification
 */
export async function sendAuditComplete(db: any, auditId: number) {
  const emailService = createEmailService(db);

  const audit = await db.get('SELECT * FROM audits WHERE id = ?', [auditId]);
  const company = await db.get('SELECT * FROM companies WHERE id = ?', [audit.company_id]);

  const lighthouseScores = JSON.parse(audit.lighthouse_scores);
  const eeatScores = JSON.parse(audit.eeat_scores);
  const recommendations = JSON.parse(audit.recommendations);

  // Count issues by priority
  const criticalIssues = recommendations.filter((r: any) => r.priority === 'critical').length;
  const highPriorityIssues = recommendations.filter((r: any) => r.priority === 'high').length;
  const mediumPriorityIssues = recommendations.filter((r: any) => r.priority === 'medium').length;

  const notification: AuditCompleteNotification = {
    type: 'audit_complete',
    priority: criticalIssues > 0 ? 'high' : 'medium',
    recipientEmail: company.email,
    recipientName: company.contact_name,
    subject: `SEO Audit Complete for ${company.name}`,
    data: {
      companyId: company.id,
      companyName: company.name,
      auditId: audit.id,
      auditDate: audit.audit_date,
      lighthouseScores: {
        performance: lighthouseScores.performance,
        accessibility: lighthouseScores.accessibility,
        bestPractices: lighthouseScores.best_practices,
        seo: lighthouseScores.seo,
        pwa: lighthouseScores.pwa,
      },
      eeatScores: {
        experience: eeatScores.experience,
        expertise: eeatScores.expertise,
        authoritativeness: eeatScores.authoritativeness,
        trustworthiness: eeatScores.trustworthiness,
      },
      criticalIssues,
      highPriorityIssues,
      mediumPriorityIssues,
      totalIssues: recommendations.length,
      auditUrl: `${process.env.NEXT_PUBLIC_APP_URL}/audits/${audit.id}`,
    },
  };

  const result = await emailService.sendNotification(notification);
  return result;
}

/**
 * Example 4: Send System Notification
 */
export async function sendSystemNotification(
  db: any,
  recipientEmail: string,
  title: string,
  message: string,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) {
  const emailService = createEmailService(db);

  const notification: SystemNotification = {
    type: 'system_notification',
    priority,
    recipientEmail,
    subject: title,
    data: {
      title,
      message,
      actionUrl: process.env.NEXT_PUBLIC_APP_URL,
      actionText: 'View Dashboard',
      metadata: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      },
    },
  };

  const result = await emailService.sendNotification(notification);
  return result;
}

/**
 * Example 5: Process Notification Queue
 * Run this in a cron job or scheduled task
 */
export async function processNotificationQueue(db: any) {
  const emailService = createEmailService(db);
  await emailService.processQueue();

}

/**
 * Example 6: Update User Notification Preferences
 */
export async function updateNotificationPreferences(db: any, email: string) {
  // This would typically be called from the preferences API
  // Example of how to structure the data:

  const preferences = {
    email,
    enabled: true,
    channels: {
      email: true,
      sms: false,
      push: false,
      inApp: true,
    },
    types: {
      weekly_report: true,
      ranking_alert: true,
      audit_complete: true,
      system_notification: true,
      keyword_ranking_change: true,
      competitor_alert: false,
      citation_issue: true,
      scheduled_report: true,
    },
    frequency: {
      weekly_report: 'weekly',
      ranking_alert: 'immediate',
      audit_complete: 'immediate',
    },
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00',
      timezone: 'America/New_York',
    },
  };

  // Call the API endpoint
  const response = await fetch('/api/notifications/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences),
  });

  return response.json();
}

/**
 * Example 7: Batch Send Notifications
 * Send notifications to multiple recipients
 */
export async function sendBatchNotifications(db: any) {
  const emailService = createEmailService(db);

  // Get all companies that need weekly reports
  const companies = await db.all(
    'SELECT * FROM companies WHERE email IS NOT NULL'
  );

  const results = [];

  for (const company of companies) {
    try {
      const result = await sendWeeklyReport(db, company.id);
      results.push({ companyId: company.id, success: result.success });
    } catch (error) {
      console.error(`Failed to send report to company ${company.id}:`, error);
      results.push({ companyId: company.id, success: false, error });
    }
  }

  return results;
}

/**
 * Example 8: Integration with Audit System
 * Call this after completing an audit
 */
export async function onAuditComplete(db: any, auditId: number) {
  try {
    // Send notification
    const result = await sendAuditComplete(db, auditId);

    // Log to history
    if (result.success) {
      await db.run(
        `INSERT INTO notification_history
         (notification_type, priority, recipient_email, subject, status, message_id, provider, sent_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          'audit_complete',
          'medium',
          result.recipientEmail,
          result.subject,
          'sent',
          result.messageId,
          process.env.EMAIL_PROVIDER,
        ]
      );
    }

    return result;
  } catch (error) {
    console.error('Error in onAuditComplete:', error);
    throw error;
  }
}

/**
 * Example 9: Integration with Ranking Tracker
 * Call this after checking keyword rankings
 */
export async function onRankingChange(
  db: any,
  keywordId: number,
  oldPosition: number,
  newPosition: number
) {
  // Only send notification if change is significant
  const change = Math.abs(oldPosition - newPosition);

  if (change >= 3) {
    const keyword = await db.get('SELECT * FROM keywords WHERE id = ?', [keywordId]);

    const result = await sendRankingAlert(
      db,
      keyword.company_id,
      keywordId,
      oldPosition,
      newPosition
    );

    // Update keyword record
    await db.run(
      'UPDATE keywords SET current_rank = ?, last_checked = datetime("now") WHERE id = ?',
      [newPosition, keywordId]
    );

    return result;
  }

  return { success: false, message: 'Change not significant enough' };
}

/**
 * Example 10: Scheduled Weekly Reports
 * Run this every Monday at 9am
 */
export async function sendScheduledWeeklyReports(db: any) {

  const companies = await db.all(
    `SELECT DISTINCT c.*
     FROM companies c
     INNER JOIN notification_preferences np ON c.email = np.email
     WHERE np.enabled = 1
     AND np.types LIKE '%"weekly_report":true%'`
  );

  const results = await sendBatchNotifications(db);

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;

  // Send summary to admin
  await sendSystemNotification(
    db,
    process.env.ADMIN_EMAIL || 'admin@geoseodomination.com',
    'Weekly Reports Sent',
    `Successfully sent ${successCount} weekly reports. ${failureCount} failed.`,
    'low'
  );

  return results;
}
