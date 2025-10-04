# Notification System Documentation

## Overview

The GEO-SEO Domination Tool notification system provides a comprehensive email notification service with support for multiple notification types, user preferences, queuing, and retry logic.

## Features

- **Multiple Notification Types**: Weekly reports, ranking alerts, audit completions, and system notifications
- **Email Provider Support**: Resend and SendGrid
- **User Preferences**: Customizable notification settings per user
- **Queue System**: Failed emails are queued for retry
- **Unsubscribe Functionality**: One-click unsubscribe with token verification
- **HTML Email Templates**: Beautiful, responsive email templates
- **Quiet Hours**: Respect user time preferences
- **Priority Levels**: Critical, high, medium, and low priority notifications

## Architecture

```
src/services/notifications/
├── email-service.ts              # Core email service
├── notification-types.ts         # TypeScript type definitions
├── index.ts                      # Main export
└── templates/
    ├── weekly-report.ts          # Weekly report template
    ├── ranking-alert.ts          # Ranking change alert template
    ├── audit-complete.ts         # Audit completion template
    └── system-notification.ts    # System notification template

web-app/app/api/notifications/
├── send/
│   └── route.ts                  # Send notification endpoint
└── preferences/
    └── route.ts                  # Manage preferences endpoint
```

## Database Schema

The notification system uses the following tables:

- **notification_queue**: Stores notifications pending delivery or retry
- **notification_preferences**: User notification preferences
- **notification_history**: Audit trail of sent notifications
- **notification_templates**: Custom email templates (optional)
- **notification_subscriptions**: Specific entity subscriptions (optional)

## Setup

### 1. Environment Variables

Copy `.env.notifications.example` and configure:

```bash
EMAIL_PROVIDER=resend
EMAIL_API_KEY=your_api_key_here
EMAIL_FROM=noreply@geoseodomination.com
EMAIL_FROM_NAME=GEO-SEO Domination
EMAIL_ENABLE_QUEUE=true
```

### 2. Database Migration

Run the notification schema migration:

```bash
sqlite3 database.db < database/migrations/001_add_notifications.sql
```

### 3. Email Provider Setup

#### Resend (Recommended)
1. Sign up at https://resend.com
2. Verify your domain
3. Create an API key
4. Add to `.env` as `EMAIL_API_KEY`

#### SendGrid
1. Sign up at https://sendgrid.com
2. Verify your domain
3. Create an API key with "Mail Send" permission
4. Add to `.env` as `EMAIL_API_KEY`
5. Set `EMAIL_PROVIDER=sendgrid`

## Usage

### Send a Notification

#### Via API

```typescript
// POST /api/notifications/send
const response = await fetch('/api/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'ranking_alert',
    priority: 'high',
    recipientEmail: 'user@example.com',
    recipientName: 'John Doe',
    subject: 'Ranking Improvement Alert',
    data: {
      companyId: 1,
      companyName: 'Acme Corp',
      keyword: 'plumber near me',
      location: 'New York, NY',
      oldPosition: 5,
      newPosition: 2,
      change: 3,
      date: '2025-10-02',
    },
  }),
});
```

#### Via Service

```typescript
import { createEmailService } from '@/services/notifications';

const emailService = createEmailService(db);

const result = await emailService.sendNotification({
  type: 'audit_complete',
  priority: 'medium',
  recipientEmail: 'user@example.com',
  recipientName: 'Jane Smith',
  subject: 'SEO Audit Complete',
  data: {
    companyId: 1,
    companyName: 'Acme Corp',
    auditId: 123,
    auditDate: '2025-10-02',
    lighthouseScores: {
      performance: 85,
      accessibility: 92,
      bestPractices: 88,
      seo: 95,
    },
    eeatScores: {
      experience: 78,
      expertise: 82,
      authoritativeness: 75,
      trustworthiness: 88,
    },
    criticalIssues: 2,
    highPriorityIssues: 5,
    mediumPriorityIssues: 12,
    totalIssues: 19,
    auditUrl: 'https://app.geoseodomination.com/audits/123',
  },
});

if (result.success) {
  console.log('Email sent:', result.messageId);
} else {
  console.error('Email failed:', result.error);
}
```

### Manage Notification Preferences

#### Get Preferences

```typescript
// GET /api/notifications/preferences?email=user@example.com
const response = await fetch('/api/notifications/preferences?email=user@example.com');
const { preferences } = await response.json();
```

#### Update Preferences

```typescript
// PUT /api/notifications/preferences
await fetch('/api/notifications/preferences', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    enabled: true,
    channels: {
      email: true,
      sms: false,
    },
    types: {
      weekly_report: true,
      ranking_alert: true,
      audit_complete: true,
      system_notification: false,
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
  }),
});
```

#### Unsubscribe

```typescript
// DELETE /api/notifications/preferences?email=user@example.com
// Or via token:
// DELETE /api/notifications/preferences?token=unsubscribe_token
```

### Process Notification Queue

Set up a cron job or scheduled task to process queued notifications:

```typescript
import { createEmailService } from '@/services/notifications';

const emailService = createEmailService(db);
await emailService.processQueue();
```

Recommended: Run every 5-10 minutes.

## Notification Types

### 1. Weekly Report

Summary of SEO metrics, ranking changes, and audit results.

**Data Structure:**
```typescript
{
  companyId: number;
  companyName: string;
  reportPeriod: { start: string; end: string; };
  metrics: {
    totalKeywords: number;
    rankingImprovements: number;
    rankingDecreases: number;
    averagePosition: number;
    topKeywords: Array<{ keyword: string; position: number; change: number; }>;
  };
  audits: { total: number; criticalIssues: number; improvements: number; };
  competitors: { total: number; gainedPositions: number; lostPositions: number; };
  reportUrl?: string;
}
```

### 2. Ranking Alert

Notification when keyword ranking changes significantly.

**Data Structure:**
```typescript
{
  companyId: number;
  companyName: string;
  keyword: string;
  location: string;
  oldPosition: number;
  newPosition: number;
  change: number;
  date: string;
  competitorData?: Array<{ name: string; position: number; }>;
}
```

### 3. Audit Complete

Notification when SEO audit finishes.

**Data Structure:**
```typescript
{
  companyId: number;
  companyName: string;
  auditId: number;
  auditDate: string;
  lighthouseScores: { performance: number; accessibility: number; bestPractices: number; seo: number; };
  eeatScores: { experience: number; expertise: number; authoritativeness: number; trustworthiness: number; };
  criticalIssues: number;
  highPriorityIssues: number;
  mediumPriorityIssues: number;
  totalIssues: number;
  auditUrl?: string;
}
```

### 4. System Notification

General system alerts and announcements.

**Data Structure:**
```typescript
{
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
}
```

## Email Templates

All email templates include:
- Responsive HTML design
- Plain text fallback
- Unsubscribe link
- Brand colors and styling
- Mobile-optimized layout

Templates are located in `src/services/notifications/templates/`.

## Queue System

The notification queue automatically:
1. Stores failed notifications
2. Retries with exponential backoff
3. Tracks attempt counts
4. Logs error messages
5. Marks as failed after max attempts

**Queue Statuses:**
- `pending`: Initial state
- `queued`: Waiting for retry
- `sent`: Successfully delivered
- `failed`: Max retries exceeded

## Security

- Unsubscribe tokens are base64url encoded
- Tokens include expiration dates (1 year)
- Email addresses are validated
- API endpoints should be protected with authentication
- Database queries use parameterized statements

## Testing

### Test Notification Send

```typescript
import { createEmailService } from '@/services/notifications';

const emailService = createEmailService(db);

// Send test email
const result = await emailService.sendNotification({
  type: 'system_notification',
  priority: 'low',
  recipientEmail: 'test@example.com',
  subject: 'Test Notification',
  data: {
    title: 'System Test',
    message: 'This is a test notification from the GEO-SEO Domination Tool.',
  },
});

console.log(result);
```

### Test Queue Processing

```typescript
// Manually queue a notification
await emailService.queueNotification(notification, new Error('Test error'));

// Process queue
await emailService.processQueue();
```

## Monitoring

Check notification queue status:

```bash
GET /api/notifications/send
```

Response:
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "pending": 5,
    "queued": 3,
    "sent": 140,
    "failed": 2
  }
}
```

## Troubleshooting

### Emails Not Sending

1. Check environment variables are set correctly
2. Verify email provider API key is valid
3. Ensure sender domain is verified with provider
4. Check database connection is working
5. Review queue for failed notifications

### Queue Growing

1. Check email provider status
2. Review error messages in `notification_queue.error_message`
3. Verify network connectivity
4. Check API rate limits

### Unsubscribe Not Working

1. Verify token is valid and not expired
2. Check database has `notification_preferences` table
3. Ensure `NEXT_PUBLIC_APP_URL` is set correctly

## Best Practices

1. **Rate Limiting**: Implement rate limiting on send endpoint
2. **Authentication**: Protect API endpoints with auth middleware
3. **Monitoring**: Set up alerts for queue size and failed notifications
4. **Testing**: Test email templates across different email clients
5. **Compliance**: Include unsubscribe links in all marketing emails
6. **Privacy**: Handle email addresses according to GDPR/privacy laws
7. **Queue Processing**: Run queue processor regularly (every 5-10 minutes)
8. **Database Cleanup**: Archive old notification history periodically

## Future Enhancements

- SMS notifications via Twilio
- Push notifications
- In-app notifications
- Webhook support
- A/B testing for email templates
- Analytics and open/click tracking
- Custom template builder UI
- Batch sending optimization
- Multi-language support

## Support

For issues or questions, please refer to the main project documentation or contact the development team.
