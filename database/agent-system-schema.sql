-- Agent System Schema
-- Tables for autonomous agent task management

-- Agent Tasks Table
CREATE TABLE IF NOT EXISTS agent_tasks (
  id TEXT PRIMARY KEY,
  agent_name TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  input TEXT NOT NULL,
  priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status TEXT CHECK(status IN ('queued', 'running', 'completed', 'failed', 'cancelled')) DEFAULT 'queued',
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  result TEXT,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  metadata TEXT, -- JSON
  FOREIGN KEY (client_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Agent Checkpoints Table
CREATE TABLE IF NOT EXISTS agent_checkpoints (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  state TEXT CHECK(state IN ('thinking', 'tool_use', 'result', 'error')) NOT NULL,
  content TEXT NOT NULL,
  tool_calls TEXT, -- JSON array
  FOREIGN KEY (task_id) REFERENCES agent_tasks(id) ON DELETE CASCADE
);

-- Generated Content Table
CREATE TABLE IF NOT EXISTS generated_content (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT, -- JSON array
  status TEXT CHECK(status IN ('draft', 'review', 'published')) DEFAULT 'draft',
  created_at TEXT NOT NULL,
  published_at TEXT,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Agent Execution Logs Table
CREATE TABLE IF NOT EXISTS agent_execution_logs (
  id TEXT PRIMARY KEY,
  agent_name TEXT NOT NULL,
  task_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'started', 'checkpoint', 'tool_executed', 'completed', 'failed'
  event_data TEXT, -- JSON
  timestamp TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES agent_tasks(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_client ON agent_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_workspace ON agent_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_created ON agent_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_checkpoints_task ON agent_checkpoints(task_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_company ON generated_content(company_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_task ON agent_execution_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_timestamp ON agent_execution_logs(timestamp DESC);
