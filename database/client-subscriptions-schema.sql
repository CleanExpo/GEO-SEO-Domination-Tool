-- ============================================================================
-- CLIENT SUBSCRIPTIONS & AUTONOMOUS TASK ALLOCATION SCHEMA
-- ============================================================================
-- Purpose: Manage client spend tiers and autonomous task generation
-- Vision: Monthly budget → Task quotas → Background execution → Results
-- ============================================================================

-- ============================================================================
-- SUBSCRIPTION TIERS & PRICING
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_tiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Tier Information
  name TEXT NOT NULL UNIQUE,            -- 'Starter', 'Growth', 'Scale', 'Empire'
  display_name TEXT NOT NULL,           -- Display in UI
  description TEXT,
  monthly_price_usd DECIMAL(10, 2) NOT NULL,

  -- Task Quotas (Monthly)
  seo_audits_per_month INTEGER DEFAULT 0,
  blog_posts_per_month INTEGER DEFAULT 0,
  social_posts_per_month INTEGER DEFAULT 0,
  research_papers_per_month INTEGER DEFAULT 0,
  gmb_posts_per_month INTEGER DEFAULT 0,
  white_papers_per_month INTEGER DEFAULT 0,

  -- Monitoring & Analysis
  competitor_monitoring_frequency TEXT DEFAULT 'weekly', -- 'daily', '3x_week', 'weekly', 'monthly'
  keyword_tracking_enabled BOOLEAN DEFAULT 1,
  backlink_monitoring_enabled BOOLEAN DEFAULT 0,

  -- Automation Features
  autopilot_enabled BOOLEAN DEFAULT 1,
  auto_publish_enabled BOOLEAN DEFAULT 0,    -- Auto-publish without approval
  ruler_quality_threshold INTEGER DEFAULT 85, -- Minimum quality score to publish

  -- Priority & Limits
  priority_level INTEGER DEFAULT 1,      -- Higher tiers get priority in queue
  max_concurrent_tasks INTEGER DEFAULT 3, -- How many tasks can run simultaneously

  -- Metadata
  is_active BOOLEAN DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate tiers
INSERT INTO subscription_tiers (name, display_name, description, monthly_price_usd,
  seo_audits_per_month, blog_posts_per_month, social_posts_per_month, research_papers_per_month,
  gmb_posts_per_month, white_papers_per_month, competitor_monitoring_frequency,
  autopilot_enabled, auto_publish_enabled, ruler_quality_threshold, priority_level, max_concurrent_tasks, display_order)
VALUES
  ('starter', 'Starter', 'Perfect for small businesses starting their SEO journey', 500.00,
    2, 4, 20, 0, 8, 0, 'weekly', 1, 0, 85, 1, 2, 1),
  ('growth', 'Growth', 'Ideal for growing businesses ready to scale their online presence', 1000.00,
    4, 8, 40, 1, 16, 0, '3x_week', 1, 1, 80, 2, 3, 2),
  ('scale', 'Scale', 'For established businesses dominating their market', 2500.00,
    8, 16, 80, 2, 32, 1, 'daily', 1, 1, 75, 3, 5, 3),
  ('empire', 'Empire', 'Industry leaders building unassailable authority', 5000.00,
    16, 32, 160, 4, 64, 2, 'realtime', 1, 1, 70, 4, 10, 4);

-- ============================================================================
-- CLIENT SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Client Link
  company_id INTEGER NOT NULL,          -- FK to companies table
  portfolio_id INTEGER,                 -- FK to company_portfolios (if using Empire CRM)

  -- Subscription Details
  tier_id INTEGER NOT NULL,
  tier_name TEXT NOT NULL,              -- Denormalized for quick access
  monthly_spend_usd DECIMAL(10, 2) NOT NULL,

  -- Status
  status TEXT DEFAULT 'active',         -- 'active', 'paused', 'cancelled', 'expired'
  autopilot_status TEXT DEFAULT 'active', -- 'active', 'paused' (can pause without cancelling)

  -- Billing
  billing_cycle TEXT DEFAULT 'monthly', -- 'monthly', 'annual'
  billing_day INTEGER DEFAULT 1,        -- Day of month to bill (1-28)
  next_billing_date DATE,
  last_billing_date DATE,

  -- Task Quotas (Copied from tier, can be customized)
  seo_audits_quota INTEGER,
  blog_posts_quota INTEGER,
  social_posts_quota INTEGER,
  research_papers_quota INTEGER,
  gmb_posts_quota INTEGER,
  white_papers_quota INTEGER,

  -- Usage Tracking (Current Month)
  seo_audits_used INTEGER DEFAULT 0,
  blog_posts_used INTEGER DEFAULT 0,
  social_posts_used INTEGER DEFAULT 0,
  research_papers_used INTEGER DEFAULT 0,
  gmb_posts_used INTEGER DEFAULT 0,
  white_papers_used INTEGER DEFAULT 0,

  -- Preferences
  preferred_content_topics TEXT,        -- JSON array
  target_keywords TEXT,                 -- JSON array
  competitor_urls TEXT,                 -- JSON array
  exclude_days TEXT,                    -- JSON array of dates to skip
  notification_email TEXT,
  weekly_report_enabled BOOLEAN DEFAULT 1,

  -- Performance Metrics
  total_tasks_completed INTEGER DEFAULT 0,
  avg_ruler_score DECIMAL(5, 2),
  seo_score_change DECIMAL(5, 2),      -- Month-over-month change

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activated_at TIMESTAMP,
  paused_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (tier_id) REFERENCES subscription_tiers(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON client_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON client_subscriptions(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_subscriptions_autopilot ON client_subscriptions(autopilot_status) WHERE autopilot_status = 'active';
CREATE INDEX IF NOT EXISTS idx_subscriptions_billing ON client_subscriptions(next_billing_date);

-- ============================================================================
-- TASK EXECUTION CALENDAR (30-Day Schedule)
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_execution_calendar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Subscription Link
  subscription_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL,

  -- Schedule Details
  scheduled_date DATE NOT NULL,
  scheduled_time TIME DEFAULT '09:00:00', -- Time of day to execute

  -- Task Configuration
  task_type TEXT NOT NULL,              -- 'seo_audit', 'blog_post', 'social_post', 'research_paper', etc.
  task_category TEXT,                   -- 'seo', 'content', 'social', 'research'
  priority TEXT DEFAULT 'medium',       -- 'low', 'medium', 'high', 'urgent'

  -- Task Metadata
  task_config TEXT,                     -- JSON: keyword, topic, platform, etc.
  -- Example: {"keyword": "fire damage restoration", "word_count": 2000, "publish_to": ["website", "linkedin"]}

  -- Execution Status
  status TEXT DEFAULT 'scheduled',      -- 'scheduled', 'created', 'executing', 'completed', 'failed', 'skipped'
  autonomous_task_id INTEGER,           -- FK to autonomous_tasks once created

  -- Results
  result_summary TEXT,                  -- JSON: brief results
  ruler_score INTEGER,

  -- Timing
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  execution_started_at TIMESTAMP,
  execution_completed_at TIMESTAMP,

  FOREIGN KEY (subscription_id) REFERENCES client_subscriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (autonomous_task_id) REFERENCES autonomous_tasks(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_subscription ON task_execution_calendar(subscription_id);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON task_execution_calendar(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_calendar_status ON task_execution_calendar(status) WHERE status IN ('scheduled', 'created');
CREATE INDEX IF NOT EXISTS idx_calendar_pending ON task_execution_calendar(scheduled_date, status)
  WHERE status = 'scheduled' AND scheduled_date <= date('now', '+1 day');

-- ============================================================================
-- TASK ALLOCATION HISTORY (Monthly Snapshots)
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_allocation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Period
  subscription_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL,
  allocation_month DATE NOT NULL,       -- First day of month (e.g., 2025-10-01)

  -- Quotas Allocated
  seo_audits_allocated INTEGER DEFAULT 0,
  blog_posts_allocated INTEGER DEFAULT 0,
  social_posts_allocated INTEGER DEFAULT 0,
  research_papers_allocated INTEGER DEFAULT 0,
  gmb_posts_allocated INTEGER DEFAULT 0,
  white_papers_allocated INTEGER DEFAULT 0,

  -- Actual Usage
  seo_audits_completed INTEGER DEFAULT 0,
  blog_posts_completed INTEGER DEFAULT 0,
  social_posts_completed INTEGER DEFAULT 0,
  research_papers_completed INTEGER DEFAULT 0,
  gmb_posts_completed INTEGER DEFAULT 0,
  white_papers_completed INTEGER DEFAULT 0,

  -- Performance
  completion_rate DECIMAL(5, 2),        -- Percentage of allocated tasks completed
  avg_ruler_score DECIMAL(5, 2),
  total_tasks_scheduled INTEGER DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,

  -- Rollover (Unused tasks)
  tasks_rolled_over INTEGER DEFAULT 0,
  rollover_to_next_month BOOLEAN DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  finalized_at TIMESTAMP,               -- When month closed

  FOREIGN KEY (subscription_id) REFERENCES client_subscriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,

  UNIQUE(subscription_id, allocation_month)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_allocation_subscription ON task_allocation_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_allocation_month ON task_allocation_history(allocation_month DESC);

-- ============================================================================
-- AUTOPILOT EXECUTION LOG (Orchestration History)
-- ============================================================================

CREATE TABLE IF NOT EXISTS autopilot_execution_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Subscription Context
  subscription_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL,
  calendar_entry_id INTEGER,            -- FK to task_execution_calendar

  -- Execution Details
  execution_type TEXT NOT NULL,         -- 'scheduled', 'manual', 'retry'
  workflow_id TEXT,                     -- Orchestrator workflow used
  agents_involved TEXT,                 -- JSON array of agent IDs

  -- Status
  status TEXT DEFAULT 'initializing',   -- 'initializing', 'running', 'completed', 'failed'
  error_message TEXT,

  -- Results
  result_data TEXT,                     -- JSON: full results
  artifacts_created TEXT,               -- JSON: URLs, file paths, IDs
  impact_metrics TEXT,                  -- JSON: ranking changes, traffic, engagement

  -- Quality
  ruler_score INTEGER,
  auto_published BOOLEAN DEFAULT 0,
  requires_review BOOLEAN DEFAULT 0,

  -- Timing
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  duration_seconds INTEGER,

  FOREIGN KEY (subscription_id) REFERENCES client_subscriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (calendar_entry_id) REFERENCES task_execution_calendar(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_autopilot_log_subscription ON autopilot_execution_log(subscription_id);
CREATE INDEX IF NOT EXISTS idx_autopilot_log_status ON autopilot_execution_log(status);
CREATE INDEX IF NOT EXISTS idx_autopilot_log_date ON autopilot_execution_log(started_at DESC);

-- ============================================================================
-- SUBSCRIPTION EVENTS (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  subscription_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL,

  -- Event Details
  event_type TEXT NOT NULL,             -- 'created', 'activated', 'paused', 'resumed', 'cancelled', 'tier_upgraded', 'tier_downgraded'
  event_data TEXT,                      -- JSON: additional context

  -- Metadata
  triggered_by TEXT,                    -- 'user', 'system', 'autopilot'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (subscription_id) REFERENCES client_subscriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_subscription ON subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_date ON subscription_events(created_at DESC);

-- ============================================================================
-- AUTO-UPDATE TRIGGERS
-- ============================================================================

-- Reset monthly quotas on first of month
CREATE TRIGGER IF NOT EXISTS reset_monthly_quotas
AFTER INSERT ON task_allocation_history
WHEN NEW.allocation_month = date('now', 'start of month')
BEGIN
  UPDATE client_subscriptions
  SET
    seo_audits_used = 0,
    blog_posts_used = 0,
    social_posts_used = 0,
    research_papers_used = 0,
    gmb_posts_used = 0,
    white_papers_used = 0,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.subscription_id;
END;

-- Increment usage counters when calendar task completed
CREATE TRIGGER IF NOT EXISTS increment_usage_counters
AFTER UPDATE ON task_execution_calendar
WHEN NEW.status = 'completed' AND OLD.status != 'completed'
BEGIN
  UPDATE client_subscriptions
  SET
    seo_audits_used = seo_audits_used + CASE WHEN NEW.task_type = 'seo_audit' THEN 1 ELSE 0 END,
    blog_posts_used = blog_posts_used + CASE WHEN NEW.task_type = 'blog_post' THEN 1 ELSE 0 END,
    social_posts_used = social_posts_used + CASE WHEN NEW.task_type = 'social_post' THEN 1 ELSE 0 END,
    research_papers_used = research_papers_used + CASE WHEN NEW.task_type = 'research_paper' THEN 1 ELSE 0 END,
    gmb_posts_used = gmb_posts_used + CASE WHEN NEW.task_type = 'gmb_post' THEN 1 ELSE 0 END,
    white_papers_used = white_papers_used + CASE WHEN NEW.task_type = 'white_paper' THEN 1 ELSE 0 END,
    total_tasks_completed = total_tasks_completed + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.subscription_id;
END;

-- Log subscription events
CREATE TRIGGER IF NOT EXISTS log_subscription_status_change
AFTER UPDATE ON client_subscriptions
WHEN NEW.status != OLD.status OR NEW.autopilot_status != OLD.autopilot_status
BEGIN
  INSERT INTO subscription_events (subscription_id, company_id, event_type, event_data, triggered_by)
  VALUES (
    NEW.id,
    NEW.company_id,
    CASE
      WHEN NEW.status = 'paused' AND OLD.status = 'active' THEN 'paused'
      WHEN NEW.status = 'active' AND OLD.status = 'paused' THEN 'resumed'
      WHEN NEW.status = 'cancelled' THEN 'cancelled'
      WHEN NEW.autopilot_status != OLD.autopilot_status THEN 'autopilot_' || NEW.autopilot_status
      ELSE 'status_changed'
    END,
    json_object('old_status', OLD.status, 'new_status', NEW.status, 'old_autopilot', OLD.autopilot_status, 'new_autopilot', NEW.autopilot_status),
    'system'
  );
END;

-- ============================================================================
-- VIEWS FOR DASHBOARD
-- ============================================================================

-- Active subscriptions with current month progress
CREATE VIEW IF NOT EXISTS v_subscription_dashboard AS
SELECT
  s.id AS subscription_id,
  s.company_id,
  c.name AS company_name,
  s.tier_name,
  s.monthly_spend_usd,
  s.status,
  s.autopilot_status,

  -- Quotas
  s.seo_audits_quota,
  s.blog_posts_quota,
  s.social_posts_quota,
  s.research_papers_quota,
  s.gmb_posts_quota,

  -- Usage
  s.seo_audits_used,
  s.blog_posts_used,
  s.social_posts_used,
  s.research_papers_used,
  s.gmb_posts_used,

  -- Completion rates
  ROUND(CAST(s.seo_audits_used AS FLOAT) / NULLIF(s.seo_audits_quota, 0) * 100, 1) AS seo_audits_completion_pct,
  ROUND(CAST(s.blog_posts_used AS FLOAT) / NULLIF(s.blog_posts_quota, 0) * 100, 1) AS blog_posts_completion_pct,
  ROUND(CAST(s.social_posts_used AS FLOAT) / NULLIF(s.social_posts_quota, 0) * 100, 1) AS social_posts_completion_pct,

  -- Tasks scheduled this month
  (SELECT COUNT(*) FROM task_execution_calendar WHERE subscription_id = s.id AND scheduled_date >= date('now', 'start of month')) AS tasks_scheduled_this_month,
  (SELECT COUNT(*) FROM task_execution_calendar WHERE subscription_id = s.id AND scheduled_date >= date('now', 'start of month') AND status = 'completed') AS tasks_completed_this_month,

  -- Performance
  s.avg_ruler_score,
  s.seo_score_change,

  s.created_at,
  s.activated_at,
  s.next_billing_date
FROM client_subscriptions s
JOIN companies c ON s.company_id = c.id
WHERE s.status = 'active';

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
-- Total Tables: 7 (tiers, subscriptions, calendar, allocation history, execution log, events, + view)
-- Total Indexes: 15+
-- Total Triggers: 3
-- Status: Ready for ClientAutopilotAgent Integration
-- ============================================================================
