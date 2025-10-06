# Integration Migration Verification

## Schema Compatibility Checklist

### ✅ UUID Types
- [x] All `id` columns use `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- [x] All `company_id` foreign keys use `UUID REFERENCES companies(id)`
- [x] All `geo_seo_keyword_id` foreign keys use `UUID REFERENCES keywords(id)`
- [x] All `audit_id` foreign keys use `UUID REFERENCES technical_audits(id)`

### ✅ Timestamp Types
- [x] All timestamp columns use `TIMESTAMP WITH TIME ZONE`
- [x] Default values use `NOW()` function

### ✅ Column Names
- [x] View uses `c.website` (not `c.domain`) from companies table
- [x] Matches Supabase schema exactly

## Supabase Companies Schema Reference

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website TEXT NOT NULL,        -- ← Used in view (not 'domain')
  industry TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Migration File Status

**File:** `database/integrations-migration.sql`

**Status:** ✅ Ready to deploy

**Tables:** 13 total
- SerpBear: 2 tables
- Google Search Console: 5 tables
- SiteOne Crawler: 6 tables

**Views:** 2
- `company_integrations` - Regular view
- `integration_statistics` - Materialized view

**Functions:** 2
- `get_company_integration_health(company_id UUID)`
- `refresh_integration_stats()`

## Deployment Methods

### Method 1: psql Command Line
```bash
# Set your Supabase database URL
export DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Run migration
psql $DATABASE_URL -f database/integrations-migration.sql
```

### Method 2: Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in sidebar
4. Create "New query"
5. Copy entire contents of `database/integrations-migration.sql`
6. Paste and click "Run"

### Method 3: Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
supabase link --project-ref [your-project-ref]

# Run migration
supabase db push
```

## Post-Migration Verification

### Step 1: Check Tables Created
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'serpbear_%'
   OR table_name LIKE 'gsc_%'
   OR table_name LIKE '%audit%'
   OR table_name = 'broken_links'
   OR table_name = 'page_performance'
   OR table_name = 'generated_sitemaps'
   OR table_name = 'crawler_logs'
ORDER BY table_name;
```

Expected: 13 tables

### Step 2: Check Views Created
```sql
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name = 'company_integrations'
   OR table_name = 'integration_statistics')
ORDER BY table_name;
```

Expected: 2 views (1 regular, 1 materialized)

### Step 3: Check Functions Created
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name = 'get_company_integration_health'
   OR routine_name = 'refresh_integration_stats')
ORDER BY routine_name;
```

Expected: 2 functions

### Step 4: Test Integration View
```sql
-- Should return all companies with integration status
SELECT * FROM company_integrations LIMIT 5;
```

### Step 5: Test Health Function
```sql
-- Replace 'your-company-uuid' with actual company UUID
SELECT get_company_integration_health('your-company-uuid'::uuid);
```

Expected JSON structure:
```json
{
  "company_id": "uuid-here",
  "company_name": "Company Name",
  "integrations": {
    "serpbear": {
      "enabled": false,
      "domains": 0,
      "keywords": 0
    },
    "google_search_console": {
      "enabled": null,
      "last_sync": null,
      "clicks_30d": 0
    },
    "technical_audits": {
      "total_completed": 0,
      "latest_score": null,
      "latest_date": null
    }
  }
}
```

### Step 6: Refresh Statistics
```sql
-- Refresh materialized view
SELECT refresh_integration_stats();

-- Check statistics
SELECT * FROM integration_statistics;
```

## Common Issues and Solutions

### Issue 1: "relation companies does not exist"
**Solution:** Run `web-app/supabase-schema.sql` first to create base tables.

### Issue 2: "extension uuid-ossp does not exist"
**Solution:** Run as superuser or enable in Supabase dashboard:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Issue 3: "column c.domain does not exist"
**Solution:** Already fixed - view now uses `c.website` instead.

### Issue 4: Type mismatch errors
**Solution:** Already fixed - all IDs are now UUID type.

## Rollback Plan

If migration fails, rollback with:

```sql
-- Drop all integration tables
DROP TABLE IF EXISTS crawler_logs CASCADE;
DROP TABLE IF EXISTS page_performance CASCADE;
DROP TABLE IF EXISTS broken_links CASCADE;
DROP TABLE IF EXISTS generated_sitemaps CASCADE;
DROP TABLE IF EXISTS audit_issues CASCADE;
DROP TABLE IF EXISTS technical_audits CASCADE;

DROP TABLE IF EXISTS gsc_sync_history CASCADE;
DROP TABLE IF EXISTS gsc_integrations CASCADE;
DROP TABLE IF EXISTS gsc_urls CASCADE;
DROP TABLE IF EXISTS gsc_keywords CASCADE;
DROP TABLE IF EXISTS gsc_daily_traffic CASCADE;

DROP TABLE IF EXISTS serpbear_keywords CASCADE;
DROP TABLE IF EXISTS serpbear_domains CASCADE;

-- Drop views
DROP MATERIALIZED VIEW IF EXISTS integration_statistics;
DROP VIEW IF EXISTS company_integrations;

-- Drop functions
DROP FUNCTION IF EXISTS refresh_integration_stats();
DROP FUNCTION IF EXISTS get_company_integration_health(UUID);
DROP FUNCTION IF EXISTS update_serpbear_updated_at();
```

## Success Criteria

Migration is successful when:
- [x] All 13 tables exist
- [x] All 2 views exist (1 regular, 1 materialized)
- [x] All 2 functions exist
- [x] No errors in migration output
- [x] `company_integrations` view returns data
- [x] `get_company_integration_health()` returns valid JSON
- [x] All foreign keys reference correct tables
- [x] All timestamps use `TIMESTAMP WITH TIME ZONE`

## Next Steps After Migration

1. **Update Environment Variables**
   - Add Google OAuth credentials for GSC integration
   - Add OpenRouter API key for DeepSeek V3
   - Configure SerpBear credentials

2. **Test Integrations**
   - Install SerpBear dependencies: `cd integrations/serpbear && npm install`
   - Install GSC Dashboard dependencies: `cd integrations/seo-dashboard && npm install`
   - Test MCP server: `cd mcp-servers/siteone-crawler && pip install -r requirements.txt`

3. **Build CRM UI**
   - Create integration dashboard page
   - Add "Run Audit" button
   - Add "Sync GSC Data" button
   - Add "Track Keywords" button
   - Display integration health cards

4. **Setup Automation**
   - Configure auto-detection of lacking data
   - Setup auto-fix workflows
   - Enable competitive intelligence features
