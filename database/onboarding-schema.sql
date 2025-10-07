-- =====================================================
-- Client Onboarding System Schema
-- =====================================================
--
-- Tracks end-to-end automated client onboarding process:
-- - Onboarding sessions with progress tracking
-- - Content calendar generation
-- - Workspace setup records
-- - Integration with existing companies/audits tables
-- =====================================================

-- =====================================================
-- Onboarding Sessions
-- Tracks each client onboarding workflow
-- =====================================================
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id TEXT PRIMARY KEY,
  company_id TEXT,

  -- Business Information
  business_name TEXT NOT NULL,
  industry TEXT,
  email TEXT NOT NULL,
  phone TEXT,

  -- Progress Tracking
  status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'completed', 'failed')),
  current_step TEXT,

  -- Request Data (full intake form)
  request_data TEXT, -- JSON: ClientIntakeData

  -- Step Progress Data
  steps_data TEXT, -- JSON: OnboardingStep[]

  -- Error Tracking
  error TEXT,

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  started_at TEXT,
  completed_at TEXT,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_onboarding_status ON onboarding_sessions(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_email ON onboarding_sessions(email);
CREATE INDEX IF NOT EXISTS idx_onboarding_created ON onboarding_sessions(created_at DESC);

-- =====================================================
-- Content Calendar
-- Tracks planned and published content for each company
-- =====================================================
CREATE TABLE IF NOT EXISTS content_calendar (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,

  -- Content Details
  publish_date TEXT NOT NULL,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'Blog post', 'Landing page', 'Product description', etc.
  target_keyword TEXT,

  -- Content Body
  content TEXT, -- Full content (when created)
  excerpt TEXT, -- Short summary

  -- SEO Meta
  meta_title TEXT,
  meta_description TEXT,
  slug TEXT,

  -- Status Tracking
  status TEXT NOT NULL CHECK(status IN ('planned', 'in_progress', 'review', 'approved', 'published', 'archived')),
  assigned_to TEXT, -- User ID

  -- Publishing
  published_url TEXT,
  published_at TEXT,

  -- Analytics
  views INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_company ON content_calendar(company_id);
CREATE INDEX IF NOT EXISTS idx_content_publish_date ON content_calendar(publish_date);
CREATE INDEX IF NOT EXISTS idx_content_status ON content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_content_assigned ON content_calendar(assigned_to);

-- =====================================================
-- Workspace Configurations
-- Stores workspace setup details for each company
-- =====================================================
CREATE TABLE IF NOT EXISTS workspace_configs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL UNIQUE,

  -- Workspace Details
  workspace_path TEXT NOT NULL,
  workspace_id TEXT NOT NULL,

  -- Configuration (JSON)
  config_data TEXT, -- JSON: workspace settings, preferences, integrations

  -- Feature Flags
  features_enabled TEXT, -- JSON: array of enabled features

  -- Access Control
  access_level TEXT DEFAULT 'standard' CHECK(access_level IN ('basic', 'standard', 'premium', 'enterprise')),

  -- Storage
  storage_used_mb REAL DEFAULT 0,
  storage_limit_mb REAL DEFAULT 1000,

  -- Status
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)),

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workspace_company ON workspace_configs(company_id);
CREATE INDEX IF NOT EXISTS idx_workspace_active ON workspace_configs(active);

-- =====================================================
-- Onboarding Templates
-- Pre-defined templates for different industries/use cases
-- =====================================================
CREATE TABLE IF NOT EXISTS onboarding_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT, -- Target industry

  -- Template Configuration (JSON)
  template_data TEXT NOT NULL, -- JSON: default settings, workflows, content plans

  -- Content Defaults
  default_content_types TEXT, -- JSON: array of content types
  default_frequency TEXT, -- 'daily', 'weekly', 'bi-weekly', 'monthly'

  -- SEO Defaults
  default_goals TEXT, -- JSON: array of goals

  -- Active/Featured
  active INTEGER DEFAULT 1 CHECK(active IN (0, 1)),
  featured INTEGER DEFAULT 0 CHECK(featured IN (0, 1)),

  -- Usage Stats
  times_used INTEGER DEFAULT 0,

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_templates_industry ON onboarding_templates(industry);
CREATE INDEX IF NOT EXISTS idx_templates_active ON onboarding_templates(active);
CREATE INDEX IF NOT EXISTS idx_templates_featured ON onboarding_templates(featured);

-- =====================================================
-- Onboarding Notifications
-- Tracks notifications sent during onboarding
-- =====================================================
CREATE TABLE IF NOT EXISTS onboarding_notifications (
  id TEXT PRIMARY KEY,
  onboarding_id TEXT NOT NULL,

  -- Notification Details
  type TEXT NOT NULL CHECK(type IN ('email', 'sms', 'slack', 'webhook')),
  recipient TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,

  -- Status
  status TEXT NOT NULL CHECK(status IN ('pending', 'sent', 'failed', 'bounced')),
  error TEXT,

  -- External IDs
  provider TEXT, -- 'resend', 'sendgrid', 'twilio', etc.
  provider_message_id TEXT,

  -- Engagement
  opened INTEGER DEFAULT 0 CHECK(opened IN (0, 1)),
  opened_at TEXT,
  clicked INTEGER DEFAULT 0 CHECK(clicked IN (0, 1)),
  clicked_at TEXT,

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at TEXT,

  FOREIGN KEY (onboarding_id) REFERENCES onboarding_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_onboarding ON onboarding_notifications(onboarding_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON onboarding_notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON onboarding_notifications(type);

-- =====================================================
-- Company Extended Data
-- Additional fields for onboarding (extends companies table)
-- =====================================================
-- Note: These are added to the existing companies table via ALTER TABLE

-- Add onboarding-specific columns if they don't exist
-- SQLite doesn't support ADD COLUMN IF NOT EXISTS, so we'll use a workaround

-- Check if columns exist first, then add them
-- This should be run after the main companies table is created

-- ALTER TABLE companies ADD COLUMN primary_goals TEXT; -- JSON array
-- ALTER TABLE companies ADD COLUMN target_keywords TEXT; -- JSON array
-- ALTER TABLE companies ADD COLUMN target_locations TEXT; -- JSON array
-- ALTER TABLE companies ADD COLUMN content_frequency TEXT; -- 'daily', 'weekly', etc.
-- ALTER TABLE companies ADD COLUMN brand_voice TEXT;
-- ALTER TABLE companies ADD COLUMN budget TEXT;
-- ALTER TABLE companies ADD COLUMN onboarding_completed INTEGER DEFAULT 0;
-- ALTER TABLE companies ADD COLUMN onboarding_date TEXT;

-- =====================================================
-- Views for Reporting
-- =====================================================

-- Recent Onboardings View
CREATE VIEW IF NOT EXISTS v_recent_onboardings AS
SELECT
  o.id,
  o.business_name,
  o.email,
  o.status,
  o.current_step,
  o.created_at,
  o.completed_at,
  c.id as company_id,
  c.name as company_name,
  CASE
    WHEN o.status = 'completed' THEN 100
    WHEN o.steps_data IS NOT NULL THEN
      (SELECT COUNT(*) FROM json_each(o.steps_data) WHERE json_extract(value, '$.status') = 'completed') * 100 /
      (SELECT COUNT(*) FROM json_each(o.steps_data))
    ELSE 0
  END as progress_percentage
FROM onboarding_sessions o
LEFT JOIN companies c ON o.company_id = c.id
ORDER BY o.created_at DESC;

-- Content Calendar Summary View
CREATE VIEW IF NOT EXISTS v_content_calendar_summary AS
SELECT
  company_id,
  COUNT(*) as total_items,
  SUM(CASE WHEN status = 'planned' THEN 1 ELSE 0 END) as planned,
  SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
  SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
  SUM(CASE WHEN date(publish_date) <= date('now') AND status = 'planned' THEN 1 ELSE 0 END) as overdue,
  MIN(publish_date) as next_publish_date
FROM content_calendar
GROUP BY company_id;

-- Workspace Usage View
CREATE VIEW IF NOT EXISTS v_workspace_usage AS
SELECT
  w.company_id,
  c.name as company_name,
  w.workspace_path,
  w.storage_used_mb,
  w.storage_limit_mb,
  ROUND((w.storage_used_mb * 100.0 / w.storage_limit_mb), 2) as storage_usage_percentage,
  w.access_level,
  w.active,
  w.created_at
FROM workspace_configs w
JOIN companies c ON w.company_id = c.id
WHERE w.active = 1
ORDER BY w.storage_used_mb DESC;

-- =====================================================
-- Triggers
-- =====================================================

-- Update workspace config updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_workspace_config_timestamp
AFTER UPDATE ON workspace_configs
BEGIN
  UPDATE workspace_configs
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;

-- Update content calendar updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_content_calendar_timestamp
AFTER UPDATE ON content_calendar
BEGIN
  UPDATE content_calendar
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;

-- Increment template usage count
CREATE TRIGGER IF NOT EXISTS increment_template_usage
AFTER INSERT ON onboarding_sessions
WHEN NEW.request_data LIKE '%"template_id"%'
BEGIN
  UPDATE onboarding_templates
  SET times_used = times_used + 1,
      updated_at = datetime('now')
  WHERE id = json_extract(NEW.request_data, '$.template_id');
END;

-- =====================================================
-- Sample Data (Optional - for testing)
-- =====================================================

-- Insert default onboarding template
INSERT OR IGNORE INTO onboarding_templates (
  id, name, description, industry, template_data,
  default_content_types, default_frequency, default_goals,
  active, featured
) VALUES (
  'template_default',
  'Standard SEO Package',
  'Complete SEO setup with blog content and local optimization',
  'General',
  '{"steps": ["audit", "content", "local_seo"], "duration_days": 90}',
  '["Blog posts", "Landing pages", "Service pages"]',
  'weekly',
  '["Increase organic traffic", "Improve search rankings", "Generate more leads"]',
  1,
  1
);
