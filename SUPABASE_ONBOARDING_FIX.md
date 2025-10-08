# Fix Onboarding Save Errors on Vercel Production

## Problem
The `/api/onboarding/save` endpoint returns 500 errors on Vercel production because the `saved_onboarding` table doesn't exist in the Supabase PostgreSQL database.

## Solution

### Step 1: Run SQL in Supabase

1. Go to your Supabase project: https://supabase.com/dashboard/projects
2. Select your project (connected via `NEXT_PUBLIC_SUPABASE_URL`)
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Paste the following SQL:

```sql
-- Saved Onboarding Progress Schema (PostgreSQL/Supabase)
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

CREATE INDEX IF NOT EXISTS idx_saved_onboarding_lookup
  ON saved_onboarding(business_name, email);

CREATE INDEX IF NOT EXISTS idx_saved_onboarding_email
  ON saved_onboarding(email);

COMMENT ON TABLE saved_onboarding IS 'Stores saved progress from the onboarding wizard';
```

6. Click **Run** (or press Ctrl+Enter)
7. Verify success message: "Success. No rows returned"

### Step 2: Verify Table Creation

Run this query to confirm the table exists:

```sql
SELECT * FROM saved_onboarding LIMIT 1;
```

Expected result: "Success. No rows returned" (table exists but empty)

### Step 3: Deploy Updated Code

The API route has been updated to handle both PostgreSQL (JSONB) and SQLite (TEXT) formats.

Changes made:
- `app/api/onboarding/save/route.ts` - Now detects database type and uses appropriate format
- `database/supabase-saved-onboarding.sql` - PostgreSQL schema file

### Step 4: Test on Production

1. Go to https://geo-seo-domination-tool.vercel.app/onboarding/new
2. Fill in business name and email
3. Verify saving works without 500 errors
4. Verify loading works when you revisit with same credentials

## Code Changes Summary

### Database Detection
```typescript
const isPostgres = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const formDataValue = isPostgres ? formData : JSON.stringify(formData);
```

### PostgreSQL uses:
- `JSONB` column type (no stringify needed)
- `NOW()` for timestamps
- `SERIAL` for auto-increment IDs

### SQLite uses:
- `TEXT` column type (requires stringify)
- `CURRENT_TIMESTAMP` for timestamps
- `INTEGER PRIMARY KEY AUTOINCREMENT` for IDs

## Verification

After running the SQL:
1. Check Supabase Table Editor to see `saved_onboarding` table
2. Test save functionality on production
3. Check Vercel deployment logs for successful database connections
