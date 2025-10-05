-- GitHub Website Connections Schema
-- For editing Next.js/Node.js sites via GitHub + Vercel/Netlify

-- GitHub Website Connections
CREATE TABLE IF NOT EXISTS github_website_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Repository info
  repo_owner TEXT NOT NULL, -- e.g., "yourusername"
  repo_name TEXT NOT NULL, -- e.g., "my-nextjs-site"
  repo_full_name TEXT GENERATED ALWAYS AS (repo_owner || '/' || repo_name) STORED,
  branch TEXT DEFAULT 'main', -- main or master
  access_token TEXT NOT NULL, -- GitHub Personal Access Token (encrypted)

  -- Deployment platform
  deployment_platform TEXT DEFAULT 'vercel', -- vercel, netlify
  site_url TEXT NOT NULL, -- https://my-site.vercel.app

  -- Site framework detection
  framework TEXT, -- nextjs, gatsby, react, etc.
  router_type TEXT, -- app_router, pages_router (for Next.js)

  -- Connection status
  status TEXT DEFAULT 'pending', -- pending, active, error, disconnected
  last_tested_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  connection_error TEXT,

  -- Capabilities
  can_edit_metadata BOOLEAN DEFAULT true,
  can_edit_content BOOLEAN DEFAULT true,
  can_create_pages BOOLEAN DEFAULT false, -- Requires template system
  can_deploy BOOLEAN DEFAULT true,

  -- Auto-optimization settings
  auto_commit BOOLEAN DEFAULT false, -- Auto-commit SEO changes
  create_pull_requests BOOLEAN DEFAULT true, -- Create PR instead of direct commit

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEO Change Proposals for GitHub sites
CREATE TABLE IF NOT EXISTS github_seo_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES github_website_connections(id) ON DELETE CASCADE,

  -- Change details
  change_type TEXT NOT NULL, -- metadata, image_alt, content, new_page
  file_path TEXT NOT NULL, -- e.g., "app/page.tsx"

  -- For metadata changes
  current_title TEXT,
  proposed_title TEXT,
  current_description TEXT,
  proposed_description TEXT,

  -- For image alt changes
  image_src TEXT,
  current_alt TEXT,
  proposed_alt TEXT,

  -- For content changes
  content_diff TEXT, -- Diff of changes

  -- AI reasoning
  reasoning TEXT NOT NULL, -- Why this change improves SEO
  estimated_score_improvement INTEGER, -- +1 to +10 points
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical

  -- Status tracking
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, applied, failed
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,

  -- Git tracking
  branch_name TEXT, -- If created PR
  commit_sha TEXT, -- After applied
  pr_number INTEGER, -- If created PR
  pr_url TEXT,

  -- Rollback capability
  can_rollback BOOLEAN DEFAULT true,
  rollback_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-Optimization Rules for GitHub sites
CREATE TABLE IF NOT EXISTS github_optimization_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- title_length, missing_description, image_alt, etc.

  -- Conditions (when to trigger)
  conditions JSONB NOT NULL,
  -- Example: {"issue_type": "title_too_long", "current_length": {"gt": 60}}

  -- Actions
  auto_approve BOOLEAN DEFAULT false,
  auto_apply BOOLEAN DEFAULT false,
  create_pr_instead BOOLEAN DEFAULT true, -- Safer than direct commit

  -- Safety limits
  max_changes_per_day INTEGER DEFAULT 10,
  require_review_after INTEGER DEFAULT 5, -- After N auto-applies, require manual review

  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GitHub Deployment Events (triggered by commits)
CREATE TABLE IF NOT EXISTS github_deployment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID REFERENCES github_website_connections(id) ON DELETE CASCADE,

  -- Deployment details
  commit_sha TEXT NOT NULL,
  commit_message TEXT,
  deployment_platform TEXT NOT NULL, -- vercel, netlify
  deployment_url TEXT, -- Preview URL from Vercel/Netlify

  -- Status
  status TEXT DEFAULT 'building', -- building, ready, error, cancelled
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Build logs
  build_logs TEXT,
  error_message TEXT,

  -- Triggered by
  triggered_by TEXT DEFAULT 'crm', -- crm, manual, webhook
  trigger_user_id UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- File Change History (for audit trail)
CREATE TABLE IF NOT EXISTS github_file_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID REFERENCES github_website_connections(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES github_seo_proposals(id) ON DELETE SET NULL,

  -- File details
  file_path TEXT NOT NULL,
  change_type TEXT NOT NULL, -- create, update, delete

  -- Content tracking
  content_before TEXT, -- Previous version (for rollback)
  content_after TEXT, -- New version
  diff TEXT, -- Generated diff

  -- Git tracking
  commit_sha TEXT NOT NULL,
  commit_message TEXT,
  commit_author TEXT DEFAULT 'GEO-SEO CRM',

  -- Rollback capability
  can_rollback BOOLEAN DEFAULT true,
  rollback_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
  rolled_back_at TIMESTAMPTZ,
  rolled_back_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_github_connections_user ON github_website_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_github_connections_company ON github_website_connections(company_id);
CREATE INDEX IF NOT EXISTS idx_github_connections_status ON github_website_connections(status);

CREATE INDEX IF NOT EXISTS idx_github_proposals_connection ON github_seo_proposals(connection_id);
CREATE INDEX IF NOT EXISTS idx_github_proposals_status ON github_seo_proposals(status);
CREATE INDEX IF NOT EXISTS idx_github_proposals_created ON github_seo_proposals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_github_deployments_connection ON github_deployment_events(connection_id);
CREATE INDEX IF NOT EXISTS idx_github_deployments_status ON github_deployment_events(status);
CREATE INDEX IF NOT EXISTS idx_github_deployments_created ON github_deployment_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_github_file_changes_connection ON github_file_changes(connection_id);
CREATE INDEX IF NOT EXISTS idx_github_file_changes_proposal ON github_file_changes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_github_file_changes_commit ON github_file_changes(commit_sha);

-- Row Level Security (RLS)
ALTER TABLE github_website_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_seo_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_optimization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_deployment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_file_changes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own GitHub connections"
  ON github_website_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own GitHub connections"
  ON github_website_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own GitHub connections"
  ON github_website_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own GitHub connections"
  ON github_website_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Similar policies for proposals
CREATE POLICY "Users can view their own proposals"
  ON github_seo_proposals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create proposals"
  ON github_seo_proposals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proposals"
  ON github_seo_proposals FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for rules
CREATE POLICY "Users can manage their own rules"
  ON github_optimization_rules FOR ALL
  USING (auth.uid() = user_id);

-- Read-only policies for deployment events and file changes
CREATE POLICY "Users can view deployment events for their connections"
  ON github_deployment_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM github_website_connections
      WHERE id = connection_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view file changes for their connections"
  ON github_file_changes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM github_website_connections
      WHERE id = connection_id AND user_id = auth.uid()
    )
  );

-- Functions for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_github_connections_updated_at BEFORE UPDATE ON github_website_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_github_proposals_updated_at BEFORE UPDATE ON github_seo_proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_github_rules_updated_at BEFORE UPDATE ON github_optimization_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
