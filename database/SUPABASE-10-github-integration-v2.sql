-- ========================================
-- FILE 10: GitHub Integration Tables (v2 - Fixed)
-- Purpose: Add GitHub OAuth, commits, PRs, issues, webhooks, and sync job tracking
-- Dependencies: auth.users, crm_github_projects (from SUPABASE-04), companies, crm_projects
-- Tables Created: github_oauth_tokens, github_commits, github_pull_requests, github_issues, github_webhooks, github_sync_jobs
-- Run this AFTER SUPABASE-09-fix-user-api-keys.sql completes
-- ========================================

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS github_sync_jobs CASCADE;
DROP TABLE IF EXISTS github_webhooks CASCADE;
DROP TABLE IF EXISTS github_issues CASCADE;
DROP TABLE IF EXISTS github_pull_requests CASCADE;
DROP TABLE IF EXISTS github_commits CASCADE;
DROP TABLE IF EXISTS github_oauth_tokens CASCADE;

-- 1. GITHUB_OAUTH_TOKENS TABLE
CREATE TABLE github_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT,
  expires_at TIMESTAMPTZ,
  refresh_token TEXT,
  github_user_id TEXT,
  github_username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_github_oauth_tokens_user ON github_oauth_tokens(user_id);
CREATE INDEX idx_github_oauth_tokens_username ON github_oauth_tokens(github_username);

COMMENT ON TABLE github_oauth_tokens IS 'GitHub OAuth access tokens for API authentication';

-- 2. ENHANCE CRM_GITHUB_PROJECTS TABLE
-- Add missing columns one by one
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS owner TEXT;
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS repo_name TEXT;
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS github_id INTEGER;
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS default_branch TEXT DEFAULT 'main';
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS is_fork BOOLEAN DEFAULT FALSE;
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS watchers INTEGER DEFAULT 0;
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS open_issues INTEGER DEFAULT 0;
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS size_kb INTEGER DEFAULT 0;
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS license TEXT;
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS topics JSONB DEFAULT '[]'::JSONB;
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS auto_sync BOOLEAN DEFAULT FALSE;
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS sync_frequency TEXT DEFAULT 'daily';
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending';
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS sync_error TEXT;
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE crm_github_projects ADD COLUMN IF NOT EXISTS project_id UUID;

-- Add foreign key constraints separately (after columns exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_github_projects_company_id_fkey'
  ) THEN
    ALTER TABLE crm_github_projects ADD CONSTRAINT crm_github_projects_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_github_projects_project_id_fkey'
  ) THEN
    ALTER TABLE crm_github_projects ADD CONSTRAINT crm_github_projects_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES crm_projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crm_github_projects_company ON crm_github_projects(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_github_projects_project ON crm_github_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_crm_github_projects_sync ON crm_github_projects(auto_sync, last_synced_at);

COMMENT ON TABLE crm_github_projects IS 'GitHub repositories with enhanced metadata and sync capabilities';

-- 3. GITHUB_COMMITS TABLE
CREATE TABLE github_commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_project_id UUID REFERENCES crm_github_projects(id) ON DELETE CASCADE,
  commit_sha TEXT NOT NULL,
  author_name TEXT,
  author_email TEXT,
  author_username TEXT,
  commit_message TEXT,
  commit_date TIMESTAMPTZ,
  additions INTEGER DEFAULT 0,
  deletions INTEGER DEFAULT 0,
  files_changed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(github_project_id, commit_sha)
);

CREATE INDEX idx_github_commits_project ON github_commits(github_project_id, commit_date DESC);
CREATE INDEX idx_github_commits_user ON github_commits(user_id);

COMMENT ON TABLE github_commits IS 'GitHub commit history tracking';

-- 4. GITHUB_PULL_REQUESTS TABLE
CREATE TABLE github_pull_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_project_id UUID REFERENCES crm_github_projects(id) ON DELETE CASCADE,
  pr_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  state TEXT NOT NULL,
  author_username TEXT,
  pr_created_at TIMESTAMPTZ,
  pr_updated_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  merged_at TIMESTAMPTZ,
  head_branch TEXT,
  base_branch TEXT,
  additions INTEGER DEFAULT 0,
  deletions INTEGER DEFAULT 0,
  changed_files INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(github_project_id, pr_number)
);

CREATE INDEX idx_github_prs_project ON github_pull_requests(github_project_id, state);
CREATE INDEX idx_github_prs_user ON github_pull_requests(user_id);

COMMENT ON TABLE github_pull_requests IS 'GitHub pull request tracking';

-- 5. GITHUB_ISSUES TABLE
CREATE TABLE github_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_project_id UUID REFERENCES crm_github_projects(id) ON DELETE CASCADE,
  issue_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  state TEXT NOT NULL,
  author_username TEXT,
  assignees JSONB DEFAULT '[]'::JSONB,
  labels JSONB DEFAULT '[]'::JSONB,
  issue_created_at TIMESTAMPTZ,
  issue_updated_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(github_project_id, issue_number)
);

CREATE INDEX idx_github_issues_project ON github_issues(github_project_id, state);
CREATE INDEX idx_github_issues_user ON github_issues(user_id);

COMMENT ON TABLE github_issues IS 'GitHub issue tracking';

-- 6. GITHUB_WEBHOOKS TABLE
CREATE TABLE github_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_project_id UUID REFERENCES crm_github_projects(id) ON DELETE CASCADE,
  webhook_id TEXT,
  webhook_url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events JSONB DEFAULT '["push", "pull_request", "issues"]'::JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  last_delivery_at TIMESTAMPTZ,
  delivery_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_github_webhooks_project ON github_webhooks(github_project_id);
CREATE INDEX idx_github_webhooks_user ON github_webhooks(user_id);

COMMENT ON TABLE github_webhooks IS 'GitHub webhook configurations';

-- 7. GITHUB_SYNC_JOBS TABLE
CREATE TABLE github_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_project_id UUID REFERENCES crm_github_projects(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  items_synced INTEGER DEFAULT 0,
  error TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_github_sync_jobs_project ON github_sync_jobs(github_project_id, created_at DESC);
CREATE INDEX idx_github_sync_jobs_user ON github_sync_jobs(user_id);
CREATE INDEX idx_github_sync_jobs_status ON github_sync_jobs(status);

COMMENT ON TABLE github_sync_jobs IS 'GitHub synchronization job tracking';

-- Verification: Check tables were created
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('github_oauth_tokens', 'github_commits', 'github_pull_requests', 'github_issues', 'github_webhooks', 'github_sync_jobs')
ORDER BY table_name;

-- Expected output: 6 rows showing all GitHub tables

-- Verify enhanced crm_github_projects columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'crm_github_projects'
  AND column_name IN ('owner', 'repo_name', 'github_id', 'company_id', 'project_id', 'auto_sync')
ORDER BY column_name;

-- Expected output: 6 rows showing enhanced columns
