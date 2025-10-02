-- GEO-SEO Domination Tool Database Schema

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  phone TEXT NOT NULL,
  website TEXT NOT NULL,
  email TEXT,
  industry TEXT,
  services TEXT, -- JSON array
  description TEXT,
  gbp_url TEXT,
  social_profiles TEXT, -- JSON object
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individuals (team members) table
CREATE TABLE IF NOT EXISTS individuals (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  credentials TEXT, -- JSON array
  experience_years INTEGER,
  bio TEXT,
  expertise_areas TEXT, -- JSON array
  author_page_url TEXT,
  social_profiles TEXT, -- JSON object
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Audits table
CREATE TABLE IF NOT EXISTS audits (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  audit_date TIMESTAMPTZ DEFAULT NOW(),
  lighthouse_scores TEXT, -- JSON object (performance, accessibility, best_practices, seo, pwa)
  eeat_scores TEXT, -- JSON object (experience, expertise, authoritativeness, trustworthiness)
  local_pack_positions TEXT, -- JSON array
  competitor_data TEXT, -- JSON object
  recommendations TEXT, -- JSON array
  priority_level TEXT CHECK(priority_level IN ('low', 'medium', 'high', 'critical')),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Keywords table
CREATE TABLE IF NOT EXISTS keywords (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  keyword TEXT NOT NULL,
  location TEXT NOT NULL,
  search_volume INTEGER,
  difficulty INTEGER,
  current_rank INTEGER,
  competition_level TEXT CHECK(competition_level IN ('low', 'medium', 'high')),
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Competitors table
CREATE TABLE IF NOT EXISTS competitors (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  competitor_name TEXT NOT NULL,
  website TEXT,
  gbp_url TEXT,
  rankings TEXT, -- JSON object
  review_count INTEGER,
  avg_rating REAL,
  last_analyzed TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Citations table
CREATE TABLE IF NOT EXISTS citations (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  nap_accurate BOOLEAN DEFAULT 0,
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK(status IN ('active', 'pending', 'inactive')),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Service areas table
CREATE TABLE IF NOT EXISTS service_areas (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  area_name TEXT NOT NULL,
  area_type TEXT CHECK(area_type IN ('city', 'state', 'radius', 'custom')),
  latitude REAL,
  longitude REAL,
  radius_miles INTEGER,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Local pack tracking table
CREATE TABLE IF NOT EXISTS local_pack_tracking (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  keyword TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  position INTEGER,
  competitor_in_pack TEXT, -- JSON array of competitors
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Backlinks table
CREATE TABLE IF NOT EXISTS backlinks (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT,
  domain_authority INTEGER,
  follow_type TEXT CHECK(follow_type IN ('dofollow', 'nofollow')),
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Content gaps table
CREATE TABLE IF NOT EXISTS content_gaps (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  topic TEXT NOT NULL,
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  competitor_has_content BOOLEAN DEFAULT 0,
  priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
  status TEXT CHECK(status IN ('identified', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Scheduled audits table
CREATE TABLE IF NOT EXISTS scheduled_audits (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  audit_type TEXT NOT NULL,
  frequency TEXT CHECK(frequency IN ('daily', 'weekly', 'monthly')),
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  enabled BOOLEAN DEFAULT 1,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_keywords_company ON keywords(company_id);
CREATE INDEX IF NOT EXISTS idx_audits_company ON audits(company_id);
CREATE INDEX IF NOT EXISTS idx_competitors_company ON competitors(company_id);
CREATE INDEX IF NOT EXISTS idx_citations_company ON citations(company_id);
CREATE INDEX IF NOT EXISTS idx_local_pack_company ON local_pack_tracking(company_id);
-- CRM System Database Schema
-- Compatible with both SQLite and PostgreSQL

-- Contacts Table
CREATE TABLE IF NOT EXISTS crm_contacts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company TEXT,
  location TEXT,
  status TEXT DEFAULT 'lead', -- 'active', 'inactive', 'lead'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deals Table
CREATE TABLE IF NOT EXISTS crm_deals (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  contact_id INTEGER NOT NULL,
  company TEXT,
  value REAL NOT NULL,
  stage TEXT DEFAULT 'prospect', -- 'prospect', 'qualification', 'proposal', 'negotiation', 'closed'
  probability INTEGER DEFAULT 0, -- 0-100
  close_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE CASCADE
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS crm_tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'completed'
  assigned_to TEXT,
  contact_id INTEGER,
  deal_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (deal_id) REFERENCES crm_deals(id) ON DELETE SET NULL
);

-- Calendar Events Table
CREATE TABLE IF NOT EXISTS crm_calendar_events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT NOT NULL,
  duration TEXT,
  type TEXT DEFAULT 'meeting', -- 'meeting', 'call', 'demo', 'follow-up'
  location TEXT,
  notes TEXT,
  contact_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE SET NULL
);

-- Event Attendees Table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS crm_event_attendees (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (event_id) REFERENCES crm_calendar_events(id) ON DELETE CASCADE
);

-- Projects Table
CREATE TABLE IF NOT EXISTS crm_projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning', -- 'planning', 'active', 'completed', 'on-hold'
  progress INTEGER DEFAULT 0, -- 0-100
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Team Members (many-to-many relationship)
CREATE TABLE IF NOT EXISTS crm_project_members (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  member_name TEXT NOT NULL,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (project_id) REFERENCES crm_projects(id) ON DELETE CASCADE
);

-- GitHub Projects Table
CREATE TABLE IF NOT EXISTS crm_github_projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT UNIQUE NOT NULL,
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  open_prs INTEGER DEFAULT 0,
  language TEXT,
  last_updated DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompts Library Table
CREATE TABLE IF NOT EXISTS crm_prompts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT, -- JSON array stored as text
  favorite BOOLEAN DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS crm_support_tickets (
  id SERIAL PRIMARY KEY,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_contacts_email ON crm_contacts(email);
CREATE INDEX idx_contacts_status ON crm_contacts(status);
CREATE INDEX idx_deals_contact_id ON crm_deals(contact_id);
CREATE INDEX idx_deals_stage ON crm_deals(stage);
CREATE INDEX idx_tasks_status ON crm_tasks(status);
CREATE INDEX idx_tasks_due_date ON crm_tasks(due_date);
CREATE INDEX idx_calendar_events_date ON crm_calendar_events(event_date);
CREATE INDEX idx_projects_status ON crm_projects(status);
CREATE INDEX idx_prompts_category ON crm_prompts(category);
CREATE INDEX idx_prompts_favorite ON crm_prompts(favorite);
-- Project Hub Dashboard Schema
-- Centralized management for all tools, builds, and projects

-- Projects/Tools Registry
CREATE TABLE IF NOT EXISTS hub_projects (
  id SERIAL PRIMARY KEY,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ
);

-- API Keys & Secrets Management
CREATE TABLE IF NOT EXISTS hub_api_keys (
  id SERIAL PRIMARY KEY,
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
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ,

  FOREIGN KEY (project_id) REFERENCES hub_projects(id) ON DELETE CASCADE
);

-- Project Configurations
CREATE TABLE IF NOT EXISTS hub_project_configs (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  config_key TEXT NOT NULL,
  config_value TEXT, -- JSON for complex configs
  config_type TEXT, -- 'string', 'number', 'boolean', 'json', 'secret'
  description TEXT,

  is_required BOOLEAN DEFAULT 0,
  default_value TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (project_id) REFERENCES hub_projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, config_key)
);

-- Project Features/Modules
CREATE TABLE IF NOT EXISTS hub_project_features (
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  session_id TEXT UNIQUE NOT NULL,

  -- Session data
  viewport_size TEXT, -- 'desktop', 'tablet', 'mobile'
  device_type TEXT,

  -- State
  last_route TEXT,
  session_data TEXT, -- JSON for session state

  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (project_id) REFERENCES hub_projects(id) ON DELETE CASCADE
);

-- Project Activity Log
CREATE TABLE IF NOT EXISTS hub_activity_log (
  id SERIAL PRIMARY KEY,
  project_id INTEGER,
  activity_type TEXT, -- 'accessed', 'configured', 'deployed', 'api_called', etc.
  activity_description TEXT,

  metadata TEXT, -- JSON for additional context

  user_id TEXT, -- If multi-user in future
  created_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (project_id) REFERENCES hub_projects(id) ON DELETE SET NULL
);

-- Quick Actions/Shortcuts
CREATE TABLE IF NOT EXISTS hub_quick_actions (
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
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
-- Resources System Database Schema for GEO-SEO Domination Tool
-- Compatible with both SQLite and PostgreSQL

-- Components Library Table
CREATE TABLE IF NOT EXISTS crm_components (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  framework TEXT, -- 'react', 'vue', 'angular', 'html', etc.
  category TEXT, -- 'ui', 'form', 'navigation', 'layout', etc.
  tags TEXT, -- JSON array stored as text
  demo_url TEXT,
  favorite BOOLEAN DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Tools Library Table
CREATE TABLE IF NOT EXISTS crm_ai_tools (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT, -- 'content', 'seo', 'design', 'development', etc.
  pricing TEXT, -- 'free', 'freemium', 'paid', 'enterprise'
  features TEXT, -- JSON array stored as text
  tags TEXT, -- JSON array stored as text
  rating REAL, -- 0.0-5.0
  favorite BOOLEAN DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tutorials Library Table
CREATE TABLE IF NOT EXISTS crm_tutorials (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT, -- 'seo', 'development', 'design', 'marketing', etc.
  difficulty TEXT DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
  duration INTEGER, -- Duration in minutes
  tags TEXT, -- JSON array stored as text
  video_url TEXT,
  resources TEXT, -- JSON array stored as text
  favorite BOOLEAN DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_components_category ON crm_components(category);
CREATE INDEX idx_components_framework ON crm_components(framework);
CREATE INDEX idx_components_favorite ON crm_components(favorite);

CREATE INDEX idx_ai_tools_category ON crm_ai_tools(category);
CREATE INDEX idx_ai_tools_pricing ON crm_ai_tools(pricing);
CREATE INDEX idx_ai_tools_favorite ON crm_ai_tools(favorite);

CREATE INDEX idx_tutorials_category ON crm_tutorials(category);
CREATE INDEX idx_tutorials_difficulty ON crm_tutorials(difficulty);
CREATE INDEX idx_tutorials_favorite ON crm_tutorials(favorite);
-- AI Search SEO Strategy Database Schema

-- SEO Strategies Template Table
CREATE TABLE IF NOT EXISTS seo_strategies (
  id SERIAL PRIMARY KEY,
  strategy_name TEXT NOT NULL,
  category TEXT CHECK(category IN ('content', 'technical', 'ai_optimization', 'local', 'citations', 'eeat', 'competitor')),
  principle TEXT NOT NULL,
  implementation_details TEXT NOT NULL,
  tools_resources TEXT, -- JSON array
  priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case Studies Table
CREATE TABLE IF NOT EXISTS strategy_case_studies (
  id SERIAL PRIMARY KEY,
  strategy_id INTEGER NOT NULL,
  case_study_title TEXT NOT NULL,
  industry TEXT,
  challenge TEXT,
  implementation TEXT,
  results_achieved TEXT,
  metrics TEXT, -- JSON object (e.g., {"traffic_increase": "150%", "rankings_improved": 45})
  timeframe TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (strategy_id) REFERENCES seo_strategies(id) ON DELETE CASCADE
);

-- AI Search Campaigns Table
CREATE TABLE IF NOT EXISTS ai_search_campaigns (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  campaign_name TEXT NOT NULL,
  objective TEXT,
  target_ai_platforms TEXT, -- JSON array ["Perplexity", "ChatGPT", "Gemini", "Claude"]
  start_date DATE,
  end_date DATE,
  status TEXT CHECK(status IN ('planning', 'active', 'paused', 'completed')),
  budget REAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Campaign Strategies (linking campaigns to strategies)
CREATE TABLE IF NOT EXISTS campaign_strategies (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL,
  strategy_id INTEGER NOT NULL,
  implementation_status TEXT CHECK(implementation_status IN ('not_started', 'in_progress', 'completed', 'on_hold')),
  assigned_to TEXT,
  due_date DATE,
  notes TEXT,
  FOREIGN KEY (campaign_id) REFERENCES ai_search_campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (strategy_id) REFERENCES seo_strategies(id) ON DELETE CASCADE
);

-- AI Search Visibility Tracking
CREATE TABLE IF NOT EXISTS ai_search_visibility (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  campaign_id INTEGER,
  ai_platform TEXT NOT NULL, -- Perplexity, ChatGPT, etc.
  query TEXT NOT NULL,
  brand_mentioned BOOLEAN DEFAULT 0,
  position_in_response INTEGER, -- Position where brand is mentioned
  context_sentiment TEXT CHECK(context_sentiment IN ('positive', 'neutral', 'negative')),
  citation_included BOOLEAN DEFAULT 0,
  citation_url TEXT,
  full_response TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES ai_search_campaigns(id) ON DELETE SET NULL
);

-- Perplexity-specific optimization tracking
CREATE TABLE IF NOT EXISTS perplexity_optimization (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  content_type TEXT, -- article, landing_page, product, etc.
  optimization_score INTEGER, -- 0-100
  ai_readability_score INTEGER,
  citation_worthiness_score INTEGER,
  key_facts_extracted TEXT, -- JSON array of key facts AI might cite
  recommended_improvements TEXT, -- JSON array
  last_analyzed TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- AI-First Content Strategy
CREATE TABLE IF NOT EXISTS ai_content_strategy (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  topic_cluster TEXT NOT NULL,
  target_ai_queries TEXT, -- JSON array of queries AI users might ask
  content_type TEXT,
  factual_angle TEXT, -- The unique factual angle to own
  expert_sources TEXT, -- JSON array of expert sources to cite
  data_points TEXT, -- JSON array of unique data points to include
  implementation_status TEXT CHECK(implementation_status IN ('planned', 'in_progress', 'published', 'optimizing')),
  published_url TEXT,
  ai_citation_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Campaign Results Tracking
CREATE TABLE IF NOT EXISTS campaign_results (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value TEXT NOT NULL,
  metric_type TEXT, -- traffic, rankings, citations, conversions, etc.
  measurement_date DATE,
  notes TEXT,
  FOREIGN KEY (campaign_id) REFERENCES ai_search_campaigns(id) ON DELETE CASCADE
);

-- AI Search Competitor Analysis
CREATE TABLE IF NOT EXISTS ai_competitor_analysis (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  competitor_id INTEGER,
  ai_platform TEXT NOT NULL,
  queries_analyzed INTEGER DEFAULT 0,
  mention_frequency INTEGER DEFAULT 0, -- How often competitor appears in AI responses
  average_position REAL,
  citation_quality_score INTEGER, -- 0-100
  topic_dominance TEXT, -- JSON object of topics they dominate
  last_analyzed TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE
);

-- Strategy Implementation Notes
CREATE TABLE IF NOT EXISTS strategy_implementation_notes (
  id SERIAL PRIMARY KEY,
  campaign_strategy_id INTEGER NOT NULL,
  note_text TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (campaign_strategy_id) REFERENCES campaign_strategies(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_visibility_platform ON ai_search_visibility(ai_platform, company_id);
CREATE INDEX IF NOT EXISTS idx_ai_visibility_query ON ai_search_visibility(query);
CREATE INDEX IF NOT EXISTS idx_campaigns_company ON ai_search_campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_campaign_strategies ON campaign_strategies(campaign_id, strategy_id);
CREATE INDEX IF NOT EXISTS idx_perplexity_opt ON perplexity_optimization(company_id, url);
-- Integrations & Third-Party Connectors Schema

-- Available Integrations Registry
CREATE TABLE IF NOT EXISTS integration_registry (
  id SERIAL PRIMARY KEY,
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User/Project Integration Connections
CREATE TABLE IF NOT EXISTS integration_connections (
  id SERIAL PRIMARY KEY,
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
  token_expires_at TIMESTAMPTZ,

  -- OAuth Data
  oauth_user_id TEXT,
  oauth_username TEXT,
  oauth_email TEXT,
  oauth_scopes TEXT, -- JSON array of granted scopes

  -- Connection Status
  status TEXT CHECK(status IN ('connected', 'disconnected', 'error', 'expired', 'pending')) DEFAULT 'pending',
  last_sync TIMESTAMPTZ,
  last_error TEXT,

  -- Configuration
  config_data TEXT, -- JSON for integration-specific config

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (project_id) REFERENCES hub_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (integration_id) REFERENCES integration_registry(id) ON DELETE CASCADE
);

-- Webhooks
CREATE TABLE IF NOT EXISTS integration_webhooks (
  id SERIAL PRIMARY KEY,
  connection_id INTEGER NOT NULL,

  webhook_url TEXT NOT NULL,
  webhook_secret TEXT, -- For signature verification

  -- Events
  subscribed_events TEXT, -- JSON array

  -- Status
  is_active BOOLEAN DEFAULT 1,
  last_triggered TIMESTAMPTZ,
  total_triggers INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (connection_id) REFERENCES integration_connections(id) ON DELETE CASCADE
);

-- Webhook Event Log
CREATE TABLE IF NOT EXISTS webhook_events (
  id SERIAL PRIMARY KEY,
  webhook_id INTEGER NOT NULL,

  event_type TEXT NOT NULL,
  event_data TEXT, -- JSON payload

  status TEXT CHECK(status IN ('received', 'processing', 'completed', 'failed')),
  error_message TEXT,

  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  FOREIGN KEY (webhook_id) REFERENCES integration_webhooks(id) ON DELETE CASCADE
);

-- Data Sync Jobs
CREATE TABLE IF NOT EXISTS integration_sync_jobs (
  id SERIAL PRIMARY KEY,
  connection_id INTEGER NOT NULL,

  sync_type TEXT, -- 'full', 'incremental', 'selective'
  sync_direction TEXT CHECK(sync_direction IN ('import', 'export', 'bidirectional')),

  -- Job Status
  status TEXT CHECK(status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),

  records_total INTEGER DEFAULT 0,
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,

  error_log TEXT, -- JSON array of errors

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  FOREIGN KEY (connection_id) REFERENCES integration_connections(id) ON DELETE CASCADE
);

-- Integration Usage Metrics
CREATE TABLE IF NOT EXISTS integration_metrics (
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
  state_token TEXT UNIQUE NOT NULL,
  integration_id INTEGER NOT NULL,
  project_id INTEGER,

  redirect_uri TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
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
-- Notification System Database Schema
-- Add these tables to your existing database

-- Notification Queue Table
-- Stores notifications that need to be sent or retried
CREATE TABLE IF NOT EXISTS notification_queue (
  id SERIAL PRIMARY KEY,
  notification_type TEXT NOT NULL CHECK(notification_type IN (
    'weekly_report',
    'ranking_alert',
    'audit_complete',
    'system_notification',
    'keyword_ranking_change',
    'competitor_alert',
    'citation_issue',
    'scheduled_report'
  )),
  priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK(status IN ('pending', 'queued', 'sent', 'failed')),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  payload TEXT NOT NULL, -- JSON stringified notification data
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Preferences Table
-- Stores user preferences for receiving notifications
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id TEXT, -- Optional: link to user authentication system
  email TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT 1,
  channels TEXT NOT NULL, -- JSON: {email: true, sms: false, push: false, inApp: true}
  types TEXT NOT NULL, -- JSON: {weekly_report: true, ranking_alert: true, ...}
  frequency TEXT NOT NULL, -- JSON: {weekly_report: 'weekly', ranking_alert: 'immediate', ...}
  quiet_hours TEXT, -- JSON: {enabled: true, start: '22:00', end: '08:00', timezone: 'UTC'}
  unsubscribe_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification History Table
-- Tracks all sent notifications for audit and analytics
CREATE TABLE IF NOT EXISTS notification_history (
  id SERIAL PRIMARY KEY,
  notification_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('sent', 'delivered', 'bounced', 'failed')),
  message_id TEXT, -- Provider's message ID
  provider TEXT, -- 'resend' or 'sendgrid'
  metadata TEXT, -- JSON: additional tracking data
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- Notification Templates Table (optional)
-- Store custom email templates for companies/users
CREATE TABLE IF NOT EXISTS notification_templates (
  id SERIAL PRIMARY KEY,
  company_id INTEGER,
  notification_type TEXT NOT NULL,
  name TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL, -- HTML template with placeholders
  text_template TEXT, -- Plain text version
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Notification Subscriptions Table
-- Track specific subscriptions (e.g., subscribe to specific keyword alerts)
CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  subscription_type TEXT NOT NULL, -- 'keyword', 'company', 'competitor', etc.
  entity_id INTEGER NOT NULL, -- ID of the entity being subscribed to
  entity_type TEXT NOT NULL, -- 'keyword', 'company', 'competitor', etc.
  notification_types TEXT NOT NULL, -- JSON array of notification types
  enabled BOOLEAN DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_queue_recipient ON notification_queue(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notification_queue_priority ON notification_queue(priority);
CREATE INDEX IF NOT EXISTS idx_notification_queue_created ON notification_queue(created_at);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_email ON notification_preferences(email);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_enabled ON notification_preferences(enabled);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_token ON notification_preferences(unsubscribe_token);

CREATE INDEX IF NOT EXISTS idx_notification_history_recipient ON notification_history(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notification_history_type ON notification_history(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent ON notification_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_history_status ON notification_history(status);

CREATE INDEX IF NOT EXISTS idx_notification_templates_company ON notification_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_email ON notification_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_entity ON notification_subscriptions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_enabled ON notification_subscriptions(enabled);
-- Job Scheduler Database Schema
-- Tables for managing scheduled jobs and their executions

-- Job Executions table - tracks all job runs
CREATE TABLE IF NOT EXISTS job_executions (
  id SERIAL PRIMARY KEY,
  job_name VARCHAR(100) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_ms INTEGER,
  status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'success', 'failed', 'cancelled')),
  details JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_executions_job_name ON job_executions(job_name);
CREATE INDEX IF NOT EXISTS idx_job_executions_start_time ON job_executions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_job_executions_status ON job_executions(status);

-- Job Schedules table - stores custom job schedules
CREATE TABLE IF NOT EXISTS job_schedules (
  id SERIAL PRIMARY KEY,
  job_name VARCHAR(100) UNIQUE NOT NULL,
  schedule VARCHAR(100) NOT NULL, -- Cron pattern
  enabled BOOLEAN DEFAULT true,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_schedules_job_name ON job_schedules(job_name);
CREATE INDEX IF NOT EXISTS idx_job_schedules_enabled ON job_schedules(enabled);

-- Rankings table - stores keyword ranking history
CREATE TABLE IF NOT EXISTS rankings (
  id SERIAL PRIMARY KEY,
  keyword_id INTEGER NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  rank_change INTEGER DEFAULT 0,
  checked_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_rankings_keyword_id ON rankings(keyword_id);
CREATE INDEX IF NOT EXISTS idx_rankings_checked_at ON rankings(checked_at DESC);

-- Reports table - stores generated reports
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL, -- 'weekly', 'monthly', 'custom'
  report_date TIMESTAMP NOT NULL,
  date_range_start TIMESTAMP NOT NULL,
  date_range_end TIMESTAMP NOT NULL,
  metrics JSONB,
  recommendations JSONB,
  data JSONB,
  file_path TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_reports_company_id ON reports(company_id);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_report_date ON reports(report_date DESC);

-- Job Alerts table - stores alerts for job failures or significant events
CREATE TABLE IF NOT EXISTS job_alerts (
  id SERIAL PRIMARY KEY,
  job_name VARCHAR(100) NOT NULL,
  alert_type VARCHAR(50) NOT NULL, -- 'failure', 'warning', 'info'
  message TEXT NOT NULL,
  details JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_alerts_job_name ON job_alerts(job_name);
CREATE INDEX IF NOT EXISTS idx_job_alerts_resolved ON job_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_job_alerts_created_at ON job_alerts(created_at DESC);

-- Add metadata column to companies table if it doesn't exist
-- This stores settings like scheduled_audits, weekly_reports, etc.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE companies ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add metadata column to keywords table if it doesn't exist
-- This stores settings like is_priority, etc.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'keywords' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE keywords ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Function to clean up old job executions (keep last 1000)
CREATE OR REPLACE FUNCTION cleanup_old_job_executions()
RETURNS void AS $$
BEGIN
  DELETE FROM job_executions
  WHERE id NOT IN (
    SELECT id FROM job_executions
    ORDER BY start_time DESC
    LIMIT 1000
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get job execution statistics
CREATE OR REPLACE FUNCTION get_job_statistics(
  p_job_name VARCHAR DEFAULT NULL,
  p_start_date TIMESTAMP DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP DEFAULT NOW()
)
RETURNS TABLE (
  job_name VARCHAR,
  total_executions BIGINT,
  successful_executions BIGINT,
  failed_executions BIGINT,
  avg_duration_ms NUMERIC,
  last_execution TIMESTAMP,
  last_status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    je.job_name,
    COUNT(*) as total_executions,
    COUNT(CASE WHEN je.status = 'success' THEN 1 END) as successful_executions,
    COUNT(CASE WHEN je.status = 'failed' THEN 1 END) as failed_executions,
    AVG(je.duration_ms) as avg_duration_ms,
    MAX(je.start_time) as last_execution,
    (
      SELECT status FROM job_executions
      WHERE job_name = je.job_name
      ORDER BY start_time DESC
      LIMIT 1
    ) as last_status
  FROM job_executions je
  WHERE je.start_time BETWEEN p_start_date AND p_end_date
    AND (p_job_name IS NULL OR je.job_name = p_job_name)
  GROUP BY je.job_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get ranking trends
CREATE OR REPLACE FUNCTION get_ranking_trends(
  p_keyword_id INTEGER,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  checked_at TIMESTAMP,
  rank INTEGER,
  rank_change INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.checked_at,
    r.rank,
    r.rank_change
  FROM rankings r
  WHERE r.keyword_id = p_keyword_id
    AND r.checked_at >= NOW() - (p_days || ' days')::INTERVAL
  ORDER BY r.checked_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Insert default job schedules
INSERT INTO job_schedules (job_name, schedule, enabled, description) VALUES
  ('audit-runner', '0 2 * * *', true, 'Run automated SEO audits for companies'),
  ('ranking-tracker', '0 3 * * *', true, 'Track keyword rankings daily'),
  ('ranking-tracker-hourly', '0 * * * *', false, 'Track high-priority keyword rankings hourly'),
  ('report-generator', '0 8 * * 1', true, 'Generate and send weekly reports')
ON CONFLICT (job_name) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE job_executions IS 'Tracks all job execution history with timing and status';
COMMENT ON TABLE job_schedules IS 'Stores custom cron schedules for background jobs';
COMMENT ON TABLE rankings IS 'Historical keyword ranking data';
COMMENT ON TABLE reports IS 'Generated reports for companies';
COMMENT ON TABLE job_alerts IS 'Alerts for job failures and significant events';

COMMENT ON COLUMN companies.metadata IS 'JSON metadata including scheduled_audits, weekly_reports settings';
COMMENT ON COLUMN keywords.metadata IS 'JSON metadata including is_priority flag';
-- Project Generation & Scaffolding Schema

-- Project Templates Registry
CREATE TABLE IF NOT EXISTS project_templates (
  id SERIAL PRIMARY KEY,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Projects
CREATE TABLE IF NOT EXISTS generated_projects (
  id SERIAL PRIMARY KEY,
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
  ide_opened_at TIMESTAMPTZ,

  -- Error Tracking
  error_log TEXT, -- JSON array of errors
  last_error TEXT,

  generated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (hub_project_id) REFERENCES hub_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES project_templates(id)
);

-- Template Features
CREATE TABLE IF NOT EXISTS template_features (
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
  generated_project_id INTEGER NOT NULL,

  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,

  status TEXT CHECK(status IN ('pending', 'running', 'completed', 'failed', 'skipped')) DEFAULT 'pending',

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  output_log TEXT, -- Command output
  error_message TEXT,

  FOREIGN KEY (generated_project_id) REFERENCES generated_projects(id) ON DELETE CASCADE
);

-- Template Variables/Placeholders
CREATE TABLE IF NOT EXISTS template_variables (
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
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

  configured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (generated_project_id) REFERENCES generated_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (integration_id) REFERENCES integration_registry(id)
);

-- Code Snippets Library
CREATE TABLE IF NOT EXISTS code_snippets (
  id SERIAL PRIMARY KEY,

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

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template Dependencies
CREATE TABLE IF NOT EXISTS template_dependencies (
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
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
