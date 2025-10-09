# Production 500 Error - ROOT CAUSE FOUND & FIXED

**Date:** 2025-10-09
**Status:** ✅ **ROOT CAUSE IDENTIFIED** - ⚠️ **AWAITING MANUAL TABLE CREATION**

## Root Cause Found Using Playwright

Used Playwright automated testing to identify the production error:

```
/api/onboarding/save:1  Failed to load resource: the server responded with a status of 500 ()
```

**Root Cause:** `saved_onboarding` table does not exist in Supabase production database

## Why The Confusion

**Your original issue:** "site is saving using localhost, but not saving when we deploy in vercel"

**What I initially thought:**
- Database connection issue (FIXED ✅)
- Server Component errors (FIXED ✅)

**What it actually was:**
- Missing database table in production ✅ **NOW IDENTIFIED**

## Evidence

1. ✅ API route expects table: `app/api/onboarding/save/route.ts:32-50`
2. ✅ Schema exists locally: `database/supabase-saved-onboarding.sql`
3. ❌ Table never created in Supabase production database
4. ✅ Localhost works (auto-creates table via `database/quick-init.sql`)
5. ❌ Production fails with PostgreSQL error: "relation 'saved_onboarding' does not exist"

## Fixes Applied

### 1. Enhanced Error Detection (Committed)
**File:** `app/api/onboarding/save/route.ts`

- Detects missing table (PostgreSQL error code 42P01)
- Returns helpful error message
- Logs diagnostic information

**Before:**
```json
{
  "error": "Failed to save progress",
  "details": "relation 'saved_onboarding' does not exist"
}
```

**After:**
```json
{
  "error": "Database table not initialized",
  "details": "The saved_onboarding table does not exist. Please contact support.",
  "code": "TABLE_MISSING",
  "instructions": "See SUPABASE_SAVED_ONBOARDING_SETUP.md"
}
```

### 2. Created Setup Guide
**File:** `SUPABASE_SAVED_ONBOARDING_SETUP.md`

Complete instructions for creating the table in Supabase SQL Editor.

### 3. Created Migration File
**File:** `database/migrations/001_add_saved_onboarding.sql`

For future automated deployments.

## MANUAL ACTION REQUIRED

**You must run this SQL in Supabase to fix production:**

1. Go to: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr
2. Click "SQL Editor"
3. Run this SQL:

```sql
CREATE TABLE IF NOT EXISTS saved_onboarding (
  id SERIAL PRIMARY KEY,
  business_name TEXT NOT NULL,
  email TEXT NOT NULL,
  form_data JSONB NOT NULL,
  current_step INTEGER DEFAULT 0,
  last_saved TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_business_email UNIQUE(business_name, email)
);

CREATE INDEX idx_saved_onboarding_lookup ON saved_onboarding(business_name, email);
CREATE INDEX idx_saved_onboarding_email ON saved_onboarding(email);
```

## Verification Steps

After creating the table:

1. **Test production save:**
   - Visit: https://geo-seo-domination-tool-aiij4hzo2-unite-group.vercel.app/onboarding/new
   - Fill form
   - Click "Save Progress"
   - **Expected:** Success message (not 500 error)

2. **Check Vercel logs:**
   ```bash
   vercel logs https://geo-seo-domination-tool-aiij4hzo2-unite-group.vercel.app
   ```
   **Expected:** 200 status (not 500)

3. **Verify data in Supabase:**
   ```sql
   SELECT * FROM saved_onboarding ORDER BY created_at DESC LIMIT 5;
   ```
   **Expected:** See saved form data

## Timeline of Fixes

1. ✅ **11:42 AM** - Fixed database detection logic (commit 0c704c3)
2. ✅ **11:44 AM** - Configured DATABASE_URL in Vercel
3. ✅ **11:44 AM** - Deployed to production
4. ✅ **02:00 PM** - Fixed Server Component errors (commit c4c7737)
5. ✅ **02:15 PM** - Used Playwright to test production
6. ✅ **02:20 PM** - **IDENTIFIED ROOT CAUSE:** Missing table
7. ✅ **02:25 PM** - Added error detection (commit 3dd25d5)
8. ⏳ **AWAITING** - Manual table creation in Supabase

## What Was Fixed vs What Remains

### ✅ Fixed (Deployed to Production)
1. Database connection detection logic
2. DATABASE_URL configured in Vercel
3. Server Component 'use client' directives
4. Enhanced API error handling

### ⚠️ Remaining (Manual Action)
1. Create `saved_onboarding` table in Supabase SQL Editor
2. Test production save functionality
3. Verify data persists

## Why This Wasn't Obvious

**Development works:**
- Uses `database/quick-init.sql`
- Auto-creates all tables including `saved_onboarding`
- No manual setup required

**Production doesn't work:**
- Supabase requires manual table creation
- Schema files exist but were never run
- No auto-migration on deploy

## Related Documentation

- **Setup Guide:** [SUPABASE_SAVED_ONBOARDING_SETUP.md](SUPABASE_SAVED_ONBOARDING_SETUP.md) - Complete setup instructions
- **Database Fix:** [PRODUCTION_DATABASE_FIX.md](PRODUCTION_DATABASE_FIX.md) - Database detection fix
- **Server Component Fix:** [SERVER_COMPONENT_ERROR_ANALYSIS.md](SERVER_COMPONENT_ERROR_ANALYSIS.md) - React errors fixed
- **Environment Setup:** [VERCEL_ENVIRONMENT_SETUP.md](VERCEL_ENVIRONMENT_SETUP.md) - All environment variables

## Commits Made

```
3dd25d5 - fix: Add missing saved_onboarding table detection and error handling
ee20f53 - test: Add Playwright production save test script
c4c7737 - fix: Add 'use client' to remaining Server Components
0c704c3 - fix: Correct database detection logic for Vercel production
```

## Success Criteria

- [x] Root cause identified
- [x] Error detection improved
- [x] Setup guide created
- [ ] Table created in Supabase ⚠️ **MANUAL ACTION NEEDED**
- [ ] Production saves return 200 status
- [ ] Data persists in PostgreSQL

---

**NEXT STEP:** Run the SQL in Supabase SQL Editor to create the table.

**Once complete:** Production saves will work immediately (no redeployment needed).
