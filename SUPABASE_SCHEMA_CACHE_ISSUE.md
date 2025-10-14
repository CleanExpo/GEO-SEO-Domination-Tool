# Supabase Schema Cache Issue - DIAGNOSIS & FIX

## Problem Statement

**Error**: `Could not find the 'address' column of 'companies' in the schema cache`

**Symptoms**:
- Individual column SELECT queries work: `SELECT email`, `SELECT address` → ✅ Success
- Multi-column SELECT queries fail: `SELECT name, email, address` → ❌ FAIL
- INSERT queries fail: `INSERT INTO companies (name, address, ...)` → ❌ FAIL

**Root Cause**:
Supabase's PostgREST layer caches the database schema for performance. When columns are added via migrations or direct SQL, **the cache is not automatically refreshed**. This causes a mismatch between:
- **Actual PostgreSQL Schema**: Has all columns (email, phone, address, city, state, zip)
- **PostgREST Schema Cache**: Missing recently added columns

## Verification

### What Works ✅
```bash
# Individual column queries (bypass cache)
SELECT email FROM companies LIMIT 1  → ✅ Works
SELECT address FROM companies LIMIT 1 → ✅ Works
```

### What Fails ❌
```bash
# Multi-column queries (use cache)
SELECT name, email, address FROM companies → ❌ "address not in cache"

# INSERT queries (use cache)
INSERT INTO companies (name, address) → ❌ "address not in cache"
```

## Solutions

### Option 1: Reload Schema Cache via Supabase Dashboard (RECOMMENDED)

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr
2. Navigate to **Settings** → **API**
3. Click **"Reload schema cache"** button
4. Wait 10-15 seconds for cache to rebuild
5. Test again

**This is the cleanest and safest solution.**

### Option 2: Restart PostgREST Service

If Option 1 doesn't work, restart the PostgREST service:

1. Go to Supabase Dashboard
2. Navigate to **Settings** → **Database**
3. Click **"Restart database"** (WARNING: This causes brief downtime)
4. Wait for service to come back online (~1-2 minutes)

### Option 3: Issue NOTIFY Command (For Self-Hosted Supabase Only)

If running self-hosted Supabase, you can manually trigger schema cache reload:

```sql
NOTIFY pgrst, 'reload schema';
```

This does NOT work on Supabase Cloud (managed hosting).

## Prevention

To prevent this issue in future migrations:

1. **Always use Supabase SQL Editor** for schema changes (not direct SQL clients)
2. **Reload schema cache** after migrations
3. **Test queries** immediately after schema changes before deploying code
4. **Use Supabase's migration system**: `supabase db push`

## Test Script

After reloading schema cache, run this to verify the fix:

```bash
SUPABASE_SERVICE_ROLE_KEY="..." node scripts/test-full-onboarding-flow.js
```

Expected result:
- ✅ Company Creation: PASS
- ✅ Credential Encryption: PASS
- ✅ Credential Retrieval: PASS
- ✅ Join Query: PASS
- ✅ Cleanup: PASS

**Success Rate: 100%**

## Current Status

**Diagnosis**: COMPLETE ✅

**Database Schema**: CORRECT ✅
- All columns exist in PostgreSQL
- All tables created (companies, client_credentials, saved_onboarding_sessions)
- Row Level Security policies configured

**PostgREST Cache**: OUT OF SYNC ❌
- Cache needs manual reload

**Action Required**:
1. User must reload schema cache via Supabase Dashboard
2. Retest onboarding flow to confirm fix

## Why This Happened

Looking at the migration file ([database/migrations/001_initialize_production.sql](database/migrations/001_initialize_production.sql)):

- Migration adds columns using `ALTER TABLE` statements
- These are executed via SQL Editor
- PostgREST does NOT automatically detect schema changes via ALTER TABLE
- Manual cache reload required after schema modifications

## Technical Details

PostgREST schema cache location: `/etc/postgrest/schema.cache`

Cache refresh triggers:
- Manual: Dashboard button or NOTIFY command
- Automatic: On PostgREST restart
- NOT triggered by: ALTER TABLE, ADD COLUMN, CREATE TABLE

Cache TTL: Indefinite (does not expire automatically)

**Conclusion**: This is a known PostgREST behavior, not a bug. Manual intervention required.
