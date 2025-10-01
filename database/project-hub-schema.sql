-- Project Hub Dashboard Schema
-- Centralized management for all tools, builds, and projects

-- Projects/Tools Registry
CREATE TABLE IF NOT EXISTS hub_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT, -- 'seo-tool', 'admin-panel', 'dashboard', 'api', 'website', etc.
  project_type TEXT CHECK(project_type IN ('internal', 'client', 'personal', 'prototype')),

  -- URLs and Access
  live_url TEXT,
  dev_url TEXT,
  github_repo TEXT,
  vercel_url TEXT,

  -- Visual Settings
  icon TEXT, -- emoji or icon class
  color TEXT, -- hex color for UI theming
  thumbnail_url TEXT,

  -- Status
  status TEXT CHECK(status IN ('active', 'development', 'paused', 'archived')),
  visibility TEXT CHECK(visibility IN ('public', 'private', 'team')),

  -- Features/Capabilities
  features TEXT, -- JSON array of feature flags
  tech_stack TEXT, -- JSON array of technologies

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_accessed DATETIME
);

-- API Keys & Secrets Management
CREATE TABLE IF NOT EXISTS hub_api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  key_name TEXT NOT NULL,
  key_label TEXT, -- User-friendly label
  service_name TEXT, -- 'SEMrush', 'Anthropic', 'Google', etc.

  -- Security
  encrypted_key TEXT NOT NULL,
  key_prefix TEXT, -- First few chars for identification

  -- Metadata
  environment TEXT CHECK(environment IN ('development', 'staging', 'production')),
  is_active BOOLEAN DEFAULT 1,
  expires_at DATETIME,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used DATETIME,

  FOREIGN KEY (project_id) REFERENCES hub_projects(id) ON DELETE CASCADE
);

-- Project Configurations
CREATE TABLE IF NOT EXISTS hub_project_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  config_key TEXT NOT NULL,
  config_value TEXT, -- JSON for complex configs
  config_type TEXT, -- 'string', 'number', 'boolean', 'json', 'secret'
  description TEXT,

  is_required BOOLEAN DEFAULT 0,
  default_value TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES hub_projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, config_key)
);

-- Project Features/Modules
CREATE TABLE IF NOT EXISTS hub_project_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  feature_name TEXT NOT NULL,
  feature_slug TEXT NOT NULL,
  description TEXT,

  is_enabled BOOLEAN DEFAULT 1,
  requires_config BOOLEAN DEFAULT 0,
  config_schema TEXT, -- JSON schema for feature config

  icon TEXT,
  route_path TEXT, -- UI route for this feature

  FOREIGN KEY (project_id) REFERENCES hub_projects(id) ON DELETE CASCADE
);

-- Project Dependencies
CREATE TABLE IF NOT EXISTS hub_project_dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  dependency_type TEXT CHECK(dependency_type IN ('api', 'service', 'database', 'auth', 'storage')),
  dependency_name TEXT NOT NULL,
  version TEXT,

  is_required BOOLEAN DEFAULT 1,
  is_configured BOOLEAN DEFAULT 0,

  FOREIGN KEY (project_id) REFERENCES hub_projects(id) ON DELETE CASCADE
);

-- Sandbox Sessions
CREATE TABLE IF NOT EXISTS hub_sandbox_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  session_id TEXT UNIQUE NOT NULL,

  -- Session data
  viewport_size TEXT, -- 'desktop', 'tablet', 'mobile'
  device_type TEXT,

  -- State
  last_route TEXT,
  session_data TEXT, -- JSON for session state

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES hub_projects(id) ON DELETE CASCADE
);

-- Project Activity Log
CREATE TABLE IF NOT EXISTS hub_activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  activity_type TEXT, -- 'accessed', 'configured', 'deployed', 'api_called', etc.
  activity_description TEXT,

  metadata TEXT, -- JSON for additional context

  user_id TEXT, -- If multi-user in future
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES hub_projects(id) ON DELETE SET NULL
);

-- Quick Actions/Shortcuts
CREATE TABLE IF NOT EXISTS hub_quick_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  action_name TEXT NOT NULL,
  action_type TEXT, -- 'url', 'api_call', 'config_change', 'script'

  action_config TEXT, -- JSON with action details

  icon TEXT,
  color TEXT,
  keyboard_shortcut TEXT,

  order_index INTEGER DEFAULT 0,

  FOREIGN KEY (project_id) REFERENCES hub_projects(id) ON DELETE CASCADE
);

-- Collections/Workspaces
CREATE TABLE IF NOT EXISTS hub_collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Project to Collection mapping
CREATE TABLE IF NOT EXISTS hub_collection_projects (
  collection_id INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  order_index INTEGER DEFAULT 0,

  PRIMARY KEY (collection_id, project_id),
  FOREIGN KEY (collection_id) REFERENCES hub_collections(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES hub_projects(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_hub_projects_slug ON hub_projects(slug);
CREATE INDEX IF NOT EXISTS idx_hub_projects_status ON hub_projects(status);
CREATE INDEX IF NOT EXISTS idx_hub_api_keys_project ON hub_api_keys(project_id);
CREATE INDEX IF NOT EXISTS idx_hub_configs_project ON hub_project_configs(project_id);
CREATE INDEX IF NOT EXISTS idx_hub_activity_project ON hub_activity_log(project_id);
