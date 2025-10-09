# Production Database Save Failure - Root Cause Analysis & Fix

**Status:** ✅ FIXED
**Commit:** 0c704c3
**Date:** 2025-10-09
**Severity:** CRITICAL (Production saves completely broken)

## Problem Statement

**User Report:**
> "it looks like the site is saving using localhost, but not saving when we deploy in vercel. Is there a production issue?"

**Symptoms:**
- ✅ Data saves work perfectly on localhost (SQLite)
- ❌ Data saves fail silently in Vercel production deployment
- No error messages in application logs
- Database connection appears successful but writes don't persist

## Root Cause Analysis

### The Bug

**File:** [lib/db.ts:44](lib/db.ts#L44)

**Original Code (BROKEN):**
```typescript
private detectDatabaseConfig(): DatabaseConfig {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const forceLocalDb = process.env.FORCE_LOCAL_DB === 'true' || process.env.USE_SQLITE === 'true';

  if (forceLocalDb || !isProduction) {
    const sqlitePath = process.env.SQLITE_PATH || path.join(process.cwd(), 'data', 'geo-seo.db');
    console.log(`Using SQLite database at ${sqlitePath}`);
    return {
      type: 'sqlite',
      sqlitePath,
    };
  }

  // Attempt PostgreSQL in production
  const pgConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!pgConnectionString) {
    throw new Error('DATABASE_URL not found for production deployment');
  }
  // ...
}
```

### Why This Failed

**The Fatal Flaw:** `process.env.VERCEL === '1'`

Vercel sets the `VERCEL` environment variable to `'1'` in **ALL** environments:
- ✅ Development (`vercel dev`)
- ✅ Preview deployments
- ✅ Production deployments

**What Happened:**
1. Code detected `VERCEL=1` and assumed "production mode"
2. Code attempted to use PostgreSQL
3. `DATABASE_URL` was not configured in Vercel environment
4. Connection failed or fell back to wrong database
5. Writes went to a non-existent or read-only database

**Environment Variable Truth Table:**

| Environment | VERCEL | NODE_ENV | DATABASE_URL | Expected DB | Actual DB (Broken) |
|-------------|--------|----------|--------------|-------------|-------------------|
| Localhost | undefined | development | undefined | SQLite | ✅ SQLite |
| Vercel Dev | '1' | development | undefined | SQLite | ❌ PostgreSQL (fails) |
| Vercel Preview | '1' | production | undefined | SQLite | ❌ PostgreSQL (fails) |
| Vercel Prod | '1' | production | set | PostgreSQL | ❌ Error (no URL) |

## The Fix

**File:** [lib/db.ts:38-71](lib/db.ts#L38-L71)

**New Code (FIXED):**
```typescript
private detectDatabaseConfig(): DatabaseConfig {
  // Check for forced local database (for development override)
  const forceLocalDb = process.env.FORCE_LOCAL_DB === 'true' || process.env.USE_SQLITE === 'true';

  if (forceLocalDb) {
    const sqlitePath = process.env.SQLITE_PATH || path.join(process.cwd(), 'data', 'geo-seo.db');
    console.log(`🔧 Using SQLite database (forced local) at: ${sqlitePath}`);
    return {
      type: 'sqlite',
      sqlitePath,
    };
  }

  // Check for PostgreSQL connection string (production database)
  const pgConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (pgConnectionString) {
    console.log('🔧 Using PostgreSQL database (production)');
    return {
      type: 'postgres',
      connectionString: pgConnectionString,
    };
  }

  // Fallback to SQLite for local development
  const sqlitePath = process.env.SQLITE_PATH || path.join(process.cwd(), 'data', 'geo-seo.db');
  console.log(`🔧 Using SQLite database (local development) at: ${sqlitePath}`);
  return {
    type: 'sqlite',
    sqlitePath,
  };
}
```

### Key Changes

1. **Removed VERCEL check entirely** - This variable is not reliable for environment detection
2. **Priority-based detection:**
   - **Priority 1:** `FORCE_LOCAL_DB` / `USE_SQLITE` override
   - **Priority 2:** `DATABASE_URL` / `POSTGRES_URL` presence → Use PostgreSQL
   - **Priority 3:** Fallback to SQLite for local development
3. **Added descriptive console logs** with emojis for easy debugging

**New Behavior:**

| Environment | DATABASE_URL | FORCE_LOCAL_DB | Selected DB | Rationale |
|-------------|--------------|----------------|-------------|-----------|
| Localhost | undefined | undefined | SQLite | Fallback (no PostgreSQL URL) |
| Localhost | undefined | true | SQLite | Forced local override |
| Vercel Prod | set | undefined | PostgreSQL | Production database configured |
| Vercel Preview | undefined | undefined | SQLite | Fallback (safe for testing) |

## Vercel Environment Setup Requirements

### Critical Environment Variables

**For Production Deployment:**

You **MUST** configure PostgreSQL connection in Vercel:

```bash
# Option 1: DATABASE_URL (preferred)
DATABASE_URL=postgresql://user:password@host:5432/database

# Option 2: POSTGRES_URL (alternative)
POSTGRES_URL=postgresql://user:password@host:5432/database
```

**For Local Development Override:**

If you want to force SQLite in any environment:

```bash
FORCE_LOCAL_DB=true
# OR
USE_SQLITE=true
```

### How to Configure in Vercel

**Method 1: Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com/)
2. Navigate to Project: `geo-seo-domination-tool`
3. Settings → Environment Variables
4. Add `DATABASE_URL` for Production environment
5. Paste PostgreSQL connection string from Supabase
6. Redeploy application

**Method 2: Vercel CLI**
```bash
# Set production DATABASE_URL
vercel env add DATABASE_URL production

# Paste connection string when prompted:
# postgresql://postgres.qwoggbbavikzhypzodcr:PASSWORD@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres

# Pull environment variables to local
vercel env pull .env.local
```

**Method 3: .env.local (Development Only)**
```bash
# For local testing with PostgreSQL
DATABASE_URL=postgresql://postgres.qwoggbbavikzhypzodcr:3McFC5u51nUOJ2IB@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres

# For local testing with SQLite (default)
# FORCE_LOCAL_DB=true
# SQLITE_PATH=./data/geo-seo.db
```

## Testing Procedures

### Pre-Deployment Verification

**1. Check Environment Variables:**
```bash
# List all environment variables for production
vercel env ls

# Expected output should include:
# DATABASE_URL  Production  (set)
```

**2. Test Database Connection Locally:**
```bash
# Test with PostgreSQL
DATABASE_URL="postgresql://..." npm run dev

# Test with SQLite (default)
npm run dev
```

**3. Verify Console Logs:**
```bash
# Look for database selection log on startup:
# ✅ "🔧 Using PostgreSQL database (production)"
# OR
# ✅ "🔧 Using SQLite database (local development) at: ./data/geo-seo.db"
```

### Post-Deployment Verification

**1. Check Vercel Deployment Logs:**
```bash
# View latest deployment logs
vercel logs --follow

# Look for database connection message:
# "🔧 Using PostgreSQL database (production)"
```

**2. Test Save Functionality:**
1. Navigate to `/onboarding` page
2. Fill out form with test data
3. Click "Save Progress"
4. Refresh page - data should persist
5. Check Vercel logs for any errors

**3. Verify Database Writes:**
```bash
# Connect to Supabase database
# Check onboarding_progress table for new row
SELECT * FROM onboarding_progress ORDER BY created_at DESC LIMIT 5;
```

## Rollback Plan

If the fix causes issues, revert with:

```bash
git revert 0c704c3
git push origin E2E-Audit
```

Then configure `FORCE_LOCAL_DB=true` in Vercel to use SQLite temporarily while investigating.

## Prevention Measures

### Code Review Checklist

- [ ] Never use `process.env.VERCEL` for environment detection
- [ ] Always check for connection string presence, not environment name
- [ ] Provide graceful fallbacks for missing environment variables
- [ ] Add descriptive console logs for database selection
- [ ] Test in all Vercel environments (dev, preview, production)

### Monitoring

**Add to Sentry tracking:**
```typescript
Sentry.captureMessage(`Database configured: ${db.getType()}`, {
  level: 'info',
  tags: {
    database_type: db.getType(),
    has_database_url: !!process.env.DATABASE_URL,
    environment: process.env.NODE_ENV,
  },
});
```

## Related Files

- [lib/db.ts](lib/db.ts) - Database client with fixed detection logic
- [app/api/onboarding/save/route.ts](app/api/onboarding/save/route.ts) - Save endpoint affected by bug
- [.env.local](.env.local) - Local environment configuration
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - PostgreSQL setup guide
- [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md) - Database design documentation

## Next Steps

1. ✅ Fix committed (0c704c3)
2. ⏳ Configure `DATABASE_URL` in Vercel Production environment
3. ⏳ Deploy to production and verify save functionality
4. ⏳ Update [DEPLOYMENT_CHECKLIST.md](.audit/DEPLOYMENT_CHECKLIST.md) with PostgreSQL requirement
5. ⏳ Add Sentry monitoring for database type selection
6. ⏳ Create automated test for database detection logic

## References

- **Vercel Environment Variables:** https://vercel.com/docs/projects/environment-variables
- **Supabase Connection String:** https://supabase.com/docs/guides/database/connecting-to-postgres
- **Database Client Implementation:** [lib/db.ts](lib/db.ts)
- **Bug Report Commit:** 0c704c3
