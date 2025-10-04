-- ========================================
-- Add user_id columns to enable proper Row Level Security
-- Generated: 2025-10-04
-- Purpose: Associate all data with users for proper filtering
-- ========================================

-- Core SEO Tables
ALTER TABLE companies ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE rankings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- CRM Tables
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE crm_tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE crm_calendar_events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE crm_projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE crm_project_notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Resource Tables
ALTER TABLE crm_prompts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE crm_components ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE crm_ai_tools ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE crm_tutorials ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Job Tables
ALTER TABLE scheduled_jobs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for performance (critical for RLS queries)
CREATE INDEX IF NOT EXISTS idx_companies_user ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_keywords_user ON keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_rankings_user ON rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_user ON crm_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_user ON crm_deals(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_user ON crm_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_calendar_events_user ON crm_calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_projects_user ON crm_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_github_projects_user ON crm_github_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_project_notes_user ON crm_project_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_prompts_user ON crm_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_components_user ON crm_components(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_ai_tools_user ON crm_ai_tools(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_tutorials_user ON crm_tutorials(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_user ON scheduled_jobs(user_id);

-- Verification: Check which tables have user_id column
-- SELECT table_name, column_name
-- FROM information_schema.columns
-- WHERE column_name = 'user_id'
--   AND table_schema = 'public'
-- ORDER BY table_name;

COMMENT ON COLUMN companies.user_id IS 'Owner of this company record';
COMMENT ON COLUMN keywords.user_id IS 'Owner of this keyword tracking';
COMMENT ON COLUMN rankings.user_id IS 'Owner of this ranking data';
