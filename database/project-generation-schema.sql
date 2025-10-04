-- Project Generation & Scaffolding Schema

-- Project Templates Registry
CREATE TABLE IF NOT EXISTS project_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK(category IN ('web', 'mobile', 'api', 'fullstack', 'ai', 'data', 'desktop')),

  -- Template Info
  tech_stack TEXT, -- JSON array: ["react", "typescript", "vite"]
  base_framework TEXT, -- 'react', 'nextjs', 'vue', 'fastapi', 'express'

  -- Template Files
  template_path TEXT NOT NULL, -- Path to template directory
  entry_file TEXT, -- Main entry point

  -- Features & Integrations
  available_features TEXT, -- JSON array of optional features
  required_integrations TEXT, -- JSON array
  optional_integrations TEXT, -- JSON array

  -- Configuration
  default_config TEXT, -- JSON object with defaults
  env_variables TEXT, -- JSON array of required env vars

  -- Metadata
  icon TEXT,
  preview_image TEXT,
  documentation_url TEXT,
  demo_url TEXT,

  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Generated Projects
CREATE TABLE IF NOT EXISTS generated_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hub_project_id INTEGER, -- Links to hub_projects
  template_id INTEGER NOT NULL,

  -- Project Info
  project_name TEXT NOT NULL,
  project_slug TEXT NOT NULL,
  output_path TEXT NOT NULL, -- Where project was generated

  -- Configuration
  selected_features TEXT, -- JSON array of enabled features
  selected_integrations TEXT, -- JSON array
  custom_config TEXT, -- JSON object with user customizations

  -- Generation Status
  status TEXT CHECK(status IN ('pending', 'generating', 'completed', 'failed', 'archived')) DEFAULT 'pending',
  generation_progress INTEGER DEFAULT 0, -- 0-100

  -- Setup Steps Status
  folder_created BOOLEAN DEFAULT 0,
  files_generated BOOLEAN DEFAULT 0,
  dependencies_installed BOOLEAN DEFAULT 0,
  env_configured BOOLEAN DEFAULT 0,
  integrations_setup BOOLEAN DEFAULT 0,
  database_migrated BOOLEAN DEFAULT 0,
  git_initialized BOOLEAN DEFAULT 0,
  ide_opened BOOLEAN DEFAULT 0,
  all_ready BOOLEAN DEFAULT 0,

  -- IDE Integration
  ide_preference TEXT CHECK(ide_preference IN ('vscode', 'cursor', 'webstorm', 'none')),
  ide_opened_at DATETIME,

  -- Error Tracking
  error_log TEXT, -- JSON array of errors
  last_error TEXT,

  generated_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (hub_project_id) REFERENCES hub_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES project_templates(id)
);

-- Template Features
CREATE TABLE IF NOT EXISTS template_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,

  feature_key TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  description TEXT,

  -- Feature Type
  category TEXT, -- 'authentication', 'database', 'ai', 'payment', etc.
  is_required BOOLEAN DEFAULT 0,

  -- Dependencies
  requires_integration TEXT, -- JSON array of integration names
  requires_features TEXT, -- JSON array of other features

  -- Code Generation
  files_to_add TEXT, -- JSON array of file paths
  dependencies_to_install TEXT, -- JSON array of npm packages
  env_variables_needed TEXT, -- JSON array

  -- Configuration
  default_enabled BOOLEAN DEFAULT 0,
  config_schema TEXT, -- JSON schema for feature config

  FOREIGN KEY (template_id) REFERENCES project_templates(id) ON DELETE CASCADE,
  UNIQUE(template_id, feature_key)
);

-- Generation Steps Log
CREATE TABLE IF NOT EXISTS generation_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  generated_project_id INTEGER NOT NULL,

  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,

  status TEXT CHECK(status IN ('pending', 'running', 'completed', 'failed', 'skipped')) DEFAULT 'pending',

  started_at DATETIME,
  completed_at DATETIME,
  duration_ms INTEGER,

  output_log TEXT, -- Command output
  error_message TEXT,

  FOREIGN KEY (generated_project_id) REFERENCES generated_projects(id) ON DELETE CASCADE
);

-- Template Variables/Placeholders
CREATE TABLE IF NOT EXISTS template_variables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,

  variable_key TEXT NOT NULL, -- e.g., 'PROJECT_NAME', 'API_KEY'
  variable_name TEXT NOT NULL,
  description TEXT,

  variable_type TEXT CHECK(variable_type IN ('string', 'number', 'boolean', 'select', 'multiselect')),
  default_value TEXT,

  -- Validation
  is_required BOOLEAN DEFAULT 0,
  validation_pattern TEXT, -- Regex for validation

  -- For select types
  options TEXT, -- JSON array

  FOREIGN KEY (template_id) REFERENCES project_templates(id) ON DELETE CASCADE,
  UNIQUE(template_id, variable_key)
);

-- Integration Auto-Configuration
CREATE TABLE IF NOT EXISTS integration_auto_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  generated_project_id INTEGER NOT NULL,
  integration_id INTEGER NOT NULL,

  -- Configuration Status
  status TEXT CHECK(status IN ('pending', 'configuring', 'completed', 'failed')) DEFAULT 'pending',

  -- Auto-Setup Actions
  env_vars_added BOOLEAN DEFAULT 0,
  config_files_created BOOLEAN DEFAULT 0,
  dependencies_installed BOOLEAN DEFAULT 0,
  initialization_run BOOLEAN DEFAULT 0,

  -- Configuration Data
  credentials_fetched TEXT, -- JSON with API keys, etc.
  config_applied TEXT, -- JSON of applied configuration

  error_message TEXT,

  configured_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (generated_project_id) REFERENCES generated_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (integration_id) REFERENCES integration_registry(id)
);

-- Code Snippets Library
CREATE TABLE IF NOT EXISTS code_snippets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  snippet_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Snippet Content
  language TEXT, -- 'javascript', 'typescript', 'python', etc.
  code_content TEXT NOT NULL,

  -- Usage Context
  use_case TEXT, -- 'authentication', 'api_call', 'database_query', etc.
  framework TEXT, -- 'react', 'vue', 'fastapi', etc.

  -- Templating
  variables TEXT, -- JSON array of variable placeholders

  -- Categorization
  tags TEXT, -- JSON array

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Template Dependencies
CREATE TABLE IF NOT EXISTS template_dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,

  dependency_name TEXT NOT NULL,
  dependency_version TEXT,

  dependency_type TEXT CHECK(dependency_type IN ('npm', 'pip', 'gem', 'system')),

  is_dev_dependency BOOLEAN DEFAULT 0,
  is_required BOOLEAN DEFAULT 1,

  FOREIGN KEY (template_id) REFERENCES project_templates(id) ON DELETE CASCADE
);

-- IDE Configurations
CREATE TABLE IF NOT EXISTS ide_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,

  ide_name TEXT CHECK(ide_name IN ('vscode', 'cursor', 'webstorm', 'pycharm')),

  -- Configuration Files
  config_files TEXT, -- JSON object with file paths and contents
  extensions_recommended TEXT, -- JSON array of extension IDs
  settings TEXT, -- JSON object with IDE settings

  launch_command TEXT, -- Command to open IDE

  FOREIGN KEY (template_id) REFERENCES project_templates(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_templates_category ON project_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_active ON project_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_generated_status ON generated_projects(status);
CREATE INDEX IF NOT EXISTS idx_generated_hub_project ON generated_projects(hub_project_id);
CREATE INDEX IF NOT EXISTS idx_features_template ON template_features(template_id);
CREATE INDEX IF NOT EXISTS idx_steps_project ON generation_steps(generated_project_id);
CREATE INDEX IF NOT EXISTS idx_snippets_language ON code_snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_framework ON code_snippets(framework);
