-- Migration 009: Add Company Context to CRM Tables
-- This migration adds organisation_id and company_id foreign keys to all CRM tables
-- so that CRM data is scoped to specific companies within organisations

-- Step 1: Add organisation_id to CRM tables
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE crm_tasks ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE crm_calendar_events ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE crm_projects ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE;

-- Step 2: Add company_id to CRM tables
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE crm_tasks ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE crm_calendar_events ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE crm_projects ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Step 3: Add company_id to github_website_connections (if not already present)
ALTER TABLE github_website_connections ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Step 4: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_crm_contacts_org_id ON crm_contacts(organisation_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_company_id ON crm_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_org_id ON crm_deals(organisation_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_company_id ON crm_deals(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_org_id ON crm_tasks(organisation_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_company_id ON crm_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_calendar_events_org_id ON crm_calendar_events(organisation_id);
CREATE INDEX IF NOT EXISTS idx_crm_calendar_events_company_id ON crm_calendar_events(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_projects_org_id ON crm_projects(organisation_id);
CREATE INDEX IF NOT EXISTS idx_crm_projects_company_id ON crm_projects(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_github_projects_org_id ON crm_github_projects(organisation_id);
CREATE INDEX IF NOT EXISTS idx_crm_github_projects_company_id ON crm_github_projects(company_id);
CREATE INDEX IF NOT EXISTS idx_github_website_connections_company_id ON github_website_connections(company_id);

-- Step 5: Add composite indexes for common queries (organisation + company)
CREATE INDEX IF NOT EXISTS idx_crm_contacts_org_company ON crm_contacts(organisation_id, company_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_org_company ON crm_deals(organisation_id, company_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_org_company ON crm_tasks(organisation_id, company_id);
CREATE INDEX IF NOT EXISTS idx_crm_calendar_events_org_company ON crm_calendar_events(organisation_id, company_id);
