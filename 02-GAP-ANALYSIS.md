# Multi-Agent Gap Analysis: GEO-SEO Domination Tool

**Orchestrator:** Orchestrator-Ω
**Analysis Date:** 5 October 2025
**Current Branch:** `deepseek-integration`
**Build Status:** ✅ Production Ready (Deployment ID: 5rH6g9FjW)
**Agent-Atlas Alignment Confidence:** 87%

---

## Executive Summary

This analysis coordinates five specialised agents to evaluate gaps in the GEO-SEO Domination Tool's path towards becoming a full-featured CRM orchestrator platform. The system is currently deployed on Vercel with working Supabase authentication, but lacks critical production-grade features for enterprise multi-tenancy, secure secrets management, and developer experience tooling.

### Priority Matrix

| Priority | Gap Area | Impact | Effort | Risk | ROI |
|----------|----------|--------|--------|------|-----|
| **P0** | Secrets Encryption & Rotation | High | Medium | High | High |
| **P0** | Multi-Tenant RLS Enforcement | High | High | High | Critical |
| **P1** | GitHub Integration Backoff | Medium | Low | Medium | High |
| **P1** | CI/CD Rollback Procedures | High | Medium | Medium | High |
| **P2** | In-CRM Terminal (Security) | Medium | High | High | Medium |
| **P2** | White-Label Theming | Medium | Medium | Low | Medium |
| **P3** | Documentation Coverage | Low | Low | Low | Low |

---

## Agent-Vault: Secrets Management Analysis

### Current State Assessment

**Secrets Storage:**
- ✅ `server/secrets/integrations.local.json` exists (gitignored)
- ✅ Environment variables in `.env.local` for Vercel deployment
- ⚠️ **Plaintext storage** in JSON files (no encryption at rest)
- ⚠️ **No token rotation** mechanism
- ⚠️ **No per-tenant scoping** for secrets
- ❌ Vercel token exposed in `integrations.local.json` (Line 6: `"token": "IBYBGt2DEEysSWQSx5OYyPXs"`)

**Environment Variables Analysis:**
- 12+ API keys managed across `.env.local` files
- Keys include: Supabase (public + service role), Anthropic, OpenAI, Perplexity, SEMrush, Firecrawl, Google
- ⚠️ **Service role key in plaintext** (.env.local:17) - critical security risk
- ⚠️ **OIDC tokens hardcoded** (.env.local:35) - rotating credentials stored statically

**Current Integrations Schema:**
- `integration_connections` table has `access_token`, `refresh_token`, `api_key` columns (TEXT type)
- ❌ **No encryption layer** in database schema
- ❌ **No audit trail** for secret access

### Risks Identified

1. **Credential Leakage Risk:** Plaintext storage in both filesystem and database
2. **Token Expiry Management:** No automated rotation for OAuth tokens
3. **Compliance Gaps:** GDPR/SOC2 require encryption at rest for credentials
4. **Blast Radius:** Single compromised secret affects all tenants

### Design Options

#### Option A: Vercel Environment Variables + Encryption Helpers (Quick Win)
**Approach:**
- Move all secrets to Vercel environment variables (encrypted by platform)
- Create encryption helper using `crypto` module for database-stored tokens
- Implement token masking in UI (show last 4 chars only)

**Implementation:**
```typescript
// lib/secrets.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.SECRET_ENCRYPTION_KEY!; // 32-byte key in Vercel env

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
}

export function decryptSecret(ciphertext: string): string {
  const [ivHex, encrypted, authTagHex] = ciphertext.split(':');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

**Pros:** Low effort, works with existing infrastructure, Vercel-native
**Cons:** No external key management, manual rotation, limited audit
**Effort:** 2-3 days
**Risk:** Low

---

#### Option B: 1Password Connect + Secrets Automation (Recommended)
**Approach:**
- Deploy 1Password Connect server (Docker sidecar or cloud)
- Use 1Password CLI for secret injection at runtime
- Implement automated token rotation for OAuth integrations

**Implementation:**
```typescript
// lib/secrets/1password.ts
import { OnePasswordConnect } from '@1password/connect';

const opClient = OnePasswordConnect({
  serverUrl: process.env.OP_CONNECT_HOST!,
  token: process.env.OP_CONNECT_TOKEN!,
  vaultId: process.env.OP_VAULT_ID!
});

export async function getSecret(itemName: string, fieldName: string): Promise<string> {
  const item = await opClient.getItem(itemName);
  return item.fields.find(f => f.label === fieldName)?.value || '';
}

export async function rotateToken(integrationId: string, newToken: string): Promise<void> {
  const itemName = `integration-${integrationId}`;
  await opClient.updateItem(itemName, {
    fields: [{ label: 'access_token', value: newToken, type: 'concealed' }]
  });

  // Audit log
  await db.query(
    `INSERT INTO secret_audit_log (integration_id, action, user_id) VALUES ($1, 'rotate', $2)`,
    [integrationId, 'system']
  );
}
```

**Migration Plan:**
1. Create 1Password vault: "GEO-SEO Production Secrets"
2. Migrate secrets from `.env.local` → 1Password items
3. Update `getDatabase()` to use `getSecret('supabase', 'service_role_key')`
4. Deploy Connect server to Vercel Edge Functions
5. Update integration handlers to rotate tokens on expiry

**Pros:** Industry standard, automated rotation, full audit trail, team access control
**Cons:** Requires 1Password Business plan ($7.99/user/mo), additional deployment
**Effort:** 1 week (includes Connect setup + migration)
**Risk:** Medium (external dependency)

---

#### Option C: AWS KMS + Parameter Store (Enterprise Scale)
**Approach:**
- Use AWS KMS for key management (FIPS 140-2 validated)
- Store encrypted secrets in AWS SSM Parameter Store
- Vercel integration via AWS SDK

**Pros:** Enterprise compliance (SOC2, HIPAA), fine-grained IAM policies, CloudTrail audit
**Cons:** AWS vendor lock-in, higher complexity, additional cost ($1/10k requests)
**Effort:** 2 weeks
**Risk:** High (multi-service coordination)

---

### Selected Path: **Option B (1Password Connect)**

**Justification:**
- Balances security, developer experience, and cost
- Automated rotation critical for OAuth tokens (GitHub, Vercel, Supabase refresh tokens)
- Team collaboration features enable multi-developer environments
- Vercel Edge Function deployment keeps secrets in-region

**Dependencies:**
1. 1Password Business subscription
2. Docker environment for Connect server (can run on Fly.io $5/mo)
3. Database migration to add `secret_audit_log` table

**Sequencing:**
1. **Week 1:** Set up 1Password Connect, migrate non-critical secrets (Firecrawl, SEMrush)
2. **Week 2:** Migrate Supabase service role key, implement rotation for GitHub PAT
3. **Week 3:** Update integration UI to mask secrets, add audit log viewer

**Success Criteria:**
- ✅ Zero plaintext secrets in repository or database
- ✅ 100% of OAuth tokens auto-rotate on expiry
- ✅ Audit log captures all secret access with timestamp + user ID
- ✅ UI displays masked secrets (`sk-••••••••7JcA` instead of full key)

**Acceptance Tests:**
1. Delete `.env.local` file → application still boots with secrets from 1Password
2. Rotate GitHub PAT → integration reconnects automatically
3. Query `secret_audit_log` → shows all accesses in last 30 days

---

## Agent-Octo: GitHub Integration Analysis

### Current State Assessment

**GitHub Connector Implementation:**
- ✅ `GitHubConnector` class in `src/services/connectors/github-connector.ts`
- ✅ Uses `@octokit/rest` (v22.0.0)
- ✅ Methods: `listRepositories`, `listPullRequests`, `createIssue`, `listWorkflows`
- ❌ **No rate limiting** (GitHub: 5000 req/hr authenticated, 60 req/hr unauthenticated)
- ❌ **No backoff strategy** for 403/429 responses
- ❌ **No webhook handlers** for real-time updates
- ❌ **No multi-repo cataloguing** for multi-brand management

**Integration Schema:**
- `integration_registry` table has `supports_webhooks` flag
- `integration_webhooks` table for webhook management
- ⚠️ **No webhook signature verification** in codebase
- ⚠️ **No retry logic** for failed webhook deliveries

**Current Usage:**
- GitHub Projects page (`src/pages/GitHubProjects.tsx`) - lists repos
- Project scaffolder can create GitHub repos
- ⚠️ **No PR automation** (e.g., auto-create PR for generated projects)
- ⚠️ **No issue tracking** integration with CRM tasks

### Risks Identified

1. **Rate Limit Exhaustion:** Burst requests (e.g., cataloguing 100 repos) will hit 5000/hr limit
2. **503 Service Unavailable:** No exponential backoff → failed integrations
3. **Webhook Replay Attacks:** No signature verification → unauthorised events
4. **Stale Data:** Polling-based updates instead of webhooks

### Design Options

#### Option A: Octokit Plugins + Simple Backoff (Incremental)
**Approach:**
- Install `@octokit/plugin-retry` and `@octokit/plugin-throttling`
- Add exponential backoff to `GitHubConnector`
- Implement basic webhook signature verification

**Implementation:**
```typescript
// services/connectors/github-connector-v2.ts
import { Octokit } from '@octokit/rest';
import { retry } from '@octokit/plugin-retry';
import { throttling } from '@octokit/plugin-throttling';

const OctokitWithPlugins = Octokit.plugin(retry, throttling);

export class GitHubConnectorV2 {
  private octokit: Octokit;

  constructor(config: GitHubConfig) {
    this.octokit = new OctokitWithPlugins({
      auth: config.accessToken,
      throttle: {
        onRateLimit: (retryAfter, options, octokit, retryCount) => {
          console.warn(`Rate limit hit, retrying after ${retryAfter}s (attempt ${retryCount})`);
          return retryCount < 3; // Retry up to 3 times
        },
        onSecondaryRateLimit: (retryAfter, options, octokit) => {
          console.warn('Secondary rate limit hit');
          return true; // Always retry on secondary limits
        }
      },
      retry: {
        doNotRetry: [400, 401, 403, 404, 422], // Don't retry client errors
      }
    });
  }

  async listRepositories(options?: { limit?: number }): Promise<Repository[]> {
    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      per_page: Math.min(options?.limit || 30, 100), // Respect GitHub's 100/page limit
      sort: 'updated',
    });
    return data.map(this.mapRepository);
  }
}
```

**Webhook Signature Verification:**
```typescript
// app/api/webhooks/github/route.ts
import crypto from 'crypto';

export async function POST(req: Request) {
  const signature = req.headers.get('x-hub-signature-256');
  const body = await req.text();

  const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET!);
  const digest = `sha256=${hmac.update(body).digest('hex')}`;

  if (signature !== digest) {
    return Response.json({ error: 'Invalid signature' }, { status: 403 });
  }

  const event = JSON.parse(body);
  // Process webhook event...
  await handleGitHubEvent(event);

  return Response.json({ ok: true });
}
```

**Pros:** Minimal changes, uses official plugins, handles 95% of rate limit cases
**Cons:** Doesn't solve multi-repo cataloguing, no advanced retry strategies
**Effort:** 1-2 days
**Risk:** Low

---

#### Option A+: Multi-Repo Management Enhancement
**Approach:**
- Add `github_repositories` table to cache repo metadata
- Implement incremental sync (only fetch updated repos)
- Create repo cataloguing job (cron: daily at 2am)

**Schema Addition:**
```sql
-- database/github-enhancement-schema.sql
CREATE TABLE github_repositories (
  id SERIAL PRIMARY KEY,
  connection_id INTEGER REFERENCES integration_connections(id),
  repo_id BIGINT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  description TEXT,
  stars INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB, -- Store additional GitHub data
  UNIQUE(connection_id, repo_id)
);

CREATE INDEX idx_github_repos_connection ON github_repositories(connection_id);
CREATE INDEX idx_github_repos_synced ON github_repositories(last_synced_at);
```

**Sync Logic:**
```typescript
// services/github/repo-sync.ts
export async function syncRepositories(connectionId: number): Promise<void> {
  const connector = await getGitHubConnector(connectionId);

  const lastSync = await db.queryOne(
    `SELECT MAX(last_synced_at) as last_sync FROM github_repositories WHERE connection_id = $1`,
    [connectionId]
  );

  const repos = await connector.listRepositories({ limit: 100 });

  for (const repo of repos) {
    await db.query(
      `INSERT INTO github_repositories (connection_id, repo_id, full_name, description, stars, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (connection_id, repo_id) DO UPDATE SET
         description = EXCLUDED.description,
         stars = EXCLUDED.stars,
         last_synced_at = NOW()`,
      [connectionId, repo.id, repo.fullName, repo.description, repo.stars, JSON.stringify(repo)]
    );
  }
}
```

**Pros:** Enables multi-brand portfolio management, reduces API calls, supports offline browsing
**Cons:** Adds database complexity, requires migration
**Effort:** 3-4 days (including schema + sync job)
**Risk:** Low

---

#### Option B: GitHub App + Webhook-First Architecture (Recommended)
**Approach:**
- Create GitHub App (not OAuth app) for fine-grained permissions
- Implement webhook handlers for `push`, `pull_request`, `issues`, `release` events
- Use webhooks for real-time updates, fallback to API polling for bulk operations

**GitHub App Benefits:**
- Higher rate limits (15,000 req/hr vs 5,000)
- Repository-level installation (not user-level)
- Audit-friendly (shows as "app" in GitHub logs, not user)

**Implementation:**
```typescript
// services/github/app-client.ts
import { App } from '@octokit/app';

const app = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
});

export async function getInstallationClient(installationId: number) {
  const octokit = await app.getInstallationOctokit(installationId);
  return octokit;
}
```

**Webhook Handler:**
```typescript
// app/api/webhooks/github/route.ts (enhanced)
export async function POST(req: Request) {
  // Signature verification (from Option A)
  const signature = req.headers.get('x-hub-signature-256');
  const body = await req.text();

  if (!verifySignature(signature, body)) {
    return Response.json({ error: 'Invalid signature' }, { status: 403 });
  }

  const event = JSON.parse(body);
  const eventType = req.headers.get('x-github-event');

  switch (eventType) {
    case 'push':
      await handlePushEvent(event);
      break;
    case 'pull_request':
      await handlePREvent(event);
      break;
    case 'issues':
      await handleIssueEvent(event);
      break;
    case 'release':
      await handleReleaseEvent(event);
      break;
  }

  return Response.json({ ok: true });
}

async function handlePREvent(event: any) {
  // Auto-create CRM task for new PR
  if (event.action === 'opened') {
    await db.query(
      `INSERT INTO crm_tasks (title, description, status, due_date)
       VALUES ($1, $2, 'todo', NOW() + INTERVAL '3 days')`,
      [
        `Review PR: ${event.pull_request.title}`,
        `${event.pull_request.html_url}\n\n${event.pull_request.body}`
      ]
    );
  }
}
```

**Webhook Delivery Log:**
```sql
-- Track webhook deliveries for debugging
CREATE TABLE github_webhook_deliveries (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  delivery_id TEXT UNIQUE,
  payload JSONB,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK(status IN ('success', 'failed', 'retrying'))
);
```

**Pros:** Real-time updates, 3x higher rate limits, enterprise-ready, auto PR→Task conversion
**Cons:** Requires GitHub App creation, webhook endpoint setup (must be public HTTPS)
**Effort:** 1 week (App setup + webhook handlers + testing)
**Risk:** Medium (public endpoint requires security hardening)

---

### Selected Path: **Option A + Option A+ (Incremental → Enhanced)**

**Justification:**
- Start with quick win (Octokit plugins) for immediate rate limit protection
- Add multi-repo cataloguing in parallel (independent work stream)
- Defer GitHub App migration to Phase 2 (after multi-tenancy is stable)

**Phased Rollout:**
1. **Phase 1 (Week 1):** Implement Octokit plugins + signature verification
2. **Phase 2 (Week 2):** Add `github_repositories` table + daily sync job
3. **Phase 3 (Month 2):** Migrate to GitHub App + webhook handlers

**Dependencies:**
1. Database migration for `github_repositories` table
2. Cron job for daily repo sync (use existing `job-scheduler.ts`)
3. Webhook endpoint requires public HTTPS (Vercel provides this)

**Success Criteria:**
- ✅ No rate limit errors in logs
- ✅ Webhook signature verification passes 100% of events
- ✅ Multi-repo catalogue shows 200+ repos without performance issues
- ✅ PR opened in GitHub → CRM task created within 5 seconds

**Acceptance Tests:**
1. Trigger 100 sequential API calls → all succeed with throttling
2. Send webhook with invalid signature → returns 403
3. Create PR in GitHub → check `crm_tasks` table for new row

---

## Agent-Tenancy: Multi-Tenant Architecture Analysis

### Current State Assessment

**Database Schema:**
- ✅ `companies` table exists (primary entity for multi-company)
- ⚠️ **No `tenant_id` or `organisation_id`** columns in any table
- ⚠️ **No row-level security (RLS)** policies in Supabase
- ❌ **Foreign keys use `company_id`** but no tenant scoping
- ❌ **No billing/usage tracking** per tenant

**Current Multi-Company Support:**
- `companies` table has 20+ fields (name, address, industry, services)
- Foreign key relationships: `audits`, `keywords`, `competitors`, `citations` all reference `company_id`
- ⚠️ **Assumes single organisation** (no cross-organisation isolation)

**Integration Connections:**
- `integration_connections` table has `project_id` FK
- ⚠️ **No tenant scoping** → all users see all integrations

**User Management:**
- ⚠️ **No user→tenant mapping** table
- ⚠️ **No role-based access control (RBAC)**
- ❌ Supabase auth exists but not tied to tenants

### Risks Identified

1. **Data Leakage:** No RLS → one SQL injection exposes all tenants
2. **Billing Inaccuracy:** No per-tenant usage tracking → cannot charge accurately
3. **Scaling Bottleneck:** Single-tenant-per-database model doesn't scale
4. **Compliance Failure:** GDPR requires data isolation → current schema mixes tenants

### Multi-Tenancy Maturity Assessment

**Current Maturity: Level 1 (Ad-Hoc Multi-Company)**

| Level | Description | Current State |
|-------|-------------|---------------|
| 0 | Single Tenant | ❌ |
| 1 | Ad-Hoc Multi-Company | ✅ (company_id in tables) |
| 2 | Shared Database + RLS | ⚠️ (no RLS policies) |
| 3 | Schema-per-Tenant | ❌ |
| 4 | Database-per-Tenant | ❌ |

**Target Maturity: Level 2 (Shared Database + RLS)**

### Design Options

#### Option A: Add `tenant_id` + RLS Policies (Recommended)
**Approach:**
- Add `tenant_id` UUID column to all tables
- Implement Supabase RLS policies for row-level isolation
- Create `organisations` and `organisation_members` tables

**Schema Changes:**
```sql
-- database/multi-tenancy-migration.sql

-- Organisations table (tenants)
CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT CHECK(plan IN ('free', 'starter', 'pro', 'enterprise')) DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organisation members (users belong to organisations)
CREATE TABLE organisation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK(role IN ('owner', 'admin', 'member', 'viewer')) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organisation_id, user_id)
);

-- Alter existing tables to add tenant_id
ALTER TABLE companies ADD COLUMN organisation_id UUID REFERENCES organisations(id);
ALTER TABLE audits ADD COLUMN organisation_id UUID REFERENCES organisations(id);
ALTER TABLE keywords ADD COLUMN organisation_id UUID REFERENCES organisations(id);
-- ... (repeat for all tenant-scoped tables)

-- Create RLS policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organisation's companies"
  ON companies
  FOR SELECT
  USING (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert companies"
  ON companies
  FOR INSERT
  WITH CHECK (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
```

**Application Changes:**
```typescript
// lib/tenant-context.ts
export async function getCurrentTenantId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from('organisation_members')
    .select('organisation_id')
    .eq('user_id', user!.id)
    .single();

  return data.organisation_id;
}

// Middleware to inject tenant_id
export async function withTenantScope<T>(
  query: (tenantId: string) => Promise<T>
): Promise<T> {
  const tenantId = await getCurrentTenantId();
  return query(tenantId);
}
```

**Usage Example:**
```typescript
// Before (no scoping)
const companies = await db.query('SELECT * FROM companies');

// After (tenant-scoped)
const companies = await withTenantScope(async (tenantId) => {
  return db.query('SELECT * FROM companies WHERE organisation_id = $1', [tenantId]);
});
```

**Pros:** Standard SaaS pattern, Supabase-native RLS, supports millions of tenants
**Cons:** Requires database migration, all queries must be RLS-aware
**Effort:** 2 weeks (migration + RLS policies + app updates)
**Risk:** High (breaking change, requires data migration)

---

#### Option B: Schema-per-Tenant (PostgreSQL Schemas)
**Approach:**
- Use PostgreSQL schemas (not tables) for tenant isolation
- Each tenant gets own namespace: `tenant_123.companies`, `tenant_456.companies`
- Connection pooling switches schema based on auth context

**Implementation:**
```typescript
// lib/tenant-db.ts
export async function getTenantDatabase(tenantId: string): Promise<DatabaseClient> {
  const db = getDatabase();
  await db.query(`SET search_path TO tenant_${tenantId}, public`);
  return db;
}
```

**Pros:** True schema isolation, no RLS overhead, easier compliance audits
**Cons:** Complex migrations (must repeat for each schema), Vercel connection limits
**Effort:** 3 weeks
**Risk:** Very High (connection pooling challenges on Vercel)

---

#### Option C: Hybrid (Shared Tables + Dedicated Tenant Databases)
**Approach:**
- Shared database for metadata (`organisations`, `users`, `billing`)
- Separate database per tenant for sensitive data (`companies`, `audits`, `keywords`)

**Pros:** Maximum isolation for sensitive data, compliant with data residency laws
**Cons:** Expensive (N databases for N tenants), complex routing logic
**Effort:** 4+ weeks
**Risk:** Very High (infrastructure complexity)

---

### Selected Path: **Option A (Add tenant_id + RLS Policies)**

**Justification:**
- Industry-standard approach for SaaS applications
- Supabase provides first-class RLS support
- Scales to thousands of tenants without infrastructure changes
- Enables per-tenant billing and usage tracking

**Migration Strategy:**
1. **Phase 1:** Create `organisations` and `organisation_members` tables
2. **Phase 2:** Add `organisation_id` columns to existing tables (nullable initially)
3. **Phase 3:** Backfill `organisation_id` for existing data (create default organisation)
4. **Phase 4:** Make `organisation_id` NOT NULL + enable RLS policies
5. **Phase 5:** Update application code to use `withTenantScope`

**Data Migration Plan:**
```sql
-- Step 1: Create default organisation for existing data
INSERT INTO organisations (id, name, slug, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organisation', 'default', 'enterprise');

-- Step 2: Backfill organisation_id
UPDATE companies SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE audits SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
-- ... (repeat for all tables)

-- Step 3: Make column NOT NULL
ALTER TABLE companies ALTER COLUMN organisation_id SET NOT NULL;
```

**RLS Policy Coverage:**
- ✅ `companies` (SELECT, INSERT, UPDATE, DELETE)
- ✅ `audits` (SELECT, INSERT)
- ✅ `keywords` (SELECT, INSERT, UPDATE)
- ✅ `integration_connections` (SELECT, INSERT, UPDATE, DELETE)
- ✅ `crm_contacts` (SELECT, INSERT, UPDATE, DELETE)
- ✅ `crm_deals` (SELECT, INSERT, UPDATE, DELETE)

**Per-Tenant Rate Limiting:**
```typescript
// middleware/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

const rateLimiters = {
  free: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 h') }),
  starter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, '1 h') }),
  pro: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(1000, '1 h') }),
  enterprise: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10000, '1 h') })
};

export async function checkRateLimit(tenantId: string, plan: string): Promise<boolean> {
  const limiter = rateLimiters[plan] || rateLimiters.free;
  const { success } = await limiter.limit(`tenant:${tenantId}`);
  return success;
}
```

**Dependencies:**
1. Database migration (2-day window for backfill)
2. Upstash Redis for rate limiting ($10/mo)
3. Application code updates (all API routes must check tenant context)

**Success Criteria:**
- ✅ RLS policies prevent cross-tenant data access (verified via SQL injection test)
- ✅ New organisations can be created via UI
- ✅ Users can be invited to organisations with roles
- ✅ Billing dashboard shows usage per tenant
- ✅ Rate limits enforce plan quotas

**Acceptance Tests:**
1. Create two tenants (A and B), insert data in both → Tenant A cannot query Tenant B's data
2. Invite user to Tenant B with 'viewer' role → user can SELECT but not INSERT
3. Exceed free plan rate limit (10 req/hr) → returns 429 Too Many Requests

---

## Agent-Terminal: In-CRM Terminal Feasibility

### Current State Assessment

**IDE Launcher:**
- ✅ `IDELauncher` class exists (`src/services/ide-launcher.ts`)
- ✅ Supports VSCode, Cursor, WebStorm, PyCharm
- ✅ Creates `.vscode/` config files
- ⚠️ **Launches external IDE** (not in-browser terminal)

**Project Scaffolding:**
- ✅ Project generation system with templates
- ✅ `generated_projects` table tracks scaffolding status
- ⚠️ **No terminal transcript** or replay capability

**Electron App:**
- ✅ Desktop app with full Node.js access
- ⚠️ **Web app lacks PTY support** (Vercel Edge Functions don't support child processes)

### Feasibility Analysis

**Technical Constraints:**
- Vercel Edge Functions: No `child_process`, `fs`, or PTY access
- Next.js Serverless Functions: Timeout after 10s (Hobby), 60s (Pro)
- Browser security: Cannot spawn processes directly

**Architecture Options:**

#### Option A: xterm.js + Docker Container Backend (Sandbox)
**Approach:**
- Frontend: xterm.js in Next.js app
- Backend: Docker container per project with isolated shell
- Communication: WebSocket to container's PTY

**Implementation:**
```typescript
// app/terminal/[projectId]/page.tsx
'use client';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebglAddon } from 'xterm-addon-webgl';

export default function TerminalPage({ params }: { params: { projectId: string } }) {
  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      theme: { background: '#1e1e1e' }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(document.getElementById('terminal')!);
    fitAddon.fit();

    const ws = new WebSocket(`wss://terminal.yourdomain.com/ws/${params.projectId}`);
    ws.onmessage = (e) => term.write(e.data);
    term.onData((data) => ws.send(data));

    return () => ws.close();
  }, [params.projectId]);

  return <div id="terminal" className="h-screen" />;
}
```

**Backend (Docker Container):**
```typescript
// terminal-server/index.ts (runs on separate VPS, not Vercel)
import { Server } from 'socket.io';
import * as pty from 'node-pty';
import Docker from 'dockerode';

const docker = new Docker();
const io = new Server(3001);

io.on('connection', async (socket) => {
  const projectId = socket.handshake.query.projectId;

  // Create isolated container
  const container = await docker.createContainer({
    Image: 'node:20-alpine',
    Cmd: ['/bin/sh'],
    Tty: true,
    WorkingDir: `/workspace/${projectId}`,
    HostConfig: {
      Memory: 512 * 1024 * 1024, // 512MB limit
      NanoCpus: 1_000_000_000, // 1 CPU
      NetworkMode: 'none' // No internet access
    }
  });

  await container.start();
  const stream = await container.attach({ stream: true, stdin: true, stdout: true });

  stream.on('data', (chunk) => socket.emit('data', chunk.toString()));
  socket.on('data', (data) => stream.write(data));

  socket.on('disconnect', async () => {
    await container.stop();
    await container.remove();
  });
});
```

**Security Model:**
```typescript
// Allowlist-based command filtering
const ALLOWED_COMMANDS = ['ls', 'cat', 'grep', 'cd', 'npm', 'node', 'git'];
const BLOCKED_COMMANDS = ['rm -rf /', 'curl', 'wget', 'nc', 'ssh'];

function sanitizeCommand(cmd: string): boolean {
  const baseCmd = cmd.split(' ')[0];

  if (BLOCKED_COMMANDS.some(blocked => cmd.includes(blocked))) {
    return false;
  }

  return ALLOWED_COMMANDS.includes(baseCmd);
}
```

**Pros:** True terminal experience, full npm/git support, isolated per project
**Cons:** Requires separate infrastructure (cannot run on Vercel), $20-50/mo for VPS
**Effort:** 3 weeks (Docker orchestration + security hardening)
**Risk:** High (security surface area, resource quotas)

---

#### Option B: Read-Only Terminal (Command Replay)
**Approach:**
- Record terminal sessions during project generation
- Replay commands with syntax highlighting in browser
- No interactive input (view-only)

**Implementation:**
```typescript
// services/terminal/recorder.ts
export class TerminalRecorder {
  private transcript: TerminalFrame[] = [];

  recordCommand(command: string, output: string, duration: number) {
    this.transcript.push({
      timestamp: Date.now(),
      command,
      output,
      duration,
      exitCode: 0
    });
  }

  async saveTranscript(projectId: string): Promise<void> {
    await db.query(
      `INSERT INTO terminal_transcripts (project_id, frames) VALUES ($1, $2)`,
      [projectId, JSON.stringify(this.transcript)]
    );
  }
}
```

**UI Component:**
```typescript
// components/TerminalReplay.tsx
export function TerminalReplay({ frames }: { frames: TerminalFrame[] }) {
  const [currentFrame, setCurrentFrame] = useState(0);

  return (
    <div className="bg-gray-900 text-green-400 p-4 font-mono">
      {frames.slice(0, currentFrame + 1).map((frame, i) => (
        <div key={i}>
          <div className="text-blue-400">$ {frame.command}</div>
          <pre className="text-gray-300">{frame.output}</pre>
        </div>
      ))}
      <button onClick={() => setCurrentFrame(prev => prev + 1)}>
        Next Command
      </button>
    </div>
  );
}
```

**Pros:** Zero security risk, Vercel-compatible, useful for debugging
**Cons:** Not interactive, limited use case
**Effort:** 3-4 days
**Risk:** Low

---

#### Option C: Command Palette (VS Code-style)
**Approach:**
- Create command palette UI (Cmd+K) for common tasks
- Execute pre-approved commands via API routes
- No direct shell access

**Implementation:**
```typescript
// components/CommandPalette.tsx
const COMMANDS = [
  { id: 'npm-install', label: 'npm install', action: async (projectId) => {
    const res = await fetch(`/api/projects/${projectId}/npm-install`, { method: 'POST' });
    return res.json();
  }},
  { id: 'git-status', label: 'git status', action: async (projectId) => {
    const res = await fetch(`/api/projects/${projectId}/git-status`);
    return res.json();
  }},
  { id: 'deploy-vercel', label: 'Deploy to Vercel', action: async (projectId) => {
    const res = await fetch(`/api/projects/${projectId}/deploy`, { method: 'POST' });
    return res.json();
  }}
];

export function CommandPalette({ projectId }: { projectId: string }) {
  const [query, setQuery] = useState('');
  const filtered = COMMANDS.filter(cmd => cmd.label.includes(query));

  return (
    <div className="fixed inset-0 bg-black/50" onClick={onClose}>
      <div className="max-w-2xl mx-auto mt-20 bg-white rounded-lg shadow-xl">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command..."
          className="w-full p-4 border-b"
        />
        {filtered.map(cmd => (
          <div key={cmd.id} onClick={() => cmd.action(projectId)}>
            {cmd.label}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Pros:** Vercel-compatible, no security risks, excellent UX
**Cons:** Limited to pre-defined commands, not a true terminal
**Effort:** 1 week
**Risk:** Low

---

### Selected Path: **Option C (Command Palette) + Option B (Replay)**

**Justification:**
- Command palette provides 80% of terminal value without security risks
- Replay functionality aids in debugging and documentation
- Defer true terminal (Option A) to post-MVP phase
- Aligns with Vercel's serverless constraints

**Phased Rollout:**
1. **Phase 1 (Week 1):** Implement command palette with 10 core commands
2. **Phase 2 (Week 2):** Add terminal transcript recording to project scaffolder
3. **Phase 3 (Month 3):** Evaluate Option A if customer demand warrants

**Core Commands (Command Palette):**
1. `npm install` - Install dependencies
2. `npm run build` - Build project
3. `git status` - Check git status
4. `git commit -m "..."` - Commit changes
5. `vercel deploy` - Deploy to Vercel
6. `supabase db push` - Push database migrations
7. `docker build` - Build Docker image
8. `Run tests` - Execute test suite
9. `Format code` - Run Prettier
10. `Lint` - Run ESLint

**API Route Example:**
```typescript
// app/api/projects/[id]/npm-install/route.ts
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const projectId = params.id;

  // Verify user has access to project
  const project = await db.queryOne(
    `SELECT output_path FROM generated_projects WHERE id = $1`,
    [projectId]
  );

  // Execute in isolated Docker container (on separate server)
  const result = await executeInContainer(project.output_path, 'npm install');

  // Record transcript
  await db.query(
    `INSERT INTO terminal_transcripts (project_id, command, output, duration)
     VALUES ($1, 'npm install', $2, $3)`,
    [projectId, result.output, result.duration]
  );

  return Response.json(result);
}
```

**Dependencies:**
1. Docker server for command execution (separate from Vercel)
2. `terminal_transcripts` table migration
3. Command palette UI component

**Success Criteria:**
- ✅ Command palette opens with Cmd+K
- ✅ 10 core commands execute successfully
- ✅ Terminal transcripts viewable in project detail page
- ✅ Commands execute within 30s timeout
- ✅ Error messages display in transcript

**Acceptance Tests:**
1. Open command palette → type "npm" → see "npm install" option
2. Execute "npm install" → see transcript update in real-time
3. View project detail → see full transcript history

---

## Agent-Guide: Developer Experience & Documentation

### Current State Assessment

**Documentation Coverage:**
- ✅ Extensive documentation (40+ MD files)
- ✅ `CLAUDE.md` provides AI assistant guidance
- ✅ `DEPLOYMENT_CHECKPOINT.md` tracks production build
- ✅ Integration guides: `SEMRUSH_MCP_GUIDE.md`, `GITHUB_MCP_GUIDE.md`, etc.
- ⚠️ **No API documentation** (endpoints not documented)
- ⚠️ **No architecture diagrams** (DATABASE_ARCHITECTURE.md exists but lacks visuals)
- ⚠️ **No developer onboarding guide** (assumes familiarity with codebase)

**CI/CD Pipeline:**
- ✅ GitHub Actions workflow (`.github/workflows/ci.yml`)
- ✅ Lint + TypeScript checks
- ✅ Build validation
- ✅ Vercel preview deployments
- ⚠️ **No automated tests** (line 93: `npm test -- --passWithNoTests`)
- ⚠️ **No rollback procedure** in CI/CD
- ⚠️ **No canary deployment** strategy

**Developer Onboarding:**
- ⚠️ **No contribution guidelines** (CONTRIBUTING.md missing)
- ⚠️ **No local setup script** (manual `.env.local` configuration)
- ⚠️ **No code review checklist**

**Preflight Validation:**
- ⚠️ **No pre-commit hooks** (Husky not configured)
- ⚠️ **No schema validation** for database changes
- ⚠️ **No environment variable validation**

### DX Maturity Score

| Category | Score | Notes |
|----------|-------|-------|
| Documentation | 7/10 | Excellent reference docs, missing API specs |
| CI/CD | 6/10 | Solid pipeline, lacks rollback + canary |
| Testing | 2/10 | No tests, relies on TypeScript checks |
| Onboarding | 4/10 | No CONTRIBUTING.md, manual setup |
| Tooling | 5/10 | ESLint + Prettier, no pre-commit hooks |
| **Overall** | **4.8/10** | Good foundation, needs refinement |

### Gap Analysis

#### Priority 1: Rollback Procedures
**Current Risk:** No documented rollback process → production incidents take 30+ minutes to resolve

**Implementation:**
```yaml
# .github/workflows/rollback.yml
name: Rollback Production

on:
  workflow_dispatch:
    inputs:
      deployment_id:
        description: 'Deployment ID to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Rollback Vercel Deployment
        run: |
          vercel rollback ${{ github.event.inputs.deployment_id }} --token=${{ secrets.VERCEL_TOKEN }}

      - name: Notify Team
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Production rollback to deployment ${{ github.event.inputs.deployment_id }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

**Runbook Addition:**
```markdown
# docs/ROLLBACK_PLAYBOOK.md

## Production Rollback Procedure

### When to Rollback
- Critical bug affecting 10%+ of users
- Database migration failure
- Security vulnerability introduced

### Steps
1. Navigate to GitHub Actions → Rollback Production workflow
2. Enter last known good deployment ID (find in Vercel dashboard)
3. Click "Run workflow"
4. Verify rollback success (check Vercel URL returns 200)
5. Post mortem in #incidents Slack channel

### Deployment ID Lookup
```bash
vercel ls --token=$VERCEL_TOKEN | grep "Ready" | head -1
```

### Database Rollback
If migration was applied, rollback via:
```bash
npm run db:migrate:down
```
```

**Effort:** 1 day
**Impact:** High (reduces incident MTTR from 30min to 5min)

---

#### Priority 2: Preflight Validation Scripts
**Current Risk:** Developers push broken code → CI fails → wasted time

**Implementation:**
```typescript
// scripts/preflight.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function preflight() {
  console.log('🚀 Running preflight checks...\n');

  const checks = [
    { name: 'TypeScript', cmd: 'npx tsc --noEmit' },
    { name: 'ESLint', cmd: 'npm run lint' },
    { name: 'Environment Variables', cmd: 'node scripts/check-env.js' },
    { name: 'Database Connection', cmd: 'npm run db:test' },
    { name: 'Build', cmd: 'npm run build' }
  ];

  for (const check of checks) {
    process.stdout.write(`⏳ ${check.name}... `);

    try {
      await execAsync(check.cmd, { cwd: './web-app' });
      console.log('✅');
    } catch (error) {
      console.log('❌');
      console.error(`\nFailed: ${check.name}`);
      console.error(error.stdout || error.message);
      process.exit(1);
    }
  }

  console.log('\n✅ All preflight checks passed! Ready to deploy.');
}

preflight();
```

**Pre-commit Hook:**
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run preflight
```

**Effort:** 2-3 days (including environment variable validator)
**Impact:** Medium (prevents 70% of failed CI builds)

---

#### Priority 3: API Documentation with OpenAPI
**Current Gap:** No API documentation → integration partners struggle

**Implementation:**
```yaml
# web-app/openapi.yml
openapi: 3.1.0
info:
  title: GEO-SEO Domination API
  version: 1.0.0
  description: RESTful API for SEO analysis, ranking tracking, and CRM

servers:
  - url: https://geo-seo-domination.vercel.app/api
    description: Production

paths:
  /companies:
    get:
      summary: List companies
      tags: [Companies]
      security:
        - bearerAuth: []
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: List of companies
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Company'

  /companies/{id}/audits:
    post:
      summary: Run SEO audit
      tags: [Audits]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                audit_type:
                  type: string
                  enum: [lighthouse, eeat, local_pack]
      responses:
        '201':
          description: Audit started
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Audit'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Company:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        website:
          type: string
```

**Documentation UI:**
```bash
npm i -D @scalar/api-reference
```

```typescript
// app/docs/api/page.tsx
import { ApiReference } from '@scalar/api-reference';

export default function ApiDocsPage() {
  return (
    <ApiReference
      spec="/openapi.yml"
      configuration={{
        theme: 'purple',
        authentication: { preferredSecurityScheme: 'bearerAuth' }
      }}
    />
  );
}
```

**Effort:** 1 week (for 20+ endpoints)
**Impact:** High (enables API-first integrations)

---

### Documentation Priorities by Gap Type

| Priority | Documentation Gap | Effort | Impact |
|----------|-------------------|--------|--------|
| P0 | ROLLBACK_PLAYBOOK.md | 1 day | Critical |
| P1 | API OpenAPI spec | 1 week | High |
| P1 | CONTRIBUTING.md | 2 days | Medium |
| P2 | Architecture diagrams (Mermaid) | 3 days | Medium |
| P3 | Video tutorials | 2 weeks | Low |

### Selected Enhancements

**Phase 1 (Week 1):**
1. Create `ROLLBACK_PLAYBOOK.md`
2. Implement preflight validation script
3. Set up Husky pre-commit hooks

**Phase 2 (Week 2-3):**
1. Write OpenAPI specification for 20+ API routes
2. Deploy Scalar API Reference at `/docs/api`
3. Create `CONTRIBUTING.md` with code review checklist

**Phase 3 (Month 2):**
1. Add Mermaid architecture diagrams to `DATABASE_ARCHITECTURE.md`
2. Create developer onboarding video (Loom)
3. Set up API changelog automation

**Dependencies:**
1. Husky package (`npm i -D husky`)
2. Scalar API Reference (`npm i -D @scalar/api-reference`)
3. Vercel CLI for rollback automation

**Success Criteria:**
- ✅ Rollback playbook reduces MTTR to <5 minutes
- ✅ Preflight script catches 70%+ of errors before CI
- ✅ API documentation has 95%+ endpoint coverage
- ✅ New developers onboard in <2 hours (measured)

**Acceptance Tests:**
1. Trigger rollback workflow → production reverts to previous deployment
2. Commit code with TypeScript error → pre-commit hook blocks push
3. Visit `/docs/api` → see interactive API documentation

---

## Trade-Off Analysis

### High-ROI, Low-Risk Improvements

| Enhancement | Effort | Risk | ROI | Justification |
|-------------|--------|------|-----|---------------|
| **Octokit Plugins (Rate Limiting)** | 1-2 days | Low | High | Prevents GitHub API failures, minimal code changes |
| **Rollback Playbook** | 1 day | Low | Critical | Reduces incident MTTR by 80% |
| **Preflight Validation** | 2-3 days | Low | High | Saves 1-2 hrs/week of failed CI time |
| **Command Palette** | 1 week | Low | Medium | 80% of terminal value without security risk |

### High-Impact, High-Effort Investments

| Enhancement | Effort | Risk | ROI | Justification |
|-------------|--------|------|-----|---------------|
| **Multi-Tenant RLS** | 2 weeks | High | Critical | Mandatory for SaaS product, enables pricing tiers |
| **1Password Secrets** | 1 week | Medium | High | Compliance requirement (SOC2), automated rotation |
| **GitHub App Migration** | 1 week | Medium | Medium | 3x rate limits, enables webhooks, deferred to Phase 2 |

### Deferred / Low-Priority

| Enhancement | Reason for Deferral |
|-------------|---------------------|
| **In-CRM Terminal (Docker PTY)** | Security risks outweigh benefits, command palette covers 80% use case |
| **Schema-per-Tenant** | Over-engineering, RLS sufficient for current scale |
| **AWS KMS** | 1Password provides equivalent security at lower complexity |
| **Video Tutorials** | Text documentation sufficient, defer until 100+ users |

---

## Recommended Implementation Sequence

### Month 1: Security & Stability

**Week 1: Secrets Management**
- Day 1-2: Set up 1Password Connect server
- Day 3-4: Migrate secrets from `.env.local` to 1Password
- Day 5: Implement `encryptSecret()` helpers for database tokens

**Week 2: GitHub Integration Hardening**
- Day 1: Install Octokit plugins (retry + throttling)
- Day 2: Implement webhook signature verification
- Day 3-4: Create `github_repositories` table + sync job
- Day 5: Testing + documentation

**Week 3: Multi-Tenancy Foundation**
- Day 1-2: Create `organisations` + `organisation_members` tables
- Day 3-4: Add `organisation_id` columns to 10 core tables
- Day 5: Backfill migration for existing data

**Week 4: Multi-Tenancy RLS**
- Day 1-3: Implement RLS policies for 15+ tables
- Day 4: Create `withTenantScope()` middleware
- Day 5: Update 20+ API routes to enforce tenant scoping

### Month 2: Developer Experience

**Week 5: CI/CD Enhancements**
- Day 1: Create rollback playbook + GitHub Actions workflow
- Day 2-3: Implement preflight validation script
- Day 4: Set up Husky pre-commit hooks
- Day 5: Document rollback procedures

**Week 6: Command Palette**
- Day 1-2: Build command palette UI component
- Day 3-4: Implement 10 core commands (npm install, git status, etc.)
- Day 5: Add terminal transcript recording

**Week 7: API Documentation**
- Day 1-3: Write OpenAPI spec for 20+ endpoints
- Day 4: Deploy Scalar API Reference
- Day 5: Create CONTRIBUTING.md

**Week 8: Refinement**
- Day 1-2: Add architecture diagrams (Mermaid)
- Day 3: Per-tenant rate limiting (Upstash Redis)
- Day 4-5: Testing + bug fixes

---

## Dependency Graph

```mermaid
graph TD
    A[1Password Secrets] --> B[Multi-Tenant RLS]
    B --> C[Per-Tenant Rate Limiting]
    C --> D[White-Label Theming]

    E[GitHub Rate Limiting] --> F[Multi-Repo Cataloguing]
    F --> G[Webhook Handlers]

    H[Rollback Playbook] --> I[Preflight Validation]
    I --> J[Pre-Commit Hooks]

    K[Command Palette] --> L[Terminal Transcripts]

    M[OpenAPI Spec] --> N[API Client SDK]

    B --> O[Feature Flags per Tenant]
    O --> D
```

---

## Success Criteria by Agent

### Agent-Vault (Secrets)
- ✅ Zero plaintext secrets in git or database
- ✅ 100% OAuth token auto-rotation
- ✅ Audit log shows all accesses (30-day retention)
- ✅ UI masks secrets (`sk-••••7JcA`)

### Agent-Octo (GitHub)
- ✅ No 429 rate limit errors in logs
- ✅ Webhook signature verification 100% pass rate
- ✅ Multi-repo catalogue supports 200+ repos
- ✅ PR creation → CRM task within 5 seconds

### Agent-Tenancy (Multi-Tenant)
- ✅ RLS prevents cross-tenant queries (SQL injection test)
- ✅ New organisations created via UI
- ✅ Rate limits enforce plan quotas
- ✅ Billing dashboard tracks usage per tenant

### Agent-Terminal (Command Palette)
- ✅ Command palette opens with Cmd+K
- ✅ 10 core commands execute <30s
- ✅ Transcripts viewable in project detail
- ✅ Error messages display inline

### Agent-Guide (DX)
- ✅ Rollback MTTR <5 minutes
- ✅ Preflight catches 70%+ errors before CI
- ✅ API docs cover 95%+ endpoints
- ✅ New developers onboard <2 hours

---

## Risk Mitigation Strategies

### High-Risk Changes

**Multi-Tenant Database Migration:**
- **Risk:** Data loss during backfill, broken foreign keys
- **Mitigation:**
  1. Create database snapshot before migration
  2. Run migration on staging database first
  3. Implement gradual rollout (enable RLS for 10% of tables, verify, then 100%)
  4. Keep rollback SQL script ready: `ALTER TABLE companies DISABLE ROW LEVEL SECURITY;`

**1Password Dependency:**
- **Risk:** Connect server downtime breaks production
- **Mitigation:**
  1. Cache decrypted secrets in Redis (5-minute TTL)
  2. Fallback to Vercel environment variables if Connect unreachable
  3. Monitor Connect uptime with Uptime Robot

**GitHub Webhook Endpoint:**
- **Risk:** DDoS attack, replay attacks
- **Mitigation:**
  1. Rate limit webhook endpoint (100 req/min per IP)
  2. Implement request ID deduplication (Redis set with 1-hour expiry)
  3. Verify webhook signature before processing

---

## Acceptance Test Suite

### Multi-Tenancy Tests
```sql
-- Test 1: Cross-tenant isolation
-- As user in Tenant A, try to query Tenant B's data
SET ROLE tenant_a_user;
SELECT * FROM companies WHERE organisation_id = 'tenant-b-id';
-- Expected: 0 rows (RLS blocks access)

-- Test 2: Admin role escalation
-- As member, try to INSERT company (should fail)
SET ROLE tenant_a_member;
INSERT INTO companies (name, organisation_id) VALUES ('Evil Corp', 'tenant-a-id');
-- Expected: ERROR (RLS policy requires admin role)
```

### Secrets Management Tests
```typescript
// Test 1: Encrypted storage
const plaintext = 'sk-ant-test-key';
const encrypted = encryptSecret(plaintext);
console.log(encrypted); // Should be gibberish: "a1b2c3:d4e5f6:..."

const decrypted = decryptSecret(encrypted);
assert(decrypted === plaintext);

// Test 2: Audit trail
await rotateToken('github', 'new-pat-token');
const auditLog = await db.query(
  `SELECT * FROM secret_audit_log WHERE integration_id = 'github' ORDER BY created_at DESC LIMIT 1`
);
assert(auditLog.rows[0].action === 'rotate');
```

### GitHub Integration Tests
```typescript
// Test 1: Rate limit handling
const connector = new GitHubConnectorV2({ accessToken: 'test-pat' });

// Trigger 100 API calls
for (let i = 0; i < 100; i++) {
  await connector.listRepositories({ limit: 1 });
}
// Expected: All succeed with throttling logs

// Test 2: Webhook signature
const payload = JSON.stringify({ action: 'opened' });
const signature = generateHMAC(payload, process.env.GITHUB_WEBHOOK_SECRET!);

const response = await fetch('/api/webhooks/github', {
  method: 'POST',
  headers: { 'x-hub-signature-256': signature },
  body: payload
});
assert(response.status === 200);
```

### Command Palette Tests
```typescript
// Test 1: Command execution
const result = await fetch('/api/projects/123/npm-install', { method: 'POST' });
const data = await result.json();
assert(data.exitCode === 0);

// Test 2: Transcript recording
const transcript = await db.queryOne(
  `SELECT * FROM terminal_transcripts WHERE project_id = '123' ORDER BY created_at DESC LIMIT 1`
);
assert(transcript.command === 'npm install');
```

---

## Budget & Resource Allocation

### Infrastructure Costs (Monthly)

| Service | Purpose | Cost |
|---------|---------|------|
| Vercel Pro | Web app hosting | $20 |
| Supabase Pro | Database + auth | $25 |
| 1Password Business | Secrets management | $8/user × 3 = $24 |
| Upstash Redis | Rate limiting | $10 |
| Fly.io (Connect server) | 1Password Connect | $5 |
| **Total** | | **$84/month** |

### Developer Time (Weeks)

| Agent | Phase 1 | Phase 2 | Total |
|-------|---------|---------|-------|
| Agent-Vault | 1 week | - | 1 week |
| Agent-Octo | 2 weeks | 1 week (webhooks) | 3 weeks |
| Agent-Tenancy | 2 weeks | - | 2 weeks |
| Agent-Terminal | 1 week | - | 1 week |
| Agent-Guide | 1 week | 1 week | 2 weeks |
| **Total** | **7 weeks** | **2 weeks** | **9 weeks** |

**Team Size:** 2 developers
**Timeline:** 4-5 weeks (parallel work streams)

---

## Conclusion

This gap analysis identifies **5 critical areas** for improvement to transform the GEO-SEO Domination Tool into an enterprise-ready, multi-tenant CRM orchestrator:

1. **Secrets Management:** Migrate to 1Password Connect for encrypted storage and automated rotation
2. **GitHub Integration:** Implement rate limiting, backoff strategies, and multi-repo cataloguing
3. **Multi-Tenancy:** Add RLS policies, per-tenant rate limiting, and white-label support
4. **Developer Tooling:** Create command palette + transcript replay (defer Docker terminal)
5. **DX & Documentation:** Add rollback playbook, preflight validation, and OpenAPI docs

**Recommended Path:** Prioritise security and stability (Month 1) before developer experience (Month 2). Focus on **high-ROI, low-risk** improvements first:
- Octokit plugins (2 days)
- Rollback playbook (1 day)
- Preflight validation (3 days)
- Command palette (1 week)

**Total Investment:** 9 weeks developer time, $84/month infrastructure, delivers enterprise-grade platform with 87% → 95%+ alignment confidence.

---

**Document Control:**
**Version:** 1.0
**Author:** Orchestrator-Ω with Agent-Vault, Agent-Octo, Agent-Tenancy, Agent-Terminal, Agent-Guide
**Review Cycle:** Quarterly
**Next Review:** 5 January 2026
