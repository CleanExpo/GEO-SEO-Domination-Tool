-- ========================================
-- FILE 7 OF 8: Enable RLS and Create Policies
-- Purpose: Enable Row Level Security on all tables and create access policies
-- Dependencies: All tables from Files 1-6
-- Run this AFTER SUPABASE-06-job-scheduler.sql completes
-- ========================================

-- ========================================
-- ENABLE RLS ON ALL TABLES
-- ========================================

-- Auth & User Tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Core SEO Tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;

-- CRM Tables
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_support_tickets ENABLE ROW LEVEL SECURITY;

-- Project Tables
ALTER TABLE hub_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_collection_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_project_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_github_projects ENABLE ROW LEVEL SECURITY;

-- Resource Tables
ALTER TABLE crm_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY;

-- Job Scheduler Tables
ALTER TABLE job_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PROFILES POLICIES
-- ========================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ========================================
-- USER_SETTINGS POLICIES
-- ========================================

DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ========================================
-- USER_API_KEYS POLICIES
-- ========================================

DROP POLICY IF EXISTS "Users can view own API keys" ON user_api_keys;
CREATE POLICY "Users can view own API keys" ON user_api_keys
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own API keys" ON user_api_keys;
CREATE POLICY "Users can insert own API keys" ON user_api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own API keys" ON user_api_keys;
CREATE POLICY "Users can update own API keys" ON user_api_keys
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own API keys" ON user_api_keys;
CREATE POLICY "Users can delete own API keys" ON user_api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- CORE SEO TABLES POLICIES (Standard CRUD)
-- ========================================

-- COMPANIES
DROP POLICY IF EXISTS "Users can view own companies" ON companies;
CREATE POLICY "Users can view own companies" ON companies
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own companies" ON companies;
CREATE POLICY "Users can insert own companies" ON companies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own companies" ON companies;
CREATE POLICY "Users can update own companies" ON companies
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own companies" ON companies;
CREATE POLICY "Users can delete own companies" ON companies
  FOR DELETE USING (auth.uid() = user_id);

-- KEYWORDS
DROP POLICY IF EXISTS "Users can view own keywords" ON keywords;
CREATE POLICY "Users can view own keywords" ON keywords
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own keywords" ON keywords;
CREATE POLICY "Users can insert own keywords" ON keywords
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own keywords" ON keywords;
CREATE POLICY "Users can update own keywords" ON keywords
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own keywords" ON keywords;
CREATE POLICY "Users can delete own keywords" ON keywords
  FOR DELETE USING (auth.uid() = user_id);

-- RANKINGS
DROP POLICY IF EXISTS "Users can view own rankings" ON rankings;
CREATE POLICY "Users can view own rankings" ON rankings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own rankings" ON rankings;
CREATE POLICY "Users can insert own rankings" ON rankings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own rankings" ON rankings;
CREATE POLICY "Users can update own rankings" ON rankings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own rankings" ON rankings;
CREATE POLICY "Users can delete own rankings" ON rankings
  FOR DELETE USING (auth.uid() = user_id);

-- SEO_AUDITS
DROP POLICY IF EXISTS "Users can view own audits" ON seo_audits;
CREATE POLICY "Users can view own audits" ON seo_audits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own audits" ON seo_audits;
CREATE POLICY "Users can insert own audits" ON seo_audits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own audits" ON seo_audits;
CREATE POLICY "Users can update own audits" ON seo_audits
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own audits" ON seo_audits;
CREATE POLICY "Users can delete own audits" ON seo_audits
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- CRM TABLES POLICIES (Standard CRUD)
-- ========================================

-- Apply same pattern for all CRM tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY['crm_contacts', 'crm_deals', 'crm_tasks', 'crm_calendar_events',
                        'crm_event_attendees', 'crm_support_tickets'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users can view own %I" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can view own %I" ON %I FOR SELECT USING (auth.uid() = user_id)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Users can insert own %I" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can insert own %I" ON %I FOR INSERT WITH CHECK (auth.uid() = user_id)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Users can update own %I" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can update own %I" ON %I FOR UPDATE USING (auth.uid() = user_id)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %I" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can delete own %I" ON %I FOR DELETE USING (auth.uid() = user_id)', tbl, tbl);
  END LOOP;
END $$;

-- ========================================
-- PROJECT TABLES POLICIES (Standard CRUD)
-- ========================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY['hub_projects', 'hub_collections', 'project_templates', 'generated_projects',
                        'crm_projects', 'crm_project_members', 'crm_project_notes', 'crm_github_projects'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users can view own %I" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can view own %I" ON %I FOR SELECT USING (auth.uid() = user_id)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Users can insert own %I" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can insert own %I" ON %I FOR INSERT WITH CHECK (auth.uid() = user_id)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Users can update own %I" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can update own %I" ON %I FOR UPDATE USING (auth.uid() = user_id)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %I" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can delete own %I" ON %I FOR DELETE USING (auth.uid() = user_id)', tbl, tbl);
  END LOOP;
END $$;

-- Hub Collection Projects (junction table - no user_id)
DROP POLICY IF EXISTS "Users can view own collection projects" ON hub_collection_projects;
CREATE POLICY "Users can view own collection projects" ON hub_collection_projects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM hub_collections WHERE id = collection_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own collection projects" ON hub_collection_projects;
CREATE POLICY "Users can insert own collection projects" ON hub_collection_projects
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM hub_collections WHERE id = collection_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own collection projects" ON hub_collection_projects;
CREATE POLICY "Users can delete own collection projects" ON hub_collection_projects
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM hub_collections WHERE id = collection_id AND user_id = auth.uid())
  );

-- ========================================
-- RESOURCE TABLES POLICIES (Standard CRUD)
-- ========================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY['crm_prompts', 'crm_components', 'crm_ai_tools', 'crm_tutorials', 'resource_categories'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users can view own %I" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can view own %I" ON %I FOR SELECT USING (auth.uid() = user_id)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Users can insert own %I" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can insert own %I" ON %I FOR INSERT WITH CHECK (auth.uid() = user_id)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Users can update own %I" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can update own %I" ON %I FOR UPDATE USING (auth.uid() = user_id)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %I" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can delete own %I" ON %I FOR DELETE USING (auth.uid() = user_id)', tbl, tbl);
  END LOOP;
END $$;

-- ========================================
-- JOB SCHEDULER POLICIES (Standard CRUD)
-- ========================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY['job_executions', 'job_schedules', 'reports', 'job_alerts'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users can view own %I" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can view own %I" ON %I FOR SELECT USING (auth.uid() = user_id)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Users can insert own %I" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can insert own %I" ON %I FOR INSERT WITH CHECK (auth.uid() = user_id)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Users can update own %I" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can update own %I" ON %I FOR UPDATE USING (auth.uid() = user_id)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %I" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can delete own %I" ON %I FOR DELETE USING (auth.uid() = user_id)', tbl, tbl);
  END LOOP;
END $$;

-- Verification: Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'user_settings', 'user_api_keys',
    'companies', 'keywords', 'rankings', 'seo_audits',
    'crm_contacts', 'crm_deals', 'crm_tasks', 'crm_calendar_events',
    'hub_projects', 'crm_prompts', 'job_executions'
  )
ORDER BY tablename;

-- Verification: Count policies created
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Expected output: All tables should have rowsecurity = true and multiple policies
