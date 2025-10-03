-- Enhanced GitHub Integration Schema
-- Adds OAuth authentication, auto-sync, webhooks, and company linking
-- Run this in Supabase SQL Editor

-- GitHub OAuth Tokens Table
CREATE TABLE IF NOT EXISTS github_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- References auth.users if using Supabase auth
  access_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT, -- GitHub OAuth scopes (e.g., 'repo,user,workflow')
  expires_at TIMESTAMPTZ,
  refresh_token TEXT,
  github_user_id TEXT,
  github_username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced GitHub Projects table (extends existing crm_github_projects)
-- Add these columns to existing table or create migration
ALTER TABLE crm_github_projects
  ADD COLUMN IF NOT EXISTS owner TEXT,
  ADD COLUMN IF NOT EXISTS repo_name TEXT,
  ADD COLUMN IF NOT EXISTS github_id INTEGER,
  ADD COLUMN IF NOT EXISTS default_branch TEXT DEFAULT 'main',
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_fork BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS watchers INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS open_issues INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS size_kb INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS license TEXT,
  ADD COLUMN IF NOT EXISTS topics JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS auto_sync BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sync_frequency TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly', 'manual'
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending', -- 'pending', 'syncing', 'success', 'failed'
  ADD COLUMN IF NOT EXISTS sync_error TEXT,
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES crm_projects(id) ON DELETE SET NULL;

-- GitHub Commits Tracking
CREATE TABLE IF NOT EXISTS github_commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_project_id INTEGER REFERENCES crm_github_projects(id) ON DELETE CASCADE,
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
  UNIQUE(github_project_id, commit_sha)
);

-- GitHub Pull Requests
CREATE TABLE IF NOT EXISTS github_pull_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_project_id INTEGER REFERENCES crm_github_projects(id) ON DELETE CASCADE,
  pr_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  state TEXT NOT NULL, -- 'open', 'closed', 'merged'
  author_username TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  merged_at TIMESTAMPTZ,
  head_branch TEXT,
  base_branch TEXT,
  additions INTEGER DEFAULT 0,
  deletions INTEGER DEFAULT 0,
  changed_files INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  UNIQUE(github_project_id, pr_number)
);

-- GitHub Issues
CREATE TABLE IF NOT EXISTS github_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_project_id INTEGER REFERENCES crm_github_projects(id) ON DELETE CASCADE,
  issue_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  state TEXT NOT NULL, -- 'open', 'closed'
  author_username TEXT,
  assignees JSONB DEFAULT '[]'::JSONB,
  labels JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  comments_count INTEGER DEFAULT 0,
  UNIQUE(github_project_id, issue_number)
);

-- GitHub Webhooks Configuration
CREATE TABLE IF NOT EXISTS github_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_project_id INTEGER REFERENCES crm_github_projects(id) ON DELETE CASCADE,
  webhook_id TEXT, -- GitHub webhook ID
  webhook_url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events JSONB DEFAULT '["push", "pull_request", "issues"]'::JSONB,
  is_active BOOLEAN DEFAULT true,
  last_delivery_at TIMESTAMPTZ,
  delivery_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GitHub Sync Jobs (for tracking sync operations)
CREATE TABLE IF NOT EXISTS github_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_project_id INTEGER REFERENCES crm_github_projects(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- 'full', 'commits', 'prs', 'issues', 'metadata'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'success', 'failed'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  items_synced INTEGER DEFAULT 0,
  error TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_github_oauth_tokens_user ON github_oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_github_oauth_tokens_username ON github_oauth_tokens(github_username);
CREATE INDEX IF NOT EXISTS idx_github_projects_company ON crm_github_projects(company_id);
CREATE INDEX IF NOT EXISTS idx_github_projects_project ON crm_github_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_github_projects_sync ON crm_github_projects(auto_sync, last_synced_at);
CREATE INDEX IF NOT EXISTS idx_github_commits_project ON github_commits(github_project_id, commit_date DESC);
CREATE INDEX IF NOT EXISTS idx_github_prs_project ON github_pull_requests(github_project_id, state);
CREATE INDEX IF NOT EXISTS idx_github_issues_project ON github_issues(github_project_id, state);
CREATE INDEX IF NOT EXISTS idx_github_sync_jobs_project ON github_sync_jobs(github_project_id, created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_github_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER trigger_github_oauth_tokens_updated_at
  BEFORE UPDATE ON github_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_github_updated_at();

CREATE TRIGGER trigger_github_webhooks_updated_at
  BEFORE UPDATE ON github_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_github_updated_at();

CREATE TRIGGER trigger_github_projects_updated_at
  BEFORE UPDATE ON crm_github_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_github_updated_at();

-- Verify schema
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN (
  'github_oauth_tokens',
  'crm_github_projects',
  'github_commits',
  'github_pull_requests',
  'github_issues',
  'github_webhooks',
  'github_sync_jobs'
)
ORDER BY table_name, ordinal_position;
