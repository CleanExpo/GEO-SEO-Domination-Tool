# Quota Enforcement Integration

This document describes the integration of usage metering quotas with the builds and deploy APIs.

## Overview

The **builds** and **deploy** APIs now enforce quotas to prevent users from exceeding their plan limits:

- **Builds API** (`/api/builds`): Enforces `builds` metric quota
- **Deploy API** (`/api/deploy`): Enforces `deployments` metric quota

Both APIs use the quota enforcement system from the `usage-metering-quotas` blueprint.

## Quota Limits

Default quota limits by tier (configured in `quota_limits` table):

### Free Tier
- **Builds**: 10/month
- **Deployments**: 5/month

### Pro Tier
- **Builds**: 500/month
- **Deployments**: 100/month

### Admin Tier
- **Builds**: Unlimited
- **Deployments**: Unlimited

## Builds API Integration

### Protected Actions

The following actions in `/api/builds` enforce quota:

1. **apply_builder**: Creates files from builder templates
2. **apply_plan**: Applies planned file changes

### Implementation

```typescript
// /api/builds POST handler
import { enforceQuota, QuotaExceededError } from '@/lib/quota';

// Get authenticated user
const { data: { user } } = await supabase.auth.getUser();

// Enforce quota before building
if (action === 'apply_builder') {
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
  }

  try {
    await enforceQuota(user.id, 'builds', 1);
  } catch (e) {
    if (e instanceof QuotaExceededError) {
      return NextResponse.json({
        ok: false,
        error: 'Build quota exceeded',
        metricType: e.metricType,
        currentUsage: e.quota.currentUsage.toString(),
        limit: e.quota.quotaLimit.toString(),
        remaining: e.quota.remaining.toString()
      }, { status: 429 });
    }
    throw e;
  }

  // Proceed with build
  const resp = await callMcp(action, params || {});
  return NextResponse.json(resp, { status: 200 });
}
```

### Unprotected Actions

These read-only actions do NOT enforce quota:
- **list_builders**: Lists available builders
- **inspect_builder**: Shows builder details
- **preview_apply**: Previews changes without applying
- **preview_conflicts**: Shows file conflicts
- **post_install_check**: Verifies installation
- **GET /api/builds**: Lists builders

## Deploy API Integration

### Protected Actions

The following deployment operations in `/api/deploy` enforce quota:

1. **build** (local or SSH): Docker compose build
2. **up** (local or SSH): Docker compose up (deployment)

### Implementation

```typescript
// /api/deploy POST handler (local deployment)
if (params?.target === 'local') {
  // Enforce quota for deployment actions (up/build)
  if ((action === 'up' || action === 'build') && user) {
    try {
      await enforceQuota(user.id, 'deployments', 1);
    } catch (e) {
      if (e instanceof QuotaExceededError) {
        return NextResponse.json({
          ok: false,
          error: 'Deployment quota exceeded',
          metricType: e.metricType,
          currentUsage: e.quota.currentUsage.toString(),
          limit: e.quota.quotaLimit.toString(),
          remaining: e.quota.remaining.toString()
        }, { status: 429 });
      }
      throw e;
    }
  }

  // Proceed with deployment
  const { code, out, err } = await run('docker', args, repoRoot);
  return NextResponse.json({ ok: code===0, status: code, stdout: out, stderr: err }, { status: 200 });
}
```

### Unprotected Actions

These operations do NOT enforce quota:
- **config**: Shows docker-compose configuration
- **down**: Stops containers (cleanup)
- **ps**: Lists running containers
- **logs**: Shows container logs
- **save_ssh**: Saves SSH deployment configuration
- **status_ssh**: Tests SSH connection

## Error Response Format

When quota is exceeded, APIs return HTTP 429 (Too Many Requests):

```json
{
  "ok": false,
  "error": "Build quota exceeded",
  "metricType": "builds",
  "currentUsage": "10",
  "limit": "10",
  "remaining": "0"
}
```

**Response Fields**:
- `ok`: `false` (operation failed)
- `error`: Human-readable error message
- `metricType`: The quota metric that was exceeded (`builds` or `deployments`)
- `currentUsage`: Current usage count (string)
- `limit`: Maximum allowed (string, `-1` for unlimited)
- `remaining`: Quota remaining (string, always `0` when exceeded)

## Usage Examples

### Client-Side Handling

#### Builds API

```typescript
async function applyBuilder(builderId: string, variables: any) {
  const response = await fetch('/api/builds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'apply_builder',
      params: { id: builderId, variables }
    })
  });

  const data = await response.json();

  if (!data.ok) {
    if (response.status === 429) {
      // Quota exceeded
      console.error(`Build quota exceeded: ${data.currentUsage}/${data.limit}`);
      alert(`You've used all ${data.limit} builds this month. Upgrade to Pro for more builds.`);
      return;
    }
    if (response.status === 401) {
      // Not authenticated
      window.location.href = '/login';
      return;
    }
    throw new Error(data.error);
  }

  return data.result;
}
```

#### Deploy API

```typescript
async function deployApp(target: 'local' | 'ssh') {
  const response = await fetch('/api/deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'up',
      params: { target }
    })
  });

  const data = await response.json();

  if (!data.ok) {
    if (response.status === 429) {
      // Quota exceeded
      console.error(`Deployment quota exceeded: ${data.currentUsage}/${data.limit}`);
      alert(`You've used all ${data.limit} deployments this month. Upgrade to Pro for more.`);
      return;
    }
    throw new Error(data.error);
  }

  console.log('Deployment successful:', data.stdout);
  return data;
}
```

### UI Integration

Display quota status before operations:

```typescript
import { getUsageSummary } from '@/lib/quota';

async function BuilderPage() {
  const { data: { user } } = await supabase.auth.getUser();
  const summary = await getUsageSummary(user!.id, 'month');

  const buildsQuota = summary.find(m => m.metricType === 'builds');
  const deploymentsQuota = summary.find(m => m.metricType === 'deployments');

  return (
    <div>
      <h1>Project Builder</h1>

      {/* Quota warning */}
      {buildsQuota && !buildsQuota.allowed && (
        <div className="alert alert-error">
          Build quota exceeded ({buildsQuota.currentUsage}/{buildsQuota.quotaLimit}).
          <a href="/pricing">Upgrade to Pro</a> for more builds.
        </div>
      )}

      {buildsQuota && buildsQuota.remaining < 3 && buildsQuota.allowed && (
        <div className="alert alert-warning">
          Low build quota: {buildsQuota.remaining} builds remaining this month.
        </div>
      )}

      {/* Builder UI */}
      <button
        onClick={() => applyBuilder('auth-complete', {})}
        disabled={!buildsQuota?.allowed}
      >
        Apply Builder
      </button>
    </div>
  );
}
```

## Testing

### Test Quota Enforcement

```bash
# 1. Sign in as a free user (limit: 10 builds/month)

# 2. Make 10 build requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/builds \
    -H "Cookie: sb-access-token=..." \
    -H "Content-Type: application/json" \
    -d '{"action":"apply_builder","params":{"id":"quota-check-lib","variables":{}}}'
done

# 3. 11th request should return 429
curl -X POST http://localhost:3000/api/builds \
  -H "Cookie: sb-access-token=..." \
  -H "Content-Type: application/json" \
  -d '{"action":"apply_builder","params":{"id":"quota-check-lib","variables":{}}}' \
  | jq

# Expected response:
# {
#   "ok": false,
#   "error": "Build quota exceeded",
#   "metricType": "builds",
#   "currentUsage": "10",
#   "limit": "10",
#   "remaining": "0"
# }
```

### Test Deployment Quota

```bash
# 1. Sign in as a free user (limit: 5 deployments/month)

# 2. Make 5 deployment requests
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/deploy \
    -H "Cookie: sb-access-token=..." \
    -H "Content-Type: application/json" \
    -d '{"action":"up","params":{"target":"local"}}'
done

# 3. 6th request should return 429
curl -X POST http://localhost:3000/api/deploy \
  -H "Cookie: sb-access-token=..." \
  -H "Content-Type: application/json" \
  -d '{"action":"up","params":{"target":"local"}}' \
  | jq
```

### Verify Usage Dashboard

After testing, navigate to `/usage` to see updated metrics:

- **builds**: Should show 10/10 (100% used, exceeded badge)
- **deployments**: Should show 5/5 (100% used, exceeded badge)

## Database Queries

### Check User Quota

```sql
-- Check build quota for a user
SELECT * FROM check_quota(
  'user-uuid-here',
  'builds',
  'month'
);

-- Check deployment quota
SELECT * FROM check_quota(
  'user-uuid-here',
  'deployments',
  'month'
);
```

### View Usage Metrics

```sql
-- View all usage for a user this month
SELECT * FROM get_usage_summary('user-uuid-here', 'month');

-- View build usage history
SELECT * FROM usage_metrics
WHERE user_id = 'user-uuid-here'
  AND metric_type = 'builds'
ORDER BY period_start DESC
LIMIT 10;
```

### Reset Usage (Development)

```sql
-- Reset build usage for testing
DELETE FROM usage_metrics
WHERE user_id = 'user-uuid-here'
  AND metric_type = 'builds';

-- Reset deployment usage
DELETE FROM usage_metrics
WHERE user_id = 'user-uuid-here'
  AND metric_type = 'deployments';
```

## Monitoring

### Track Quota Violations

```sql
-- Users hitting build limits
SELECT
  u.email,
  COUNT(*) as exceeded_count,
  MAX(um.period_start) as last_exceeded
FROM usage_metrics um
JOIN auth.users u ON u.id = um.user_id
JOIN profiles p ON p.id = u.id
JOIN quota_limits ql ON ql.role = p.role AND ql.metric_type = 'builds' AND ql.period = 'month'
WHERE um.metric_type = 'builds'
  AND um.period_start >= DATE_TRUNC('month', NOW())
GROUP BY u.email
HAVING SUM(um.value) >= MAX(ql.limit_value)
ORDER BY exceeded_count DESC;
```

### Revenue Opportunity

```sql
-- Free users exceeding limits (potential upgrades)
SELECT
  u.email,
  p.role,
  SUM(CASE WHEN um.metric_type = 'builds' THEN um.value ELSE 0 END) as total_builds,
  SUM(CASE WHEN um.metric_type = 'deployments' THEN um.value ELSE 0 END) as total_deployments
FROM usage_metrics um
JOIN auth.users u ON u.id = um.user_id
JOIN profiles p ON p.id = u.id
WHERE p.role = 'free'
  AND um.period_start >= DATE_TRUNC('month', NOW())
GROUP BY u.email, p.role
HAVING SUM(CASE WHEN um.metric_type = 'builds' THEN um.value ELSE 0 END) >= 10
   OR SUM(CASE WHEN um.metric_type = 'deployments' THEN um.value ELSE 0 END) >= 5
ORDER BY total_builds + total_deployments DESC;
```

## Troubleshooting

### Quota not enforcing

1. Verify `quota_limits` table has data:
   ```sql
   SELECT * FROM quota_limits WHERE metric_type IN ('builds', 'deployments');
   ```

2. Check user has a role in profiles:
   ```sql
   SELECT id, email, role FROM profiles WHERE id = 'user-uuid';
   ```

3. Verify `enforceQuota` function is imported:
   ```typescript
   import { enforceQuota, QuotaExceededError } from '@/lib/quota';
   ```

### User not authenticated

Authentication is required for quota enforcement. If user is not logged in:
- Builds API returns 401 for protected actions
- Deploy API allows operations but doesn't track usage

Ensure proper authentication:
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
}
```

### Quota tracking not working

1. Verify `track_usage` function exists:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'track_usage';
   ```

2. Check RLS policies allow inserts:
   ```sql
   SELECT * FROM usage_metrics WHERE user_id = 'user-uuid' LIMIT 1;
   ```

3. Ensure service role key is set (server-side only):
   ```env
   SUPABASE_SERVICE_ROLE=eyJhbGci...
   ```

## Future Enhancements

### Soft Limits

Allow users to exceed quotas with warnings:

```typescript
const quota = await checkQuota(user.id, 'builds', 'month');

if (!quota.allowed) {
  // Log soft limit exceeded
  await logSoftLimitExceeded(user.id, 'builds');

  // Send email notification
  await sendEmail(user.email, 'quota-warning', {
    metricType: 'builds',
    currentUsage: quota.currentUsage,
    limit: quota.quotaLimit
  });

  // Allow operation but warn
  console.warn(`User ${user.id} exceeded soft limit for builds`);
}

// Track usage regardless
await trackUsage(user.id, 'builds', 1);
```

### Usage-Based Pricing

Charge per build/deployment beyond quota:

```typescript
if (!quota.allowed && quota.quotaLimit > 0) {
  // Charge overage fee
  const overage = quota.currentUsage - quota.quotaLimit + 1;
  const overageFee = overage * 0.50; // $0.50 per build

  await chargeOverageFee(user.id, 'builds', overageFee);

  // Allow operation
  await trackUsage(user.id, 'builds', 1);
}
```

### Team-Level Quotas

Share quota across workspace members:

```typescript
const workspaceId = getActiveWorkspaceId();

await enforceQuota(user.id, 'builds', 1, {
  workspaceId,
  shareAcrossMembers: true
});
```

## References

- [Usage Metering & Quotas Documentation](./USAGE_METERING_QUOTAS.md)
- [Builds API](../web-app/app/api/builds/route.ts)
- [Deploy API](../web-app/app/api/deploy/route.ts)
- [Quota Check Library](../web-app/lib/quota.ts)
