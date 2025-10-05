# Multi-Tenancy Architecture

**Ticket:** TENANT-001
**Author:** Orchestra-Coordinator (Agent-Tenancy)
**Date:** 2025-10-05
**Status:** Implemented

## Overview

The GEO-SEO Domination Tool implements multi-tenancy using Supabase Row-Level Security (RLS) to ensure strict data isolation between organisations. This architecture allows multiple organisations to use the same application instance whilst guaranteeing that tenant data remains completely isolated.

## Architecture

### Database Schema

#### Core Tables

**organisations:**
```sql
CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT CHECK(plan IN ('free', 'starter', 'pro', 'enterprise')) DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**organisation_members:**
```sql
CREATE TABLE organisation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK(role IN ('owner', 'admin', 'member', 'viewer')) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organisation_id, user_id)
);
```

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **owner** | Full access: CRUD all resources, manage members, delete organisation |
| **admin** | Create/Update/Delete companies, audits, keywords; Cannot manage organisation settings |
| **member** | Create/Update audits, keywords; Read-only companies |
| **viewer** | Read-only access to all resources |

### Row-Level Security (RLS)

All data tables include an `organisation_id` column and enforce RLS policies:

**Example: Companies Table RLS**
```sql
-- SELECT: All members can view
CREATE POLICY "Users can view own organisation's companies"
  ON companies FOR SELECT
  USING (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Admin or Owner only
CREATE POLICY "Admins can insert companies"
  ON companies FOR INSERT
  WITH CHECK (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
```

## Implementation

### Tenant Context Middleware

**File:** `web-app/lib/tenant-context.ts`

```typescript
import { getCurrentOrganisationId, withTenantScope } from '@/lib/tenant-context';

// Usage in API routes
export async function GET(req: Request) {
  const companies = await withTenantScope(async (organisationId) => {
    const db = getDatabase();
    return db.all(
      'SELECT * FROM companies WHERE organisation_id = ?',
      [organisationId]
    );
  });

  return Response.json(companies);
}
```

### Organisation Switcher UI

**Component:** `web-app/components/organisation-switcher.tsx`

Users can switch between organisations they belong to via a dropdown in the navigation bar. The switcher displays:
- Organisation name
- Current plan (free, starter, pro, enterprise)
- User's role in the organisation

### API Routes

**List Organisations:**
```
GET /api/organisations/list
Returns: { organisations: [...], count: number }
```

**Switch Organisation:**
```
POST /api/organisations/switch
Body: { organisationId: string }
Returns: { success: boolean, organisationId: string }
```

## Migration

**Migration File:** `database/migrations/003_multi_tenancy_foundation.sql`

### Migration Steps

1. **Create organisations tables:**
   - `organisations`
   - `organisation_members`

2. **Add organisation_id column to existing tables:**
   - companies, audits, keywords, competitors, citations
   - service_areas, local_pack_tracking, backlinks
   - crm_contacts, crm_deals, crm_tasks, crm_calendar_events
   - crm_projects, crm_github_projects, crm_prompts

3. **Backfill existing data:**
   - Create default organisation (UUID: `00000000-0000-0000-0000-000000000001`)
   - Assign all existing rows to default organisation

4. **Make organisation_id NOT NULL:**
   - Enforce foreign key constraint after backfill

5. **Enable RLS and create policies:**
   - Enable RLS on core tables
   - Create SELECT/INSERT/UPDATE/DELETE policies

### Rollback Procedure

If multi-tenancy causes issues, execute the rollback section in the migration file:

```bash
# Disable RLS immediately
psql $DATABASE_URL -c "ALTER TABLE companies DISABLE ROW LEVEL SECURITY;"
psql $DATABASE_URL -c "ALTER TABLE audits DISABLE ROW LEVEL SECURITY;"

# Full rollback
psql $DATABASE_URL < database/migrations/003_multi_tenancy_foundation.sql
# (Execute ROLLBACK section)
```

**Estimated Rollback Time:** 15 minutes

## Security Testing

### SQL Injection Test

Verify RLS prevents cross-tenant access:

```sql
-- As user in Tenant A, attempt to access Tenant B data
SET ROLE tenant_a_user;
SELECT * FROM companies WHERE organisation_id = 'tenant-b-uuid';
-- Expected: 0 rows (RLS blocks access)

-- Attempt SQL injection bypass
SELECT * FROM companies WHERE organisation_id = 'tenant-a-uuid' OR 1=1;
-- Expected: Only Tenant A's data (RLS enforces policy)
```

### Role-Based Access Test

```sql
-- As viewer role, attempt to INSERT company (should fail)
SET ROLE tenant_a_viewer;
INSERT INTO companies (name, organisation_id, address, city, state, zip, phone, website)
VALUES ('Evil Corp', 'tenant-a-uuid', '123 St', 'City', 'State', '12345', '555-0000', 'https://evil.com');
-- Expected: ERROR - RLS policy requires admin or owner role
```

## Best Practises

### Always Use Tenant Context

**Good:**
```typescript
import { withTenantScope } from '@/lib/tenant-context';

const companies = await withTenantScope(async (organisationId) => {
  return db.all('SELECT * FROM companies WHERE organisation_id = ?', [organisationId]);
});
```

**Bad:**
```typescript
// NEVER DO THIS - bypasses tenant isolation
const companies = await db.all('SELECT * FROM companies');
```

### Check User Roles

```typescript
import { requireRole } from '@/lib/tenant-context';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await requireRole('owner'); // Throws error if user is not owner

  // Delete company...
}
```

### Organisation Switcher

Always include the organisation switcher in your navigation:

```tsx
import { OrganisationSwitcher } from '@/components/organisation-switcher';

export default function Navbar() {
  return (
    <nav>
      <OrganisationSwitcher currentOrgId={orgId} />
      {/* Other nav items */}
    </nav>
  );
}
```

## Limitations

1. **Single Active Organisation:** Users can only be in one organisation context at a time. They must switch organisations to view different tenant data.

2. **No Cross-Tenant Queries:** Queries cannot span multiple organisations (by design).

3. **Performance:** RLS adds a small overhead to queries (~5-10ms). Use indexes on `organisation_id` columns.

## Performance Optimisation

### Indexes

All tenant-scoped tables include indexes:
```sql
CREATE INDEX idx_companies_organisation ON companies(organisation_id);
CREATE INDEX idx_audits_organisation ON audits(organisation_id);
```

### Query Optimisation

Use `organisation_id` in WHERE clauses:
```sql
-- Good: Uses index
SELECT * FROM companies WHERE organisation_id = ? AND name LIKE '%acme%';

-- Bad: Full table scan
SELECT * FROM companies WHERE name LIKE '%acme%';
```

## Monitoring

### RLS Policy Violations

Monitor PostgreSQL logs for RLS policy violations:
```bash
tail -f /var/log/postgresql/postgresql.log | grep "permission denied"
```

### Cross-Tenant Access Attempts

Log all failed tenant context lookups:
```typescript
try {
  const orgId = await getCurrentOrganisationId();
} catch (error) {
  logger.error('Tenant context violation', { userId, error });
}
```

## Future Enhancements

- **Multi-Organisation Users:** Allow users to be active in multiple organisations simultaneously
- **Organisation Invitations:** Email-based invitation system for adding members
- **Usage Quotas:** Per-organisation API rate limits and storage quotas
- **Custom Domains:** White-label support with custom domain per organisation

---

**Next Steps:**
1. Run migration: `psql $DATABASE_URL < database/migrations/003_multi_tenancy_foundation.sql`
2. Update all API routes to use `withTenantScope()`
3. Add organisation switcher to navigation
4. Test RLS policies with SQL injection tests
5. Monitor production logs for RLS violations
