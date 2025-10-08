# Sentry Setup Guide - GEO-SEO Domination Tool

**Created:** 2025-10-09
**Purpose:** Replace 742 console.log statements with proper error tracking and monitoring
**Status:** Ready to configure

---

## Overview

Sentry will provide:
- **Error Tracking** - Capture and track 742+ console.log/error/warn statements
- **Performance Monitoring** - API response times, database queries
- **Release Health** - Session tracking, crash-free rates, user adoption
- **User Context** - Track which users experience errors
- **Breadcrumbs** - Full context leading up to errors

---

## Installation ✅

**Already Installed:**
```bash
npm install @sentry/nextjs --save
```

**Status:** ✅ Package installed, ready for configuration

---

## Configuration Steps

### Step 1: Run Sentry Wizard (5 minutes)

```bash
npx @sentry/wizard@latest -i nextjs
```

**Wizard will:**
1. Prompt for Sentry DSN (from sentry.io project)
2. Create configuration files:
   - `sentry.client.config.ts` - Client-side tracking
   - `sentry.server.config.ts` - Server-side tracking
   - `sentry.edge.config.ts` - Edge runtime tracking
3. Update `next.config.js` with Sentry webpack plugin
4. Add environment variables to `.env.local`

### Step 2: Create Sentry Project (10 minutes)

1. Go to https://sentry.io
2. Create account or sign in
3. Create new project:
   - Platform: **Next.js**
   - Project name: **GEO-SEO-Domination-Tool**
   - Alert frequency: **On every new issue**
4. Copy **DSN** (Data Source Name)
   - Format: `https://[key]@[org].ingest.sentry.io/[project]`

### Step 3: Configure Environment Variables

Add to `.env.local`:
```env
# Sentry Configuration
SENTRY_DSN=https://[your-key]@[your-org].ingest.sentry.io/[project-id]
SENTRY_AUTH_TOKEN=sntrys_[your-auth-token]
SENTRY_ORG=[your-org-slug]
SENTRY_PROJECT=geo-seo-domination-tool

# Release tracking (optional but recommended)
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_RELEASE_VERSION=1.0.0
```

Add to Vercel environment variables:
```bash
vercel env add SENTRY_DSN production
vercel env add SENTRY_AUTH_TOKEN production
vercel env add SENTRY_ORG production
vercel env add SENTRY_PROJECT production
```

---

## Release Health Configuration

### Understanding Sessions for Next.js

**Our Application Type:** Server-mode/request-mode sessions

**Session Definition:**
- **Starts:** When server receives HTTP request
- **Ends:** When server sends response
- **Volume:** High (one session per API call)

**Session Tracking:**
- Automatically handled by @sentry/nextjs
- Each page load = new session
- Each navigation in SPA = new session
- Each API request = new session

### Session Statuses

**Healthy:**
- Request completed successfully
- No errors occurred
- Normal termination

**Errored:**
- Request completed but had handled errors
- Non-crashing errors (400-level responses)
- Logged errors that didn't crash server

**Crashed:**
- Unhandled exceptions
- 500-level errors
- Server failures

**Abnormal:**
- Timeouts
- Forced terminations
- OS-level kills

### Release Health Metrics

**Crash-Free Sessions:**
- Target: >99.5%
- Alert threshold: <99%
- Calculation: (Total sessions - Crashed sessions) / Total sessions

**Crash-Free Users:**
- Target: >99%
- Alert threshold: <95%
- Tracks unique users who didn't experience crashes

**Active Sessions:**
- Sessions started in last 24 hours
- Indicates application usage

**Active Users:**
- Users who started app in last 24 hours
- Indicates user engagement

---

## Configuration Files

### 1. sentry.client.config.ts

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',
  release: process.env.NEXT_PUBLIC_RELEASE_VERSION,

  // Performance Monitoring
  tracesSampleRate: 1.0, // 100% in development, 0.1 in production

  // Session Replay (optional)
  replaysOnErrorSampleRate: 1.0, // Capture 100% of errors
  replaysSessionSampleRate: 0.1, // Capture 10% of sessions

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Ignore common non-critical errors
  ignoreErrors: [
    'Non-Error promise rejection captured',
    'ResizeObserver loop limit exceeded',
    'Network request failed',
  ],

  // User context (for authenticated users)
  beforeSend(event, hint) {
    // Add custom context
    if (event.user) {
      // Don't send PII in production
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
});
```

### 2. sentry.server.config.ts

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Environment
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',
  release: process.env.NEXT_PUBLIC_RELEASE_VERSION,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions in production

  // Enable profiling (optional)
  profilesSampleRate: 0.1,

  // Server-specific integrations
  integrations: [
    Sentry.httpIntegration({
      tracing: true,
      breadcrumbs: true,
    }),
  ],

  // Error filtering
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = hint.originalException;

      // Don't send expected 404s
      if (error?.message?.includes('404')) {
        return null;
      }
    }

    return event;
  },

  // Breadcrumb filtering
  beforeBreadcrumb(breadcrumb, hint) {
    // Don't send breadcrumbs for health checks
    if (breadcrumb.category === 'http' && breadcrumb.data?.url?.includes('/health')) {
      return null;
    }
    return breadcrumb;
  },
});
```

### 3. sentry.edge.config.ts

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',
  release: process.env.NEXT_PUBLIC_RELEASE_VERSION,
  tracesSampleRate: 0.1,
});
```

### 4. Update next.config.js

```javascript
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Suppresses source map uploading logs during build
  silent: true,

  // Organization and project from Sentry
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for uploading source maps
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps in production only
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
  disableLogger: true,
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
```

---

## Migration Strategy: Replace console.log

### Priority 1: Critical Error Handling (100 statements - 2 hours)

**Services Layer:**
```typescript
// Before
export async function fetchSEMrushData(domain: string) {
  try {
    const response = await fetch(`https://api.semrush.com/...`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('SEMrush API error:', error); // ❌ Remove
    throw error;
  }
}

// After
import * as Sentry from '@sentry/nextjs';

export async function fetchSEMrushData(domain: string) {
  try {
    const response = await fetch(`https://api.semrush.com/...`);
    const data = await response.json();
    return data;
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        service: 'semrush',
        feature: 'keyword-research',
      },
      contexts: {
        api: {
          domain,
          endpoint: '/keywords',
        },
      },
    });
    throw error;
  }
}
```

**API Routes:**
```typescript
// Before
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await processData(body);
    return Response.json(result);
  } catch (error) {
    console.error('API error:', error); // ❌ Remove
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

// After
import * as Sentry from '@sentry/nextjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await processData(body);
    return Response.json(result);
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: 'api/companies' },
      extra: { requestBody: body },
    });
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### Priority 2: Security-Sensitive Logging (~50 statements - 2 hours)

**Authentication:**
```typescript
// Before
export async function signIn(credentials) {
  console.log('Sign in attempt:', credentials.email); // ❌ Security risk
  // ...
}

// After
import * as Sentry from '@sentry/nextjs';

export async function signIn(credentials) {
  Sentry.addBreadcrumb({
    category: 'auth',
    message: 'Sign in attempt',
    level: 'info',
    data: {
      // Don't log sensitive data
      method: 'credentials',
      timestamp: Date.now(),
    },
  });
  // ...
}
```

### Priority 3: User-Facing Errors (~100 statements - 2 hours)

**Component Error Boundaries:**
```typescript
// Before
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error); // ❌ Remove
  }
}

// After
import * as Sentry from '@sentry/nextjs';

class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }
}
```

### Priority 4: Debug Logging (~492 console.log - 4 hours)

**Service Methods:**
```typescript
// Before
export async function getCompany(id: string) {
  console.log('Fetching company:', id); // ❌ Remove
  const company = await db.get('SELECT * FROM companies WHERE id = ?', id);
  console.log('Found company:', company); // ❌ Remove
  return company;
}

// After
import * as Sentry from '@sentry/nextjs';

export async function getCompany(id: string) {
  Sentry.addBreadcrumb({
    category: 'database',
    message: 'Fetching company',
    level: 'debug',
    data: { companyId: id },
  });

  const company = await db.get('SELECT * FROM companies WHERE id = ?', id);

  if (!company) {
    Sentry.addBreadcrumb({
      category: 'database',
      message: 'Company not found',
      level: 'warning',
      data: { companyId: id },
    });
  }

  return company;
}
```

---

## Release Tracking

### Automatic Release Creation

Add to `package.json`:
```json
{
  "scripts": {
    "build": "next build",
    "postbuild": "sentry-cli releases new $npm_package_version && sentry-cli releases finalize $npm_package_version"
  }
}
```

### Manual Release Creation

```bash
# Create release
sentry-cli releases new 1.0.0

# Associate commits
sentry-cli releases set-commits 1.0.0 --auto

# Deploy
npm run build
vercel deploy --prod

# Finalize release
sentry-cli releases finalize 1.0.0

# Create deploy
sentry-cli releases deploys 1.0.0 new -e production
```

### Release Health Monitoring

**Key Metrics to Track:**
1. **Crash-Free Rate:** Should be >99%
2. **Session Count:** Trending up with user growth
3. **Error Count:** Trending down over releases
4. **Performance:** Response times improving

**Set Up Alerts:**
```typescript
// In Sentry dashboard:
// Alerts > Create Alert Rule

Alert Conditions:
- Crash rate > 1% for any release
- Error count > 100 in 1 hour
- Response time P95 > 2000ms
```

---

## Performance Monitoring

### Instrument Slow Queries

```typescript
import * as Sentry from '@sentry/nextjs';

export async function getCompanyWithRelations(id: string) {
  const transaction = Sentry.startTransaction({
    op: 'database',
    name: 'Get Company with Relations',
  });

  try {
    const companySpan = transaction.startChild({
      op: 'db.query',
      description: 'SELECT company',
    });
    const company = await db.get('SELECT * FROM companies WHERE id = ?', id);
    companySpan.finish();

    const keywordsSpan = transaction.startChild({
      op: 'db.query',
      description: 'SELECT keywords',
    });
    const keywords = await db.all('SELECT * FROM keywords WHERE company_id = ?', id);
    keywordsSpan.finish();

    return { company, keywords };
  } finally {
    transaction.finish();
  }
}
```

### Instrument API Calls

```typescript
import * as Sentry from '@sentry/nextjs';

export async function fetchSEMrushKeywords(domain: string) {
  const transaction = Sentry.startTransaction({
    op: 'http',
    name: 'Fetch SEMrush Keywords',
  });

  try {
    const response = await fetch(`https://api.semrush.com/keywords?domain=${domain}`);
    const data = await response.json();

    transaction.setTag('status_code', response.status);
    transaction.setData('keyword_count', data.keywords.length);

    return data;
  } finally {
    transaction.finish();
  }
}
```

---

## Testing Sentry Integration

### Test Error Capture

Create test route: `app/api/sentry-test/route.ts`
```typescript
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  try {
    throw new Error('This is a test error from Sentry integration');
  } catch (error) {
    Sentry.captureException(error, {
      tags: { test: true },
    });
    throw error;
  }
}
```

**Test Steps:**
1. Visit `/api/sentry-test`
2. Check Sentry dashboard for error
3. Verify stack trace, breadcrumbs, context
4. Delete test route after verification

---

## ESLint Rule: Prevent New console.log

Add to `.eslintrc.json`:
```json
{
  "rules": {
    "no-console": ["error", {
      "allow": ["warn", "error", "info"]
    }]
  }
}
```

**Or enforce strictly:**
```json
{
  "rules": {
    "no-console": "error"
  }
}
```

This will cause ESLint errors on any new `console.log` statements.

---

## Success Metrics

### After Sentry Integration

**Observability:**
- Before: 40/100
- After: 70/100
- Improvement: +75%

**Error Tracking:**
- Before: 742 console.log (lost in serverless)
- After: All errors tracked with context
- Retention: 90 days

**Performance:**
- Track slow API calls
- Identify N+1 queries
- Monitor database performance

**Release Health:**
- Crash-free rate monitoring
- User adoption tracking
- Error trending

---

## Timeline

**Week 1 (10 hours):**
- Setup: 1h
- Priority 1 (critical errors): 2h
- Priority 2 (security): 2h
- Priority 3 (user-facing): 2h
- Priority 4 (debug logs): 3h

**Week 2 (6 hours):**
- Performance instrumentation: 3h
- Release tracking setup: 2h
- Alert configuration: 1h

**Week 3 (4 hours):**
- Testing and validation: 2h
- Documentation: 1h
- Training team: 1h

**Total:** 20 hours

---

## Next Steps

1. **Run Sentry Wizard:** `npx @sentry/wizard@latest -i nextjs`
2. **Create Sentry Project:** Get DSN from sentry.io
3. **Configure Environment Variables:** Add to .env.local and Vercel
4. **Test Integration:** Create test error and verify in Sentry
5. **Begin Migration:** Start with Priority 1 (critical errors)

---

## Resources

- **Sentry Next.js Docs:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Release Health:** https://docs.sentry.io/product/releases/health/
- **Performance Monitoring:** https://docs.sentry.io/product/performance/
- **Session Replay:** https://docs.sentry.io/product/explore/session-replay/

---

**Status:** Ready to configure - Wizard will create all config files
