-- ========================================
-- FILE 0 OF 8: Database Cleanup Script
-- Purpose: Drop ALL existing tables to start fresh
-- Run this FIRST if you have any old tables from previous schema files
-- WARNING: This will delete ALL data in your database!
-- ========================================

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS job_alerts CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS job_schedules CASCADE;
DROP TABLE IF EXISTS job_executions CASCADE;

DROP TABLE IF EXISTS resource_categories CASCADE;
DROP TABLE IF EXISTS crm_tutorials CASCADE;
DROP TABLE IF EXISTS crm_ai_tools CASCADE;
DROP TABLE IF EXISTS resource_ai_tools CASCADE;
DROP TABLE IF EXISTS crm_components CASCADE;
DROP TABLE IF EXISTS crm_prompts CASCADE;

DROP TABLE IF EXISTS crm_github_projects CASCADE;
DROP TABLE IF EXISTS crm_project_notes CASCADE;
DROP TABLE IF EXISTS crm_project_members CASCADE;
DROP TABLE IF EXISTS crm_projects CASCADE;
DROP TABLE IF EXISTS generated_projects CASCADE;
DROP TABLE IF EXISTS project_templates CASCADE;
DROP TABLE IF EXISTS hub_collection_projects CASCADE;
DROP TABLE IF EXISTS hub_collections CASCADE;
DROP TABLE IF EXISTS hub_projects CASCADE;

DROP TABLE IF EXISTS crm_support_tickets CASCADE;
DROP TABLE IF EXISTS crm_event_attendees CASCADE;
DROP TABLE IF EXISTS crm_calendar_events CASCADE;
DROP TABLE IF EXISTS crm_events CASCADE;
DROP TABLE IF EXISTS crm_tasks CASCADE;
DROP TABLE IF EXISTS crm_deals CASCADE;
DROP TABLE IF EXISTS crm_contacts CASCADE;

DROP TABLE IF EXISTS seo_audits CASCADE;
DROP TABLE IF EXISTS rankings CASCADE;
DROP TABLE IF EXISTS keywords CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

DROP TABLE IF EXISTS user_api_keys CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop views (if they exist as views, not tables)
-- Note: resource_ai_tools and crm_events might be tables, already dropped above

-- Drop functions
DROP FUNCTION IF EXISTS increment_tutorial_views() CASCADE;
DROP FUNCTION IF EXISTS increment_usage_count() CASCADE;
DROP FUNCTION IF EXISTS update_keyword_current_rank() CASCADE;
DROP FUNCTION IF EXISTS calculate_rank_change() CASCADE;
DROP FUNCTION IF EXISTS update_company_last_accessed() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS get_ranking_trends(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_job_statistics(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_job_executions() CASCADE;

-- Verification: Check all tables are dropped
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected output: Empty result set (no tables in public schema)

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database cleanup complete! All tables, views, and functions dropped.';
  RAISE NOTICE 'You can now run SUPABASE-01-auth-tables.sql to start fresh.';
END $$;
