-- Post-Audit Automation System Schema (SQLite)
-- Simplified version for local development

-- =====================================================
-- 1. WEBSITE CREDENTIALS
-- =====================================================

CREATE TABLE IF NOT EXISTS website_credentials (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),

  -- Platform identification
  platform_type TEXT NOT NULL CHECK(platform_type IN ('wordpress', 'shopify', 'next', 'static', 'custom', 'react', 'vue')),
  platform_version TEXT,
  primary_access_method TEXT NOT NULL CHECK(primary_access_method IN ('wp_rest_api', 'wp_admin', 'ftp', 'sftp', 'github', 'cpanel', 'vercel', 'shopify_api', 'ssh')),

  -- WordPress Credentials
  wp_url TEXT,
  wp_username TEXT,
  wp_app_password_encrypted TEXT,
  wp_password_encrypted TEXT,

  -- FTP/SFTP Credentials
  ftp_host TEXT,
  ftp_port INTEGER DEFAULT 21,
  ftp_username TEXT,
  ftp_password_encrypted TEXT,
  ftp_root_path TEXT DEFAULT '/',
  ftp_protocol TEXT DEFAULT 'ftp',

  -- cPanel/Hosting Credentials
  cpanel_url TEXT,
  cpanel_username TEXT,
  cpanel_api_token_encrypted TEXT,

  -- GitHub Credentials
  github_repo TEXT,
  github_token_encrypted TEXT,
  github_branch TEXT DEFAULT 'main',
  github_auto_pr INTEGER DEFAULT 1,

  -- Vercel Credentials
  vercel_project_id TEXT,
  vercel_token_encrypted TEXT,

  -- Shopify Credentials
  shopify_store_url TEXT,
  shopify_access_token_encrypted TEXT,
  shopify_api_version TEXT DEFAULT '2024-01',

  -- SSH Credentials
  ssh_host TEXT,
  ssh_port INTEGER DEFAULT 22,
  ssh_username TEXT,
  ssh_private_key_encrypted TEXT,
  ssh_passphrase_encrypted TEXT,

  -- Metadata
  notes TEXT,
  test_connection_status TEXT DEFAULT 'untested' CHECK(test_connection_status IN ('untested', 'success', 'failed')),
  last_verified_at DATETIME,
  last_used_at DATETIME,
  is_active INTEGER DEFAULT 1,
  deactivated_reason TEXT,

  UNIQUE(company_id, platform_type)
);

CREATE INDEX IF NOT EXISTS idx_website_credentials_company_id ON website_credentials(company_id);
CREATE INDEX IF NOT EXISTS idx_website_credentials_active ON website_credentials(is_active) WHERE is_active = 1;

-- =====================================================
-- 2. AGENT TASKS
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_tasks (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  audit_id TEXT REFERENCES seo_audits(id) ON DELETE SET NULL,
  parent_task_id TEXT REFERENCES agent_tasks(id),
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
  scheduled_at DATETIME,
  started_at DATETIME,
  completed_at DATETIME,

  -- Task classification
  task_type TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('content', 'performance', 'seo', 'accessibility', 'security', 'ux', 'technical')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'failed', 'requires_review', 'rolled_back', 'cancelled')),

  -- Target details
  page_url TEXT,
  element_selector TEXT,
  target_files TEXT, -- JSON array as TEXT

  -- Task instructions (JSON)
  instructions TEXT NOT NULL, -- JSON

  -- Execution details
  agent_type TEXT,
  estimated_time_seconds INTEGER,
  actual_time_seconds INTEGER,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Execution logs (structured)
  agent_execution_logs TEXT DEFAULT '[]', -- JSON

  -- Results
  success INTEGER,
  error_message TEXT,
  error_code TEXT,
  before_snapshot TEXT,
  after_snapshot TEXT,
  before_content_hash TEXT,
  after_content_hash TEXT,

  -- Performance impact
  performance_impact TEXT, -- JSON

  -- Approval workflow
  requires_approval INTEGER DEFAULT 0,
  approval_reason TEXT,
  approved_by TEXT,
  approved_at DATETIME,
  rejected_by TEXT,
  rejected_at DATETIME,
  rejection_reason TEXT,

  -- Rollback capability
  rollback_data TEXT, -- JSON
  rolled_back_at DATETIME,
  rolled_back_by TEXT,

  -- Metadata
  tags TEXT, -- JSON array
  cost_usd REAL
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_company_id ON agent_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_audit_id ON agent_tasks(audit_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status) WHERE status IN ('pending', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_agent_tasks_priority ON agent_tasks(priority) WHERE priority IN ('critical', 'high');
CREATE INDEX IF NOT EXISTS idx_agent_tasks_created_at ON agent_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_parent ON agent_tasks(parent_task_id);

-- =====================================================
-- 3. TASK EXECUTION LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS task_execution_logs (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,
  timestamp DATETIME DEFAULT (datetime('now')),

  log_level TEXT NOT NULL CHECK(log_level IN ('debug', 'info', 'warning', 'error', 'success')),
  message TEXT NOT NULL,
  step_number INTEGER,
  progress_pct INTEGER CHECK(progress_pct BETWEEN 0 AND 100),

  -- Additional context
  metadata TEXT -- JSON
);

CREATE INDEX IF NOT EXISTS idx_task_execution_logs_task_id ON task_execution_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_execution_logs_timestamp ON task_execution_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_task_execution_logs_level ON task_execution_logs(log_level) WHERE log_level IN ('error', 'warning');

-- =====================================================
-- 4. TASK TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS task_templates (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),

  task_type TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  default_priority TEXT NOT NULL DEFAULT 'medium',

  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Template instructions (with placeholders)
  instructions_template TEXT NOT NULL, -- JSON

  -- Agent compatibility
  compatible_agents TEXT NOT NULL, -- JSON array
  preferred_agent TEXT NOT NULL,

  -- Risk assessment
  risk_level TEXT NOT NULL DEFAULT 'medium' CHECK(risk_level IN ('low', 'medium', 'high', 'critical')),
  requires_approval INTEGER DEFAULT 0,
  requires_backup INTEGER DEFAULT 1,

  -- Execution estimates
  estimated_time_seconds INTEGER NOT NULL,
  estimated_cost_usd REAL DEFAULT 0,

  -- Validation
  success_criteria TEXT, -- JSON
  rollback_available INTEGER DEFAULT 1,

  is_active INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_task_templates_task_type ON task_templates(task_type);
CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_templates(category);

-- =====================================================
-- 5. CREDENTIALS ACCESS LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS credentials_access_log (
  id TEXT PRIMARY KEY,
  credential_id TEXT NOT NULL REFERENCES website_credentials(id) ON DELETE CASCADE,
  accessed_at DATETIME DEFAULT (datetime('now')),

  accessed_by TEXT,
  access_type TEXT NOT NULL CHECK(access_type IN ('view', 'edit', 'test', 'delete', 'use_in_task')),
  task_id TEXT REFERENCES agent_tasks(id),

  ip_address TEXT,
  user_agent TEXT,

  success INTEGER NOT NULL,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_credentials_access_log_credential_id ON credentials_access_log(credential_id);
CREATE INDEX IF NOT EXISTS idx_credentials_access_log_accessed_at ON credentials_access_log(accessed_at DESC);

-- =====================================================
-- 6. AUTOMATION RULES
-- =====================================================

CREATE TABLE IF NOT EXISTS automation_rules (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),

  rule_name TEXT NOT NULL,
  description TEXT,

  -- Trigger conditions
  trigger_type TEXT NOT NULL CHECK(trigger_type IN ('audit_completed', 'score_dropped', 'schedule', 'manual', 'webhook')),
  trigger_conditions TEXT, -- JSON

  -- Actions to take
  auto_create_tasks INTEGER DEFAULT 1,
  auto_execute_tasks INTEGER DEFAULT 0,
  require_approval INTEGER DEFAULT 1,

  -- Task filters
  task_types_included TEXT, -- JSON array
  task_types_excluded TEXT, -- JSON array
  max_tasks_per_audit INTEGER DEFAULT 20,
  priority_threshold TEXT DEFAULT 'medium',

  is_active INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_company_id ON automation_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger_type ON automation_rules(trigger_type) WHERE is_active = 1;

-- =====================================================
-- TRIGGERS (SQLite)
-- =====================================================

-- Update timestamp on website_credentials update
CREATE TRIGGER IF NOT EXISTS trigger_update_website_credentials_updated_at
  AFTER UPDATE ON website_credentials
  FOR EACH ROW
BEGIN
  UPDATE website_credentials SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Update timestamp on agent_tasks update
CREATE TRIGGER IF NOT EXISTS trigger_update_agent_tasks_updated_at
  AFTER UPDATE ON agent_tasks
  FOR EACH ROW
BEGIN
  UPDATE agent_tasks SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Success message
SELECT '✅ Successfully created 6 post-audit automation tables!' as result;
