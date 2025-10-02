CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE TABLE IF NOT EXISTS individuals (
  company_id UUID NOT NULL,
  title TEXT,
  credentials TEXT, -- JSON array
  experience_years INTEGER,
  bio TEXT,
  expertise_areas TEXT, -- JSON array
  author_page_url TEXT,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS audits (
  audit_date TIMESTAMPTZ DEFAULT NOW(),
  lighthouse_scores TEXT, -- JSON object (performance, accessibility, best_practices, seo, pwa)
  eeat_scores TEXT, -- JSON object (experience, expertise, authoritativeness, trustworthiness)
  local_pack_positions TEXT, -- JSON array
  competitor_data TEXT, -- JSON object
  recommendations TEXT, -- JSON array
  priority_level TEXT CHECK(priority_level IN ('low', 'medium', 'high', 'critical')),
CREATE TABLE IF NOT EXISTS keywords (
  keyword TEXT NOT NULL,
  location TEXT NOT NULL,
  search_volume INTEGER,
  difficulty INTEGER,
  current_rank INTEGER,
  competition_level TEXT CHECK(competition_level IN ('low', 'medium', 'high')),
  last_checked TIMESTAMPTZ DEFAULT NOW(),
CREATE TABLE IF NOT EXISTS competitors (
  competitor_name TEXT NOT NULL,
  website TEXT,
  rankings TEXT, -- JSON object
  review_count INTEGER,
  avg_rating REAL,
  last_analyzed TIMESTAMPTZ DEFAULT NOW(),
CREATE TABLE IF NOT EXISTS citations (
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  nap_accurate BOOLEAN DEFAULT false,
  status TEXT CHECK(status IN ('active', 'pending', 'inactive')),
CREATE TABLE IF NOT EXISTS service_areas (
  area_name TEXT NOT NULL,
  area_type TEXT CHECK(area_type IN ('city', 'state', 'radius', 'custom')),
  latitude REAL,
  longitude REAL,
  radius_miles INTEGER,
CREATE TABLE IF NOT EXISTS local_pack_tracking (
  position INTEGER,
  competitor_in_pack TEXT, -- JSON array of competitors
  checked_at TIMESTAMPTZ DEFAULT NOW(),
CREATE TABLE IF NOT EXISTS backlinks (
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT,
  domain_authority INTEGER,
  follow_type TEXT CHECK(follow_type IN ('dofollow', 'nofollow')),
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
CREATE TABLE IF NOT EXISTS content_gaps (
  topic TEXT NOT NULL,
  competitor_has_content BOOLEAN DEFAULT false,
  priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
  status TEXT CHECK(status IN ('identified', 'in_progress', 'completed')),
CREATE TABLE IF NOT EXISTS scheduled_audits (
  audit_type TEXT NOT NULL,
  frequency TEXT CHECK(frequency IN ('daily', 'weekly', 'monthly')),
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  enabled BOOLEAN DEFAULT true,
CREATE TABLE IF NOT EXISTS crm_contacts (
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company TEXT,
  location TEXT,
  status TEXT DEFAULT 'lead', -- 'active', 'inactive', 'lead'
  notes TEXT,
CREATE TABLE IF NOT EXISTS crm_deals (
  title TEXT NOT NULL,
  contact_id UUID NOT NULL,
  value REAL NOT NULL,
  stage TEXT DEFAULT 'prospect', -- 'prospect', 'qualification', 'proposal', 'negotiation', 'closed'
  probability INTEGER DEFAULT 0, -- 0-100
  close_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS crm_tasks (
  due_date DATE,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'completed'
  assigned_to TEXT,
  contact_id UUID,
  deal_id UUID,
  FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (deal_id) REFERENCES crm_deals(id) ON DELETE SET NULL
CREATE TABLE IF NOT EXISTS crm_calendar_events (
  event_date DATE NOT NULL,
  event_time TEXT NOT NULL,
  duration TEXT,
  type TEXT DEFAULT 'meeting', -- 'meeting', 'call', 'demo', 'follow-up'
  FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE SET NULL
CREATE TABLE IF NOT EXISTS crm_event_attendees (
  event_id UUID NOT NULL,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT,
  FOREIGN KEY (event_id) REFERENCES crm_calendar_events(id) ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS crm_projects (
  status TEXT DEFAULT 'planning', -- 'planning', 'active', 'completed', 'on-hold'
  progress INTEGER DEFAULT 0, -- 0-100
CREATE TABLE IF NOT EXISTS crm_project_members (
  project_id UUID NOT NULL,
  member_name TEXT NOT NULL,
  role TEXT,
  FOREIGN KEY (project_id) REFERENCES crm_projects(id) ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS crm_github_projects (
  url TEXT UNIQUE NOT NULL,
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  open_prs INTEGER DEFAULT 0,
  language TEXT,
  last_updated DATE,
CREATE TABLE IF NOT EXISTS crm_prompts (
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT, -- JSON array stored as text
  favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
CREATE TABLE IF NOT EXISTS crm_support_tickets (
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
CREATE TABLE IF NOT EXISTS hub_projects (
  slug TEXT UNIQUE NOT NULL,
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
  last_accessed TIMESTAMPTZ
CREATE TABLE IF NOT EXISTS hub_api_keys (
  project_id UUID,
  key_name TEXT NOT NULL,
  key_label TEXT, -- User-friendly label
  service_name TEXT, -- 'SEMrush', 'Anthropic', 'Google', etc.
  -- Security
  encrypted_key TEXT NOT NULL,
  key_prefix TEXT, -- First few chars for identification
  environment TEXT CHECK(environment IN ('development', 'staging', 'production')),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_used TIMESTAMPTZ,
  FOREIGN KEY (project_id) REFERENCES hub_projects(id) ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS hub_project_configs (
  config_key TEXT NOT NULL,
  config_value TEXT, -- JSON for complex configs
  config_type TEXT, -- 'string', 'number', 'boolean', 'json', 'secret'
  is_required BOOLEAN DEFAULT false,
  default_value TEXT,
  FOREIGN KEY (project_id) REFERENCES hub_projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, config_key)
CREATE TABLE IF NOT EXISTS hub_project_features (
  feature_name TEXT NOT NULL,
  feature_slug TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  requires_config BOOLEAN DEFAULT false,
  config_schema TEXT, -- JSON schema for feature config
  icon TEXT,
  route_path TEXT, -- UI route for this feature
CREATE TABLE IF NOT EXISTS hub_project_dependencies (
  dependency_type TEXT CHECK(dependency_type IN ('api', 'service', 'database', 'auth', 'storage')),
  dependency_name TEXT NOT NULL,
  version TEXT,
  is_required BOOLEAN DEFAULT true,
  is_configured BOOLEAN DEFAULT false,
CREATE TABLE IF NOT EXISTS hub_sandbox_sessions (
  session_id TEXT UNIQUE NOT NULL,
  -- Session data
  viewport_size TEXT, -- 'desktop', 'tablet', 'mobile'
  device_type TEXT,
  -- State
  last_route TEXT,
  session_data TEXT, -- JSON for session state
  last_active TIMESTAMPTZ DEFAULT NOW(),
CREATE TABLE IF NOT EXISTS hub_activity_log (
  activity_type TEXT, -- 'accessed', 'configured', 'deployed', 'api_called', etc.
  activity_description TEXT,
  metadata TEXT, -- JSON for additional context
  user_id TEXT, -- If multi-user in future
  FOREIGN KEY (project_id) REFERENCES hub_projects(id) ON DELETE SET NULL
CREATE TABLE IF NOT EXISTS hub_quick_actions (
  action_name TEXT NOT NULL,
  action_type TEXT, -- 'url', 'api_call', 'config_change', 'script'
  action_config TEXT, -- JSON with action details
  color TEXT,
  keyboard_shortcut TEXT,
  order_index INTEGER DEFAULT 0,
CREATE TABLE IF NOT EXISTS hub_collections (
  created_at TIMESTAMPTZ DEFAULT NOW()
CREATE TABLE IF NOT EXISTS hub_collection_projects (
  collection_id UUID NOT NULL,
  PRIMARY KEY (collection_id, project_id),
  FOREIGN KEY (collection_id) REFERENCES hub_collections(id) ON DELETE CASCADE,
CREATE TABLE IF NOT EXISTS crm_components (
  code TEXT NOT NULL,
  framework TEXT, -- 'react', 'vue', 'angular', 'html', etc.
  category TEXT, -- 'ui', 'form', 'navigation', 'layout', etc.
  demo_url TEXT,
CREATE TABLE IF NOT EXISTS crm_ai_tools (
  description TEXT NOT NULL,
  category TEXT, -- 'content', 'seo', 'design', 'development', etc.
  pricing TEXT, -- 'free', 'freemium', 'paid', 'enterprise'
  features TEXT, -- JSON array stored as text
  rating REAL, -- 0.0-5.0
CREATE TABLE IF NOT EXISTS crm_tutorials (
  category TEXT, -- 'seo', 'development', 'design', 'marketing', etc.
  difficulty TEXT DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
  duration INTEGER, -- Duration in minutes
  video_url TEXT,
  resources TEXT, -- JSON array stored as text
  views INTEGER DEFAULT 0,
CREATE TABLE IF NOT EXISTS seo_strategies (
  strategy_name TEXT NOT NULL,
  category TEXT CHECK(category IN ('content', 'technical', 'ai_optimization', 'local', 'citations', 'eeat', 'competitor')),
  principle TEXT NOT NULL,
  implementation_details TEXT NOT NULL,
  tools_resources TEXT, -- JSON array
  priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'critical')),
CREATE TABLE IF NOT EXISTS strategy_case_studies (
  strategy_id UUID NOT NULL,
  case_study_title TEXT NOT NULL,
  challenge TEXT,
  implementation TEXT,
  results_achieved TEXT,
  metrics TEXT, -- JSON object (e.g., {"traffic_increase": "150%", "rankings_improved": 45})
  timeframe TEXT,
  FOREIGN KEY (strategy_id) REFERENCES seo_strategies(id) ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS ai_search_campaigns (
  campaign_name TEXT NOT NULL,
  objective TEXT,
  target_ai_platforms TEXT, -- JSON array ["Perplexity", "ChatGPT", "Gemini", "Claude"]
  start_date DATE,
  end_date DATE,
  status TEXT CHECK(status IN ('planning', 'active', 'paused', 'completed')),
  budget REAL,
CREATE TABLE IF NOT EXISTS campaign_strategies (
  campaign_id UUID NOT NULL,
  implementation_status TEXT CHECK(implementation_status IN ('not_started', 'in_progress', 'completed', 'on_hold')),
  FOREIGN KEY (campaign_id) REFERENCES ai_search_campaigns(id) ON DELETE CASCADE,
CREATE TABLE IF NOT EXISTS ai_search_visibility (
  campaign_id UUID,
  ai_platform TEXT NOT NULL, -- Perplexity, ChatGPT, etc.
  query TEXT NOT NULL,
  brand_mentioned BOOLEAN DEFAULT false,
  position_in_response INTEGER, -- Position where brand is mentioned
  context_sentiment TEXT CHECK(context_sentiment IN ('positive', 'neutral', 'negative')),
  citation_included BOOLEAN DEFAULT false,
  citation_url TEXT,
  full_response TEXT,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES ai_search_campaigns(id) ON DELETE SET NULL
CREATE TABLE IF NOT EXISTS perplexity_optimization (
  content_type TEXT, -- article, landing_page, product, etc.
  optimization_score INTEGER, -- 0-100
  ai_readability_score INTEGER,
  citation_worthiness_score INTEGER,
  key_facts_extracted TEXT, -- JSON array of key facts AI might cite
  recommended_improvements TEXT, -- JSON array
CREATE TABLE IF NOT EXISTS ai_content_strategy (
  topic_cluster TEXT NOT NULL,
  target_ai_queries TEXT, -- JSON array of queries AI users might ask
  content_type TEXT,
  factual_angle TEXT, -- The unique factual angle to own
  expert_sources TEXT, -- JSON array of expert sources to cite
  data_points TEXT, -- JSON array of unique data points to include
  implementation_status TEXT CHECK(implementation_status IN ('planned', 'in_progress', 'published', 'optimizing')),
  published_url TEXT,
  ai_citation_count INTEGER DEFAULT 0,
CREATE TABLE IF NOT EXISTS campaign_results (
  metric_name TEXT NOT NULL,
  metric_value TEXT NOT NULL,
  metric_type TEXT, -- traffic, rankings, citations, conversions, etc.
  measurement_date DATE,
  FOREIGN KEY (campaign_id) REFERENCES ai_search_campaigns(id) ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS ai_competitor_analysis (
  competitor_id UUID,
  ai_platform TEXT NOT NULL,
  queries_analyzed INTEGER DEFAULT 0,
  mention_frequency INTEGER DEFAULT 0, -- How often competitor appears in AI responses
  average_position REAL,
  citation_quality_score INTEGER, -- 0-100
  topic_dominance TEXT, -- JSON object of topics they dominate
  FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS strategy_implementation_notes (
  campaign_strategy_id UUID NOT NULL,
  note_text TEXT NOT NULL,
  created_by TEXT,
  FOREIGN KEY (campaign_strategy_id) REFERENCES campaign_strategies(id) ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS integration_registry (
  name TEXT NOT NULL UNIQUE,
  category TEXT CHECK(category IN ('development', 'database', 'ai', 'analytics', 'deployment', 'auth', 'storage', 'communication', 'productivity')),
  -- Display Info
  display_name TEXT NOT NULL,
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
  supports_webhooks BOOLEAN DEFAULT false,
  supports_realtime BOOLEAN DEFAULT false,
  supports_file_storage BOOLEAN DEFAULT false,
  -- Documentation
  docs_url TEXT,
  setup_guide_url TEXT,
  api_reference_url TEXT,
CREATE TABLE IF NOT EXISTS integration_connections (
  integration_id UUID NOT NULL,
  -- Connection Info
  connection_name TEXT,
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
  FOREIGN KEY (integration_id) REFERENCES integration_registry(id) ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS integration_webhooks (
  connection_id UUID NOT NULL,
  webhook_url TEXT NOT NULL,
  webhook_secret TEXT, -- For signature verification
  -- Events
  subscribed_events TEXT, -- JSON array
  last_triggered TIMESTAMPTZ,
  total_triggers INTEGER DEFAULT 0,
  FOREIGN KEY (connection_id) REFERENCES integration_connections(id) ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS webhook_events (
  webhook_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT, -- JSON payload
  status TEXT CHECK(status IN ('received', 'processing', 'completed', 'failed')),
  error_message TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  FOREIGN KEY (webhook_id) REFERENCES integration_webhooks(id) ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS integration_sync_jobs (
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
CREATE TABLE IF NOT EXISTS integration_metrics (
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
CREATE TABLE IF NOT EXISTS integration_sdk_versions (
  sdk_name TEXT,
  sdk_version TEXT,
  language TEXT, -- 'javascript', 'python', 'typescript', etc.
  install_command TEXT,
  is_recommended BOOLEAN DEFAULT false,
CREATE TABLE IF NOT EXISTS integration_templates (
  template_name TEXT NOT NULL,
  use_case TEXT, -- 'authentication', 'data_storage', 'real_time', etc.
  config_template TEXT, -- JSON template
  code_snippet TEXT,
CREATE TABLE IF NOT EXISTS oauth_states (
  state_token TEXT UNIQUE NOT NULL,
  redirect_uri TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  FOREIGN KEY (integration_id) REFERENCES integration_registry(id),
  FOREIGN KEY (project_id) REFERENCES hub_projects(id)
CREATE TABLE IF NOT EXISTS notification_queue (
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
  payload TEXT NOT NULL, -- JSON stringified notification data
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id TEXT, -- Optional: link to user authentication system
  email TEXT NOT NULL UNIQUE,
  channels TEXT NOT NULL, -- JSON: {email: true, sms: false, push: false, inApp: true}
  types TEXT NOT NULL, -- JSON: {weekly_report: true, ranking_alert: true, ...}
  frequency TEXT NOT NULL, -- JSON: {weekly_report: 'weekly', ranking_alert: 'immediate', ...}
  quiet_hours TEXT, -- JSON: {enabled: true, start: '22:00', end: '08:00', timezone: 'UTC'}
  unsubscribe_token TEXT UNIQUE,
CREATE TABLE IF NOT EXISTS notification_history (
  notification_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('sent', 'delivered', 'bounced', 'failed')),
  message_id TEXT, -- Provider's message ID
  provider TEXT, -- 'resend' or 'sendgrid'
  metadata TEXT, -- JSON: additional tracking data
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
CREATE TABLE IF NOT EXISTS notification_templates (
  company_id UUID,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL, -- HTML template with placeholders
  text_template TEXT, -- Plain text version
CREATE TABLE IF NOT EXISTS notification_subscriptions (
  email TEXT NOT NULL,
  subscription_type TEXT NOT NULL, -- 'keyword', 'company', 'competitor', etc.
  entity_id UUID NOT NULL, -- ID of the entity being subscribed to
  entity_type TEXT NOT NULL, -- 'keyword', 'company', 'competitor', etc.
  notification_types TEXT NOT NULL, -- JSON array of notification types
CREATE TABLE IF NOT EXISTS job_executions (
  job_name VARCHAR(100) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_ms INTEGER,
  status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'success', 'failed', 'cancelled')),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
CREATE TABLE IF NOT EXISTS job_schedules (
  job_name VARCHAR(100) UNIQUE NOT NULL,
  schedule VARCHAR(100) NOT NULL, -- Cron pattern
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
CREATE TABLE IF NOT EXISTS rankings (
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  rank_change INTEGER DEFAULT 0,
  checked_at TIMESTAMP DEFAULT NOW(),
CREATE TABLE IF NOT EXISTS reports (
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL, -- 'weekly', 'monthly', 'custom'
  report_date TIMESTAMP NOT NULL,
  date_range_start TIMESTAMP NOT NULL,
  date_range_end TIMESTAMP NOT NULL,
  metrics JSONB,
  recommendations JSONB,
  data JSONB,
  file_path TEXT,
  sent_at TIMESTAMP,
CREATE TABLE IF NOT EXISTS job_alerts (
  alert_type VARCHAR(50) NOT NULL, -- 'failure', 'warning', 'info'
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE companies ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;
    WHERE table_name = 'keywords' AND column_name = 'metadata'
    ALTER TABLE keywords ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
CREATE OR REPLACE FUNCTION cleanup_old_job_executions()
RETURNS void AS $$
  DELETE FROM job_executions
  WHERE id NOT IN (
    SELECT id FROM job_executions
    ORDER BY start_time DESC
    LIMIT 1000
  );
END;
$$ LANGUAGE plpgsql;
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
CREATE OR REPLACE FUNCTION get_ranking_trends(
  p_keyword_id UUID,
  p_days INTEGER DEFAULT 30
  checked_at TIMESTAMP,
  rank INTEGER,
  rank_change INTEGER
    r.checked_at,
    r.rank,
    r.rank_change
  FROM rankings r
  WHERE r.keyword_id = p_keyword_id
    AND r.checked_at >= NOW() - (p_days || ' days')::INTERVAL
  ORDER BY r.checked_at ASC;
INSERT INTO job_schedules (job_name, schedule, enabled, description) VALUES
  ('audit-runner', '0 2 * * *', true, 'Run automated SEO audits for companies'),
  ('ranking-tracker', '0 3 * * *', true, 'Track keyword rankings daily'),
  ('ranking-tracker-hourly', '0 * * * *', false, 'Track high-priority keyword rankings hourly'),
  ('report-generator', '0 8 * * 1', true, 'Generate and send weekly reports')
ON CONFLICT (job_name) DO NOTHING;
COMMENT ON TABLE job_executions IS 'Tracks all job execution history with timing and status';
COMMENT ON TABLE job_schedules IS 'Stores custom cron schedules for background jobs';
COMMENT ON TABLE rankings IS 'Historical keyword ranking data';
COMMENT ON TABLE reports IS 'Generated reports for companies';
COMMENT ON TABLE job_alerts IS 'Alerts for job failures and significant events';
COMMENT ON COLUMN companies.metadata IS 'JSON metadata including scheduled_audits, weekly_reports settings';
COMMENT ON COLUMN keywords.metadata IS 'JSON metadata including is_priority flag';
CREATE TABLE IF NOT EXISTS project_templates (
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
  default_config TEXT, -- JSON object with defaults
  env_variables TEXT, -- JSON array of required env vars
  preview_image TEXT,
  documentation_url TEXT,
CREATE TABLE IF NOT EXISTS generated_projects (
  hub_project_id UUID, -- Links to hub_projects
  template_id UUID NOT NULL,
  -- Project Info
  project_name TEXT NOT NULL,
  project_slug TEXT NOT NULL,
  output_path TEXT NOT NULL, -- Where project was generated
  selected_features TEXT, -- JSON array of enabled features
  selected_integrations TEXT, -- JSON array
  custom_config TEXT, -- JSON object with user customizations
  -- Generation Status
  status TEXT CHECK(status IN ('pending', 'generating', 'completed', 'failed', 'archived')) DEFAULT 'pending',
  generation_progress INTEGER DEFAULT 0, -- 0-100
  -- Setup Steps Status
  folder_created BOOLEAN DEFAULT false,
  files_generated BOOLEAN DEFAULT false,
  dependencies_installed BOOLEAN DEFAULT false,
  env_configured BOOLEAN DEFAULT false,
  integrations_setup BOOLEAN DEFAULT false,
  database_migrated BOOLEAN DEFAULT false,
  git_initialized BOOLEAN DEFAULT false,
  ide_opened BOOLEAN DEFAULT false,
  all_ready BOOLEAN DEFAULT false,
  -- IDE Integration
  ide_preference TEXT CHECK(ide_preference IN ('vscode', 'cursor', 'webstorm', 'none')),
  ide_opened_at TIMESTAMPTZ,
  -- Error Tracking
  generated_at TIMESTAMPTZ,
  FOREIGN KEY (hub_project_id) REFERENCES hub_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES project_templates(id)
CREATE TABLE IF NOT EXISTS template_features (
  feature_key TEXT NOT NULL,
  -- Feature Type
  category TEXT, -- 'authentication', 'database', 'ai', 'payment', etc.
  -- Dependencies
  requires_integration TEXT, -- JSON array of integration names
  requires_features TEXT, -- JSON array of other features
  -- Code Generation
  files_to_add TEXT, -- JSON array of file paths
  dependencies_to_install TEXT, -- JSON array of npm packages
  env_variables_needed TEXT, -- JSON array
  default_enabled BOOLEAN DEFAULT false,
  FOREIGN KEY (template_id) REFERENCES project_templates(id) ON DELETE CASCADE,
  UNIQUE(template_id, feature_key)
CREATE TABLE IF NOT EXISTS generation_steps (
  generated_project_id UUID NOT NULL,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  status TEXT CHECK(status IN ('pending', 'running', 'completed', 'failed', 'skipped')) DEFAULT 'pending',
  output_log TEXT, -- Command output
  FOREIGN KEY (generated_project_id) REFERENCES generated_projects(id) ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS template_variables (
  variable_key TEXT NOT NULL, -- e.g., 'PROJECT_NAME', 'API_KEY'
  variable_name TEXT NOT NULL,
  variable_type TEXT CHECK(variable_type IN ('string', 'number', 'boolean', 'select', 'multiselect')),
  -- Validation
  validation_pattern TEXT, -- Regex for validation
  -- For select types
  options TEXT, -- JSON array
  UNIQUE(template_id, variable_key)
CREATE TABLE IF NOT EXISTS integration_auto_config (
  -- Configuration Status
  status TEXT CHECK(status IN ('pending', 'configuring', 'completed', 'failed')) DEFAULT 'pending',
  -- Auto-Setup Actions
  env_vars_added BOOLEAN DEFAULT false,
  config_files_created BOOLEAN DEFAULT false,
  initialization_run BOOLEAN DEFAULT false,
  -- Configuration Data
  credentials_fetched TEXT, -- JSON with API keys, etc.
  config_applied TEXT, -- JSON of applied configuration
  configured_at TIMESTAMPTZ,
  FOREIGN KEY (generated_project_id) REFERENCES generated_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (integration_id) REFERENCES integration_registry(id)
CREATE TABLE IF NOT EXISTS code_snippets (
  snippet_key TEXT UNIQUE NOT NULL,
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
CREATE TABLE IF NOT EXISTS template_dependencies (
  dependency_version TEXT,
  dependency_type TEXT CHECK(dependency_type IN ('npm', 'pip', 'gem', 'system')),
  is_dev_dependency BOOLEAN DEFAULT false,
  FOREIGN KEY (template_id) REFERENCES project_templates(id) ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS ide_configs (
  ide_name TEXT CHECK(ide_name IN ('vscode', 'cursor', 'webstorm', 'pycharm')),
  -- Configuration Files
  config_files TEXT, -- JSON object with file paths and contents
  extensions_recommended TEXT, -- JSON array of extension IDs
  settings TEXT, -- JSON object with IDE settings
  launch_command TEXT, -- Command to open IDE
ALTER TABLE companies ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE individuals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE audits ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE rankings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE backlinks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE crm_tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE crm_calendar_events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE individuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own data" ON companies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own data" ON companies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own data" ON companies FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_keywords_company ON keywords(company_id);
CREATE INDEX IF NOT EXISTS idx_audits_company ON audits(company_id);
CREATE INDEX IF NOT EXISTS idx_competitors_company ON competitors(company_id);
CREATE INDEX IF NOT EXISTS idx_citations_company ON citations(company_id);
CREATE INDEX IF NOT EXISTS idx_local_pack_company ON local_pack_tracking(company_id);
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
CREATE INDEX IF NOT EXISTS idx_hub_projects_slug ON hub_projects(slug);
CREATE INDEX IF NOT EXISTS idx_hub_projects_status ON hub_projects(status);
CREATE INDEX IF NOT EXISTS idx_hub_api_keys_project ON hub_api_keys(project_id);
CREATE INDEX IF NOT EXISTS idx_hub_configs_project ON hub_project_configs(project_id);
CREATE INDEX IF NOT EXISTS idx_hub_activity_project ON hub_activity_log(project_id);
CREATE INDEX idx_components_category ON crm_components(category);
CREATE INDEX idx_components_framework ON crm_components(framework);
CREATE INDEX idx_components_favorite ON crm_components(favorite);
CREATE INDEX idx_ai_tools_category ON crm_ai_tools(category);
CREATE INDEX idx_ai_tools_pricing ON crm_ai_tools(pricing);
CREATE INDEX idx_ai_tools_favorite ON crm_ai_tools(favorite);
CREATE INDEX idx_tutorials_category ON crm_tutorials(category);
CREATE INDEX idx_tutorials_difficulty ON crm_tutorials(difficulty);
CREATE INDEX idx_tutorials_favorite ON crm_tutorials(favorite);
CREATE INDEX IF NOT EXISTS idx_ai_visibility_platform ON ai_search_visibility(ai_platform, company_id);
CREATE INDEX IF NOT EXISTS idx_ai_visibility_query ON ai_search_visibility(query);
CREATE INDEX IF NOT EXISTS idx_campaigns_company ON ai_search_campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_campaign_strategies ON campaign_strategies(campaign_id, strategy_id);
CREATE INDEX IF NOT EXISTS idx_perplexity_opt ON perplexity_optimization(company_id, url);
CREATE INDEX IF NOT EXISTS idx_connections_project ON integration_connections(project_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON integration_connections(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_connection ON integration_webhooks(connection_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_webhook ON webhook_events(webhook_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_connection ON integration_sync_jobs(connection_id);
CREATE INDEX IF NOT EXISTS idx_metrics_connection ON integration_metrics(connection_id);
CREATE INDEX IF NOT EXISTS idx_oauth_state_token ON oauth_states(state_token);
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
CREATE INDEX IF NOT EXISTS idx_job_executions_job_name ON job_executions(job_name);
CREATE INDEX IF NOT EXISTS idx_job_executions_start_time ON job_executions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_job_executions_status ON job_executions(status);
CREATE INDEX IF NOT EXISTS idx_job_schedules_job_name ON job_schedules(job_name);
CREATE INDEX IF NOT EXISTS idx_job_schedules_enabled ON job_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_rankings_keyword_id ON rankings(keyword_id);
CREATE INDEX IF NOT EXISTS idx_rankings_checked_at ON rankings(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_company_id ON reports(company_id);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_report_date ON reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_job_alerts_job_name ON job_alerts(job_name);
CREATE INDEX IF NOT EXISTS idx_job_alerts_resolved ON job_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_job_alerts_created_at ON job_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_category ON project_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_active ON project_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_generated_status ON generated_projects(status);
CREATE INDEX IF NOT EXISTS idx_generated_hub_project ON generated_projects(hub_project_id);
CREATE INDEX IF NOT EXISTS idx_features_template ON template_features(template_id);
CREATE INDEX IF NOT EXISTS idx_steps_project ON generation_steps(generated_project_id);
CREATE INDEX IF NOT EXISTS idx_snippets_language ON code_snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_framework ON code_snippets(framework);
