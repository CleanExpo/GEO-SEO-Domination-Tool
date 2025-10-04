-- Fix Row Level Security (RLS) Policies for GEO-SEO Domination Tool
-- This script disables RLS or adds permissive policies to allow authenticated users to access data

-- ============================================================================
-- OPTION 1: DISABLE RLS (Quick fix for testing/development)
-- ============================================================================
-- Uncomment these lines to completely disable RLS:

ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE keywords DISABLE ROW LEVEL SECURITY;
ALTER TABLE rankings DISABLE ROW LEVEL SECURITY;
ALTER TABLE seo_audits DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE github_repos DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE resource_prompts DISABLE ROW LEVEL SECURITY;
ALTER TABLE resource_components DISABLE ROW LEVEL SECURITY;
ALTER TABLE resource_ai_tools DISABLE ROW LEVEL SECURITY;
ALTER TABLE resource_tutorials DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- OPTION 2: ADD PERMISSIVE RLS POLICIES (Secure approach)
-- ============================================================================
-- If you want to keep RLS enabled but allow authenticated users full access:

/*
-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_repos ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users full access" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON keywords;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON rankings;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON seo_audits;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON projects;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON project_notes;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON github_repos;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON crm_contacts;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON crm_deals;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON crm_tasks;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON crm_events;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON resource_prompts;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON resource_components;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON resource_ai_tools;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON resource_tutorials;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON notification_preferences;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON notification_queue;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON notification_history;

-- Create permissive policies for all tables (allows all CRUD for authenticated users)
CREATE POLICY "Allow authenticated users full access" ON companies
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access" ON keywords
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access" ON rankings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access" ON seo_audits
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access" ON projects
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access" ON project_notes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access" ON github_repos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access" ON crm_contacts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access" ON crm_deals
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access" ON crm_tasks
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access" ON crm_events
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access" ON resource_prompts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access" ON resource_components
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access" ON resource_ai_tools
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access" ON resource_tutorials
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access" ON notification_preferences
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access" ON notification_queue
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access" ON notification_history
  FOR ALL USING (auth.role() = 'authenticated');
*/
