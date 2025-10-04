/**
 * Support Contact Email Template
 */

import { EmailTemplate } from '../notification-types';

interface SupportContactData {
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string;
}

export function generateSupportContactTemplate(
  data: SupportContactData,
  isAdminNotification: boolean = false
): EmailTemplate {
  if (isAdminNotification) {
    // Email to admin/support team
    const subject = `New Support Contact: ${data.subject}`;

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
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
    .info-section {
      background: #f9fafb;
      border-left: 4px solid #10b981;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-item {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-item:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #6b7280;
      font-weight: 600;
      min-width: 100px;
    }
    .info-value {
      color: #1f2937;
      flex: 1;
    }
    .message-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      padding: 20px;
      margin: 20px 0;
      border-radius: 6px;
    }
    .message-label {
      font-size: 14px;
      font-weight: bold;
      color: #6b7280;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .message-content {
      color: #1f2937;
      font-size: 16px;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .cta-button {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .cta-button:hover {
      background: #059669;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">📧</div>
      <h1>New Support Contact</h1>
    </div>

    <div class="info-section">
      <div class="info-item">
        <span class="info-label">From:</span>
        <span class="info-value">${data.name}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Email:</span>
        <span class="info-value"><a href="mailto:${data.email}">${data.email}</a></span>
      </div>
      <div class="info-item">
        <span class="info-label">Subject:</span>
        <span class="info-value">${data.subject}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Submitted:</span>
        <span class="info-value">${data.submittedAt}</span>
      </div>
    </div>

    <div class="message-box">
      <div class="message-label">Message</div>
      <div class="message-content">${data.message}</div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}" class="cta-button">Reply to ${data.name}</a>
    </div>

    <div class="footer">
      <p>GEO-SEO Domination Tool - Support Contact Notification</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
NEW SUPPORT CONTACT

From: ${data.name}
Email: ${data.email}
Subject: ${data.subject}
Submitted: ${data.submittedAt}

MESSAGE:
${data.message}

Reply to: ${data.email}

---
GEO-SEO Domination Tool
    `.trim();

    return { subject, html, text };
  } else {
    // Confirmation email to user
    const subject = `We received your message - ${data.subject}`;

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
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
    .message-box {
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .summary-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      padding: 20px;
      margin: 20px 0;
      border-radius: 6px;
    }
    .summary-title {
      font-size: 14px;
      font-weight: bold;
      color: #6b7280;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .summary-item {
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .summary-item:last-child {
      border-bottom: none;
    }
    .summary-label {
      color: #6b7280;
      font-size: 14px;
    }
    .summary-value {
      color: #1f2937;
      font-weight: 600;
      margin-top: 4px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">✅</div>
      <h1>Message Received</h1>
    </div>

    <p>Hi ${data.name},</p>

    <div class="message-box">
      <p style="margin: 0; color: #065f46; font-size: 16px;">
        Thank you for contacting us! We've received your message and our support team will review it shortly.
      </p>
    </div>

    <p>We typically respond within 24 hours during business days. For urgent matters, please don't hesitate to follow up.</p>

    <div class="summary-box">
      <div class="summary-title">Your Message Summary</div>
      <div class="summary-item">
        <div class="summary-label">Subject</div>
        <div class="summary-value">${data.subject}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Submitted</div>
        <div class="summary-value">${data.submittedAt}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Message</div>
        <div class="summary-value" style="white-space: pre-wrap; font-weight: normal; margin-top: 8px;">${data.message}</div>
      </div>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      If you didn't submit this contact request, please ignore this email.
    </p>

    <div class="footer">
      <p>GEO-SEO Domination Tool - Support Team</p>
      <p>This is an automated confirmation. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
MESSAGE RECEIVED

Hi ${data.name},

Thank you for contacting us! We've received your message and our support team will review it shortly.

We typically respond within 24 hours during business days. For urgent matters, please don't hesitate to follow up.

YOUR MESSAGE SUMMARY:
Subject: ${data.subject}
Submitted: ${data.submittedAt}

Message:
${data.message}

If you didn't submit this contact request, please ignore this email.

---
GEO-SEO Domination Tool - Support Team
This is an automated confirmation. Please do not reply to this email.
    `.trim();

    return { subject, html, text };
  }
}
