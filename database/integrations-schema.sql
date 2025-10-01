-- Integrations & Third-Party Connectors Schema

-- Available Integrations Registry
CREATE TABLE IF NOT EXISTS integration_registry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  category TEXT CHECK(category IN ('development', 'database', 'ai', 'analytics', 'deployment', 'auth', 'storage', 'communication', 'productivity')),

  -- Display Info
  display_name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  logo_url TEXT,
  color TEXT, -- Brand color

  -- Integration Type
  integration_type TEXT CHECK(integration_type IN ('oauth2', 'api_key', 'webhook', 'sdk', 'database_connector')),
  auth_method TEXT, -- 'oauth2', 'api_key', 'bearer_token', 'basic_auth'

  -- OAuth Configuration
  oauth_authorize_url TEXT,
  oauth_token_url TEXT,
  oauth_scopes TEXT, -- JSON array

  -- Capabilities
  supports_webhooks BOOLEAN DEFAULT 0,
  supports_realtime BOOLEAN DEFAULT 0,
  supports_file_storage BOOLEAN DEFAULT 0,

  -- Documentation
  docs_url TEXT,
  setup_guide_url TEXT,
  api_reference_url TEXT,

  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User/Project Integration Connections
CREATE TABLE IF NOT EXISTS integration_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  integration_id INTEGER NOT NULL,

  -- Connection Info
  connection_name TEXT,
  environment TEXT CHECK(environment IN ('development', 'staging', 'production')),

  -- Authentication
  auth_type TEXT,
  access_token TEXT, -- Encrypted
  refresh_token TEXT, -- Encrypted
  api_key TEXT, -- Encrypted
  token_expires_at DATETIME,

  -- OAuth Data
  oauth_user_id TEXT,
  oauth_username TEXT,
  oauth_email TEXT,
  oauth_scopes TEXT, -- JSON array of granted scopes

  -- Connection Status
  status TEXT CHECK(status IN ('connected', 'disconnected', 'error', 'expired', 'pending')) DEFAULT 'pending',
  last_sync DATETIME,
  last_error TEXT,

  -- Configuration
  config_data TEXT, -- JSON for integration-specific config

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES hub_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (integration_id) REFERENCES integration_registry(id) ON DELETE CASCADE
);

-- Webhooks
CREATE TABLE IF NOT EXISTS integration_webhooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,

  webhook_url TEXT NOT NULL,
  webhook_secret TEXT, -- For signature verification

  -- Events
  subscribed_events TEXT, -- JSON array

  -- Status
  is_active BOOLEAN DEFAULT 1,
  last_triggered DATETIME,
  total_triggers INTEGER DEFAULT 0,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (connection_id) REFERENCES integration_connections(id) ON DELETE CASCADE
);

-- Webhook Event Log
CREATE TABLE IF NOT EXISTS webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  webhook_id INTEGER NOT NULL,

  event_type TEXT NOT NULL,
  event_data TEXT, -- JSON payload

  status TEXT CHECK(status IN ('received', 'processing', 'completed', 'failed')),
  error_message TEXT,

  received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,

  FOREIGN KEY (webhook_id) REFERENCES integration_webhooks(id) ON DELETE CASCADE
);

-- Data Sync Jobs
CREATE TABLE IF NOT EXISTS integration_sync_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,

  sync_type TEXT, -- 'full', 'incremental', 'selective'
  sync_direction TEXT CHECK(sync_direction IN ('import', 'export', 'bidirectional')),

  -- Job Status
  status TEXT CHECK(status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),

  records_total INTEGER DEFAULT 0,
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,

  error_log TEXT, -- JSON array of errors

  started_at DATETIME,
  completed_at DATETIME,

  FOREIGN KEY (connection_id) REFERENCES integration_connections(id) ON DELETE CASCADE
);

-- Integration Usage Metrics
CREATE TABLE IF NOT EXISTS integration_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connection_id INTEGER NOT NULL,

  metric_date DATE NOT NULL,

  -- API Usage
  api_calls_count INTEGER DEFAULT 0,
  api_errors_count INTEGER DEFAULT 0,

  -- Data Transfer
  data_uploaded_bytes INTEGER DEFAULT 0,
  data_downloaded_bytes INTEGER DEFAULT 0,

  -- Webhooks
  webhooks_received INTEGER DEFAULT 0,
  webhooks_processed INTEGER DEFAULT 0,

  -- Performance
  avg_response_time_ms INTEGER,

  FOREIGN KEY (connection_id) REFERENCES integration_connections(id) ON DELETE CASCADE,
  UNIQUE(connection_id, metric_date)
);

-- SDK/Client Library Versions
CREATE TABLE IF NOT EXISTS integration_sdk_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  integration_id INTEGER NOT NULL,

  sdk_name TEXT,
  sdk_version TEXT,
  language TEXT, -- 'javascript', 'python', 'typescript', etc.

  install_command TEXT,
  docs_url TEXT,

  is_recommended BOOLEAN DEFAULT 0,

  FOREIGN KEY (integration_id) REFERENCES integration_registry(id) ON DELETE CASCADE
);

-- Integration Templates (Pre-configured setups)
CREATE TABLE IF NOT EXISTS integration_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  integration_id INTEGER NOT NULL,

  template_name TEXT NOT NULL,
  description TEXT,

  use_case TEXT, -- 'authentication', 'data_storage', 'real_time', etc.

  config_template TEXT, -- JSON template
  code_snippet TEXT,

  FOREIGN KEY (integration_id) REFERENCES integration_registry(id) ON DELETE CASCADE
);

-- OAuth State Management (for CSRF protection)
CREATE TABLE IF NOT EXISTS oauth_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  state_token TEXT UNIQUE NOT NULL,
  integration_id INTEGER NOT NULL,
  project_id INTEGER,

  redirect_uri TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT 0,

  FOREIGN KEY (integration_id) REFERENCES integration_registry(id),
  FOREIGN KEY (project_id) REFERENCES hub_projects(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_connections_project ON integration_connections(project_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON integration_connections(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_connection ON integration_webhooks(connection_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_webhook ON webhook_events(webhook_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_connection ON integration_sync_jobs(connection_id);
CREATE INDEX IF NOT EXISTS idx_metrics_connection ON integration_metrics(connection_id);
CREATE INDEX IF NOT EXISTS idx_oauth_state_token ON oauth_states(state_token);
