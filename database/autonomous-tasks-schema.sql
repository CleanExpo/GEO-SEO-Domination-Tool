-- Autonomous Tasks Schema
-- Tracks tasks executed by the agent swarm system

-- Main tasks table
CREATE TABLE IF NOT EXISTS autonomous_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  input_type TEXT DEFAULT 'text', -- text, voice, file, url
  workflow_id TEXT NOT NULL,       -- ID of workflow to execute

  -- Task lifecycle
  status TEXT DEFAULT 'queued',    -- queued, in_progress, completed, failed
  priority TEXT DEFAULT 'medium',  -- low, medium, high, urgent

  -- Metadata
  metadata TEXT,                   -- JSON: input files, URLs, voice transcripts
  result TEXT,                     -- JSON: execution results

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Agent execution logs (what each agent did)
CREATE TABLE IF NOT EXISTS task_agent_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  agent_id TEXT NOT NULL,
  result TEXT,                     -- JSON: agent's output
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (task_id) REFERENCES autonomous_tasks(id) ON DELETE CASCADE
);

-- Browser automation sessions
CREATE TABLE IF NOT EXISTS browser_sessions (
  id TEXT PRIMARY KEY,             -- Session ID from browser automation service
  task_id INTEGER,
  url TEXT,
  status TEXT DEFAULT 'active',    -- active, closed

  -- Session data
  screenshots TEXT,                -- JSON array of base64 screenshots
  action_log TEXT,                 -- JSON array of actions performed
  extracted_data TEXT,             -- JSON: data extracted from pages

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,

  FOREIGN KEY (task_id) REFERENCES autonomous_tasks(id) ON DELETE CASCADE
);

-- Task templates (pre-configured workflows)
CREATE TABLE IF NOT EXISTS task_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  workflow_id TEXT NOT NULL,

  -- Template configuration
  default_priority TEXT DEFAULT 'medium',
  input_fields TEXT,               -- JSON: fields user needs to fill
  example_inputs TEXT,             -- JSON: example values

  -- Usage
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task attachments (files, images, documents)
CREATE TABLE IF NOT EXISTS task_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  file_data BLOB,                  -- Or URL to storage

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (task_id) REFERENCES autonomous_tasks(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON autonomous_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON autonomous_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_workflow ON autonomous_tasks(workflow_id);

CREATE INDEX IF NOT EXISTS idx_agent_logs_task ON task_agent_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created ON task_agent_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_browser_sessions_task ON browser_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_status ON browser_sessions(status);

CREATE INDEX IF NOT EXISTS idx_attachments_task ON task_attachments(task_id);

-- PostgreSQL compatibility notes:
-- AUTOINCREMENT → SERIAL
-- TIMESTAMP → TIMESTAMPTZ
-- BLOB → BYTEA
