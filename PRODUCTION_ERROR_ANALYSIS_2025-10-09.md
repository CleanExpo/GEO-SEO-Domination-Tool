# Production Error Analysis - October 9, 2025

**URL**: https://geo-seo-domination-tool.vercel.app/onboarding/new
**Endpoint**: POST /api/onboarding/save
**Date**: 2025-10-09
**Status**: ❌ **500 Internal Server Error**

---

## 🔍 Error Details

### API Response
```json
{
  "error": "Failed to save progress",
  "details": "Tenant or user not found",
  "code": "XX000"
}
```

### Error Analysis

**PostgreSQL Error Code: XX000**
- **Meaning**: "Internal Error" - Generic PostgreSQL internal error
- **Common Cause**: Database connection failure, authentication error, or missing permissions
- **Context**: Error occurs during `db.initialize()` in `/app/api/onboarding/save/route.ts:24`

**Error Message: "Tenant or user not found"**
- This is a PostgreSQL authentication/connection error
- Occurs when the database client cannot connect to the PostgreSQL server
- Suggests either:
  1. Missing or incorrect `DATABASE_URL` / `POSTGRES_URL` environment variable
  2. Invalid database credentials
  3. Database does not exist
  4. User/role does not have permissions

---

## 🧪 Test Results

### Test Command
```bash
node scripts/test-onboarding-api.js
```

### Results
- **Status Code**: 500 ❌
- **Error**: "Tenant or user not found"
- **Code**: XX000
- **Source**: Database initialization failure (lib/db.ts:89-94)

### Code Flow
1. Request hits `/api/onboarding/save`
2. Route calls `getDatabase()` → creates new `DatabaseClient`
3. Calls `db.initialize()` → attempts PostgreSQL connection
4. `pgPool.connect()` fails with "Tenant or user not found"
5. Error bubbles up to route handler
6. Returns 500 response with generic error message

---

## 🔧 Root Cause

### Primary Issue: Missing or Invalid Database Environment Variable

**Evidence**:
1. ✅ Code properly detects PostgreSQL vs SQLite via `process.env.DATABASE_URL || process.env.POSTGRES_URL`
2. ❌ PostgreSQL connection fails with authentication error
3. ✅ Local development works (uses SQLite)
4. ❌ Production fails (attempts PostgreSQL but can't connect)

**Diagnosis**: The `DATABASE_URL` or `POSTGRES_URL` environment variable in Vercel is either:
- Not set
- Set to invalid/expired credentials
- Points to a database that doesn't exist
- Uses credentials that don't have proper permissions

---

## 📊 Environment Variable Check

### Expected Format
```bash
# PostgreSQL connection string format
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# OR Supabase format
DATABASE_URL="postgresql://postgres.qwoggbbavikzhypzodcr:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
```

### Vercel Environment Variables

**Check at**: https://vercel.com/unite-group/geo-seo-domination-tool/settings/environment-variables

Required variables for database:
- `DATABASE_URL` or `POSTGRES_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

---

## 🛠️ Fix Instructions

### Step 1: Get Supabase Connection String

1. Visit Supabase Dashboard: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr
2. Navigate to: **Settings** → **Database**
3. Find **Connection String** section
4. Copy the **Connection Pooling** string (URI format)
5. Replace `[YOUR-PASSWORD]` with your actual database password

Example:
```
postgresql://postgres.qwoggbbavikzhypzodcr:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

### Step 2: Set Environment Variable in Vercel

1. Visit Vercel Project Settings:
   ```
   https://vercel.com/unite-group/geo-seo-domination-tool/settings/environment-variables
   ```

2. Add or update `DATABASE_URL`:
   - **Key**: `DATABASE_URL`
   - **Value**: `postgresql://postgres.qwoggbbavikzhypzodcr:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres`
   - **Environments**: Select **Production**, **Preview**, **Development**

3. Click **Save**

### Step 3: Redeploy

After setting environment variable, trigger a new deployment:

**Option A: Git Push (Recommended)**
```bash
git commit --allow-empty -m "chore: Trigger redeployment after DATABASE_URL fix"
git push origin main
```

**Option B: Vercel CLI**
```bash
vercel --prod
```

**Option C: Vercel Dashboard**
- Go to Deployments tab
- Click **...** next to latest deployment
- Select **Redeploy**

### Step 4: Test Again

After redeployment completes:
```bash
node scripts/test-onboarding-api.js
```

Expected successful response:
```json
{
  "success": true,
  "message": "Progress saved successfully"
}
```

---

## 🔐 Security Notes

### Environment Variable Security

**Current Risk**: If `DATABASE_URL` is not set, the application falls back to SQLite in production, which:
- Won't persist data across serverless function invocations
- Could cause data loss
- Affects all database operations

**Best Practice**:
1. Never commit database credentials to git
2. Use Vercel environment variables for secrets
3. Use connection pooling for PostgreSQL (Supabase Pooler)
4. Enable SSL for production database connections

### Password Management

If you don't know the Supabase database password:
1. Visit: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/settings/database
2. Click **Reset database password**
3. Generate new password
4. Update `DATABASE_URL` in Vercel
5. Redeploy

---

## 📋 Related Issues

### Issue 1: Missing `saved_onboarding` Table (Secondary)

**Status**: ⚠️ **Will appear after DATABASE_URL fix**

Once database connection is working, you'll encounter the missing table error:
```json
{
  "error": "Database table not initialized",
  "details": "The saved_onboarding table does not exist. Please contact support.",
  "code": "TABLE_MISSING"
}
```

**Fix**: Run SQL in Supabase SQL Editor (see [PRODUCTION_ISSUE_ANALYSIS.md](PRODUCTION_ISSUE_ANALYSIS.md))

### Issue 2: Bytebot Integration (Unrelated)

The Bytebot integration completed in commit `87e589e` requires Docker and won't work on Vercel serverless. This is expected and documented.

---

## 🧪 Verification Checklist

After applying fixes:

### Database Connection
- [ ] `DATABASE_URL` set in Vercel environment variables
- [ ] Connection string uses correct format
- [ ] Password is correct and not expired
- [ ] SSL mode is enabled (`?sslmode=require`)
- [ ] Deployment succeeds without errors

### API Endpoint
- [ ] `/api/onboarding/save` returns 200 (or TABLE_MISSING error)
- [ ] No "Tenant or user not found" errors
- [ ] Database connection initializes successfully
- [ ] Logs show "✓ Connected to PostgreSQL database"

### Full Flow
- [ ] Create `saved_onboarding` table in Supabase
- [ ] Test POST `/api/onboarding/save` - returns success
- [ ] Test GET `/api/onboarding/save?businessName=Test&email=test@example.com` - returns data
- [ ] Frontend form auto-save works
- [ ] "Load Saved Progress" button works

---

## 📊 Error Hierarchy

```
1. DATABASE_URL missing/invalid (Current Error)
   ↓ Fix: Set correct DATABASE_URL in Vercel
   ↓
2. PostgreSQL connection succeeds
   ↓
3. saved_onboarding table missing (Next Error)
   ↓ Fix: Run SQL in Supabase
   ↓
4. Table created successfully
   ↓
5. ✅ API fully functional
```

---

## 🔗 Quick Links

- **Vercel Project**: https://vercel.com/unite-group/geo-seo-domination-tool
- **Environment Variables**: https://vercel.com/unite-group/geo-seo-domination-tool/settings/environment-variables
- **Supabase Project**: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr
- **Database Settings**: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/settings/database
- **Production URL**: https://geo-seo-domination-tool.vercel.app/onboarding/new

---

## 📝 Summary

| Item | Status | Action Required |
|------|--------|-----------------|
| **Database Connection** | ❌ Failed | Set `DATABASE_URL` in Vercel |
| **Environment Variables** | ⚠️ Missing/Invalid | Add PostgreSQL connection string |
| **Supabase Credentials** | ❓ Unknown | Verify or reset password |
| **Table Creation** | ⏳ Pending | Run after database connection fixed |
| **API Functionality** | ❌ Broken | Will work after both fixes applied |

---

## 🎯 Next Steps

### Immediate (Do Now)
1. ✅ Check Vercel environment variables for `DATABASE_URL`
2. ✅ Get Supabase connection string with valid password
3. ✅ Set `DATABASE_URL` in Vercel (all environments)
4. ✅ Redeploy application
5. ✅ Test API endpoint

### After DATABASE_URL Fix
6. ⏳ Create `saved_onboarding` table in Supabase SQL Editor
7. ⏳ Create `bytebot_tasks` table (if using Bytebot)
8. ⏳ Test full onboarding flow
9. ⏳ Verify auto-save functionality

---

**Status**: ⏳ **AWAITING USER ACTION**
**Priority**: 🔴 **CRITICAL** - Blocks all onboarding functionality
**Estimated Fix Time**: 5-10 minutes (once credentials obtained)

