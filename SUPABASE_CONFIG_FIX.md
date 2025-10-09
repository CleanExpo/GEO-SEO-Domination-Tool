# Supabase Configuration Fix - qwoggbbavikzhypzodcr

**Production Project Confirmed**: `qwoggbbavikzhypzodcr`
**Date**: 2025-10-09
**Status**: ⚠️ **REQUIRES IMMEDIATE ACTION**

---

## Problem Analysis

### Current State

Your Vercel environment has **TWO different Supabase projects** configured:

**✅ Correct Project**: `qwoggbbavikzhypzodcr` (3 variables)
```
NEXT_PUBLIC_SUPABASE_URL=https://qwoggbbavikzhypzodcr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
POSTGRES_URL=postgresql://postgres.qwoggbbavikzhypzodcr:3McFC5u51nUOJ2IB@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres
```

**❌ Wrong Project**: `vgjkdsmlvffblaghywlk` (8 variables)
```
POSTGRES_POSTGRES_HOST=db.vgjkdsmlvffblaghywlk.supabase.co
POSTGRES_POSTGRES_URL=postgres://postgres.vgjkdsmlvffblaghywlk:...
POSTGRES_POSTGRES_PRISMA_URL=postgres://postgres.vgjkdsmlvffblaghywlk:...
POSTGRES_POSTGRES_URL_NON_POOLING=postgres://postgres.vgjkdsmlvffblaghywlk:...
POSTGRES_POSTGRES_PASSWORD=HIA1BiDLjsmjlVG1
POSTGRES_SUPABASE_URL=https://vgjkdsmlvffblaghywlk.supabase.co
POSTGRES_SUPABASE_JWT_SECRET=6PFs923/8wZJ3q2Z4ZezKJKmDThKv4hkQvc4y6BquPmaNWccR7o4BmjNcCFpfVoJfabmQpJDQYrmdKNYTaM0XA==
POSTGRES_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnamtkc21sdmZmYmxhZ2h5d2xrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkxODQ4MiwiZXhwIjoyMDc1NDk0NDgyfQ.0Xerj39HlLd9XYc2XF7vjuRz33JWadyzHgW10wMm4bs
```

### The Issue

Your application code uses `DATABASE_URL` (pointing to `qwoggbbavikzhypzodcr`), but the **DATABASE_URL was just added 7 hours ago**. The production error "Tenant or user not found" suggests the connection string may be invalid.

**Current DATABASE_URL**:
```
postgresql://postgres.qwoggbbavikzhypzodcr:3McFC5u51nUOJ2IB@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres
```

**Possible causes**:
1. Password `3McFC5u51nUOJ2IB` is incorrect or expired
2. Database host changed
3. Connection pooling configuration incorrect
4. Database doesn't exist or was deleted

---

## Solution: Get Fresh Connection String

### Step 1: Visit Supabase Dashboard

Go to your production project:
```
https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/settings/database
```

### Step 2: Get Connection String

In the **Database Settings** page, find the **Connection String** section.

Copy the **Connection pooling** string (recommended for serverless):

**Format**:
```
postgresql://postgres.qwoggbbavikzhypzodcr:[YOUR-PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres
```

**Note**:
- Port should be **6543** (pooler) not 5432 (direct)
- Replace `[YOUR-PASSWORD]` with actual database password

### Step 3: Update DATABASE_URL in Vercel

Visit Vercel environment variables:
```
https://vercel.com/unite-group/geo-seo-domination-tool/settings/environment-variables
```

**Update DATABASE_URL**:
1. Find `DATABASE_URL` in the list
2. Click **Edit**
3. Replace with new connection string from Step 2
4. Select environments: **Production**, **Preview**, **Development**
5. Click **Save**

### Step 4: Remove Wrong Project Variables (Optional but Recommended)

Delete these 8 variables for the wrong project (`vgjkdsmlvffblaghywlk`):

```bash
vercel env rm POSTGRES_POSTGRES_HOST --yes
vercel env rm POSTGRES_POSTGRES_URL --yes
vercel env rm POSTGRES_POSTGRES_PRISMA_URL --yes
vercel env rm POSTGRES_POSTGRES_URL_NON_POOLING --yes
vercel env rm POSTGRES_POSTGRES_USER --yes
vercel env rm POSTGRES_POSTGRES_PASSWORD --yes
vercel env rm POSTGRES_POSTGRES_DATABASE --yes
vercel env rm POSTGRES_SUPABASE_URL --yes
vercel env rm POSTGRES_SUPABASE_JWT_SECRET --yes
vercel env rm POSTGRES_SUPABASE_SERVICE_ROLE_KEY --yes
```

**Why remove them?**
- They point to wrong database
- May cause confusion in the future
- Reduces attack surface

### Step 5: Get Service Role Key (For Backend Operations)

While in Supabase dashboard (`qwoggbbavikzhypzodcr`):

1. Go to: **Settings** → **API**
2. Find **Project API keys** section
3. Copy the **service_role** key (secret, for server-side only)

**Add to Vercel** (if not already set for correct project):
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3b2dnYmJhdmlremh5cHpvZGNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM2NjgxOSwiZXhwIjoyMDc0OTQyODE5fQ.[REST-OF-TOKEN]
Environments: Production, Preview, Development
```

### Step 6: Redeploy

After updating environment variables:

```bash
git commit --allow-empty -m "chore: Trigger redeploy after DATABASE_URL fix"
git push origin main
```

Or use Vercel CLI:
```bash
vercel --prod
```

### Step 7: Verify Fix

After redeployment completes, test the API:

```bash
node scripts/test-onboarding-api.js
```

**Expected result** (after DATABASE_URL is fixed):
```json
{
  "error": "Database table not initialized",
  "details": "The saved_onboarding table does not exist",
  "code": "TABLE_MISSING"
}
```

This error is **progress!** It means database connection works, now you just need to create the table.

---

## What Happens Next

### After DATABASE_URL is Fixed

You'll see the **next error**: Missing `saved_onboarding` table.

**Fix**: Run this SQL in Supabase SQL Editor:

```sql
-- Create saved_onboarding table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_onboarding_lookup
  ON saved_onboarding(business_name, email);

CREATE INDEX IF NOT EXISTS idx_saved_onboarding_last_saved
  ON saved_onboarding(last_saved DESC);

-- Create bytebot_tasks table (for Bytebot integration)
CREATE TABLE IF NOT EXISTS bytebot_tasks (
  id SERIAL PRIMARY KEY,
  bytebot_task_id TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  task_type TEXT NOT NULL,
  priority TEXT NOT NULL,

  -- Foreign keys (optional - can be NULL if not associated)
  company_id INTEGER,
  onboarding_id TEXT,
  audit_id INTEGER,

  -- Task metadata
  metadata JSONB,
  status TEXT NOT NULL DEFAULT 'PENDING',

  -- Results
  result JSONB,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT fk_bytebot_company FOREIGN KEY (company_id)
    REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_bytebot_audit FOREIGN KEY (audit_id)
    REFERENCES audits(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bytebot_tasks_status
  ON bytebot_tasks(status);
CREATE INDEX IF NOT EXISTS idx_bytebot_tasks_created
  ON bytebot_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bytebot_tasks_company
  ON bytebot_tasks(company_id);
```

---

## Correct Environment Variables for Production

After cleanup, you should have **only these** Supabase-related variables:

### Required (Primary)
```
DATABASE_URL                      = postgresql://postgres.qwoggbbavikzhypzodcr:[PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres
NEXT_PUBLIC_SUPABASE_URL          = https://qwoggbbavikzhypzodcr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3b2dnYmJhdmlremh5cHpvZGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjY4MTksImV4cCI6MjA3NDk0MjgxOX0.VXYF4vR9bO5kMzWNun52G9oM8K7p3jvavhiaYLvfD8o
```

### Optional (If Needed)
```
SUPABASE_SERVICE_ROLE_KEY         = eyJ... (service_role key for qwoggbbavikzhypzodcr)
SUPABASE_JWT_SECRET               = (JWT secret for qwoggbbavikzhypzodcr)
POSTGRES_URL                      = (alias for DATABASE_URL, can keep for compatibility)
```

---

## Code Changes Required

### Update lib/db.ts (If Needed)

Your current code detects database via:
```typescript
const pgConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
```

This is correct! It will use `DATABASE_URL` first, which is the right variable.

**No code changes needed** - just fix the environment variable.

---

## Verification Checklist

After applying all fixes:

### 1. Database Connection
- [ ] DATABASE_URL updated in Vercel with correct connection string
- [ ] Connection string uses port **6543** (pooler)
- [ ] Password is current and valid
- [ ] Points to `qwoggbbavikzhypzodcr` project

### 2. Environment Variables
- [ ] Wrong project variables removed (`vgjkdsmlvffblaghywlk`)
- [ ] Only `qwoggbbavikzhypzodcr` variables remain
- [ ] NEXT_PUBLIC_SUPABASE_URL matches project
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY matches project

### 3. Deployment
- [ ] Application redeployed after env var changes
- [ ] Build completed successfully
- [ ] No deployment errors

### 4. API Testing
- [ ] Test endpoint: POST /api/onboarding/save
- [ ] Response is either 200 OK or "TABLE_MISSING" error
- [ ] No "Tenant or user not found" error

### 5. Database Tables
- [ ] `saved_onboarding` table created in Supabase
- [ ] `bytebot_tasks` table created in Supabase
- [ ] Both tables show in Supabase Table Editor

### 6. End-to-End Test
- [ ] Visit https://geo-seo-domination-tool.vercel.app/onboarding/new
- [ ] Fill out form and click "Save Progress"
- [ ] No errors in browser console
- [ ] Success message appears
- [ ] Data persists after page refresh

---

## Quick Commands Reference

### Get Supabase Connection String
```bash
# Visit dashboard
open https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/settings/database
```

### Update Environment Variable
```bash
# Using Vercel CLI
vercel env add DATABASE_URL production

# Or use dashboard
open https://vercel.com/unite-group/geo-seo-domination-tool/settings/environment-variables
```

### Test Database Connection
```bash
# Test connection string locally
psql "postgresql://postgres.qwoggbbavikzhypzodcr:[PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres"

# Or test via Node.js
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: 'postgresql://postgres.qwoggbbavikzhypzodcr:[PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres', ssl: { rejectUnauthorized: false } }); pool.query('SELECT NOW()').then(res => { console.log('✅ Connected:', res.rows[0]); pool.end(); }).catch(err => { console.error('❌ Error:', err.message); pool.end(); });"
```

### Redeploy
```bash
git commit --allow-empty -m "chore: Trigger redeploy"
git push origin main
```

### Test API
```bash
node scripts/test-onboarding-api.js
```

---

## Common Issues & Solutions

### Issue 1: "Invalid password" error
**Solution**: Reset database password in Supabase dashboard and update DATABASE_URL

### Issue 2: "Connection timeout"
**Solution**: Ensure using port 6543 (pooler) not 5432 (direct connection)

### Issue 3: "SSL connection required"
**Solution**: Add `?sslmode=require` to connection string

### Issue 4: Still getting "Tenant or user not found"
**Solution**: Double-check you're using the **connection pooling** string, not direct connection

### Issue 5: Tables still missing after deployment
**Solution**: Run SQL script directly in Supabase SQL Editor (not via application)

---

## Summary

**Your production project**: `qwoggbbavikzhypzodcr`

**Actions required**:
1. ✅ **Get fresh connection string** from Supabase dashboard
2. ✅ **Update DATABASE_URL** in Vercel (port 6543, correct password)
3. ✅ **Remove wrong project variables** (vgjkdsmlvffblaghywlk)
4. ✅ **Redeploy** application
5. ✅ **Create tables** in Supabase SQL Editor
6. ✅ **Test** production API

**Time estimate**: 10-15 minutes

**Priority**: 🔴 **CRITICAL** - Blocks all onboarding functionality

---

## Related Documentation

- [SECURITY_AUDIT_2025-10-09.md](SECURITY_AUDIT_2025-10-09.md) - Complete security audit
- [PRODUCTION_ERROR_ANALYSIS_2025-10-09.md](PRODUCTION_ERROR_ANALYSIS_2025-10-09.md) - Detailed error analysis
- [PRODUCTION_ERROR_SUMMARY.md](PRODUCTION_ERROR_SUMMARY.md) - Quick reference
- [PRODUCTION_ISSUE_ANALYSIS.md](PRODUCTION_ISSUE_ANALYSIS.md) - Original issue documentation

---

**Status**: ⏳ **AWAITING USER ACTION**
**Last Updated**: 2025-10-09
**Next Review**: After DATABASE_URL is updated and tested
