-- ============================================================================
-- ENHANCEMENT TABLES - NO FOREIGN KEY DEPENDENCIES
-- ============================================================================
-- Creates all 18 enhancement tables without FK constraints to users/subscription_tiers
-- We'll store user_id as TEXT instead of UUID FK for now
-- ============================================================================

-- ============================================================================
-- ANALYTICS TABLES (4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS competitor_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  competitor_id UUID,
  competitor_name TEXT NOT NULL,
  competitor_website TEXT,
  snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ranking_data JSONB,
  local_pack_position INTEGER,
  review_count INTEGER,
  avg_rating NUMERIC(3,2),
  review_velocity INTEGER,
  domain_authority INTEGER,
  page_authority INTEGER,
  backlink_count INTEGER,
  referring_domains INTEGER,
  indexed_pages INTEGER,
  blog_post_count INTEGER,
  last_content_update TIMESTAMP WITH TIME ZONE,
  social_signals JSONB,
  visibility_score NUMERIC(5,2),
  data_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_category TEXT,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  metric_context JSONB,
  previous_value NUMERIC,
  change_amount NUMERIC,
  change_percentage NUMERIC,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  period_type TEXT,
  data_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ranking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  keyword_id UUID REFERENCES keywords(id) ON DELETE SET NULL,
  keyword_text TEXT NOT NULL,
  location TEXT,
  rank_position INTEGER,
  rank_url TEXT,
  rank_type TEXT,
  in_local_pack BOOLEAN DEFAULT FALSE,
  local_pack_position INTEGER,
  has_featured_snippet BOOLEAN DEFAULT FALSE,
  has_knowledge_panel BOOLEAN DEFAULT FALSE,
  search_volume INTEGER,
  top_competitor_rank INTEGER,
  top_competitor_name TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visibility_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  organic_visibility_score NUMERIC(5,2),
  local_visibility_score NUMERIC(5,2),
  total_visibility_score NUMERIC(5,2),
  ranking_score NUMERIC(5,2),
  traffic_score NUMERIC(5,2),
  local_pack_score NUMERIC(5,2),
  review_score NUMERIC(5,2),
  citation_score NUMERIC(5,2),
  market_share NUMERIC(5,2),
  competitive_position INTEGER,
  previous_score NUMERIC(5,2),
  score_change NUMERIC(5,2),
  change_percentage NUMERIC(5,2),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- RATE LIMITING TABLES (4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT, -- Changed from UUID FK to TEXT
  organisation_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  endpoint TEXT NOT NULL,
  http_method TEXT NOT NULL,
  request_path TEXT,
  query_params JSONB,
  request_body_size INTEGER,
  response_status INTEGER,
  response_time_ms INTEGER,
  response_body_size INTEGER,
  error_message TEXT,
  rate_limit_key TEXT,
  rate_limit_remaining INTEGER,
  rate_limit_reset_at TIMESTAMP WITH TIME ZONE,
  database_query_count INTEGER,
  database_query_time_ms INTEGER,
  cache_hit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  user_id TEXT, -- Changed from UUID FK to TEXT
  ip_address INET,
  rate_limit_key TEXT NOT NULL UNIQUE,
  endpoint_pattern TEXT NOT NULL,
  method_pattern TEXT DEFAULT '*',
  max_requests_per_minute INTEGER,
  max_requests_per_hour INTEGER,
  max_requests_per_day INTEGER,
  current_minute_count INTEGER DEFAULT 0,
  current_hour_count INTEGER DEFAULT 0,
  current_day_count INTEGER DEFAULT 0,
  minute_window_start TIMESTAMP WITH TIME ZONE,
  hour_window_start TIMESTAMP WITH TIME ZONE,
  day_window_start TIMESTAMP WITH TIME ZONE,
  total_exceeded_count INTEGER DEFAULT 0,
  last_exceeded_at TIMESTAMP WITH TIME ZONE,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  banned_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  subscription_tier_id TEXT, -- Changed from UUID FK to TEXT
  quota_type TEXT NOT NULL,
  max_quota_per_month INTEGER NOT NULL,
  current_month_usage INTEGER DEFAULT 0,
  quota_reset_date DATE,
  allow_overage BOOLEAN DEFAULT FALSE,
  overage_rate NUMERIC(10,2),
  total_overage_this_month INTEGER DEFAULT 0,
  total_overage_cost NUMERIC(10,2) DEFAULT 0,
  quota_status TEXT DEFAULT 'active',
  quota_exceeded_at TIMESTAMP WITH TIME ZONE,
  notification_sent_at_90_percent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id TEXT, -- Changed from UUID FK to TEXT
  key_name TEXT NOT NULL,
  api_key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  scopes TEXT[],
  allowed_endpoints TEXT[],
  ip_whitelist INET[],
  is_active BOOLEAN DEFAULT TRUE,
  is_test_key BOOLEAN DEFAULT FALSE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  total_requests INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT -- Changed from UUID FK to TEXT
);

-- ============================================================================
-- AUDIT HISTORY TABLES (4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES seo_audits(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL,
  changed_by TEXT, -- Changed from UUID FK to TEXT
  changed_by_name TEXT,
  version_number INTEGER NOT NULL,
  before_data JSONB,
  after_data JSONB,
  diff_summary TEXT,
  changed_fields TEXT[],
  field_changes JSONB,
  change_reason TEXT,
  change_source TEXT DEFAULT 'manual',
  ip_address INET,
  user_agent TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_by TEXT, -- Changed from UUID FK to TEXT
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_notes TEXT
);

CREATE TABLE IF NOT EXISTS company_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL,
  changed_by TEXT, -- Changed from UUID FK to TEXT
  changed_by_name TEXT,
  version_number INTEGER NOT NULL,
  before_data JSONB,
  after_data JSONB,
  diff_summary TEXT,
  changed_fields TEXT[],
  field_changes JSONB,
  change_reason TEXT,
  change_source TEXT DEFAULT 'manual',
  ip_address INET,
  user_agent TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS change_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  change_description TEXT NOT NULL,
  proposed_changes JSONB NOT NULL,
  change_impact TEXT,
  requested_by TEXT NOT NULL, -- Changed from UUID FK to TEXT
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  request_reason TEXT,
  approval_status TEXT DEFAULT 'pending',
  approved_by TEXT, -- Changed from UUID FK to TEXT
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  executed_at TIMESTAMP WITH TIME ZONE,
  execution_status TEXT,
  execution_error TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_name TEXT NOT NULL,
  snapshot_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  snapshot_data JSONB NOT NULL,
  snapshot_size_bytes INTEGER,
  created_by TEXT, -- Changed from UUID FK to TEXT
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  snapshot_notes TEXT,
  retain_until TIMESTAMP WITH TIME ZONE,
  is_archived BOOLEAN DEFAULT FALSE,
  restored_at TIMESTAMP WITH TIME ZONE,
  restored_by TEXT -- Changed from UUID FK to TEXT
);

-- ============================================================================
-- CLIENT PORTAL TABLES (6)
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  access_token TEXT UNIQUE NOT NULL,
  token_type TEXT DEFAULT 'portal',
  allowed_sections TEXT[],
  can_download_reports BOOLEAN DEFAULT TRUE,
  can_request_audits BOOLEAN DEFAULT FALSE,
  can_view_recommendations BOOLEAN DEFAULT TRUE,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  last_ip_address INET,
  last_user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by TEXT, -- Changed from UUID FK to TEXT
  revocation_reason TEXT,
  invited_by TEXT, -- Changed from UUID FK to TEXT
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invitation_email TEXT,
  invitation_accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  portal_access_id UUID REFERENCES client_portal_access(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL,
  report_title TEXT NOT NULL,
  report_period_start DATE,
  report_period_end DATE,
  report_data JSONB NOT NULL,
  report_summary TEXT,
  key_metrics JSONB,
  charts_data JSONB,
  has_pdf_export BOOLEAN DEFAULT FALSE,
  pdf_url TEXT,
  report_status TEXT DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  published_by TEXT, -- Changed from UUID FK to TEXT
  client_viewed_at TIMESTAMP WITH TIME ZONE,
  client_view_count INTEGER DEFAULT 0,
  client_downloaded_at TIMESTAMP WITH TIME ZONE,
  client_feedback TEXT,
  client_rating INTEGER,
  is_shareable BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE,
  share_expires_at TIMESTAMP WITH TIME ZONE,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by TEXT, -- Changed from UUID FK to TEXT
  generation_method TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  portal_access_id UUID REFERENCES client_portal_access(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  action_url TEXT,
  action_label TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  sent_via_email BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  sent_via_sms BOOLEAN DEFAULT FALSE,
  sms_sent_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT -- Changed from UUID FK to TEXT
);

CREATE TABLE IF NOT EXISTS client_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  portal_access_id UUID REFERENCES client_portal_access(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL,
  subject TEXT,
  feedback_text TEXT NOT NULL,
  overall_rating INTEGER,
  service_quality_rating INTEGER,
  communication_rating INTEGER,
  results_rating INTEGER,
  related_report_id UUID REFERENCES client_reports(id) ON DELETE SET NULL,
  related_audit_id UUID REFERENCES seo_audits(id) ON DELETE SET NULL,
  page_url TEXT,
  response_required BOOLEAN DEFAULT FALSE,
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by TEXT, -- Changed from UUID FK to TEXT
  response_text TEXT,
  feedback_status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE TABLE IF NOT EXISTS client_dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  portal_access_id UUID REFERENCES client_portal_access(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL,
  widget_title TEXT,
  widget_config JSONB,
  section TEXT DEFAULT 'main',
  display_order INTEGER DEFAULT 0,
  grid_position JSONB,
  is_visible BOOLEAN DEFAULT TRUE,
  is_pinned BOOLEAN DEFAULT FALSE,
  refresh_interval_seconds INTEGER,
  last_refreshed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  portal_access_id UUID NOT NULL REFERENCES client_portal_access(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_description TEXT,
  page_url TEXT,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for all tables
CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_company_id ON competitor_snapshots(company_id);
CREATE INDEX IF NOT EXISTS idx_seo_trends_company_id ON seo_trends(company_id);
CREATE INDEX IF NOT EXISTS idx_ranking_history_company_id ON ranking_history(company_id);
CREATE INDEX IF NOT EXISTS idx_visibility_history_company_id ON visibility_history(company_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_organisation_id ON api_requests(organisation_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_organisation_id ON rate_limits(organisation_id);
CREATE INDEX IF NOT EXISTS idx_api_quotas_organisation_id ON api_quotas(organisation_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_organisation_id ON api_keys(organisation_id);
CREATE INDEX IF NOT EXISTS idx_audit_history_company_id ON audit_history(company_id);
CREATE INDEX IF NOT EXISTS idx_company_history_company_id ON company_history(company_id);
CREATE INDEX IF NOT EXISTS idx_change_approvals_company_id ON change_approvals(company_id);
CREATE INDEX IF NOT EXISTS idx_data_snapshots_entity ON data_snapshots(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_client_portal_access_company_id ON client_portal_access(company_id);
CREATE INDEX IF NOT EXISTS idx_client_reports_company_id ON client_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_client_notifications_company_id ON client_notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_client_feedback_company_id ON client_feedback(company_id);
CREATE INDEX IF NOT EXISTS idx_client_dashboard_widgets_company_id ON client_dashboard_widgets(company_id);
CREATE INDEX IF NOT EXISTS idx_client_activity_log_company_id ON client_activity_log(company_id);

-- Success message
SELECT '✅ Successfully created 18 enhancement tables!' as result;
