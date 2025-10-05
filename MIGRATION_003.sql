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
