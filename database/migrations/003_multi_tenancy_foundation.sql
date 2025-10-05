-- Migration: 003_multi_tenancy_foundation.sql
-- Purpose: Add multi-tenancy foundation with organisations table and RLS policies
-- Author: Orchestra-Coordinator (Agent-Tenancy)
-- Date: 2025-10-05
-- Ticket: TENANT-001

-- ============================================================================
-- UP MIGRATION
-- ============================================================================

BEGIN;

-- Create organisations table
CREATE TABLE IF NOT EXISTS organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT CHECK(plan IN ('free', 'starter', 'pro', 'enterprise')) DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organisation_members table (role-based access control)
CREATE TABLE IF NOT EXISTS organisation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK(role IN ('owner', 'admin', 'member', 'viewer')) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organisation_id, user_id)
);

-- Add organisation_id to existing tables
-- Core SEO Tables
ALTER TABLE companies ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE audits ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE citations ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE service_areas ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE local_pack_tracking ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE backlinks ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE content_gaps ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE scheduled_audits ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);

-- CRM Tables
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE crm_tasks ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE crm_calendar_events ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE crm_projects ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE crm_prompts ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);

-- Backfill: Create default organisation
INSERT INTO organisations (id, name, slug, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organisation', 'default', 'enterprise')
ON CONFLICT (id) DO NOTHING;

-- Backfill: Assign existing data to default organisation
UPDATE companies SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE audits SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE keywords SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE competitors SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE citations SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE service_areas SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE local_pack_tracking SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE backlinks SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE content_gaps SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE scheduled_audits SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE crm_contacts SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE crm_deals SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE crm_tasks SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE crm_calendar_events SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE crm_projects SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE crm_github_projects SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
UPDATE crm_prompts SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;

-- Make organisation_id NOT NULL (after backfill)
ALTER TABLE companies ALTER COLUMN organisation_id SET NOT NULL;
ALTER TABLE audits ALTER COLUMN organisation_id SET NOT NULL;
ALTER TABLE keywords ALTER COLUMN organisation_id SET NOT NULL;

-- Enable Row-Level Security (RLS) on core tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies table
CREATE POLICY "Users can view own organisation's companies"
  ON companies FOR SELECT
  USING (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert companies"
  ON companies FOR INSERT
  WITH CHECK (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
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

-- RLS Policies for audits table (similar pattern)
CREATE POLICY "Users can view own organisation's audits"
  ON audits FOR SELECT
  USING (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert audits"
  ON audits FOR INSERT
  WITH CHECK (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

-- RLS Policies for keywords table
CREATE POLICY "Users can view own organisation's keywords"
  ON keywords FOR SELECT
  USING (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert keywords"
  ON keywords FOR INSERT
  WITH CHECK (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

-- RLS Policies for CRM tables
CREATE POLICY "Users can view own organisation's contacts"
  ON crm_contacts FOR SELECT
  USING (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage contacts"
  ON crm_contacts FOR ALL
  USING (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_organisation ON companies(organisation_id);
CREATE INDEX IF NOT EXISTS idx_audits_organisation ON audits(organisation_id);
CREATE INDEX IF NOT EXISTS idx_keywords_organisation ON keywords(organisation_id);
CREATE INDEX IF NOT EXISTS idx_organisation_members_user ON organisation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organisation_members_org ON organisation_members(organisation_id);

COMMIT;

-- ============================================================================
-- DOWN MIGRATION (ROLLBACK)
-- ============================================================================

-- To rollback this migration, execute the following:
-- BEGIN;
--
-- -- Drop RLS policies
-- DROP POLICY IF EXISTS "Users can view own organisation's companies" ON companies;
-- DROP POLICY IF EXISTS "Admins can insert companies" ON companies;
-- DROP POLICY IF EXISTS "Admins can update companies" ON companies;
-- DROP POLICY IF EXISTS "Owners can delete companies" ON companies;
-- DROP POLICY IF EXISTS "Users can view own organisation's audits" ON audits;
-- DROP POLICY IF EXISTS "Members can insert audits" ON audits;
-- DROP POLICY IF EXISTS "Users can view own organisation's keywords" ON keywords;
-- DROP POLICY IF EXISTS "Members can insert keywords" ON keywords;
-- DROP POLICY IF EXISTS "Users can view own organisation's contacts" ON crm_contacts;
-- DROP POLICY IF EXISTS "Members can manage contacts" ON crm_contacts;
--
-- -- Disable RLS
-- ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE audits DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE keywords DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE competitors DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE citations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE crm_contacts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE crm_deals DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE crm_tasks DISABLE ROW LEVEL SECURITY;
--
-- -- Drop organisation_id columns
-- ALTER TABLE companies DROP COLUMN IF EXISTS organisation_id;
-- ALTER TABLE audits DROP COLUMN IF EXISTS organisation_id;
-- ALTER TABLE keywords DROP COLUMN IF EXISTS organisation_id;
-- ALTER TABLE competitors DROP COLUMN IF EXISTS organisation_id;
-- ALTER TABLE citations DROP COLUMN IF EXISTS organisation_id;
-- ALTER TABLE service_areas DROP COLUMN IF EXISTS organisation_id;
-- ALTER TABLE local_pack_tracking DROP COLUMN IF EXISTS organisation_id;
-- ALTER TABLE backlinks DROP COLUMN IF EXISTS organisation_id;
-- ALTER TABLE content_gaps DROP COLUMN IF EXISTS organisation_id;
-- ALTER TABLE scheduled_audits DROP COLUMN IF EXISTS organisation_id;
-- ALTER TABLE crm_contacts DROP COLUMN IF EXISTS organisation_id;
-- ALTER TABLE crm_deals DROP COLUMN IF EXISTS organisation_id;
-- ALTER TABLE crm_tasks DROP COLUMN IF EXISTS organisation_id;
-- ALTER TABLE crm_calendar_events DROP COLUMN IF EXISTS organisation_id;
-- ALTER TABLE crm_projects DROP COLUMN IF EXISTS organisation_id;
-- ALTER TABLE crm_github_projects DROP COLUMN IF EXISTS organisation_id;
-- ALTER TABLE crm_prompts DROP COLUMN IF EXISTS organisation_id;
--
-- -- Drop tables
-- DROP TABLE IF EXISTS organisation_members;
-- DROP TABLE IF EXISTS organisations;
--
-- COMMIT;
