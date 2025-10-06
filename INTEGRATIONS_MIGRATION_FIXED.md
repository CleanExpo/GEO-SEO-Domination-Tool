# Integration Migration - UUID Fix

## Issue Resolved

**Error:** `foreign key constraint "serpbear_domains_company_id_fkey" cannot be implemented - Key columns "company_id" and "id" are of incompatible types: integer and uuid`

**Root Cause:** The integration migration used `INTEGER` for foreign keys, but the Supabase schema uses `UUID` for all primary keys.

## Changes Made

### Before (Incorrect)
```sql
CREATE TABLE serpbear_domains (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### After (Correct)
```sql
CREATE TABLE serpbear_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Complete Migration Ready

**File:** `database/integrations-migration.sql`

**Changes:**
- ✅ All `id SERIAL PRIMARY KEY` → `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- ✅ All `company_id INTEGER` → `company_id UUID`
- ✅ All `geo_seo_keyword_id INTEGER` → `geo_seo_keyword_id UUID`
- ✅ All `audit_id INTEGER` → `audit_id UUID`
- ✅ All `TIMESTAMP` → `TIMESTAMP WITH TIME ZONE`
- ✅ All foreign key references now match Supabase schema

## Tables Updated

**SerpBear (2 tables):**
- `serpbear_domains` - UUID primary key, UUID foreign key to companies
- `serpbear_keywords` - UUID primary key, UUID foreign key to keywords

**Google Search Console (5 tables):**
- `gsc_daily_traffic` - UUID primary key, UUID foreign key to companies
- `gsc_keywords` - UUID primary key, UUID foreign keys to companies and keywords
- `gsc_urls` - UUID primary key, UUID foreign key to companies
- `gsc_integrations` - UUID primary key, UUID foreign key to companies
- `gsc_sync_history` - UUID primary key, UUID foreign key to companies

**SiteOne Crawler (6 tables):**
- `technical_audits` - UUID primary key, UUID foreign key to companies
- `audit_issues` - UUID primary key, UUID foreign key to technical_audits
- `broken_links` - UUID primary key, UUID foreign keys to companies and technical_audits
- `page_performance` - UUID primary key, UUID foreign keys to companies and technical_audits
- `generated_sitemaps` - UUID primary key, UUID foreign keys to companies and technical_audits
- `crawler_logs` - UUID primary key, UUID foreign key to technical_audits

## Verification

Run this command to verify the migration:
```bash
psql $DATABASE_URL -f database/integrations-migration.sql
```

Or run in Supabase SQL Editor.

## Expected Output

```
NOTICE:  ✅ Integration migration completed successfully!
NOTICE:
NOTICE:  Tables created:
NOTICE:    • SerpBear: serpbear_domains, serpbear_keywords
NOTICE:    • GSC: gsc_daily_traffic, gsc_keywords, gsc_urls, gsc_integrations, gsc_sync_history
NOTICE:    • Technical Audits: technical_audits, audit_issues, broken_links, page_performance, generated_sitemaps, crawler_logs
NOTICE:
NOTICE:  Views created:
NOTICE:    • company_integrations
NOTICE:    • integration_statistics (materialized)
NOTICE:
NOTICE:  Functions created:
NOTICE:    • get_company_integration_health(company_id)
NOTICE:    • refresh_integration_stats()
NOTICE:
NOTICE:  Next steps:
NOTICE:    1. Test queries: SELECT * FROM company_integrations;
NOTICE:    2. Check stats: SELECT * FROM integration_statistics;
NOTICE:    3. Get company health: SELECT get_company_integration_health(1);
```

## Key Learning

**Always check the target database schema before creating foreign keys!**

- SQLite uses `INTEGER AUTOINCREMENT`
- PostgreSQL can use `SERIAL` or `UUID`
- Supabase defaults to `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- Foreign key types MUST match the referenced table's primary key type

## Migration Compatibility

The migration is now compatible with:
- ✅ Supabase PostgreSQL (UUID-based)
- ✅ Standard PostgreSQL with uuid-ossp extension
- ✅ Any PostgreSQL instance with `gen_random_uuid()` support

**Note:** This migration will NOT work with SQLite or PostgreSQL without UUID support. For those environments, use the original INTEGER-based schema files.
