-- ============================================================================
-- FIX: Company Creation Issue on Production
-- ============================================================================
-- Issue: Users cannot create companies on production
-- Root Cause: 
--   1. Migration 008 trigger might not be applied (auto-create organisations)
--   2. RLS policy conflict between migration 003 and SUPABASE-07
--   3. Existing users might not have organisation memberships
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Ensure organisations and organisation_members tables exist
-- ============================================================================

CREATE TABLE IF NOT EXISTS organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT CHECK(plan IN ('free', 'starter', 'pro', 'enterprise')) DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organisation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK(role IN ('owner', 'admin', 'member', 'viewer')) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organisation_id, user_id)
);

-- ============================================================================
-- STEP 2: Create default organisation if it doesn't exist
-- ============================================================================

INSERT INTO organisations (id, name, slug, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organisation', 'default', 'enterprise')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 3: Create personal organisations for existing users without them
-- ============================================================================

DO $$
DECLARE
  user_record RECORD;
  new_org_id UUID;
BEGIN
  -- Loop through all users who don't have an organisation membership
  FOR user_record IN 
    SELECT u.id, u.email
    FROM auth.users u
    LEFT JOIN organisation_members om ON u.id = om.user_id
    WHERE om.id IS NULL
  LOOP
    -- Create a personal organisation for this user
    INSERT INTO organisations (name, slug, plan)
    VALUES (
      COALESCE(user_record.email, 'User') || '''s Organisation',
      'user-' || user_record.id::text,
      'free'
    )
    RETURNING id INTO new_org_id;

    -- Add user as owner of their personal organisation
    INSERT INTO organisation_members (organisation_id, user_id, role)
    VALUES (new_org_id, user_record.id, 'owner');

    -- Also add them to default organisation as member (fallback)
    INSERT INTO organisation_members (organisation_id, user_id, role)
    VALUES ('00000000-0000-0000-0000-000000000001', user_record.id, 'member')
    ON CONFLICT (organisation_id, user_id) DO NOTHING;

    RAISE NOTICE 'Created organisation % for user %', new_org_id, user_record.email;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 4: Add organisation_id to companies table if not exists
-- ============================================================================

ALTER TABLE companies ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);

-- Backfill organisation_id for existing companies based on user's organisation
UPDATE companies c
SET organisation_id = (
  SELECT om.organisation_id
  FROM organisation_members om
  WHERE om.user_id = c.user_id
  AND om.role = 'owner'
  LIMIT 1
)
WHERE organisation_id IS NULL;

-- For any remaining companies without organisation, assign to default
UPDATE companies 
SET organisation_id = '00000000-0000-0000-0000-000000000001'
WHERE organisation_id IS NULL;

-- ============================================================================
-- STEP 5: Fix RLS Policies for Companies Table
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own companies" ON companies;
DROP POLICY IF EXISTS "Users can insert own companies" ON companies;
DROP POLICY IF EXISTS "Users can update own companies" ON companies;
DROP POLICY IF EXISTS "Users can delete own companies" ON companies;
DROP POLICY IF EXISTS "Users can view own organisation's companies" ON companies;
DROP POLICY IF EXISTS "Admins can insert companies" ON companies;
DROP POLICY IF EXISTS "Admins can update companies" ON companies;
DROP POLICY IF EXISTS "Owners can delete companies" ON companies;

-- Create unified policies that work with both user_id AND organisation_id

-- SELECT: Users can view their own companies OR companies in their organisations
CREATE POLICY "Users can view companies" ON companies
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    organisation_id IN (
      SELECT organisation_id FROM organisation_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can insert companies if they belong to the organisation
CREATE POLICY "Users can insert companies" ON companies
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND
    (
      organisation_id IN (
        SELECT organisation_id FROM organisation_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'member')
      )
    )
  );

-- UPDATE: Users can update their own companies in their organisations
CREATE POLICY "Users can update companies" ON companies
  FOR UPDATE USING (
    auth.uid() = user_id
    AND
    organisation_id IN (
      SELECT organisation_id FROM organisation_members 
      WHERE user_id = auth.uid()
    )
  );

-- DELETE: Users can delete their own companies in their organisations (if admin/owner)
CREATE POLICY "Users can delete companies" ON companies
  FOR DELETE USING (
    auth.uid() = user_id
    AND
    organisation_id IN (
      SELECT organisation_id FROM organisation_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- STEP 6: Install trigger to auto-create organisations for new users
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_org_id UUID;
  new_org_id UUID;
BEGIN
  -- Create profile for the new user
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'free')
  ON CONFLICT (id) DO NOTHING;

  -- Get the default organisation ID
  SELECT id INTO default_org_id
  FROM organisations
  WHERE slug = 'default'
  LIMIT 1;

  -- If default organisation doesn't exist, create it
  IF default_org_id IS NULL THEN
    INSERT INTO organisations (id, name, slug, plan)
    VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organisation', 'default', 'enterprise')
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO default_org_id;
  END IF;

  -- Create a personal organisation for the new user
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

  -- Also add them as member of default organisation (fallback)
  IF default_org_id IS NOT NULL THEN
    INSERT INTO organisation_members (organisation_id, user_id, role)
    VALUES (default_org_id, NEW.id, 'member')
    ON CONFLICT (organisation_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 7: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_companies_organisation ON companies(organisation_id);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_organisation_members_user ON organisation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organisation_members_org ON organisation_members(organisation_id);

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check organisations created
SELECT COUNT(*) as org_count FROM organisations;

-- Check organisation memberships
SELECT COUNT(*) as membership_count FROM organisation_members;

-- Check users without organisations (should be 0)
SELECT COUNT(*) as users_without_org
FROM auth.users u
LEFT JOIN organisation_members om ON u.id = om.user_id
WHERE om.id IS NULL;

-- Check companies with organisations
SELECT COUNT(*) as companies_with_org FROM companies WHERE organisation_id IS NOT NULL;
SELECT COUNT(*) as companies_without_org FROM companies WHERE organisation_id IS NULL;

-- Test RLS policies (run as authenticated user)
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claim.sub = '<user_id>';
-- SELECT * FROM companies; -- Should return user's companies
