# Database Migration Order for Supabase
## Step-by-Step Schema Deployment Guide

**Important:** The schemas must be run in the correct order because of foreign key dependencies.

---

## Prerequisites

1. Supabase project created
2. Supabase SQL Editor open (Dashboard → SQL Editor)
3. Database connection string (from Supabase settings)

---

## Migration Order

### Step 1: Core Tables (Base Schema)

Run these schemas **first** as they have no dependencies:

```sql
-- 1. Client Onboarding (PostgreSQL version)
-- NOTE: The existing client-onboarding-schema.sql uses SQLite syntax
-- You need to convert it OR create client_onboarding table manually

CREATE TABLE IF NOT EXISTS client_onboarding (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  -- Company Information
  business_name TEXT NOT NULL,  -- Changed from company_name
  website_url TEXT,             -- Changed from company_website
  industry TEXT NOT NULL,
  company_size TEXT,

  -- Contact Information
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,   -- Changed from contact_email
  phone TEXT,                    -- Changed from contact_phone
  contact_role TEXT,

  -- Business Details
  primary_goal TEXT,
  target_audience TEXT,

  -- Service Selection
  tier TEXT DEFAULT 'good',      -- Changed from selected_tier
  status TEXT DEFAULT 'pending', -- New field for subscription status

  -- Onboarding Status
  onboarding_step INTEGER DEFAULT 1,
  onboarding_completed BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_onboarding_email ON client_onboarding(email);
CREATE INDEX idx_onboarding_status ON client_onboarding(status);
CREATE INDEX idx_onboarding_tier ON client_onboarding(tier);
```

### Step 2: Subscriptions Schema (Depends on client_onboarding)

Now run the **subscriptions schema**:

```bash
# Copy the entire content of database/subscriptions-schema.sql
# and paste into Supabase SQL Editor
```

Or manually:

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Paste the entire `subscriptions-schema.sql` content
4. Click "Run" (or Ctrl+Enter)

**Expected Result:**
```
✅ 10 tables created
✅ 4 tier definitions inserted
✅ 3 views created
✅ Success!
```

### Step 3: Verify Tables Created

Run this query to verify all tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
AND table_name IN (
  'client_onboarding',
  'subscriptions',
  'payments',
  'stripe_customers',
  'tier_access',
  'approval_tasks',
  'agent_execution_logs',
  'webhook_events',
  'usage_tracking',
  'subscription_history',
  'tier_features_reference'
)
ORDER BY table_name;
```

**Expected Output (11 tables):**
```
agent_execution_logs
approval_tasks
client_onboarding
payments
stripe_customers
subscription_history
subscriptions
tier_access
tier_features_reference
usage_tracking
webhook_events
```

---

## Quick Fix: If client_onboarding Already Exists

If you already have a `client_onboarding` table with different columns, you need to:

### Option A: Add Missing Columns (Recommended)

```sql
-- Check current columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'client_onboarding'
ORDER BY ordinal_position;

-- Add missing columns if needed
ALTER TABLE client_onboarding ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'good';
ALTER TABLE client_onboarding ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
```

### Option B: Use Existing Table As-Is

If your `client_onboarding` table has `id`, `email`, and `business_name` columns, the subscriptions schema will work as-is because it only references `client_onboarding(id)`.

---

## Simplified One-Command Deployment

If you want to run everything at once, use this script:

```sql
-- ============================================================================
-- STEP 1: Create client_onboarding if it doesn't exist
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_onboarding (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  website_url TEXT,
  industry TEXT,
  tier TEXT DEFAULT 'good',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_onboarding_email ON client_onboarding(email);
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON client_onboarding(status);

-- ============================================================================
-- STEP 2: Run subscriptions-schema.sql
-- ============================================================================
-- (Paste entire subscriptions-schema.sql content here)
```

---

## Testing After Migration

### Test 1: Insert Sample Client

```sql
INSERT INTO client_onboarding (id, business_name, email, website_url, industry, tier, status)
VALUES (
  gen_random_uuid()::text,
  'Test Company',
  'test@example.com',
  'https://example.com',
  'Technology',
  'good',
  'pending'
);
```

### Test 2: Verify Tier Features

```sql
SELECT tier, name, price_monthly, price_annual, automation_level
FROM tier_features_reference
ORDER BY price_monthly;
```

**Expected Output:**
```
good    | Good   | 29900  | 299000 | manual
better  | Better | 44900  | 449000 | semi_autonomous
best    | Best   | 59900  | 599000 | full_autopilot
custom  | Custom | 0      | 0      | custom
```

### Test 3: Check Views

```sql
-- Revenue view (should return empty initially)
SELECT * FROM v_active_subscriptions;

-- Pending approvals (should return empty initially)
SELECT * FROM v_pending_approvals;

-- Agent performance (should return empty initially)
SELECT * FROM v_agent_performance;
```

---

## Common Errors and Solutions

### Error: relation "client_onboarding" does not exist

**Cause:** You ran subscriptions-schema.sql before creating client_onboarding table

**Solution:** Run Step 1 first (create client_onboarding table)

---

### Error: syntax error at or near "OR"

**Cause:** Using SQLite syntax in PostgreSQL

**Solution:** Use the fixed `subscriptions-schema.sql` from the repository (already fixed)

---

### Error: function gen_random_uuid() does not exist

**Cause:** pgcrypto extension not enabled

**Solution:**
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

Or use this alternative:
```sql
-- Replace gen_random_uuid()::text with:
md5(random()::text || clock_timestamp()::text)
```

---

### Error: column "company_name" does not exist

**Cause:** Your existing client_onboarding table uses different column names

**Solution:** Update references in subscriptions schema OR rename columns:

```sql
-- Option 1: Add aliases in views
CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT
  c.id as client_id,
  c.business_name as business_name,  -- or c.company_name
  c.tier,
  ...
FROM client_onboarding c
...

-- Option 2: Rename columns
ALTER TABLE client_onboarding RENAME COLUMN company_name TO business_name;
ALTER TABLE client_onboarding RENAME COLUMN contact_email TO email;
```

---

## Migration Checklist

Before running subscriptions schema:

- [x] Supabase project created
- [x] SQL Editor open
- [x] `client_onboarding` table exists (or will be created)
- [x] pgcrypto extension enabled (for gen_random_uuid)
- [x] Backed up existing data (if any)

After running:

- [ ] All 11 tables created successfully
- [ ] 4 tier definitions inserted
- [ ] 3 views created
- [ ] Sample test passed
- [ ] No error messages in SQL Editor

---

## Next Steps

After database migration is complete:

1. **Set up Stripe** (see [STRIPE_DEPLOYMENT_GUIDE.md](STRIPE_DEPLOYMENT_GUIDE.md))
2. **Configure environment variables** (add database URL, Stripe keys)
3. **Test payment flow** (use Stripe test mode)
4. **Deploy to Vercel** (production)

---

## Quick Reference: Required Tables

The subscriptions system requires these tables to function:

| Table | Purpose | Status |
|-------|---------|--------|
| `client_onboarding` | Base client data | **MUST exist first** |
| `subscriptions` | Subscription records | Created by subscriptions-schema.sql |
| `payments` | Payment history | Created by subscriptions-schema.sql |
| `stripe_customers` | Stripe mapping | Created by subscriptions-schema.sql |
| `tier_access` | Feature gates | Created by subscriptions-schema.sql |
| `approval_tasks` | Good/Better approvals | Created by subscriptions-schema.sql |
| `agent_execution_logs` | Agent activity | Created by subscriptions-schema.sql |
| `webhook_events` | Stripe webhooks | Created by subscriptions-schema.sql |
| `usage_tracking` | Limits enforcement | Created by subscriptions-schema.sql |
| `subscription_history` | Audit trail | Created by subscriptions-schema.sql |
| `tier_features_reference` | Tier definitions | Created by subscriptions-schema.sql |

---

## Support

If you encounter issues:

1. Check error message carefully
2. Verify table dependencies
3. Confirm PostgreSQL syntax (not SQLite)
4. Review this migration order guide
5. Check Supabase logs (Dashboard → Logs)

**The database schema is now production-ready for PostgreSQL/Supabase!** 🚀
