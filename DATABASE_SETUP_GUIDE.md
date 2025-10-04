# Database Setup Guide

## Current Database Schema

Your database has **73 tables** across different functional areas:

### SEO & Analytics (15 tables)
- `companies` - Company profiles for SEO clients
- `audits` - SEO audit results
- `keywords` - Keyword tracking
- `rankings` - Search ranking data
- `backlinks` - Backlink analysis
- `competitors` - Competitor tracking
- `reports` - SEO reports
- `scheduled_audits` - Automated audit scheduling
- `local_pack_tracking` - Local SEO tracking
- `service_areas` - Geographic service areas
- `individuals` - Individual contacts
- `perplexity_optimization` - AI-powered optimization
- `citations` - Business citations
- `content_gaps` - Content opportunity analysis
- `seo_strategies` - SEO strategy planning

### CRM & Pipeline (9 tables)
- `crm_contacts` - Contact management
- `crm_deals` - Sales pipeline/deals
- `crm_tasks` - Task management
- `crm_calendar_events` - Calendar/scheduling
- `crm_event_attendees` - Event participants
- `crm_support_tickets` - Support/helpdesk
- `crm_projects` - Project management (internal CRM projects)
- `crm_project_members` - Project team members
- `crm_github_projects` - GitHub integration

### Project Hub (13 tables)
- `hub_projects` - Main project registry
- `hub_project_configs` - Project configurations
- `hub_project_features` - Feature toggles
- `hub_project_dependencies` - Dependency management
- `hub_collections` - Project collections/groups
- `hub_collection_projects` - Collection membership
- `hub_sandbox_sessions` - Development sandboxes
- `hub_quick_actions` - Quick action shortcuts
- `hub_activity_log` - Activity tracking
- `hub_api_keys` - API key management
- `ide_configs` - IDE settings
- `project_templates` - Reusable templates
- `generated_projects` - AI-generated projects

### Resources & Learning (4 tables)
- `crm_prompts` - AI prompt library
- `crm_components` - Reusable components
- `crm_ai_tools` - AI tool registry
- `crm_tutorials` - Tutorial content
- `code_snippets` - Code snippet library

### AI & Search (4 tables)
- `ai_search_campaigns` - AI search campaigns
- `ai_search_visibility` - Search visibility tracking
- `ai_competitor_analysis` - AI competitor insights
- `ai_content_strategy` - Content strategy AI

### Integrations (10 tables)
- `integration_registry` - Available integrations
- `integration_connections` - Active connections
- `integration_templates` - Integration templates
- `integration_webhooks` - Webhook configurations
- `integration_sync_jobs` - Sync job tracking
- `integration_metrics` - Integration analytics
- `integration_auto_config` - Auto-configuration
- `integration_sdk_versions` - SDK version tracking
- `oauth_states` - OAuth state management
- `webhook_events` - Webhook event log

### Notifications (5 tables)
- `notification_queue` - Notification queue
- `notification_history` - Notification log
- `notification_templates` - Email/SMS templates
- `notification_preferences` - User preferences
- `notification_subscriptions` - Subscription management

### Job Scheduler (3 tables)
- `job_schedules` - Cron job definitions
- `job_executions` - Job execution history
- `job_alerts` - Job failure alerts

### Campaign Management (2 tables)
- `campaign_strategies` - Marketing strategies
- `campaign_results` - Campaign performance

### Strategy & Analytics (3 tables)
- `strategy_case_studies` - Success stories
- `strategy_implementation_notes` - Implementation guides
- `template_variables` - Template customization
- `template_features` - Template features
- `template_dependencies` - Template requirements

### Project Generation (2 tables)
- `generation_steps` - Project generation workflow
- `project_templates` - Generation templates

---

## ✅ Apply Schema to Supabase

### Option 1: Using Supabase SQL Editor (Recommended)

1. **Go to Supabase Dashboard** → Your Project
2. Click **"SQL Editor"** in left sidebar
3. Create a new query
4. **Run each schema file one at a time**:

```sql
-- First, run the main schema
-- Copy contents of database/schema.sql and run it
```

Then run these in order:
```bash
1. database/schema.sql (main SEO tables)
2. database/crm_schema.sql (CRM tables)
3. database/project-hub-schema.sql (project management)
4. database/resources-schema.sql (resources)
5. database/ai-search-schema.sql (AI features)
6. database/integrations-schema.sql (integrations)
7. database/notifications-schema.sql (notifications)
8. database/job-scheduler-schema.sql (cron jobs)
9. database/project-generation-schema.sql (project generation)
10. database/migrations/001_add_notifications.sql (migration)
```

---

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref qwoggbbavikzhypzodcr

# Run migrations
supabase db push

# OR manually run each file
supabase db execute --file database/schema.sql
supabase db execute --file database/crm_schema.sql
# ... etc
```

---

### Option 3: Automated Script

Create a script to run all schemas:

```bash
# From project root
cd database

# Run all schemas in order
for file in schema.sql crm_schema.sql project-hub-schema.sql resources-schema.sql ai-search-schema.sql integrations-schema.sql notifications-schema.sql job-scheduler-schema.sql project-generation-schema.sql; do
  echo "Running $file..."
  # Use Supabase CLI or psql
  supabase db execute --file "$file"
done

# Run migrations
supabase db execute --file migrations/001_add_notifications.sql
```

---

## ⚙️ Enable Row Level Security (RLS)

After creating tables, enable RLS for security:

### For Each Table, Run:

```sql
-- Example for companies table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own company data
CREATE POLICY "Users can view own company data"
ON companies
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own data
CREATE POLICY "Users can insert own company data"
ON companies
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own company data"
ON companies
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own data
CREATE POLICY "Users can delete own company data"
ON companies
FOR DELETE
USING (auth.uid() = user_id);
```

### Apply RLS to All Tables

Here's a comprehensive RLS setup:

```sql
-- Enable RLS on all tables
DO $$
DECLARE
    tbl_name text;
BEGIN
    FOR tbl_name IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl_name);
    END LOOP;
END $$;
```

---

## 🔍 Verify Tables Created

Run this query in Supabase SQL Editor:

```sql
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Should return 73+ tables.

---

## 📊 Check Current Database Status

### In Supabase Dashboard:

1. Go to **"Table Editor"**
2. See which tables exist
3. Click each table to view structure

### Using SQL:

```sql
-- Count tables
SELECT COUNT(*) as table_count
FROM pg_tables
WHERE schemaname = 'public';

-- List all tables with row counts
SELECT
    schemaname,
    tablename,
    (xpath('/row/cnt/text()',
        query_to_xml(format('SELECT COUNT(*) as cnt FROM %I.%I', schemaname, tablename),
        false, true, ''))
    )[1]::text::int as row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## 🚨 Important Notes

### User ID Column
Most tables need a `user_id` column to link data to authenticated users:

```sql
-- Add user_id to tables that don't have it
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Set default to current user
ALTER TABLE companies
ALTER COLUMN user_id SET DEFAULT auth.uid();
```

### Timestamps
Ensure all tables have created_at and updated_at:

```sql
-- Add timestamps if missing
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create update trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

---

## 🔗 Next Steps After Database Setup

1. ✅ **Verify all 73 tables are created**
2. ✅ **Enable RLS on all tables**
3. ✅ **Create RLS policies for user data isolation**
4. ✅ **Add indexes for performance**
5. ✅ **Set up foreign key relationships**
6. ✅ **Create database functions/triggers**
7. ✅ **Populate with seed data (optional)**
8. ✅ **Update TypeScript types** to match schema

---

## 📝 Generate TypeScript Types

After tables are created, generate types:

```bash
# Using Supabase CLI
supabase gen types typescript --project-id qwoggbbavikzhypzodcr > web-app/types/supabase.ts
```

Or manually in Supabase Dashboard:
1. Go to **Settings** → **API**
2. Scroll to **"Auto-generated TypeScript Types"**
3. Copy the types
4. Paste into `web-app/types/supabase.ts`

---

## 🐛 Troubleshooting

### "Table already exists" Error
```sql
-- Drop and recreate
DROP TABLE IF EXISTS table_name CASCADE;
-- Then run CREATE TABLE again
```

### "Permission denied" Error
```sql
-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

### Foreign Key Errors
```sql
-- Check if referenced table exists first
SELECT tablename FROM pg_tables WHERE tablename = 'referenced_table';
```

---

## 📚 Resources

- [Supabase Table Editor](https://app.supabase.com/project/qwoggbbavikzhypzodcr/editor)
- [Supabase SQL Editor](https://app.supabase.com/project/qwoggbbavikzhypzodcr/sql)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
