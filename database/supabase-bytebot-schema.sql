-- Bytebot Task Tracking Schema (PostgreSQL/Supabase)
-- Track Bytebot tasks associated with companies, audits, and onboarding

-- Table: bytebot_tasks
-- Stores references to Bytebot tasks and their relationship to our entities
CREATE TABLE IF NOT EXISTS bytebot_tasks (
  id SERIAL PRIMARY KEY,
  bytebot_task_id TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  task_type TEXT NOT NULL, -- 'onboarding', 'audit', 'competitor_research', 'rank_tracking', etc.
  priority TEXT DEFAULT 'MEDIUM',
  status TEXT DEFAULT 'PENDING', -- 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'

  -- Relationships
  company_id INTEGER,
  onboarding_id INTEGER,
  audit_id INTEGER,

  -- Metadata (JSONB for better querying)
  metadata JSONB,

  -- Results
  result JSONB, -- Task results
  error TEXT, -- Error message if failed
  screenshots JSONB, -- Array of screenshot URLs/paths

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

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

-- GIN index for JSONB columns for better query performance
CREATE INDEX IF NOT EXISTS idx_bytebot_tasks_metadata ON bytebot_tasks USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_bytebot_tasks_result ON bytebot_tasks USING GIN (result);

-- Table: bytebot_task_logs
-- Store execution logs for Bytebot tasks
CREATE TABLE IF NOT EXISTS bytebot_task_logs (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  log_level TEXT DEFAULT 'INFO', -- 'DEBUG', 'INFO', 'WARN', 'ERROR'
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (task_id) REFERENCES bytebot_tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bytebot_logs_task ON bytebot_task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_bytebot_logs_timestamp ON bytebot_task_logs(timestamp DESC);

-- Comments for documentation
COMMENT ON TABLE bytebot_tasks IS 'Tracks Bytebot AI desktop agent tasks and their relationships to companies, audits, and onboarding';
COMMENT ON TABLE bytebot_task_logs IS 'Execution logs for Bytebot tasks';

COMMENT ON COLUMN bytebot_tasks.task_type IS 'Type of task: onboarding, audit, competitor_research, rank_tracking, etc.';
COMMENT ON COLUMN bytebot_tasks.metadata IS 'JSON metadata about the task context (company info, keywords, etc.)';
COMMENT ON COLUMN bytebot_tasks.result IS 'JSON results returned by the task';
COMMENT ON COLUMN bytebot_tasks.screenshots IS 'JSON array of screenshot URLs from task execution';
