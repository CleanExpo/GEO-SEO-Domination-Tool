# Feature Flag System (FEATURE-001)

**Phase 3: Polish & Scale**
**Status:** ✅ Complete
**Ticket:** FEATURE-001

## Overview

Enterprise feature flag system for gradual rollouts and A/B testing:
- **Global Toggles** - Enable/disable features globally
- **Percentage Rollouts** - Gradual rollout to X% of users
- **Organisation Overrides** - Per-tenant feature control
- **A/B Testing** - Variant distribution
- **Analytics** - Feature usage tracking

## Architecture

### Database Schema

**Tables:**
1. `feature_flags` - Flag definitions
2. `organisation_feature_overrides` - Per-org overrides
3. `user_feature_assignments` - User-level assignments
4. `feature_flag_analytics` - Usage analytics

### Flag Evaluation Logic

```
1. Check global toggle (enabled: true/false)
   ↓ If disabled → return false
2. Check organisation override
   ↓ If exists → return override value
3. Check user assignment
   ↓ If exists → return assignment
4. Calculate percentage rollout (deterministic hash)
   ↓ Hash(userId + flagKey) % 100 < rolloutPercentage
5. Return global enabled value
```

## Core Feature Flags

**Pre-seeded flags:**

| Key | Name | Description | Default |
|-----|------|-------------|---------|
| `secrets-vault-enabled` | Secrets Vault | Encrypted secrets management (VAULT-001) | ✅ 100% |
| `multi-tenancy-enabled` | Multi-Tenancy | Organisation-based multi-tenancy (TENANT-001) | ✅ 100% |
| `command-palette-enabled` | Command Palette | Keyboard-driven interface (CMD-001) | ✅ 100% |
| `usage-tracking-enabled` | Usage Tracking | API metering and quotas (BILLING-001) | ✅ 100% |
| `white-label-theming` | White-Label Theming | Per-tenant customisation (THEME-001) | ✅ 100% |
| `github-webhooks` | GitHub Webhooks | GitHub integration (WEBHOOK-001) | ✅ 100% |
| `observability-suite` | Observability Suite | Sentry & Winston (MONITOR-001) | ✅ 100% |

## API Endpoints

### Evaluate Flag

**POST `/api/feature-flags/evaluate`**

**Request:**
```json
{
  "flagKey": "white-label-theming",
  "context": {
    "userId": "user_123",
    "organisationId": "org_456",
    "customProperties": { "plan": "enterprise" }
  }
}
```

**Response:**
```json
{
  "enabled": true,
  "variant": "variant_a",
  "reason": "org_override_enabled"
}
```

**Reasons:**
- `flag_not_found` - Flag doesn't exist
- `global_disabled` - Global toggle off
- `org_override_enabled` / `org_override_disabled` - Org override applied
- `user_assignment` - User-specific assignment
- `rollout_included` / `rollout_excluded` - Percentage rollout result
- `global_enabled` - Default enabled

### List Flags

**GET `/api/feature-flags?organisationId={id}`**

**Response:**
```json
{
  "flags": [
    {
      "id": "uuid",
      "key": "white-label-theming",
      "name": "White-Label Theming",
      "description": "...",
      "enabled": true,
      "rollout_percentage": 100,
      "variants": null,
      "organisationOverride": true
    }
  ]
}
```

### Create Flag

**POST `/api/feature-flags`**

**Request:**
```json
{
  "key": "new-feature",
  "name": "New Feature",
  "description": "Description of feature",
  "enabled": false,
  "rolloutPercentage": 0,
  "variants": {
    "control": { "color": "blue" },
    "variant_a": { "color": "green" }
  }
}
```

### Update Flag

**PUT `/api/feature-flags`**

**Request:**
```json
{
  "id": "uuid",
  "updates": {
    "enabled": true,
    "rolloutPercentage": 50
  }
}
```

## Usage

### React Hook

```tsx
import { useFeatureFlag, FEATURE_FLAGS } from '@/lib/feature-flags';

function MyComponent() {
  const { enabled, isLoading } = useFeatureFlag(
    FEATURE_FLAGS.WHITE_LABEL_THEMING,
    { userId, organisationId }
  );

  if (isLoading) return <Spinner />;

  return (
    <div>
      {enabled ? <ThemeCustomiser /> : <UpgradePrompt />}
    </div>
  );
}
```

### Service Layer

```typescript
import { FeatureFlagService } from '@/lib/feature-flags';

const flagService = new FeatureFlagService(supabaseUrl, supabaseKey);

// Evaluate flag
const result = await flagService.evaluateFlag('white-label-theming', {
  userId: 'user_123',
  organisationId: 'org_456'
});

if (result.enabled) {
  // Feature is enabled
}

// Get all flags for context
const allFlags = await flagService.getAllFlags({ userId, organisationId });
// { "secrets-vault-enabled": true, "multi-tenancy-enabled": true, ... }
```

### Type-Safe Flag Keys

```typescript
import { FEATURE_FLAGS } from '@/lib/feature-flags';

// IntelliSense autocomplete
FEATURE_FLAGS.SECRETS_VAULT
FEATURE_FLAGS.MULTI_TENANCY
FEATURE_FLAGS.COMMAND_PALETTE
FEATURE_FLAGS.WHITE_LABEL_THEMING
```

## Rollout Strategies

### Percentage Rollout

**Example:** Enable for 25% of users

```sql
UPDATE feature_flags
SET rollout_percentage = 25
WHERE key = 'new-feature';
```

**Deterministic Hashing:**
- Same user always gets same result
- Hash: `MD5(userId + flagKey) % 100 < percentage`
- Ensures consistent experience

### Organisation Override

**Example:** Enable for specific org (beta testers)

```sql
INSERT INTO organisation_feature_overrides (organisation_id, feature_flag_id, enabled, reason)
VALUES ('org_123', 'flag_uuid', true, 'Beta testing program');
```

### Gradual Rollout

**Phase 1:** Internal testing (5%)
```sql
UPDATE feature_flags SET rollout_percentage = 5 WHERE key = 'new-feature';
```

**Phase 2:** Beta users (25%)
```sql
UPDATE feature_flags SET rollout_percentage = 25 WHERE key = 'new-feature';
```

**Phase 3:** General availability (100%)
```sql
UPDATE feature_flags SET enabled = true, rollout_percentage = 100 WHERE key = 'new-feature';
```

## A/B Testing

### Setup Variants

```typescript
const variants = {
  control: {
    buttonColor: 'blue',
    ctaText: 'Sign Up'
  },
  variant_a: {
    buttonColor: 'green',
    ctaText: 'Get Started'
  },
  variant_b: {
    buttonColor: 'red',
    ctaText: 'Join Now'
  }
};

// Create flag
await flagService.createFlag({
  key: 'signup-button-test',
  name: 'Signup Button A/B Test',
  enabled: true,
  rolloutPercentage: 100,
  variants
});
```

### Evaluate Variant

```typescript
const result = await flagService.evaluateFlag('signup-button-test', {
  userId: 'user_123'
});

if (result.enabled && result.variant) {
  const config = variants[result.variant];
  // Render button with variant config
}
```

### Track Conversions

```typescript
// User clicked signup button
await supabase.from('feature_flag_analytics').insert({
  feature_flag_id: flagId,
  event_type: 'conversion',
  user_id: userId,
  enabled: true,
  variant: result.variant
});
```

### Analyse Results

```sql
-- Conversion rate by variant
SELECT
  variant,
  COUNT(*) FILTER (WHERE event_type = 'evaluation') AS impressions,
  COUNT(*) FILTER (WHERE event_type = 'conversion') AS conversions,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE event_type = 'conversion') /
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'evaluation'), 0),
    2
  ) AS conversion_rate
FROM feature_flag_analytics
WHERE feature_flag_id = 'flag_uuid'
GROUP BY variant;
```

## Analytics

### Event Types

| Event | When Tracked | Purpose |
|-------|--------------|---------|
| `evaluation` | Flag evaluated | Measure flag usage |
| `impression` | Feature displayed | Track visibility |
| `conversion` | User action completed | A/B test results |

### Analytics Query Examples

**Flag usage over time:**
```sql
SELECT
  DATE(recorded_at) AS date,
  COUNT(*) AS evaluations,
  COUNT(*) FILTER (WHERE enabled = true) AS enabled_count
FROM feature_flag_analytics
WHERE feature_flag_id = 'flag_uuid'
GROUP BY DATE(recorded_at)
ORDER BY date DESC;
```

**Top organisations by feature adoption:**
```sql
SELECT
  o.name AS organisation,
  COUNT(DISTINCT ffa.user_id) AS users_enabled
FROM feature_flag_analytics ffa
JOIN organisations o ON ffa.organisation_id = o.id
WHERE ffa.feature_flag_id = 'flag_uuid'
  AND ffa.enabled = true
GROUP BY o.name
ORDER BY users_enabled DESC
LIMIT 10;
```

## Caching

**In-Memory Cache:**
- Flags cached for 60 seconds
- Reduces database queries
- Clear cache: `flagService.clearCache()`

**Cache Invalidation:**
```typescript
// After flag update
flagService.clearCache();

// Or specific flag (future enhancement)
flagService.clearCacheForFlag('white-label-theming');
```

## Security

### RLS Policies

**Feature Flags:**
- All authenticated users can view
- Only owners can create/update

**Organisation Overrides:**
- Org members can view their org's overrides
- Org admins can manage overrides

**User Assignments:**
- Users can view their own assignments
- Admins can view all assignments

**Analytics:**
- No direct access (API only)
- Aggregate queries allowed

## Migration

```bash
# Apply migration
npm run db:migrate

# Verify flags seeded
psql -d your_db -c "SELECT key, name, enabled FROM feature_flags;"
```

**Output:**
```
key                      | name                  | enabled
-------------------------|-----------------------|--------
secrets-vault-enabled    | Secrets Vault         | t
multi-tenancy-enabled    | Multi-Tenancy         | t
command-palette-enabled  | Command Palette       | t
...
```

## Best Practices

### Naming Conventions

✅ **Do:**
- Use kebab-case: `white-label-theming`
- Be descriptive: `payment-processing-v2`
- Include feature area: `dashboard-analytics-chart`

❌ **Don't:**
- Use camelCase or snake_case
- Use generic names: `feature1`, `test`
- Omit context: `new-thing`

### Flag Lifecycle

1. **Development:** Create flag (disabled, 0% rollout)
2. **Internal Testing:** Enable for internal org override
3. **Beta:** 5-10% rollout
4. **Gradual Rollout:** 25% → 50% → 75% → 100%
5. **Full Release:** Enabled globally, 100%
6. **Cleanup:** Remove flag code after stable (2-4 weeks)

### Cleanup

**Remove obsolete flags:**
```sql
-- After feature is stable and code is cleaned up
DELETE FROM feature_flags WHERE key = 'old-feature';
```

**Archive analytics:**
```sql
-- Move to archive table before deletion
INSERT INTO feature_flag_analytics_archive
SELECT * FROM feature_flag_analytics
WHERE feature_flag_id = 'flag_uuid';
```

## Troubleshooting

**Issue:** Flag always returns false
- ✅ Check global toggle is enabled
- ✅ Verify no org override disabling it
- ✅ Check rollout percentage > 0

**Issue:** Inconsistent flag values
- ✅ Clear cache: `flagService.clearCache()`
- ✅ Verify userId is consistent
- ✅ Check for org overrides

**Issue:** A/B test skewed results
- ✅ Ensure deterministic hashing (same userId)
- ✅ Check variant distribution in analytics
- ✅ Verify no org overrides affecting test

## Future Enhancements

- Targeting rules (e.g., plan === 'enterprise')
- Time-based rollouts (enable at specific date/time)
- Dependency management (flag A requires flag B)
- Flag audit log (who changed what when)
- Dashboard UI for non-technical users
- Integration with LaunchDarkly or Unleash

---

**Files Created:**
- `database/migrations/007_feature_flags.sql`
- `lib/feature-flags.ts`
- `app/api/feature-flags/route.ts`
- `app/api/feature-flags/evaluate/route.ts`
- `docs/FEATURE-FLAGS.md`
