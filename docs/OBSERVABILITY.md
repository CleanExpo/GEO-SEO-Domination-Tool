# Observability Suite (MONITOR-001)

**Phase 3: Polish & Scale**
**Status:** ✅ Complete
**Ticket:** MONITOR-001

## Overview

Production-grade observability system with:
- **Sentry** - Error tracking and performance monitoring
- **Winston** - Structured logging
- **React Error Boundaries** - Graceful error handling
- **Health Check Dashboard** - System status monitoring
- **Web Vitals** - Performance metrics

## Architecture

### Components

1. **Sentry Integration** (`lib/sentry.ts`)
   - Error capture and reporting
   - Performance tracing
   - Session replay
   - User context tracking

2. **Winston Logger** (`lib/logger.ts`)
   - Structured JSON logging
   - Multiple transports (console, file, cloud)
   - Automatic data scrubbing

3. **Error Boundaries** (`components/error-boundary.tsx`)
   - React error catching
   - Sentry integration
   - User-friendly fallback UI

4. **Health Checks** (`app/api/health/detailed/route.ts`)
   - Database connectivity
   - Storage API status
   - Memory usage
   - Environment validation

## Sentry Configuration

### Setup

```bash
# Install Sentry SDK
npm install @sentry/nextjs

# Add to .env.local
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/yyy
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
```

### Initialisation

```typescript
import { initSentry } from '@/lib/sentry';

// In app layout or _app.tsx
initSentry();
```

### Features

**Error Tracking:**
- Automatic exception capture
- Stack trace recording
- Breadcrumb tracking
- User context association

**Performance Monitoring:**
- Transaction tracing (10% sample rate)
- API request timing
- Database query performance
- Custom operation measurement

**Session Replay:**
- 10% of sessions recorded
- 100% of error sessions captured
- All text/media masked for privacy

**Data Scrubbing:**
```typescript
// Automatically redacts sensitive keys
const sensitiveKeys = [
  'password', 'secret', 'token', 'api_key',
  'authorization', 'cookie', 'session', 'credit_card'
];
```

### Usage

**Capture Exception:**
```typescript
import { captureException } from '@/lib/sentry';

try {
  await riskyOperation();
} catch (error) {
  captureException(error, {
    context: { operation: 'riskyOperation', userId: '123' }
  });
  throw error;
}
```

**Capture Message:**
```typescript
import { captureMessage } from '@/lib/sentry';

captureMessage('Payment failed', 'error', {
  amount: 100,
  currency: 'USD',
  userId: '123'
});
```

**Set User Context:**
```typescript
import { setSentryUser } from '@/lib/sentry';

setSentryUser(userId, email, organisationId);

// On logout
clearSentryUser();
```

**Performance Tracking:**
```typescript
import { measurePerformance } from '@/lib/sentry';

const result = await measurePerformance('expensive-operation', async () => {
  return await expensiveCalculation();
});
```

## Winston Logging

### Log Levels

| Level | Priority | Use Case |
|-------|----------|----------|
| `error` | 0 | Exceptions, failures |
| `warn` | 1 | Degraded performance, quota warnings |
| `info` | 2 | Significant events (login, API calls) |
| `http` | 3 | HTTP request/response logging |
| `debug` | 4 | Detailed diagnostics (dev only) |

### Configuration

```bash
# Set log level
LOG_LEVEL=info # Production
LOG_LEVEL=debug # Development
```

### Usage

**Basic Logging:**
```typescript
import { log } from '@/lib/logger';

log.error('Database connection failed', { error: err.message });
log.warn('API rate limit approaching', { remaining: 10, limit: 100 });
log.info('User logged in', { userId, organisationId });
log.debug('Cache hit', { key: 'user:123', ttl: 300 });
```

**HTTP Request Logging:**
```typescript
import { logHttpRequest } from '@/lib/logger';

logHttpRequest(
  'POST',
  '/api/projects',
  201,
  145, // response time in ms
  userId
);
```

**Performance Logging:**
```typescript
import { measureAndLog } from '@/lib/logger';

const result = await measureAndLog('generate-report', async () => {
  return await generateReport(projectId);
});

// Logs: "generate-report completed" { duration: 2345, success: true }
```

### Log Formats

**Development (console):**
```
14:32:15 [info]: User logged in userId=123 orgId=abc
```

**Production (JSON):**
```json
{
  "timestamp": "2025-10-05 14:32:15",
  "level": "info",
  "message": "User logged in",
  "userId": "123",
  "organisationId": "abc"
}
```

### File Transports (Production)

```
logs/
  error.log      # Error level only
  combined.log   # All levels
  exceptions.log # Unhandled exceptions
  rejections.log # Unhandled promise rejections
```

## Error Boundaries

### Usage

**Wrap Components:**
```tsx
import { ErrorBoundary } from '@/components/error-boundary';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

**Custom Fallback:**
```tsx
<ErrorBoundary
  fallback={<div>Custom error UI</div>}
  onError={(error, errorInfo) => {
    console.log('Error caught:', error);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

**Route Error Boundary (App Router):**
```tsx
// app/error.tsx
'use client';

import { RouteErrorBoundary } from '@/components/error-boundary';

export default function Error({ error, reset }) {
  return <RouteErrorBoundary error={error} reset={reset} />;
}
```

### Behaviour

1. **Catch React Errors**
   - Component render errors
   - Lifecycle method errors
   - Event handler errors (via try/catch)

2. **Report to Sentry**
   - Full error details
   - Component stack trace
   - User context

3. **Log to Winston**
   - Error message
   - Stack trace
   - Component stack

4. **Display Fallback UI**
   - User-friendly error message
   - "Try Again" and "Reload" buttons
   - Error details in development only

## Health Check Dashboard

### Endpoint

**GET `/api/health/detailed`**

**Response:**
```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "2025-10-05T14:32:15Z",
  "version": "abc1234",
  "uptime": 86400,
  "checks": {
    "database": {
      "status": "pass",
      "message": "Database connectivity OK",
      "responseTime": 45,
      "details": { "recordCount": 150 }
    },
    "storage": {
      "status": "pass",
      "message": "Storage API OK",
      "responseTime": 32,
      "details": { "bucketCount": 3 }
    },
    "environment": {
      "status": "pass",
      "message": "All environment variables configured"
    },
    "memory": {
      "status": "pass",
      "message": "Memory usage normal",
      "details": {
        "heapUsedMB": 45,
        "heapTotalMB": 128,
        "usagePercent": 35
      }
    }
  }
}
```

### Status Codes

- `200` - Healthy (all checks pass)
- `207` - Degraded (warnings present)
- `503` - Unhealthy (failures present)

### Check Criteria

**Database:**
- ✅ Pass: Query < 1s, no errors
- ⚠️ Warn: Query > 1s
- ❌ Fail: Query error or timeout

**Storage:**
- ✅ Pass: List buckets succeeds
- ❌ Fail: Storage API error

**Environment:**
- ✅ Pass: All required vars present
- ⚠️ Warn: Optional vars missing
- ❌ Fail: Required vars missing

**Memory:**
- ✅ Pass: Usage < 75%
- ⚠️ Warn: Usage 75-90%
- ❌ Fail: Usage > 90%

### Monitoring

**Uptime Monitoring:**
```bash
# Ping health check every 60s
*/1 * * * * curl https://your-app.vercel.app/api/health/detailed
```

**Vercel Cron:**
```json
{
  "crons": [{
    "path": "/api/health/check",
    "schedule": "*/5 * * * *"
  }]
}
```

## Web Vitals (Future)

**Metrics to Track:**
- LCP (Largest Contentful Paint) - Loading performance
- FID (First Input Delay) - Interactivity
- CLS (Cumulative Layout Shift) - Visual stability
- TTFB (Time to First Byte) - Server response

**Implementation:**
```typescript
import { getCLS, getFID, getLCP } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getLCP(console.log);
```

## Best Practices

### Error Handling

✅ **Do:**
- Catch errors at component boundaries
- Provide meaningful error messages
- Log errors with context
- Report to Sentry for analysis

❌ **Don't:**
- Swallow errors silently
- Log sensitive data (passwords, tokens)
- Over-report (e.g., every validation error)

### Logging

✅ **Do:**
- Use appropriate log levels
- Include context (userId, orgId)
- Structure logs as JSON
- Scrub sensitive data

❌ **Don't:**
- Log at debug level in production
- Include stack traces in info logs
- Log PII without masking

### Performance

✅ **Do:**
- Sample transactions (10% default)
- Measure critical paths
- Track slow queries
- Monitor memory usage

❌ **Don't:**
- Trace every request (overhead)
- Block on logging operations
- Store logs locally in production

## Troubleshooting

**Issue:** Errors not appearing in Sentry
- ✅ Check NEXT_PUBLIC_SENTRY_DSN is set
- ✅ Verify initSentry() is called
- ✅ Test with captureException()

**Issue:** Logs not written to files
- ✅ Ensure NODE_ENV=production
- ✅ Check logs/ directory exists
- ✅ Verify write permissions

**Issue:** Health check fails
- ✅ Check Supabase credentials
- ✅ Verify network connectivity
- ✅ Review environment variables

## Security

**Data Scrubbing:**
- Passwords, tokens, secrets → `[REDACTED]`
- Email addresses → `j***@example.com`
- Credit cards, SSN → Fully masked

**Privacy:**
- Session replay: All text/media masked
- User context: Minimal PII
- Logs: Structured with scrubbing

## Australian English

Consistent spelling:
- `organisation` (not organization)
- `colour` (not color)
- `behaviour` (not behavior)

---

**Files Created:**
- `lib/sentry.ts`
- `lib/logger.ts`
- `components/error-boundary.tsx`
- `app/api/health/detailed/route.ts`
- `docs/OBSERVABILITY.md`
