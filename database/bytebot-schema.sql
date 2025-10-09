-- Bytebot Task Tracking Schema
-- Track Bytebot tasks associated with companies, audits, and onboarding

-- Table: bytebot_tasks
-- Stores references to Bytebot tasks and their relationship to our entities
CREATE TABLE IF NOT EXISTS bytebot_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bytebot_task_id TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  task_type TEXT NOT NULL, -- 'onboarding', 'audit', 'competitor_research', 'rank_tracking', etc.
  priority TEXT DEFAULT 'MEDIUM',
  status TEXT DEFAULT 'PENDING', -- 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'

  -- Relationships
  company_id INTEGER,
  onboarding_id INTEGER,
  audit_id INTEGER,

  -- Metadata
  metadata TEXT, -- JSON string with additional context

  -- Results
  result TEXT, -- JSON string with task results
  error TEXT, -- Error message if failed
  screenshots TEXT, -- JSON array of screenshot URLs/paths

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (onboarding_id) REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_bytebot_tasks_bytebot_id ON bytebot_tasks(bytebot_task_id);
CREATE INDEX IF NOT EXISTS idx_bytebot_tasks_company ON bytebot_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_bytebot_tasks_onboarding ON bytebot_tasks(onboarding_id);
CREATE INDEX IF NOT EXISTS idx_bytebot_tasks_audit ON bytebot_tasks(audit_id);
CREATE INDEX IF NOT EXISTS idx_bytebot_tasks_status ON bytebot_tasks(status);
CREATE INDEX IF NOT EXISTS idx_bytebot_tasks_type ON bytebot_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_bytebot_tasks_created ON bytebot_tasks(created_at DESC);

-- Table: bytebot_task_logs
-- Store execution logs for Bytebot tasks
CREATE TABLE IF NOT EXISTS bytebot_task_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  log_level TEXT DEFAULT 'INFO', -- 'DEBUG', 'INFO', 'WARN', 'ERROR'
  message TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (task_id) REFERENCES bytebot_tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bytebot_logs_task ON bytebot_task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_bytebot_logs_timestamp ON bytebot_task_logs(timestamp DESC);

-- PostgreSQL compatibility notes:
-- For production deployment with PostgreSQL:
-- - Change INTEGER PRIMARY KEY AUTOINCREMENT to SERIAL PRIMARY KEY
-- - Change TIMESTAMP to TIMESTAMPTZ
-- - Change TEXT columns containing JSON to JSONB type
