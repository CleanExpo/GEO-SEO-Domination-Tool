# Production Monitoring Setup Guide

**Date**: October 7, 2025
**Production URL**: https://geo-seo-domination-tool-unite-group.vercel.app

---

## Overview

This guide provides step-by-step instructions for setting up production monitoring using:
1. **UptimeRobot** - External uptime monitoring and alerts
2. **Vercel Analytics** - Built-in performance and usage analytics
3. **Sentry** (Optional) - Error tracking and performance monitoring

---

## 1. UptimeRobot Setup (External Monitoring)

### Why UptimeRobot?
- Free tier includes 50 monitors
- 5-minute check intervals
- Email, SMS, and webhook alerts
- Public status pages
- 90-day uptime history

### Setup Steps

#### Step 1: Create Account
1. Go to https://uptimerobot.com
2. Sign up for free account
3. Verify email address

#### Step 2: Create HTTP(s) Monitor

**Monitor Configuration:**
```
Monitor Type: HTTP(s)
Friendly Name: GEO-SEO Domination Tool - Production
URL: https://geo-seo-domination-tool-unite-group.vercel.app/api/health
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
```

**Alert Contacts:**
```
Email: your-email@example.com
Alert When: Down
Alert After: 1 failure (immediate)
```

#### Step 3: Create Additional Monitors (Optional)

**Homepage Monitor:**
```
Monitor Type: HTTP(s)
Friendly Name: GEO-SEO - Homepage
URL: https://geo-seo-domination-tool-unite-group.vercel.app
Monitoring Interval: 5 minutes
```

**Dashboard Monitor:**
```
Monitor Type: HTTP(s)
Friendly Name: GEO-SEO - Dashboard
URL: https://geo-seo-domination-tool-unite-group.vercel.app/dashboard
Monitoring Interval: 5 minutes
```

#### Step 4: Configure Keyword Monitoring

Add keyword monitoring to ensure API returns correct responses:

```
Monitor Type: Keyword
Keyword Type: Exists
Keyword: "status":"ok"
Case Sensitive: Yes
```

#### Step 5: Set Up Status Page (Optional)

1. Go to **Public Status Pages** in UptimeRobot
2. Click **Add New Status Page**
3. Select monitors to include
4. Customize design and URL
5. Share URL with stakeholders

**Example Status Page URL:**
```
https://stats.uptimerobot.com/your-custom-id
```

### Webhook Integration (Optional)

For Slack/Discord alerts:

**Slack Webhook:**
1. Create Slack app with Incoming Webhook
2. Copy webhook URL
3. Add as Alert Contact in UptimeRobot:
   ```
   Contact Type: Web-Hook
   URL to Notify: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   POST Value: {"text":"*{monitorFriendlyName}* is *{monitorAlertType}*\n{monitorURL}"}
   ```

---

## 2. Vercel Analytics Setup

### Enable Vercel Analytics

#### Step 1: Enable in Vercel Dashboard
1. Go to https://vercel.com/unite-group/geo-seo-domination-tool
2. Navigate to **Analytics** tab
3. Click **Enable Analytics**
4. Select plan:
   - **Free**: 2,500 events/month
   - **Pro**: 100,000 events/month

#### Step 2: Add Analytics Package (Already Installed)

Vercel Analytics is already configured in the project via `@vercel/analytics` package.

Check installation in `web-app/package.json`:
```json
{
  "dependencies": {
    "@vercel/analytics": "^1.x.x"
  }
}
```

#### Step 3: Verify Analytics Code

Analytics should be initialized in `web-app/app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

#### Step 4: View Analytics Dashboard

Access analytics at:
```
https://vercel.com/unite-group/geo-seo-domination-tool/analytics
```

**Metrics Available:**
- Page views
- Unique visitors
- Top pages
- Top referrers
- Countries
- Devices
- Browsers

### Enable Web Vitals (Performance Monitoring)

Web Vitals track Core Web Vitals metrics:
- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)
- **FCP** (First Contentful Paint)
- **TTFB** (Time to First Byte)

Already enabled via `@vercel/analytics` - no additional configuration needed.

### Set Up Alerts

1. Go to Analytics → Settings
2. Configure alert thresholds:
   ```
   Traffic spike: > 500% increase
   Error rate: > 5%
   Performance degradation: LCP > 2.5s
   ```

3. Add notification emails

---

## 3. Sentry Setup (Error Tracking - Optional)

### Why Sentry?
- Real-time error tracking
- Performance monitoring
- Release tracking
- User feedback
- Source map support

### Quick Setup

#### Step 1: Create Sentry Account
1. Go to https://sentry.io
2. Sign up for free account
3. Create new project: **Next.js**

#### Step 2: Install Sentry
```bash
cd web-app
npx @sentry/wizard@latest -i nextjs
```

This will:
- Install `@sentry/nextjs` package
- Create `sentry.client.config.ts`
- Create `sentry.server.config.ts`
- Create `sentry.edge.config.ts`
- Add Sentry to `next.config.js`

#### Step 3: Add Environment Variables

In Vercel Dashboard → Settings → Environment Variables:
```
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-org
SENTRY_PROJECT=geo-seo-domination-tool
SENTRY_AUTH_TOKEN=your-auth-token
```

#### Step 4: Configure Error Boundaries

Sentry automatically adds error boundaries. Verify in:
```typescript
// web-app/app/error.tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

---

## 4. Health Check Endpoint

Ensure health check endpoint is working:

**Endpoint**: `/api/health`

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-07T08:43:00.000Z",
  "environment": "production",
  "database": "connected",
  "services": {
    "supabase": "ok",
    "scheduler": "ok"
  }
}
```

**Test Endpoint:**
```bash
curl https://geo-seo-domination-tool-unite-group.vercel.app/api/health
```

---

## 5. Monitoring Dashboard URLs

### Quick Access Links

| Service | URL |
|---------|-----|
| Production Site | https://geo-seo-domination-tool-unite-group.vercel.app |
| Health Check | https://geo-seo-domination-tool-unite-group.vercel.app/api/health |
| Vercel Dashboard | https://vercel.com/unite-group/geo-seo-domination-tool |
| Vercel Analytics | https://vercel.com/unite-group/geo-seo-domination-tool/analytics |
| Vercel Deployments | https://vercel.com/unite-group/geo-seo-domination-tool/deployments |
| UptimeRobot Dashboard | https://uptimerobot.com/dashboard |
| Sentry Dashboard | https://sentry.io/organizations/your-org/projects/geo-seo-domination-tool/ |

---

## 6. Alert Configuration

### Recommended Alert Rules

#### Critical Alerts (Immediate Response Required)
- Site down (UptimeRobot)
- 500 error rate > 5% (Vercel/Sentry)
- Database connection failures (Health check)
- Deployment failures (Vercel webhook)

#### Warning Alerts (Investigation Needed)
- Response time > 2 seconds (UptimeRobot)
- Error rate > 1% (Sentry)
- Memory usage > 80% (Vercel)
- LCP > 2.5s (Web Vitals)

#### Info Alerts (Track Trends)
- Daily traffic reports (Vercel Analytics)
- Weekly performance reports (Sentry)
- Monthly uptime reports (UptimeRobot)

### Notification Channels

**Immediate (Critical):**
- Email
- SMS (if configured)
- Slack/Discord webhook

**Daily Digest:**
- Email summary
- Slack channel posting

---

## 7. Monitoring Checklist

### Initial Setup
- [ ] UptimeRobot account created
- [ ] Health check monitor configured
- [ ] Homepage monitor configured
- [ ] Alert contacts added
- [ ] Vercel Analytics enabled
- [ ] Analytics verified in dashboard
- [ ] Sentry configured (optional)
- [ ] Test all alerts

### Daily Checks
- [ ] Check UptimeRobot dashboard for uptime
- [ ] Review Vercel Analytics for traffic patterns
- [ ] Check for new errors in Sentry

### Weekly Reviews
- [ ] Review uptime percentage (target: 99.9%)
- [ ] Analyze traffic trends
- [ ] Review performance metrics
- [ ] Check error rates and fix critical issues

### Monthly Audits
- [ ] Review monitoring coverage
- [ ] Update alert thresholds
- [ ] Optimize slow endpoints
- [ ] Review and close resolved issues

---

## 8. Troubleshooting

### UptimeRobot Shows Site Down

1. **Verify manually**: Visit production URL
2. **Check Vercel status**: https://vercel.com/status
3. **Review deployment logs**: Vercel dashboard
4. **Check health endpoint**: `/api/health`
5. **Review recent deployments**: Look for failed builds

### High Error Rate in Sentry

1. **Identify error pattern**: Group similar errors
2. **Check deployment time**: Correlate with releases
3. **Review error stack traces**: Find root cause
4. **Deploy hotfix if critical**: Use Vercel rollback if needed
5. **Monitor error rate**: Ensure fix resolves issue

### Poor Performance Metrics

1. **Identify slow pages**: Use Vercel Analytics
2. **Check Web Vitals**: Focus on LCP, FID, CLS
3. **Review API response times**: Optimize slow endpoints
4. **Enable caching**: Use Vercel Edge Network
5. **Optimize images**: Use Next.js Image component

---

## 9. Next Steps After Setup

Once monitoring is configured:

1. **Baseline Metrics**: Collect 1 week of data
2. **Set Realistic Thresholds**: Based on baseline
3. **Document Incidents**: Create runbook for common issues
4. **Automate Responses**: Use webhooks for auto-healing
5. **Regular Reviews**: Weekly monitoring meetings

---

## Status

- ✅ Health check endpoint available
- ✅ Vercel Analytics package installed
- 🔄 UptimeRobot setup (requires manual account creation)
- 🔄 Vercel Analytics enablement (requires dashboard action)
- ⏸️ Sentry setup (optional, as needed)

**Last Updated**: October 7, 2025
