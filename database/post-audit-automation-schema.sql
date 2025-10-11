-- Post-Audit Automation System Schema
-- Enables automated website fixes via AI agents after SEO audits complete

-- =====================================================
-- 1. WEBSITE CREDENTIALS (Encrypted Storage)
-- =====================================================

CREATE TABLE IF NOT EXISTS website_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Platform identification
  platform_type TEXT NOT NULL, -- 'wordpress', 'shopify', 'next', 'static', 'custom'
  platform_version TEXT, -- e.g., 'WordPress 6.4', 'Shopify Plus'
  primary_access_method TEXT NOT NULL, -- 'wp_rest_api', 'ftp', 'github', 'cpanel', 'vercel'

  -- WordPress Credentials
  wp_url TEXT,
  wp_username TEXT,
  wp_app_password_encrypted TEXT, -- Recommended: Application Password
  wp_password_encrypted TEXT, -- Fallback: Admin password (less secure)

  -- FTP/SFTP Credentials
  ftp_host TEXT,
  ftp_port INTEGER DEFAULT 21,
  ftp_username TEXT,
  ftp_password_encrypted TEXT,
  ftp_root_path TEXT DEFAULT '/',
  ftp_protocol TEXT DEFAULT 'ftp', -- 'ftp', 'sftp', 'ftps'

  -- cPanel/Hosting Credentials
  cpanel_url TEXT,
  cpanel_username TEXT,
  cpanel_api_token_encrypted TEXT,

  -- GitHub Credentials (for code-based sites)
  github_repo TEXT, -- Format: 'owner/repo'
  github_token_encrypted TEXT,
  github_branch TEXT DEFAULT 'main',
  github_auto_pr BOOLEAN DEFAULT TRUE, -- Create PR instead of direct commit

  -- Vercel Credentials (for Next.js/Jamstack)
  vercel_project_id TEXT,
  vercel_token_encrypted TEXT,

  -- Shopify Credentials
  shopify_store_url TEXT,
  shopify_access_token_encrypted TEXT,
  shopify_api_version TEXT DEFAULT '2024-01',

  -- SSH Credentials (advanced)
  ssh_host TEXT,
  ssh_port INTEGER DEFAULT 22,
  ssh_username TEXT,
  ssh_private_key_encrypted TEXT,
  ssh_passphrase_encrypted TEXT,

  -- Metadata
  notes TEXT,
  test_connection_status TEXT, -- 'untested', 'success', 'failed'
  last_verified_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  deactivated_reason TEXT,

  CONSTRAINT unique_company_platform UNIQUE(company_id, platform_type),
  CONSTRAINT valid_platform_type CHECK (platform_type IN ('wordpress', 'shopify', 'next', 'static', 'custom', 'react', 'vue')),
  CONSTRAINT valid_access_method CHECK (primary_access_method IN ('wp_rest_api', 'wp_admin', 'ftp', 'sftp', 'github', 'cpanel', 'vercel', 'shopify_api', 'ssh')),
  CONSTRAINT valid_test_status CHECK (test_connection_status IN ('untested', 'success', 'failed'))
);

CREATE INDEX idx_website_credentials_company_id ON website_credentials(company_id);
CREATE INDEX idx_website_credentials_active ON website_credentials(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE website_credentials IS 'Securely stores encrypted credentials for automated website access';
COMMENT ON COLUMN website_credentials.wp_app_password_encrypted IS 'WordPress Application Password (preferred over admin password)';
COMMENT ON COLUMN website_credentials.ftp_protocol IS 'FTP protocol: ftp (insecure), sftp (secure), ftps (FTP over SSL)';

-- =====================================================
-- 2. AGENT TASKS (Audit-Driven Automation)
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  audit_id UUID REFERENCES seo_audits(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES agent_tasks(id), -- For subtasks
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_at TIMESTAMP WITH TIME ZONE, -- For delayed execution
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Task classification
  task_type TEXT NOT NULL, -- 'add_h1_tag', 'optimize_images', 'add_alt_text', etc.
  category TEXT NOT NULL, -- 'content', 'performance', 'seo', 'accessibility', 'security'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'requires_review', 'rolled_back'

  -- Target details
  page_url TEXT, -- URL of page to modify
  element_selector TEXT, -- CSS selector for targeted changes (e.g., 'main h1')
  target_files TEXT[], -- Array of file paths to modify

  -- Task instructions (JSON)
  instructions JSONB NOT NULL,
  /* Example structure:
  {
    "action": "add_element",
    "element": "h1",
    "content": "Professional Water Damage Restoration",
    "position": "before_first_paragraph",
    "context": "Add H1 to improve page structure and SEO"
  }
  */

  -- Execution details
  agent_type TEXT, -- 'claude_computer_use', 'wp_rest_api', 'github_copilot', 'ftp_script', 'custom_script'
  estimated_time_seconds INTEGER,
  actual_time_seconds INTEGER,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Execution logs (structured)
  agent_execution_logs JSONB DEFAULT '[]',
  /* Example log entry:
  {
    "timestamp": "2025-01-11T14:30:00Z",
    "level": "info",
    "message": "Logged into WordPress admin",
    "step": 1,
    "progress_pct": 20
  }
  */

  -- Results
  success BOOLEAN,
  error_message TEXT,
  error_code TEXT, -- 'auth_failed', 'timeout', 'network_error', etc.
  before_snapshot TEXT, -- URL to screenshot or content backup
  after_snapshot TEXT,
  before_content_hash TEXT, -- SHA256 of original content
  after_content_hash TEXT, -- SHA256 of modified content

  -- Performance impact
  performance_impact JSONB,
  /* Example:
  {
    "score_before": 67,
    "score_after": 87,
    "improvement": 20,
    "metrics_changed": ["performance", "seo"]
  }
  */

  -- Approval workflow
  requires_approval BOOLEAN DEFAULT FALSE,
  approval_reason TEXT, -- Why approval is needed
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  -- Rollback capability
  rollback_data JSONB,
  rolled_back_at TIMESTAMP WITH TIME ZONE,
  rolled_back_by UUID REFERENCES auth.users(id),

  -- Metadata
  tags TEXT[], -- ['automated', 'high-impact', 'content-change']
  cost_usd DECIMAL(10, 4), -- Cost of execution (API calls, agent time)

  CONSTRAINT valid_priority CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'requires_review', 'rolled_back', 'cancelled')),
  CONSTRAINT valid_category CHECK (category IN ('content', 'performance', 'seo', 'accessibility', 'security', 'ux', 'technical'))
);

CREATE INDEX idx_agent_tasks_company_id ON agent_tasks(company_id);
CREATE INDEX idx_agent_tasks_audit_id ON agent_tasks(audit_id);
CREATE INDEX idx_agent_tasks_status ON agent_tasks(status) WHERE status IN ('pending', 'in_progress');
CREATE INDEX idx_agent_tasks_priority ON agent_tasks(priority) WHERE priority IN ('critical', 'high');
CREATE INDEX idx_agent_tasks_created_at ON agent_tasks(created_at DESC);
CREATE INDEX idx_agent_tasks_parent ON agent_tasks(parent_task_id);

COMMENT ON TABLE agent_tasks IS 'AI agent tasks generated from audit findings for automated website fixes';
COMMENT ON COLUMN agent_tasks.task_type IS 'Specific task identifier (e.g., add_h1_tag, optimize_images)';
COMMENT ON COLUMN agent_tasks.requires_approval IS 'High-risk tasks require human approval before execution';

-- =====================================================
-- 3. TASK EXECUTION LOGS (Detailed Audit Trail)
-- =====================================================

CREATE TABLE IF NOT EXISTS task_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  log_level TEXT NOT NULL, -- 'debug', 'info', 'warning', 'error', 'success'
  message TEXT NOT NULL,
  step_number INTEGER,
  progress_pct INTEGER,

  -- Additional context
  metadata JSONB,
  /* Example:
  {
    "url_accessed": "https://example.com/wp-admin",
    "http_status": 200,
    "files_modified": ["index.php"],
    "api_response": {...}
  }
  */

  CONSTRAINT valid_log_level CHECK (log_level IN ('debug', 'info', 'warning', 'error', 'success')),
  CONSTRAINT valid_progress_pct CHECK (progress_pct BETWEEN 0 AND 100)
);

CREATE INDEX idx_task_execution_logs_task_id ON task_execution_logs(task_id);
CREATE INDEX idx_task_execution_logs_timestamp ON task_execution_logs(timestamp DESC);
CREATE INDEX idx_task_execution_logs_level ON task_execution_logs(log_level) WHERE log_level IN ('error', 'warning');

COMMENT ON TABLE task_execution_logs IS 'Detailed execution logs for agent tasks (debugging and audit trail)';

-- =====================================================
-- 4. TASK TEMPLATES (Reusable Task Definitions)
-- =====================================================

CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  task_type TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  default_priority TEXT NOT NULL DEFAULT 'medium',

  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Template instructions (with placeholders)
  instructions_template JSONB NOT NULL,
  /* Example:
  {
    "action": "add_element",
    "element": "{{element_type}}",
    "content": "{{content}}",
    "position": "{{position}}"
  }
  */

  -- Agent compatibility
  compatible_agents TEXT[] NOT NULL, -- ['wp_rest_api', 'ftp_script']
  preferred_agent TEXT NOT NULL,

  -- Risk assessment
  risk_level TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  requires_approval BOOLEAN DEFAULT FALSE,
  requires_backup BOOLEAN DEFAULT TRUE,

  -- Execution estimates
  estimated_time_seconds INTEGER NOT NULL,
  estimated_cost_usd DECIMAL(10, 4) DEFAULT 0,

  -- Validation
  success_criteria JSONB,
  rollback_available BOOLEAN DEFAULT TRUE,

  is_active BOOLEAN DEFAULT TRUE,

  CONSTRAINT valid_risk_level CHECK (risk_level IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX idx_task_templates_task_type ON task_templates(task_type);
CREATE INDEX idx_task_templates_category ON task_templates(category);

COMMENT ON TABLE task_templates IS 'Reusable task definitions for common SEO/web fixes';

-- =====================================================
-- 5. CREDENTIALS ACCESS LOG (Security Audit)
-- =====================================================

CREATE TABLE IF NOT EXISTS credentials_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL REFERENCES website_credentials(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  accessed_by UUID REFERENCES auth.users(id),
  access_type TEXT NOT NULL, -- 'view', 'edit', 'test', 'use_in_task'
  task_id UUID REFERENCES agent_tasks(id),

  ip_address INET,
  user_agent TEXT,

  success BOOLEAN NOT NULL,
  error_message TEXT,

  CONSTRAINT valid_access_type CHECK (access_type IN ('view', 'edit', 'test', 'delete', 'use_in_task'))
);

CREATE INDEX idx_credentials_access_log_credential_id ON credentials_access_log(credential_id);
CREATE INDEX idx_credentials_access_log_accessed_at ON credentials_access_log(accessed_at DESC);

COMMENT ON TABLE credentials_access_log IS 'Audit trail for all credential access (security & compliance)';

-- =====================================================
-- 6. AUTOMATION RULES (Trigger-Based Execution)
-- =====================================================

CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  rule_name TEXT NOT NULL,
  description TEXT,

  -- Trigger conditions
  trigger_type TEXT NOT NULL, -- 'audit_completed', 'score_dropped', 'schedule', 'manual'
  trigger_conditions JSONB,
  /* Example:
  {
    "audit_score_below": 75,
    "categories": ["performance", "seo"],
    "priority_minimum": "high"
  }
  */

  -- Actions to take
  auto_create_tasks BOOLEAN DEFAULT TRUE,
  auto_execute_tasks BOOLEAN DEFAULT FALSE,
  require_approval BOOLEAN DEFAULT TRUE,

  -- Task filters
  task_types_included TEXT[], -- Only create these task types
  task_types_excluded TEXT[], -- Never create these task types
  max_tasks_per_audit INTEGER DEFAULT 20,
  priority_threshold TEXT DEFAULT 'medium', -- Only create tasks above this priority

  is_active BOOLEAN DEFAULT TRUE,

  CONSTRAINT valid_trigger_type CHECK (trigger_type IN ('audit_completed', 'score_dropped', 'schedule', 'manual', 'webhook'))
);

CREATE INDEX idx_automation_rules_company_id ON automation_rules(company_id);
CREATE INDEX idx_automation_rules_trigger_type ON automation_rules(trigger_type) WHERE is_active = TRUE;

COMMENT ON TABLE automation_rules IS 'Defines when and how to automatically create/execute tasks';

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

-- Update timestamp on website_credentials update
CREATE OR REPLACE FUNCTION update_website_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_website_credentials_updated_at
  BEFORE UPDATE ON website_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_website_credentials_updated_at();

-- Update timestamp on agent_tasks update
CREATE OR REPLACE FUNCTION update_agent_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agent_tasks_updated_at
  BEFORE UPDATE ON agent_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_tasks_updated_at();

-- Log credentials access automatically
CREATE OR REPLACE FUNCTION log_credentials_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO credentials_access_log (credential_id, access_type, success)
  VALUES (NEW.id, 'view', TRUE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Actual access logging should be done at application level for better control
