# Onboarding Sessions Table Setup

## Issue

**Error:** `relation "onboarding_sessions" does not exist`

**Endpoint:** `POST /api/onboarding/start`

**Root Cause:** The `onboarding_sessions` table has not been created in the Supabase PostgreSQL database.

## Quick Fix (2 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `qwoggbbavikzhypzodcr`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the SQL Script

Copy and paste this SQL script:

```sql
-- =====================================================
-- Onboarding Sessions Table for PostgreSQL/Supabase
-- =====================================================

CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id TEXT PRIMARY KEY,
  company_id TEXT,

  -- Business Information
  business_name TEXT NOT NULL,
  industry TEXT,
  email TEXT NOT NULL,
  phone TEXT,

  -- Progress Tracking
  status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'completed', 'failed')),
  current_step TEXT,

  -- Request Data (full intake form stored as JSONB in PostgreSQL)
  request_data JSONB,

  -- Step Progress Data (stored as JSONB in PostgreSQL)
  steps_data JSONB,

  -- Error Tracking
  error TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON onboarding_sessions(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_email ON onboarding_sessions(email);
CREATE INDEX IF NOT EXISTS idx_onboarding_created ON onboarding_sessions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust in production)
CREATE POLICY "Allow all operations on onboarding_sessions" ON onboarding_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### Step 3: Execute the Query

1. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
2. Wait for success message: ✅ "Success. No rows returned"
3. Close the SQL Editor

### Step 4: Verify the Table Exists

Run this query to confirm:

```sql
SELECT * FROM onboarding_sessions LIMIT 1;
```

Expected result: Empty result set (no error)

### Step 5: Test the Endpoint

```bash
node /tmp/test-onboarding-start.mjs
```

Or use the production endpoint:
```bash
curl -X POST https://geo-seo-domination-tool.vercel.app/api/onboarding/start \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Company",
    "email": "test@example.com",
    "industry": "Technology",
    "contactName": "Test User",
    "primaryGoals": ["Increase organic traffic"],
    "targetKeywords": ["test"],
    "contentTypes": ["Blog posts"],
    "selectedServices": ["SEO Audit"],
    "contentFrequency": "weekly"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "onboardingId": "onb_xxxxx",
  "message": "Onboarding started successfully"
}
```

## Alternative: Use SQL File

The SQL script is saved in:
```
database/supabase-onboarding-sessions.sql
```

## What This Table Does

The `onboarding_sessions` table tracks the entire client onboarding process:

- **Progress tracking**: Monitors which step the client is on
- **Data storage**: Stores all intake form data as JSONB
- **Status management**: Tracks if onboarding is pending/in progress/completed/failed
- **Error logging**: Records any errors that occur during onboarding
- **Timestamps**: Records when onboarding started and completed

## Related Tables

This table works with:
- `companies` - Links to created company record
- `saved_onboarding` - Temporary progress saves (different purpose)
- `content_calendar` - Generated content plan after onboarding

## Fields Explanation

| Field | Type | Purpose |
|-------|------|---------|
| `id` | TEXT | Unique identifier (e.g., "onb_123abc") |
| `company_id` | TEXT | Links to companies table after creation |
| `business_name` | TEXT | Business name from intake form |
| `industry` | TEXT | Industry/sector |
| `email` | TEXT | Primary contact email |
| `status` | TEXT | pending, in_progress, completed, failed |
| `request_data` | JSONB | Full ClientIntakeData from form |
| `steps_data` | JSONB | Progress for each onboarding step |
| `created_at` | TIMESTAMP | When onboarding started |
| `completed_at` | TIMESTAMP | When onboarding finished |

## Troubleshooting

### Error: "relation companies does not exist"

The `companies` table must exist first. Run:
```sql
-- Check if companies table exists
SELECT * FROM companies LIMIT 1;
```

If it doesn't exist, you need to run the main schema first:
```bash
npm run db:init
```

### Error: "permission denied for table"

Make sure RLS policies are set correctly. The script above includes a permissive policy for development.

### Table Already Exists

If you see "relation already exists", that's OK! The script uses `IF NOT EXISTS` to avoid errors.

## Production Notes

**⚠️ Security Warning:**

The current RLS policy allows ALL operations:
```sql
USING (true) WITH CHECK (true)
```

In production, replace this with proper authentication-based policies:

```sql
-- Example: Only authenticated users can view their own sessions
CREATE POLICY "Users can view own sessions" ON onboarding_sessions
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Example: Only admins can create sessions
CREATE POLICY "Admins can create sessions" ON onboarding_sessions
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

## Next Steps After Setup

1. ✅ Table created
2. ✅ Test endpoint works
3. Complete onboarding workflow will:
   - Create onboarding session
   - Generate company record
   - Run initial SEO audit
   - Create content calendar
   - Set up workspace
   - Send welcome email

---

**File Location:** `database/supabase-onboarding-sessions.sql`
**Created:** 2025-10-10
**Issue:** relation "onboarding_sessions" does not exist
**Fix:** Run SQL script in Supabase SQL Editor
