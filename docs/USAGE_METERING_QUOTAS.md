# Usage Metering & Quotas

Complete usage tracking and quota enforcement system for SaaS applications with role-based limits.

## Overview

The **usage-metering-complete** blueprint creates:
1. **usage-metering-schema** → Database tables (quota_limits, usage_metrics) with RLS and helper functions
2. **quota-check-lib** → TypeScript utilities for checking and enforcing quotas
3. **usage-dashboard-page** → User-facing dashboard showing usage and limits

## Features

### Database Schema
- **quota_limits** table: Defines limits per role (free/pro/admin) and metric type
- **usage_metrics** table: Tracks actual resource consumption
- **Helper functions**: track_usage(), check_quota(), get_usage_summary()
- **RLS policies**: Users see own usage, admins see all

### Quota Enforcement
- **Pre-check**: Verify quota before operation
- **Auto-track**: Record usage automatically
- **Flexible periods**: hour, day, month, total
- **Workspace-scoped**: Optional workspace-level quotas

### User Dashboard
- **Real-time usage**: Current usage vs limits for all metrics
- **Progress bars**: Visual indication with color coding
- **Alerts**: Badges for exceeded or low remaining quotas
- **Upgrade CTA**: Encourage free users to upgrade

## Metrics Supported

Default metrics (extensible):
- **api_calls**: API request count
- **storage_mb**: Storage consumption
- **projects**: Number of projects
- **builds**: Build execution count
- **deployments**: Deployment count

## Default Quotas

### Free Tier
- API Calls: 100/day, 1,000/month
- Storage: 100 MB (total)
- Projects: 3 (total)
- Builds: 10/month
- Deployments: 5/month

### Pro Tier
- API Calls: 1,000/day, 50,000/month
- Storage: 10 GB (total)
- Projects: 50 (total)
- Builds: 500/month
- Deployments: 100/month

### Admin Tier
- All metrics: Unlimited

## Prerequisites

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE=eyJhbGci...  # Server-side only
```

### Package Installation
```bash
npm i -w web-app @supabase/supabase-js @supabase/ssr
```

## Apply the Blueprint

### Via Blueprints UI
1. Navigate to `/projects/blueprints`
2. Select "Usage Metering & Quotas Complete"
3. Click "Preview Blueprint"
4. Click "Apply Blueprint"

### Via MCP Server
```bash
call_mcp apply_blueprint --id usage-metering-complete
```

## Generated Files

### Database Schema
- `database/supabase/usage_metering.sql` — Tables, functions, policies, seed data

### Application Files
- `web-app/lib/quota.ts` — Quota utilities
- `web-app/app/usage/page.tsx` — Usage dashboard

### Documentation
- `docs/builders/usage-metering-schema.md`
- `docs/builders/quota-check-lib.md`
- `docs/builders/usage-dashboard-page.md`

## Setup Steps

### 1. Apply the Blueprint
Use Blueprints UI or MCP server to generate all files.

### 2. Run Database Migration
Copy SQL from `database/supabase/usage_metering.sql` and run in Supabase SQL Editor.

Verify tables created:
```sql
SELECT tablename FROM pg_tables WHERE tablename IN ('quota_limits', 'usage_metrics');
```

### 3. Verify Seed Data
```sql
SELECT role, metric_type, limit_value, period FROM quota_limits ORDER BY role, metric_type;
```

Should show 18 rows (3 roles × 6 metrics).

### 4. Start Development Server
```bash
npm run dev -w web-app
```

## Usage Examples

### Basic Quota Check
```typescript
// app/api/some-endpoint/route.ts
import { checkQuota } from '@/lib/quota';

export async function POST(req: Request){
  const { data: { user } } = await supa.auth.getUser();

  // Check if user has quota
  const quota = await checkQuota(user.id, 'api_calls', 'day');

  if (!quota.allowed) {
    return Response.json({
      error: 'Daily API call limit exceeded',
      currentUsage: quota.currentUsage.toString(),
      limit: quota.quotaLimit.toString()
    }, { status: 429 });
  }

  // Process request...
}
```

### Enforce Quota (Check + Track)
```typescript
import { enforceQuota, QuotaExceededError } from '@/lib/quota';

export async function POST(req: Request){
  const { data: { user } } = await supa.auth.getUser();

  try {
    // This checks quota and tracks usage in one call
    await enforceQuota(user.id, 'api_calls', 1);

    // Process request...
    return Response.json({ ok: true });

  } catch (e) {
    if (e instanceof QuotaExceededError) {
      return Response.json({
        error: 'Quota exceeded',
        metricType: e.metricType,
        currentUsage: e.quota.currentUsage.toString(),
        limit: e.quota.quotaLimit.toString(),
        remaining: e.quota.remaining.toString()
      }, { status: 429 });
    }
    throw e;
  }
}
```

### Track Usage Manually
```typescript
import { trackUsage } from '@/lib/quota';

// Track storage usage
await trackUsage(user.id, 'storage_mb', 50, {
  period: 'total',
  metadata: { fileName: 'logo.png', size: 52428800 }
});

// Track workspace-scoped usage
await trackUsage(user.id, 'builds', 1, {
  workspaceId: workspace.id,
  metadata: { buildId: build.id, duration: 120 }
});
```

### Get Usage Summary
```typescript
import { getUsageSummary } from '@/lib/quota';

const summary = await getUsageSummary(user.id, 'month');

summary.forEach(metric => {
  console.log(`${metric.metricType}: ${metric.currentUsage}/${metric.quotaLimit}`);
  console.log(`  Remaining: ${metric.remaining}, Allowed: ${metric.allowed}`);
});
```

## Testing

### Check Initial State
```bash
# Sign in as a free user
# Navigate to /usage
# Should see all metrics at 0 usage
```

### Trigger Usage
```bash
# Make an API call that uses enforceQuota
curl -X POST http://localhost:3000/api/test-quota \
  -H "Cookie: sb-access-token=..."

# Refresh /usage page
# Should see api_calls increment
```

### Test Quota Limit
```bash
# Make 101 requests (free tier limit: 100/day)
for i in {1..101}; do
  curl -X POST http://localhost:3000/api/test-quota \
    -H "Cookie: sb-access-token=..."
done

# Request 101 should return 429
# /usage page should show "Exceeded" badge
```

### Test Database Functions
```sql
-- Check quota for a user
SELECT * FROM check_quota(
  'user-uuid-here',
  'api_calls',
  'day'
);

-- Track usage
SELECT track_usage(
  'user-uuid-here',
  'api_calls',
  1,
  null,
  '{}',
  'day'
);

-- Get usage summary
SELECT * FROM get_usage_summary('user-uuid-here', 'month');
```

## API Integration Patterns

### Express-style Middleware
```typescript
// lib/middleware/quota.ts
import { enforceQuota } from '@/lib/quota';
import { createServerClient } from '@supabase/ssr';

export async function quotaMiddleware(
  req: NextRequest,
  metricType: string,
  value: number = 1
) {
  const supa = createServerClient(/*...*/);
  const { data: { user } } = await supa.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  await enforceQuota(user.id, metricType, value);
}

// Usage in route
export async function POST(req: NextRequest){
  await quotaMiddleware(req, 'api_calls');
  // ... rest of handler
}
```

### Decorator Pattern
```typescript
// lib/decorators/with-quota.ts
export function withQuota(metricType: string, value: number = 1) {
  return function(handler: Function) {
    return async function(req: NextRequest, ...args: any[]) {
      const { data: { user } } = await supa.auth.getUser();
      await enforceQuota(user!.id, metricType, value);
      return handler(req, ...args);
    };
  };
}

// Usage
export const POST = withQuota('api_calls')(async function(req: NextRequest){
  // ... handler logic
});
```

### Response Headers
```typescript
// Include quota info in headers
import { checkQuota } from '@/lib/quota';

const quota = await checkQuota(user.id, 'api_calls', 'day');

return Response.json({ data }, {
  headers: {
    'X-RateLimit-Limit': quota.quotaLimit.toString(),
    'X-RateLimit-Remaining': quota.remaining.toString(),
    'X-RateLimit-Reset': /* calculate reset time */
  }
});
```

## Customization

### Add Custom Metrics
```sql
-- Add new metric type
INSERT INTO quota_limits (role, metric_type, limit_value, period)
VALUES
  ('free', 'ai_requests', 10, 'day'),
  ('pro', 'ai_requests', 1000, 'day');
```

```typescript
// Track custom metric
await enforceQuota(user.id, 'ai_requests', 1);
```

### Modify Existing Quotas
```sql
-- Increase free tier storage
UPDATE quota_limits
SET limit_value = 500
WHERE role = 'free' AND metric_type = 'storage_mb' AND period = 'total';
```

### Add New Tiers
```sql
-- Add enterprise tier
INSERT INTO quota_limits (role, metric_type, limit_value, period)
VALUES
  ('enterprise', 'api_calls', 10000, 'day'),
  ('enterprise', 'api_calls', 500000, 'month'),
  ('enterprise', 'storage_mb', 100000, 'total'),
  ('enterprise', 'projects', 500, 'total'),
  ('enterprise', 'builds', 5000, 'month'),
  ('enterprise', 'deployments', 1000, 'month');
```

### Workspace-Level Quotas
```sql
-- Add workspace-specific quota limits table
CREATE TABLE workspace_quota_overrides (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id),
  metric_type TEXT NOT NULL,
  limit_value BIGINT NOT NULL,
  period TEXT NOT NULL
);

-- Override workspace quota
INSERT INTO workspace_quota_overrides (workspace_id, metric_type, limit_value, period)
VALUES ('workspace-uuid', 'builds', 1000, 'month');
```

## Monitoring & Analytics

### Usage Trends
```sql
-- Daily API calls for last 30 days
SELECT
  period_start::date as day,
  SUM(value) as total_calls
FROM usage_metrics
WHERE metric_type = 'api_calls'
  AND period_start >= NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day;
```

### Top Users by Metric
```sql
-- Top 10 users by storage
SELECT
  u.email,
  SUM(um.value) as total_storage_mb
FROM usage_metrics um
JOIN auth.users u ON u.id = um.user_id
WHERE um.metric_type = 'storage_mb'
GROUP BY u.id, u.email
ORDER BY total_storage_mb DESC
LIMIT 10;
```

### Quota Utilization
```sql
-- Users near quota limits (>80%)
SELECT
  u.email,
  um.metric_type,
  SUM(um.value) as current_usage,
  ql.limit_value,
  (SUM(um.value)::float / ql.limit_value * 100) as utilization_pct
FROM usage_metrics um
JOIN auth.users u ON u.id = um.user_id
JOIN profiles p ON p.id = u.id
JOIN quota_limits ql ON ql.role = p.role AND ql.metric_type = um.metric_type AND ql.period = 'month'
WHERE um.period_start >= DATE_TRUNC('month', NOW())
GROUP BY u.email, um.metric_type, ql.limit_value
HAVING (SUM(um.value)::float / ql.limit_value * 100) > 80
ORDER BY utilization_pct DESC;
```

### Revenue Opportunity
```sql
-- Free users hitting limits (potential Pro upgrades)
SELECT
  u.email,
  COUNT(DISTINCT um.metric_type) as metrics_exceeded
FROM usage_metrics um
JOIN auth.users u ON u.id = um.user_id
JOIN profiles p ON p.id = u.id AND p.role = 'free'
JOIN quota_limits ql ON ql.role = 'free' AND ql.metric_type = um.metric_type AND ql.period = 'month'
WHERE um.period_start >= DATE_TRUNC('month', NOW())
GROUP BY u.id, u.email
HAVING SUM(um.value) > MAX(ql.limit_value)
ORDER BY metrics_exceeded DESC;
```

## Security Considerations

### Server-Side Only
- Always check quotas on the server (API routes)
- Never trust client-side quota checks
- Use service role for quota functions

### Race Conditions
```typescript
// Potential race condition (two requests at once)
const quota = await checkQuota(user.id, 'api_calls');
if (!quota.allowed) return error;
// ⚠️ Another request could pass here before tracking
await trackUsage(user.id, 'api_calls');

// Better: Use enforceQuota (atomic check + track)
await enforceQuota(user.id, 'api_calls');
```

### Database Constraints
```sql
-- Add constraint to prevent negative usage
ALTER TABLE usage_metrics
ADD CONSTRAINT positive_value CHECK (value >= 0);
```

### Audit Trail
Track quota changes:
```sql
CREATE TABLE quota_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  old_limit BIGINT,
  new_limit BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Performance Optimization

### Indexing
Already included in schema:
- User + metric + period (composite)
- Workspace + metric + period (composite)
- Period range queries

### Caching
```typescript
// Cache quota limits (rarely change)
import NodeCache from 'node-cache';
const quotaCache = new NodeCache({ stdTTL: 3600 });

async function getQuotaLimit(role: string, metricType: string) {
  const key = `${role}:${metricType}`;
  let limit = quotaCache.get<number>(key);

  if (!limit) {
    const { data } = await supa
      .from('quota_limits')
      .select('limit_value')
      .eq('role', role)
      .eq('metric_type', metricType)
      .single();

    limit = data?.limit_value || 0;
    quotaCache.set(key, limit);
  }

  return limit;
}
```

### Batch Tracking
```typescript
// Track multiple metrics at once
async function trackBatch(userId: string, metrics: Array<{ type: string; value: number }>) {
  await Promise.all(
    metrics.map(m => trackUsage(userId, m.type, m.value))
  );
}

await trackBatch(user.id, [
  { type: 'api_calls', value: 1 },
  { type: 'builds', value: 1 },
  { type: 'storage_mb', value: 50 }
]);
```

## Troubleshooting

### Usage not tracking
- Check service role environment variable is set
- Verify `track_usage` function exists
- Check RLS policies allow insert
- Review database logs for errors

### Quota always shows unlimited
- Verify quota_limits table has data
- Check user role in profiles table
- Ensure role matches quota_limits.role

### Wrong period calculation
- Verify timezone settings in database
- Check `get_period_bounds` function
- Test period calculation: `SELECT * FROM get_period_bounds('month');`

### Dashboard not showing usage
- Check user is authenticated
- Verify `get_usage_summary` function works
- Test directly: `SELECT * FROM get_usage_summary('user-id', 'month');`

## Production Deployment

### Environment Variables (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE=...
```

### Database Migration
Run usage_metering.sql in production Supabase SQL Editor.

### Monitoring Alerts
Set up alerts for:
- High quota utilization (>90%)
- Frequent quota exceeded errors
- Unusual usage spikes
- Quota limit changes (audit log)

## Next Steps

### Add Quota Alerts
Email users when approaching limits:
```typescript
// Send email at 80%, 90%, 100%
if (utilization >= 0.8 && utilization < 0.9) {
  await sendEmail(user.email, 'quota-warning-80');
}
```

### Usage Analytics Dashboard (Admin)
Show system-wide usage trends and revenue opportunities.

### Soft vs Hard Limits
```typescript
// Soft limit: warn but allow
if (!quota.allowed && quota.quotaLimit > 0) {
  // Log warning, send email, but continue
  await logSoftLimitExceeded(user.id, metricType);
}

// Hard limit: block request
if (!quota.allowed && isHardLimit(metricType)) {
  throw new QuotaExceededError(...);
}
```

### Quota Rollover
Allow unused quota to roll over to next period:
```sql
-- Track rollover allowance
ALTER TABLE usage_metrics ADD COLUMN rollover_bonus BIGINT DEFAULT 0;
```

## References

- [Usage-Based Pricing Models](https://www.paddle.com/resources/usage-based-pricing)
- [SaaS Metrics Guide](https://www.saastr.com/saas-metrics-guide/)
- [PostgreSQL Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [BigInt in PostgreSQL](https://www.postgresql.org/docs/current/datatype-numeric.html)
