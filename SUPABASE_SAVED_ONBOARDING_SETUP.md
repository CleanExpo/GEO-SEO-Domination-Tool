# Supabase Setup: saved_onboarding Table

**CRITICAL:** This table is missing in production, causing 500 errors on save API

## Quick Fix (Run Now in Supabase)

1. Go to https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr
2. Click "SQL Editor" in left sidebar
3. Click "New Query"
4. Copy and paste the SQL below
5. Click "Run" or press Ctrl+Enter

```sql
-- Create saved_onboarding table for onboarding progress
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

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_saved_onboarding_lookup
  ON saved_onboarding(business_name, email);

CREATE INDEX IF NOT EXISTS idx_saved_onboarding_email
  ON saved_onboarding(email);

-- Verify table was created
SELECT 'saved_onboarding table created successfully' AS status;

-- Check table structure
\d saved_onboarding


## Verification

After running the SQL:

1. **Check table exists:**
   ```sql
   SELECT tablename
   FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename = 'saved_onboarding';
   ```

2. **Test with sample data:**
   ```sql
   INSERT INTO saved_onboarding (business_name, email, form_data, current_step)
   VALUES ('Test Company', 'test@example.com', '{"step1": "data"}', 1);

   SELECT * FROM saved_onboarding WHERE email = 'test@example.com';

   DELETE FROM saved_onboarding WHERE email = 'test@example.com';
   ```

3. **Test production save API:**
   - Visit: https://geo-seo-domination-tool-aiij4hzo2-unite-group.vercel.app/onboarding/new
   - Fill form
   - Click "Save Progress"
   - Should see success message (not 500 error)

## Why This Was Missing

- ✅ Schema file exists: `database/supabase-saved-onboarding.sql`
- ❌ Schema was never run on Supabase production database
- ✅ Localhost works (uses `database/quick-init.sql` with auto-creation)
- ❌ Production needs manual table creation

## Error Being Fixed

**Before fix:**
```
/api/onboarding/save:1  Failed to load resource: the server responded with a status of 500 ()
```

**Error details (in Vercel logs):**
```
relation "saved_onboarding" does not exist
```

**After fix:**
```
Status: 200 OK
Response: { "success": true, "message": "Progress saved successfully" }
```

## Related Files

- **API Route:** [app/api/onboarding/save/route.ts](app/api/onboarding/save/route.ts)
- **Schema (Supabase):** [database/supabase-saved-onboarding.sql](database/supabase-saved-onboarding.sql)
- **Schema (SQLite):** [database/saved-onboarding-schema.sql](database/saved-onboarding-schema.sql)
- **Quick Init:** [database/quick-init.sql](database/quick-init.sql) (includes this table)

## Supabase Project Details

- **Project:** qwoggbbavikzhypzodcr
- **Region:** ap-southeast-2 (Sydney)
- **Database:** PostgreSQL 15
- **Connection String:** `postgresql://postgres.qwoggbbavikzhypzodcr:3McFC5u51nUOJ2IB@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres`

## Next Steps After Table Creation

1. ✅ Run SQL in Supabase SQL Editor
2. ✅ Verify table exists
3. ✅ Test production save functionality
4. ✅ Confirm data persists
5. ✅ Check Vercel logs show 200 status (not 500)

---

**Status:** AWAITING MANUAL TABLE CREATION IN SUPABASE

**Once complete:** Production saves should work immediately (no redeployment needed)
