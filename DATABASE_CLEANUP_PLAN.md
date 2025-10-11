# Database Cleanup & Enhancement Plan

**Date:** January 11, 2025
**Current State:** 20+ tables operational, 65+ SQL files (many duplicates/obsolete)
**Goal:** Clean up, consolidate, and enhance database schema

---

## 🔍 Current State Analysis

### ✅ Tables Currently in Supabase (20 tables)
1. `companies` (24 rows) - Core company data
2. `seo_audits` (31 rows) - Audit results
3. `keywords` (2 rows) - Keyword tracking
4. `rankings` (0 rows) - Ranking data
5. `individuals` (0 rows) - Team members
6. `organisations` (1 row) - Multi-tenancy
7. `users` (0 rows) - User accounts
8. `user_settings` (1 row) - User preferences
9. `saved_onboarding` (10 rows) - Onboarding progress
10. `client_subscriptions` (0 rows) - Subscriptions
11. `subscription_tiers` (0 rows) - Pricing tiers
12. `notifications` (0 rows) - Notification system
13. `scheduled_jobs` (1 row) - Cron jobs
14. `integrations` (0 rows) - Third-party integrations
15. `agent_tasks` (0 rows) - Agent automation (DUPLICATE PURPOSE - see note below)
16. `autonomous_tasks` (0 rows) - Autonomous tasks
17. `company_portfolios` (1 row) - Client portfolios
18. `onboarding_sessions` (47 rows) - Active onboarding
19. `gmb_integrations` (0 rows) - Google My Business OAuth
20. `bing_webmaster_integrations` (0 rows) - Bing Webmaster

### ✅ Post-Audit Automation Tables (6 tables - Recently Added)
1. `website_credentials` (0 rows) - Encrypted credentials
2. `agent_tasks` (0 rows) - **DUPLICATE NAME** with #15 above
3. `task_execution_logs` (0 rows) - Execution logs
4. `task_templates` (0 rows) - Reusable templates
5. `credentials_access_log` (0 rows) - Security audit
6. `automation_rules` (0 rows) - Automation rules

**⚠️ CRITICAL ISSUE:** Two tables named `agent_tasks`:
- One from old schema (generic agent system)
- One from post-audit automation (specific to post-audit fixes)
- Need to check which one exists and rename/merge

---

## 📂 SQL File Issues (65 files total)

### ❌ Files to DELETE (Obsolete/Duplicate)

#### Root Directory (Migration/Test Files - Should be in database/migrations/)
- `RLS_VERIFICATION.sql` - Ad-hoc RLS test (move to /scripts/)
- `CHECK_RLS_POLICIES.sql` - Ad-hoc policy check (move to /scripts/)
- `MIGRATION_003.sql` - Old migration (consolidate)
- `MIGRATION_008.sql` - Old migration (consolidate)
- `MIGRATION_009_COMPANY_CONTEXT.sql` - Old migration (consolidate)
- `URGENT_FIX_seo_audits.sql` - Emergency fix (archived)
- `URGENT_FIX_seo_audits_v2.sql` - Emergency fix (archived)
- `URGENT_FIX_seo_audits_v3.sql` - Emergency fix (archived)

#### Duplicate Schema Files
- `database/schema.sql` - **SQLite version** (app uses PostgreSQL/Supabase)
- `database/quick-init.sql` - **SQLite version** (redundant)
- `database/empire-crm-schema-sqlite.sql` - **SQLite version** (keep PostgreSQL only)
- `database/saved-onboarding-schema.sql` - Replaced by `supabase-saved-onboarding.sql`
- `database/bytebot-schema.sql` - Replaced by `supabase-bytebot-schema.sql`

#### Obsolete/Incomplete Features
- `database/serpbear-schema.sql` - SERPBear integration (not implemented)
- `database/siteone-crawler-schema.sql` - SiteOne crawler (not implemented)
- `database/sandbox-schema.sql` - Sandbox system (incomplete)
- `database/support-tickets-schema.sql` - Support tickets (use CRM instead)

#### Coding Agent (Separate Tool)
- `tools/coding-agent/lib/db/migrations/*.sql` (5 files) - Keep but isolate

### ✅ Files to KEEP (Active/Essential)

#### Core Schemas
- `database/02-core-seo.sql` - Core SEO tables (PostgreSQL)
- `database/user-settings-schema.sql` - User settings
- `database/add-user-id-columns.sql` - Multi-tenancy columns

#### Onboarding
- `database/onboarding-schema.sql` - Onboarding system
- `database/client-onboarding-schema.sql` - Client onboarding
- `database/supabase-onboarding-sessions.sql` - Onboarding sessions
- `database/supabase-saved-onboarding.sql` - Saved progress

#### Automation & Agents
- `database/autonomous-tasks-schema.sql` - Autonomous tasks
- `database/agent-system-schema.sql` - Agent system
- `database/post-audit-automation-schema.sql` - Post-audit automation (NEW!)

#### Integrations
- `database/integrations-schema.sql` - Integration framework
- `database/integrations-migration.sql` - Integration migrations
- `database/google-search-console-schema.sql` - GSC integration
- `database/onboarding-vitals-schema.sql` - GMB/Bing OAuth
- `database/migrations/001_gmb_integrations.sql` - GMB OAuth tables
- `database/migrations/001_gmb_integrations_fixed.sql` - GMB OAuth fix

#### Content & SEO
- `database/ai-search-schema.sql` - AI search optimization
- `database/content-opportunities-schema.sql` - Content opportunities
- `database/marketing-knowledge-schema.sql` - Marketing knowledge base
- `database/seo-monitor-schema.sql` - SEO monitoring

#### CRM & Subscriptions
- `database/empire-crm-schema.sql` - CRM system (PostgreSQL)
- `database/client-subscriptions-schema.sql` - Subscriptions

#### System
- `database/notifications-schema.sql` - Notifications
- `database/scheduled-jobs-schema.sql` - Cron jobs
- `database/localization-schema.sql` - Localization

### ✅ Migrations to KEEP
- `database/migrations/001_add_notifications.sql`
- `database/migrations/002_add_project_notes.sql`
- `database/migrations/003_multi_tenancy_foundation.sql`
- `database/migrations/004_usage_tracking.sql`
- `database/migrations/005_theming_system.sql`
- `database/migrations/006_github_sync.sql`
- `database/migrations/007_feature_flags.sql`
- `database/migrations/008_auto_add_users_to_organisation.sql`
- `database/migrations/010_make_seo_audits_user_id_nullable.sql`
- `database/migrations/011_add_sandbox_tasks.sql`
- `database/migrations/012_autonomous_seo_agent.sql`
- `database/migrations/012_autonomous_seo_agent_postgres.sql`
- `database/migrations/001_add_saved_onboarding.sql`
- `database/migrations/003_add_onboarding_columns_to_portfolios.sql`
- `database/migrations/004_orchestrator_progress_tracking.sql`
- `database/migrations/2025-01-10_workspace-schema.sql`

---

## 🚀 Cleanup Actions

### Phase 1: Archive Obsolete Files (10 files)
Move to `database/archive/` folder:
```
database/archive/
├── sqlite/
│   ├── schema.sql (SQLite version)
│   ├── quick-init.sql
│   └── empire-crm-schema-sqlite.sql
├── incomplete/
│   ├── serpbear-schema.sql
│   ├── siteone-crawler-schema.sql
│   ├── sandbox-schema.sql
│   └── support-tickets-schema.sql
├── emergency-fixes/
│   ├── URGENT_FIX_seo_audits.sql
│   ├── URGENT_FIX_seo_audits_v2.sql
│   └── URGENT_FIX_seo_audits_v3.sql
└── old-migrations/
    ├── MIGRATION_003.sql
    ├── MIGRATION_008.sql
    └── MIGRATION_009_COMPANY_CONTEXT.sql
```

### Phase 2: Consolidate Master Schema
Create `database/supabase-master-schema.sql`:
- Combines all active PostgreSQL schemas
- Correct order of table creation
- All necessary indexes
- RLS policies
- Triggers and functions

### Phase 3: Fix `agent_tasks` Duplicate
Check which `agent_tasks` table is currently in use:
- If old generic version: Rename to `legacy_agent_tasks`
- If post-audit version: Keep as is
- If both: Merge into single comprehensive table

### Phase 4: Create Enhancement Schemas
Build new schemas for missing/incomplete features:
1. **Advanced Analytics Schema** - Competitor analysis, trend tracking
2. **API Rate Limiting Schema** - Request throttling, quota management
3. **Audit History Schema** - Version control for audit changes
4. **Client Portal Schema** - Client-facing dashboard tables

---

## 📋 New Enhancement Schemas to Create

### 1. Advanced Analytics Schema
```sql
-- Competitor tracking over time
CREATE TABLE competitor_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  competitor_id UUID REFERENCES competitors(id),
  snapshot_date TIMESTAMP DEFAULT NOW(),
  ranking_data JSONB,
  review_count INTEGER,
  avg_rating NUMERIC(3,2),
  visibility_score NUMERIC(5,2)
);

-- SEO trend analysis
CREATE TABLE seo_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  metric_name TEXT,
  metric_value NUMERIC,
  recorded_at TIMESTAMP DEFAULT NOW()
);
```

### 2. API Rate Limiting Schema
```sql
-- API request tracking
CREATE TABLE api_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  response_status INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rate limit quotas
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES organisations(id),
  endpoint_pattern TEXT NOT NULL,
  max_requests_per_hour INTEGER,
  max_requests_per_day INTEGER,
  current_hour_count INTEGER DEFAULT 0,
  current_day_count INTEGER DEFAULT 0,
  window_reset_at TIMESTAMP
);
```

### 3. Audit History Schema
```sql
-- Audit change tracking
CREATE TABLE audit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES seo_audits(id),
  changed_by UUID REFERENCES users(id),
  change_type TEXT, -- 'created', 'updated', 'deleted'
  before_data JSONB,
  after_data JSONB,
  changed_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Client Portal Schema
```sql
-- Client access tokens
CREATE TABLE client_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  access_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP,
  last_accessed_at TIMESTAMP,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Client visible reports
CREATE TABLE client_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  report_type TEXT, -- 'monthly_summary', 'audit_results', 'ranking_update'
  report_data JSONB,
  generated_at TIMESTAMP DEFAULT NOW(),
  client_viewed_at TIMESTAMP
);
```

---

## ✅ Master Consolidation File Structure

### `database/supabase-master-schema.sql`

```sql
-- ============================================================================
-- GEO-SEO DOMINATION TOOL - MASTER SUPABASE SCHEMA
-- ============================================================================
-- PostgreSQL schema for Supabase
-- Last updated: January 11, 2025
-- ============================================================================

-- SECTION 1: CORE TABLES
-- companies, individuals, organisations, users, user_settings

-- SECTION 2: SEO & AUDITS
-- seo_audits, keywords, rankings, competitors, citations

-- SECTION 3: ONBOARDING
-- saved_onboarding, onboarding_sessions, client_onboarding

-- SECTION 4: SUBSCRIPTIONS
-- subscription_tiers, client_subscriptions

-- SECTION 5: AUTOMATION
-- autonomous_tasks, agent_tasks_unified (merged table), task_execution_logs

-- SECTION 6: POST-AUDIT AUTOMATION (NEW!)
-- website_credentials, task_templates, automation_rules, credentials_access_log

-- SECTION 7: INTEGRATIONS
-- integrations, gmb_integrations, bing_webmaster_integrations, google_search_console

-- SECTION 8: CONTENT & AI
-- ai_search_strategies, content_opportunities, marketing_knowledge

-- SECTION 9: CRM
-- crm_contacts, crm_deals, crm_tasks, crm_calendar_events

-- SECTION 10: MONITORING
-- seo_monitor_keywords, scheduled_jobs, notifications

-- SECTION 11: ANALYTICS (NEW!)
-- competitor_snapshots, seo_trends

-- SECTION 12: RATE LIMITING (NEW!)
-- api_requests, rate_limits

-- SECTION 13: AUDIT HISTORY (NEW!)
-- audit_history

-- SECTION 14: CLIENT PORTAL (NEW!)
-- client_portal_access, client_reports

-- SECTION 15: INDEXES
-- All performance indexes

-- SECTION 16: RLS POLICIES
-- Row Level Security policies

-- SECTION 17: TRIGGERS & FUNCTIONS
-- Auto-update triggers, helper functions
```

---

## 🎯 Execution Plan

### Step 1: Backup Current Database
```bash
# Export current schema
pg_dump -s postgresql://... > backup_schema_2025-01-11.sql
```

### Step 2: Archive Obsolete Files
```bash
mkdir -p database/archive/{sqlite,incomplete,emergency-fixes,old-migrations}
mv database/schema.sql database/archive/sqlite/
# ... move others
```

### Step 3: Create Master Schema
- Consolidate all active schemas
- Fix `agent_tasks` duplicate
- Add missing indexes
- Add missing RLS policies

### Step 4: Create Enhancement Schemas
- Advanced analytics
- API rate limiting
- Audit history
- Client portal

### Step 5: Execute in Supabase
- Run master schema (idempotent - won't break existing)
- Run enhancement schemas
- Verify all tables
- Run test suite

### Step 6: Update Documentation
- Update CLAUDE.md with new table list
- Update API documentation
- Create migration guide for developers

---

## 📊 Expected Results

### Before Cleanup:
- ❌ 65 SQL files (many duplicates/obsolete)
- ❌ Mixed SQLite/PostgreSQL
- ❌ Unclear which files are active
- ❌ Duplicate `agent_tasks` table
- ❌ Missing enhancement features

### After Cleanup:
- ✅ ~30 active SQL files (organized)
- ✅ All PostgreSQL/Supabase compatible
- ✅ Clear file organization
- ✅ Unified agent_tasks table
- ✅ 4 new enhancement schemas
- ✅ Master consolidation file
- ✅ Complete documentation

---

## 🚀 Ready to Execute?

I'm ready to:
1. Create the master consolidation schema
2. Create 4 enhancement schemas
3. Archive obsolete files
4. Execute updates in Supabase
5. Verify all tables and indexes

**Would you like me to proceed with the cleanup and enhancements?**
