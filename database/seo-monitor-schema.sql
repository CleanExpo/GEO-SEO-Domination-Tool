-- =====================================================
-- SEO Autonomous Monitoring System Schema
-- =====================================================
--
-- This schema supports the Autonomous SEO Agent which:
-- - Schedules regular SEO audits (daily/weekly/monthly)
-- - Tracks audit history and results
-- - Generates weekly performance reports
-- - Stores recommendations and insights
-- =====================================================

-- =====================================================
-- SEO Audit Schedules
-- Stores monitoring schedules for each company
-- =====================================================
CREATE TABLE IF NOT EXISTS seo_audit_schedules (
  company_id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  website TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly')),
  next_run TEXT NOT NULL, -- ISO 8601 timestamp
  last_run TEXT, -- ISO 8601 timestamp
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_seo_schedules_active ON seo_audit_schedules(active);
CREATE INDEX IF NOT EXISTS idx_seo_schedules_next_run ON seo_audit_schedules(next_run);

-- =====================================================
-- SEO Audit Results
-- Stores detailed results from each audit execution
-- =====================================================
CREATE TABLE IF NOT EXISTS seo_audits (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  website TEXT NOT NULL,
  audit_type TEXT NOT NULL CHECK(audit_type IN ('scheduled', 'manual', 'triggered')),

  -- Lighthouse Scores (0-100)
  lighthouse_performance INTEGER,
  lighthouse_accessibility INTEGER,
  lighthouse_best_practices INTEGER,
  lighthouse_seo INTEGER,
  lighthouse_overall INTEGER,

  -- E-E-A-T Scores (0-100)
  eeat_experience INTEGER,
  eeat_expertise INTEGER,
  eeat_authoritativeness INTEGER,
  eeat_trustworthiness INTEGER,
  eeat_overall INTEGER,

  -- Overall SEO Health Score (0-100)
  overall_score INTEGER NOT NULL,

  -- Rankings Data (JSON array of keyword positions)
  rankings_data TEXT, -- JSON: [{"keyword": "...", "position": 5, "change": -2}]

  -- Issues Found (JSON array)
  issues_data TEXT, -- JSON: [{"severity": "critical", "category": "...", "description": "...", "recommendation": "..."}]

  -- Audit Metadata
  report_data TEXT, -- Full JSON report
  execution_time_ms INTEGER,
  agent_task_id TEXT, -- Reference to agent_tasks table

  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_task_id) REFERENCES agent_tasks(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_seo_audits_company ON seo_audits(company_id);
CREATE INDEX IF NOT EXISTS idx_seo_audits_created ON seo_audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_audits_score ON seo_audits(overall_score);

-- =====================================================
-- Weekly SEO Reports
-- Aggregated weekly performance reports
-- =====================================================
CREATE TABLE IF NOT EXISTS weekly_seo_reports (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  company_name TEXT NOT NULL,

  -- Week Range
  week_start TEXT NOT NULL, -- ISO 8601 date
  week_end TEXT NOT NULL, -- ISO 8601 date

  -- Summary Statistics (JSON)
  summary TEXT NOT NULL, -- JSON: {"overallScore": 85, "scoreChange": +5, "totalIssues": 12, "criticalIssues": 2, "rankingChanges": 8}

  -- AI-Generated Recommendations (JSON array)
  recommendations TEXT NOT NULL, -- JSON: ["Recommendation 1", "Recommendation 2", ...]

  -- Audit References
  audit_ids TEXT, -- JSON: ["audit_id_1", "audit_id_2", ...]

  -- Report Metadata
  generated_at TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at TEXT, -- When email was sent
  email_status TEXT CHECK(email_status IN ('pending', 'sent', 'failed', 'skipped')),
  email_error TEXT,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_company ON weekly_seo_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week ON weekly_seo_reports(week_start, week_end);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_created ON weekly_seo_reports(created_at DESC);

-- =====================================================
-- SEO Alert Rules
-- Configurable alert thresholds for autonomous monitoring
-- =====================================================
CREATE TABLE IF NOT EXISTS seo_alert_rules (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK(rule_type IN ('score_drop', 'ranking_drop', 'critical_issue', 'performance_degradation')),

  -- Threshold Configuration (JSON)
  threshold_config TEXT NOT NULL, -- JSON: {"metric": "overall_score", "operator": "<", "value": 70, "consecutive_checks": 2}

  -- Alert Configuration
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0, 1)),
  notify_email TEXT,
  notify_slack TEXT, -- Slack webhook URL
  notify_dashboard INTEGER DEFAULT 1,

  -- State Tracking
  last_triggered TEXT, -- ISO 8601 timestamp
  trigger_count INTEGER DEFAULT 0,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_company ON seo_alert_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON seo_alert_rules(enabled);

-- =====================================================
-- SEO Alert History
-- Log of triggered alerts
-- =====================================================
CREATE TABLE IF NOT EXISTS seo_alert_history (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  audit_id TEXT,

  -- Alert Details
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  details TEXT, -- JSON with context

  -- Notification Status
  email_sent INTEGER DEFAULT 0,
  slack_sent INTEGER DEFAULT 0,
  dashboard_shown INTEGER DEFAULT 0,

  -- Resolution Tracking
  acknowledged INTEGER DEFAULT 0,
  acknowledged_by TEXT,
  acknowledged_at TEXT,
  resolved INTEGER DEFAULT 0,
  resolved_at TEXT,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (rule_id) REFERENCES seo_alert_rules(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (audit_id) REFERENCES seo_audits(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_alert_history_company ON seo_alert_history(company_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_rule ON seo_alert_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_created ON seo_alert_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_history_unresolved ON seo_alert_history(resolved) WHERE resolved = 0;

-- =====================================================
-- Autonomous Agent Status
-- Tracks operational status of the autonomous SEO agent
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_status (
  agent_name TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK(status IN ('running', 'stopped', 'error', 'paused')),

  -- Operational Metrics
  companies_monitored INTEGER DEFAULT 0,
  active_cron_jobs INTEGER DEFAULT 0,
  last_health_check TEXT,

  -- Performance Stats
  total_audits_run INTEGER DEFAULT 0,
  total_reports_generated INTEGER DEFAULT 0,
  total_alerts_sent INTEGER DEFAULT 0,
  average_audit_time_ms INTEGER,

  -- Error Tracking
  last_error TEXT,
  last_error_at TEXT,
  consecutive_errors INTEGER DEFAULT 0,

  -- State
  started_at TEXT,
  stopped_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Initialize autonomous SEO agent status
INSERT OR IGNORE INTO agent_status (agent_name, status) VALUES ('autonomous-seo', 'stopped');

-- =====================================================
-- Views for Reporting
-- =====================================================

-- Recent Audit Summary View
CREATE VIEW IF NOT EXISTS v_recent_audits AS
SELECT
  a.id,
  a.company_id,
  c.name as company_name,
  a.website,
  a.overall_score,
  a.lighthouse_overall,
  a.eeat_overall,
  a.audit_type,
  json_extract(a.issues_data, '$') as issues_count,
  a.created_at
FROM seo_audits a
JOIN companies c ON a.company_id = c.id
ORDER BY a.created_at DESC
LIMIT 100;

-- Active Monitoring Summary View
CREATE VIEW IF NOT EXISTS v_monitoring_summary AS
SELECT
  s.company_id,
  s.company_name,
  s.website,
  s.frequency,
  s.next_run,
  s.last_run,
  s.active,
  (SELECT overall_score FROM seo_audits WHERE company_id = s.company_id ORDER BY created_at DESC LIMIT 1) as last_score,
  (SELECT created_at FROM seo_audits WHERE company_id = s.company_id ORDER BY created_at DESC LIMIT 1) as last_audit_date,
  (SELECT COUNT(*) FROM seo_audits WHERE company_id = s.company_id AND created_at >= datetime('now', '-7 days')) as audits_this_week
FROM seo_audit_schedules s
WHERE s.active = 1
ORDER BY s.next_run ASC;

-- Unresolved Alerts View
CREATE VIEW IF NOT EXISTS v_unresolved_alerts AS
SELECT
  ah.id,
  ah.company_id,
  c.name as company_name,
  ah.severity,
  ah.message,
  ah.created_at,
  ar.rule_name,
  ah.acknowledged
FROM seo_alert_history ah
JOIN companies c ON ah.company_id = c.id
JOIN seo_alert_rules ar ON ah.rule_id = ar.id
WHERE ah.resolved = 0
ORDER BY
  CASE ah.severity
    WHEN 'critical' THEN 1
    WHEN 'warning' THEN 2
    WHEN 'info' THEN 3
  END,
  ah.created_at DESC;
