-- Migration: 006_github_sync.sql
-- Description: GitHub webhook integration for auto-sync and CRM task creation
-- Dependencies: None (standalone)
-- Author: Orchestra Coordinator (Phase 3)
-- Date: 2025-10-05

-- ============================================================
-- GITHUB REPOSITORIES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS github_repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,

  -- GitHub metadata
  github_repo_id bigint UNIQUE NOT NULL,
  owner text NOT NULL,
  name text NOT NULL,
  full_name text NOT NULL, -- 'owner/name'

  -- Repository details
  description text,
  default_branch text DEFAULT 'main',
  is_private boolean DEFAULT false,
  homepage_url text,

  -- Sync tracking
  last_push_at timestamptz,
  last_sync_at timestamptz,
  webhook_secret text, -- Encrypted webhook secret

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_repo_per_org UNIQUE(organisation_id, github_repo_id)
);

CREATE INDEX idx_github_repos_org_id ON github_repositories(organisation_id);
CREATE INDEX idx_github_repos_github_id ON github_repositories(github_repo_id);
CREATE INDEX idx_github_repos_full_name ON github_repositories(full_name);

-- ============================================================
-- GITHUB COMMITS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS github_commits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid REFERENCES github_repositories(id) ON DELETE CASCADE NOT NULL,

  -- Commit metadata
  sha text NOT NULL,
  message text NOT NULL,
  author_name text,
  author_email text,
  committer_name text,
  committer_email text,

  -- Timing
  committed_at timestamptz NOT NULL,

  -- Associations
  branch text,
  is_merge_commit boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),

  CONSTRAINT unique_commit_per_repo UNIQUE(repository_id, sha)
);

CREATE INDEX idx_github_commits_repo_id ON github_commits(repository_id);
CREATE INDEX idx_github_commits_sha ON github_commits(sha);
CREATE INDEX idx_github_commits_branch ON github_commits(branch);
CREATE INDEX idx_github_commits_committed_at ON github_commits(committed_at DESC);

-- ============================================================
-- GITHUB PULL REQUESTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS github_pull_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid REFERENCES github_repositories(id) ON DELETE CASCADE NOT NULL,

  -- PR metadata
  github_pr_number integer NOT NULL,
  github_pr_id bigint NOT NULL,
  title text NOT NULL,
  body text,
  state text NOT NULL CHECK (state IN ('open', 'closed', 'merged')),

  -- Branch info
  head_branch text NOT NULL,
  base_branch text NOT NULL,

  -- Author
  author_username text,
  author_avatar_url text,

  -- Timing
  opened_at timestamptz NOT NULL,
  closed_at timestamptz,
  merged_at timestamptz,

  -- CRM integration
  crm_task_id uuid, -- Link to CRM task if created
  project_milestone_id uuid, -- Link to project milestone

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_pr_per_repo UNIQUE(repository_id, github_pr_number)
);

CREATE INDEX idx_github_prs_repo_id ON github_pull_requests(repository_id);
CREATE INDEX idx_github_prs_number ON github_pull_requests(github_pr_number);
CREATE INDEX idx_github_prs_state ON github_pull_requests(state);
CREATE INDEX idx_github_prs_crm_task ON github_pull_requests(crm_task_id);

-- ============================================================
-- GITHUB ISSUES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS github_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid REFERENCES github_repositories(id) ON DELETE CASCADE NOT NULL,

  -- Issue metadata
  github_issue_number integer NOT NULL,
  github_issue_id bigint NOT NULL,
  title text NOT NULL,
  body text,
  state text NOT NULL CHECK (state IN ('open', 'closed')),

  -- Author
  author_username text,

  -- Labels
  labels text[], -- Array of label names

  -- Timing
  opened_at timestamptz NOT NULL,
  closed_at timestamptz,

  -- CRM integration
  crm_task_id uuid, -- Auto-create CRM task from issue

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_issue_per_repo UNIQUE(repository_id, github_issue_number)
);

CREATE INDEX idx_github_issues_repo_id ON github_issues(repository_id);
CREATE INDEX idx_github_issues_number ON github_issues(github_issue_number);
CREATE INDEX idx_github_issues_state ON github_issues(state);
CREATE INDEX idx_github_issues_crm_task ON github_issues(crm_task_id);

-- ============================================================
-- GITHUB RELEASES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS github_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid REFERENCES github_repositories(id) ON DELETE CASCADE NOT NULL,

  -- Release metadata
  github_release_id bigint UNIQUE NOT NULL,
  tag_name text NOT NULL,
  release_name text,
  body text, -- Release notes

  -- Version info
  is_prerelease boolean DEFAULT false,
  is_draft boolean DEFAULT false,

  -- Author
  author_username text,

  -- Timing
  published_at timestamptz,

  -- Changelog integration
  changelog_generated boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),

  CONSTRAINT unique_release_per_repo UNIQUE(repository_id, tag_name)
);

CREATE INDEX idx_github_releases_repo_id ON github_releases(repository_id);
CREATE INDEX idx_github_releases_tag ON github_releases(tag_name);
CREATE INDEX idx_github_releases_published ON github_releases(published_at DESC);

-- ============================================================
-- GITHUB WEBHOOK EVENTS LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS github_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid REFERENCES github_repositories(id) ON DELETE CASCADE,

  -- Event metadata
  event_type text NOT NULL, -- 'push', 'pull_request', 'issues', 'release'
  action text, -- 'opened', 'closed', 'synchronized', etc.

  -- Payload
  payload jsonb NOT NULL,

  -- Processing
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error_message text,

  -- Timing
  received_at timestamptz DEFAULT now(),

  -- Signature verification
  signature_valid boolean DEFAULT false
);

CREATE INDEX idx_webhook_events_repo_id ON github_webhook_events(repository_id);
CREATE INDEX idx_webhook_events_type ON github_webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON github_webhook_events(processed, received_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE github_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_pull_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_webhook_events ENABLE ROW LEVEL SECURITY;

-- Repositories: Organisation members can view
CREATE POLICY github_repos_select ON github_repositories
  FOR SELECT USING (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members WHERE user_id = auth.uid()
    )
  );

-- Commits: Organisation members can view
CREATE POLICY github_commits_select ON github_commits
  FOR SELECT USING (
    repository_id IN (
      SELECT id FROM github_repositories WHERE organisation_id IN (
        SELECT organisation_id FROM organisation_members WHERE user_id = auth.uid()
      )
    )
  );

-- Pull Requests: Organisation members can view
CREATE POLICY github_prs_select ON github_pull_requests
  FOR SELECT USING (
    repository_id IN (
      SELECT id FROM github_repositories WHERE organisation_id IN (
        SELECT organisation_id FROM organisation_members WHERE user_id = auth.uid()
      )
    )
  );

-- Issues: Organisation members can view
CREATE POLICY github_issues_select ON github_issues
  FOR SELECT USING (
    repository_id IN (
      SELECT id FROM github_repositories WHERE organisation_id IN (
        SELECT organisation_id FROM organisation_members WHERE user_id = auth.uid()
      )
    )
  );

-- Releases: Organisation members can view
CREATE POLICY github_releases_select ON github_releases
  FOR SELECT USING (
    repository_id IN (
      SELECT id FROM github_repositories WHERE organisation_id IN (
        SELECT organisation_id FROM organisation_members WHERE user_id = auth.uid()
      )
    )
  );

-- Webhook events: Organisation admins can view
CREATE POLICY github_webhook_events_select ON github_webhook_events
  FOR SELECT USING (
    repository_id IN (
      SELECT id FROM github_repositories WHERE organisation_id IN (
        SELECT organisation_id FROM organisation_members WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
      )
    )
  );

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_github_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_github_repo_timestamp
  BEFORE UPDATE ON github_repositories
  FOR EACH ROW EXECUTE FUNCTION update_github_updated_at();

CREATE TRIGGER trigger_update_github_pr_timestamp
  BEFORE UPDATE ON github_pull_requests
  FOR EACH ROW EXECUTE FUNCTION update_github_updated_at();

CREATE TRIGGER trigger_update_github_issue_timestamp
  BEFORE UPDATE ON github_issues
  FOR EACH ROW EXECUTE FUNCTION update_github_updated_at();

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE github_repositories IS 'Synced GitHub repositories per organisation';
COMMENT ON TABLE github_commits IS 'Commit history synced from GitHub webhooks';
COMMENT ON TABLE github_pull_requests IS 'Pull requests with CRM task linkage';
COMMENT ON TABLE github_issues IS 'GitHub issues synced to CRM tasks';
COMMENT ON TABLE github_releases IS 'Release tracking and changelog automation';
COMMENT ON TABLE github_webhook_events IS 'Audit log of all GitHub webhook events';
