# Database Migration Execution Guide
**IMPORTANT:** Run these migrations in Supabase before deploying to production

---

## Quick Start (5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"

### Step 2: Run Migration 003
**Copy and paste this entire SQL block:**

```sql
-- Migration 003: Multi-Tenancy Foundation
-- This migration adds organisation-based multi-tenancy to the application

-- Create organisations table
CREATE TABLE IF NOT EXISTS organisations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT CHECK(plan IN ('free', 'starter', 'pro', 'enterprise')) DEFAULT 'free',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organisation_members table
CREATE TABLE IF NOT EXISTS organisation_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK(role IN ('owner', 'admin', 'member', 'viewer')) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organisation_id, user_id)
);

-- Create default organisation
INSERT INTO organisations (id, name, slug, plan)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Organisation',
  'default',
  'enterprise'
) ON CONFLICT (id) DO NOTHING;

-- Add organisation_id to existing tables
ALTER TABLE companies ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE rankings ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE seo_audits ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE crm_tasks ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE crm_calendar_events ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE crm_projects ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE crm_prompts ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE crm_components ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE crm_ai_tools ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE crm_tutorials ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE scheduled_jobs ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE github_repositories ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE github_website_connections ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);

-- Backfill existing data to default organisation
UPDATE companies SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE keywords SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE rankings SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE seo_audits SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE crm_contacts SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE crm_deals SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE crm_tasks SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE crm_calendar_events SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE crm_projects SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE crm_github_projects SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE crm_prompts SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE crm_components SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE crm_ai_tools SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE crm_tutorials SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organisations_slug ON organisations(slug);
CREATE INDEX IF NOT EXISTS idx_organisation_members_org_id ON organisation_members(organisation_id);
CREATE INDEX IF NOT EXISTS idx_organisation_members_user_id ON organisation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_org_id ON companies(organisation_id);
CREATE INDEX IF NOT EXISTS idx_keywords_org_id ON keywords(organisation_id);
CREATE INDEX IF NOT EXISTS idx_rankings_org_id ON rankings(organisation_id);
CREATE INDEX IF NOT EXISTS idx_seo_audits_org_id ON seo_audits(organisation_id);

-- Enable RLS on new tables
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organisations
CREATE POLICY "Users can view organisations they belong to"
  ON organisations FOR SELECT
  USING (
    id IN (
      SELECT organisation_id FROM organisation_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their organisations"
  ON organisations FOR UPDATE
  USING (
    id IN (
      SELECT organisation_id FROM organisation_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- RLS Policies for organisation_members
CREATE POLICY "Users can view members of their organisations"
  ON organisation_members FOR SELECT
  USING (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can add members"
  ON organisation_members FOR INSERT
  WITH CHECK (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for data tables (companies example - apply to all)
CREATE POLICY "Users can view companies in their organisations"
  ON companies FOR SELECT
  USING (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create companies"
  ON companies FOR INSERT
  WITH CHECK (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Admins can update companies"
  ON companies FOR UPDATE
  USING (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners can delete companies"
  ON companies FOR DELETE
  USING (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
```

**Click "Run" or press F5**

**Expected Result:** `Success. No rows returned`

---

### Step 3: Run Migration 008
**Copy and paste this entire SQL block:**

```sql
-- Migration 008: Auto-Add Users to Organisation
-- This migration creates a trigger to automatically add new users to an organisation

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_org_id UUID;
  new_org_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'free')
  ON CONFLICT (id) DO NOTHING;

  -- Get or create default organisation
  SELECT id INTO default_org_id
  FROM organisations
  WHERE slug = 'default'
  LIMIT 1;

  IF default_org_id IS NULL THEN
    INSERT INTO organisations (id, name, slug, plan)
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      'Default Organisation',
      'default',
      'enterprise'
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO default_org_id;
  END IF;

  -- Create personal organisation for this user
  INSERT INTO organisations (name, slug, plan)
  VALUES (
    COALESCE(NEW.email, 'User') || '''s Organisation',
    'user-' || NEW.id::text,
    'free'
  )
  RETURNING id INTO new_org_id;

  -- Add user as owner of their personal organisation
  INSERT INTO organisation_members (organisation_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner')
  ON CONFLICT (organisation_id, user_id) DO NOTHING;

  -- Also add user as member of default organisation (fallback)
  IF default_org_id IS NOT NULL THEN
    INSERT INTO organisation_members (organisation_id, user_id, role)
    VALUES (default_org_id, NEW.id, 'member')
    ON CONFLICT (organisation_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Click "Run" or press F5**

**Expected Result:** `Success. No rows returned`

---

### Step 4: Verify Migrations

**Run this verification query:**

```sql
-- Verify tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('organisations', 'organisation_members')
ORDER BY table_name;

-- Should return:
-- organisations
-- organisation_members

-- Verify trigger exists
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Should return:
-- on_auth_user_created | users

-- Verify default organisation exists
SELECT id, name, slug, plan
FROM organisations
WHERE slug = 'default';

-- Should return:
-- 00000000-0000-0000-0000-000000000001 | Default Organisation | default | enterprise

-- Check organisation_id columns exist
SELECT column_name, table_name
FROM information_schema.columns
WHERE column_name = 'organisation_id'
  AND table_schema = 'public'
ORDER BY table_name;

-- Should show organisation_id in 17+ tables
```

---

## Verification Test

### Create Test User

1. Go to your application (locally or on Vercel)
2. Click "Sign Up"
3. Enter test credentials:
   - Email: test@example.com
   - Password: TestPassword123!

4. After signup, run this query in Supabase:

```sql
-- Check user was created with organisations
SELECT
  u.id as user_id,
  u.email,
  o.name as organisation_name,
  o.slug as organisation_slug,
  om.role
FROM auth.users u
LEFT JOIN organisation_members om ON om.user_id = u.id
LEFT JOIN organisations o ON o.id = om.organisation_id
WHERE u.email = 'test@example.com';

-- Should return 2 rows:
-- Row 1: test@example.com | test@example.com's Organisation | user-<uuid> | owner
-- Row 2: test@example.com | Default Organisation | default | member
```

---

## Rollback (If Needed)

**Only run if you need to undo the migrations:**

```sql
-- Remove trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Remove policies
DROP POLICY IF EXISTS "Users can view organisations they belong to" ON organisations;
DROP POLICY IF EXISTS "Owners can update their organisations" ON organisations;
DROP POLICY IF EXISTS "Users can view members of their organisations" ON organisation_members;
DROP POLICY IF EXISTS "Owners and admins can add members" ON organisation_members;
DROP POLICY IF EXISTS "Users can view companies in their organisations" ON companies;
DROP POLICY IF EXISTS "Admins can create companies" ON companies;
DROP POLICY IF EXISTS "Admins can update companies" ON companies;
DROP POLICY IF EXISTS "Owners can delete companies" ON companies;

-- Remove organisation_id columns
ALTER TABLE companies DROP COLUMN IF EXISTS organisation_id;
ALTER TABLE keywords DROP COLUMN IF EXISTS organisation_id;
ALTER TABLE rankings DROP COLUMN IF EXISTS organisation_id;
ALTER TABLE seo_audits DROP COLUMN IF EXISTS organisation_id;
ALTER TABLE crm_contacts DROP COLUMN IF EXISTS organisation_id;
ALTER TABLE crm_deals DROP COLUMN IF EXISTS organisation_id;
ALTER TABLE crm_tasks DROP COLUMN IF EXISTS organisation_id;
ALTER TABLE crm_calendar_events DROP COLUMN IF EXISTS organisation_id;
ALTER TABLE crm_projects DROP COLUMN IF EXISTS organisation_id;
ALTER TABLE crm_github_projects DROP COLUMN IF EXISTS organisation_id;
ALTER TABLE crm_prompts DROP COLUMN IF EXISTS organisation_id;
ALTER TABLE crm_components DROP COLUMN IF EXISTS organisation_id;
ALTER TABLE crm_ai_tools DROP COLUMN IF EXISTS organisation_id;
ALTER TABLE crm_tutorials DROP COLUMN IF EXISTS organisation_id;

-- Remove tables
DROP TABLE IF EXISTS organisation_members;
DROP TABLE IF EXISTS organisations;
```

---

## Common Issues

### Issue: "relation organisations does not exist"

**Cause:** Migration 003 hasn't run yet

**Solution:** Run Migration 003 first (Step 2 above)

---

### Issue: "duplicate key value violates unique constraint"

**Cause:** Trying to run migrations twice

**Solution:** Migrations are idempotent - safe to run multiple times. Check if tables already exist:

```sql
SELECT * FROM organisations;
SELECT * FROM organisation_members;
```

---

### Issue: "function handle_new_user() does not exist"

**Cause:** Migration 008 hasn't run yet

**Solution:** Run Migration 008 (Step 3 above)

---

### Issue: New users not getting organisations

**Cause:** Trigger not firing

**Solution:** Verify trigger exists:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

If missing, run Migration 008 again.

---

## Next Steps

After running migrations successfully:

1. ✅ Mark "Execute Supabase schema" as complete
2. ✅ Test user signup flow
3. ✅ Verify organisations are created automatically
4. ✅ Proceed with deployment (see DEPLOYMENT_GUIDE_FINAL.md)

---

**Status:** Ready to Execute ⚡
**Time Required:** 5-10 minutes
**Complexity:** Low (copy-paste SQL)
**Risk:** Minimal (idempotent, can rollback)
