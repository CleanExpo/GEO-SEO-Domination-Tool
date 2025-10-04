/**
 * System Notification Email Template
 */

import { SystemNotification, CompetitorAlertNotification, CitationIssueNotification, EmailTemplate } from '../notification-types';

export function generateSystemNotificationTemplate(
  notification: SystemNotification | CompetitorAlertNotification | CitationIssueNotification,
  unsubscribeUrl?: string
): EmailTemplate {
  const { data, recipientName, priority } = notification;
  const { title, message, actionUrl, actionText, metadata } = data;

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return '#dc2626';
      case 'high':
        return '#f59e0b';
      case 'medium':
        return '#2563eb';
      default:
        return '#6b7280';
    }
  };

  const getPriorityIcon = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const priorityColor = getPriorityColor(priority);
  const priorityIcon = getPriorityIcon(priority);

  const subject = `${priorityIcon} ${title}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding: 20px;
      background: linear-gradient(135deg, ${priorityColor} 0%, ${priorityColor}dd 100%);
      color: white;
      border-radius: 6px;
      margin-bottom: 30px;
    }
    .header .icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .priority-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 10px;
      font-weight: 600;
    }
    .message-box {
      background: #f9fafb;
      border-left: 4px solid ${priorityColor};
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .message-content {
      color: #1f2937;
      font-size: 16px;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .metadata-section {
      margin: 25px 0;
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
    }
    .metadata-title {
      font-size: 14px;
      font-weight: bold;
      color: #6b7280;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .metadata-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .metadata-item:last-child {
      border-bottom: none;
    }
    .metadata-key {
      color: #6b7280;
      font-size: 14px;
    }
    .metadata-value {
      color: #1f2937;
      font-weight: 600;
      font-size: 14px;
    }
    .cta-button {
      display: inline-block;
      background: ${priorityColor};
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .cta-button:hover {
      opacity: 0.9;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    .unsubscribe {
      color: #6b7280;
      text-decoration: none;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">${priorityIcon}</div>
      <h1>${title}</h1>
      <div class="priority-badge">${priority.toUpperCase()} PRIORITY</div>
    </div>

    ${recipientName ? `<p>Hi ${recipientName},</p>` : ''}

    <div class="message-box">
      <div class="message-content">${message}</div>
    </div>

    ${metadata && Object.keys(metadata).length > 0 ? `
    <div class="metadata-section">
      <div class="metadata-title">Additional Information</div>
      ${Object.entries(metadata).map(([key, value]) => `
        <div class="metadata-item">
          <span class="metadata-key">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
          <span class="metadata-value">${value}</span>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${actionUrl && actionText ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${actionUrl}" class="cta-button">${actionText}</a>
    </div>
    ` : ''}

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      This is an automated notification from the GEO-SEO Domination Tool system.
    </p>

    <div class="footer">
      <p>GEO-SEO Domination Tool - System Notifications</p>
      ${unsubscribeUrl ? `<p><a href="${unsubscribeUrl}" class="unsubscribe">Unsubscribe from system notifications</a></p>` : ''}
    </div>
  </div>
</body>
</html>
  `;

  const text = `
${priorityIcon} ${title}
${priority.toUpperCase()} PRIORITY

${recipientName ? `Hi ${recipientName},\n\n` : ''}
${message}

${metadata && Object.keys(metadata).length > 0 ? `
ADDITIONAL INFORMATION:
${Object.entries(metadata).map(([key, value]) => `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}`).join('\n')}
` : ''}

${actionUrl && actionText ? `${actionText}: ${actionUrl}\n\n` : ''}
This is an automated notification from the GEO-SEO Domination Tool system.

---
GEO-SEO Domination Tool
${unsubscribeUrl ? `Unsubscribe: ${unsubscribeUrl}` : ''}
  `.trim();

  return { subject, html, text };
}
