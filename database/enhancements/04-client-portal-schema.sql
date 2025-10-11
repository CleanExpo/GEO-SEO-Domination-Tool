-- ============================================================================
-- ENHANCEMENT 4: CLIENT PORTAL SCHEMA
-- ============================================================================
-- Implements client-facing portal with reports, access control, and notifications
-- ============================================================================

-- ============================================================================
-- CLIENT PORTAL ACCESS (Authentication and access tokens)
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Company reference
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,

  -- Access token
  access_token TEXT UNIQUE NOT NULL, -- Unique token for client access
  token_type TEXT DEFAULT 'portal', -- 'portal', 'report_share', 'api'

  -- Permissions
  allowed_sections TEXT[], -- ['audits', 'rankings', 'reports', 'invoices']
  can_download_reports BOOLEAN DEFAULT TRUE,
  can_request_audits BOOLEAN DEFAULT FALSE,
  can_view_recommendations BOOLEAN DEFAULT TRUE,

  -- Usage tracking
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  last_ip_address INET,
  last_user_agent TEXT,

  -- Expiration and status
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  revocation_reason TEXT,

  -- Invitation
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invitation_email TEXT,
  invitation_accepted_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_portal_access_company_id
  ON client_portal_access(company_id);
CREATE INDEX IF NOT EXISTS idx_client_portal_access_token
  ON client_portal_access(access_token);
CREATE INDEX IF NOT EXISTS idx_client_portal_access_active
  ON client_portal_access(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_client_portal_access_expires
  ON client_portal_access(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- CLIENT REPORTS (Generated reports for client viewing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Company reference
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  portal_access_id UUID REFERENCES client_portal_access(id) ON DELETE SET NULL,

  -- Report details
  report_type TEXT NOT NULL, -- 'monthly_summary', 'audit_results', 'ranking_update', 'competitive_analysis'
  report_title TEXT NOT NULL,
  report_period_start DATE,
  report_period_end DATE,

  -- Report data
  report_data JSONB NOT NULL, -- Full report content
  report_summary TEXT, -- Executive summary
  key_metrics JSONB, -- Top-level metrics for quick view

  -- Visualizations
  charts_data JSONB, -- Chart configurations and data
  has_pdf_export BOOLEAN DEFAULT FALSE,
  pdf_url TEXT, -- S3/storage URL for PDF version

  -- Status
  report_status TEXT DEFAULT 'draft', -- 'draft', 'published', 'archived'
  published_at TIMESTAMP WITH TIME ZONE,
  published_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Client interaction
  client_viewed_at TIMESTAMP WITH TIME ZONE,
  client_view_count INTEGER DEFAULT 0,
  client_downloaded_at TIMESTAMP WITH TIME ZONE,
  client_feedback TEXT,
  client_rating INTEGER, -- 1-5 stars

  -- Sharing
  is_shareable BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE, -- For sharing via public link
  share_expires_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  generation_method TEXT DEFAULT 'manual', -- 'manual', 'automated', 'scheduled'

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_reports_company_id
  ON client_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_client_reports_type
  ON client_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_client_reports_status
  ON client_reports(report_status);
CREATE INDEX IF NOT EXISTS idx_client_reports_published_at
  ON client_reports(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_reports_share_token
  ON client_reports(share_token) WHERE share_token IS NOT NULL;

-- ============================================================================
-- CLIENT NOTIFICATIONS (Portal notifications for clients)
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Company reference
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  portal_access_id UUID REFERENCES client_portal_access(id) ON DELETE CASCADE,

  -- Notification details
  notification_type TEXT NOT NULL, -- 'new_report', 'ranking_change', 'audit_complete', 'message'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'

  -- Action link
  action_url TEXT, -- Link to report or specific page
  action_label TEXT, -- Button text: "View Report", "See Rankings"

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,

  -- Delivery
  sent_via_email BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  sent_via_sms BOOLEAN DEFAULT FALSE,
  sms_sent_at TIMESTAMP WITH TIME ZONE,

  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_client_notifications_company_id
  ON client_notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_client_notifications_portal_access_id
  ON client_notifications(portal_access_id);
CREATE INDEX IF NOT EXISTS idx_client_notifications_is_read
  ON client_notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_client_notifications_created_at
  ON client_notifications(created_at DESC);

-- ============================================================================
-- CLIENT FEEDBACK (Feedback and satisfaction tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Company reference
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  portal_access_id UUID REFERENCES client_portal_access(id) ON DELETE SET NULL,

  -- Feedback details
  feedback_type TEXT NOT NULL, -- 'general', 'report_feedback', 'service_rating', 'feature_request'
  subject TEXT,
  feedback_text TEXT NOT NULL,

  -- Rating
  overall_rating INTEGER, -- 1-5 stars
  service_quality_rating INTEGER, -- 1-5 stars
  communication_rating INTEGER, -- 1-5 stars
  results_rating INTEGER, -- 1-5 stars

  -- Context
  related_report_id UUID REFERENCES client_reports(id) ON DELETE SET NULL,
  related_audit_id UUID REFERENCES seo_audits(id) ON DELETE SET NULL,
  page_url TEXT, -- Which page they were on when submitting

  -- Response
  response_required BOOLEAN DEFAULT FALSE,
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  response_text TEXT,

  -- Status
  feedback_status TEXT DEFAULT 'new', -- 'new', 'acknowledged', 'in_progress', 'resolved', 'closed'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high'

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_client_feedback_company_id
  ON client_feedback(company_id);
CREATE INDEX IF NOT EXISTS idx_client_feedback_status
  ON client_feedback(feedback_status);
CREATE INDEX IF NOT EXISTS idx_client_feedback_type
  ON client_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_client_feedback_created_at
  ON client_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_feedback_response_required
  ON client_feedback(response_required) WHERE response_required = TRUE;

-- ============================================================================
-- CLIENT DASHBOARD WIDGETS (Customizable dashboard configuration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Company reference
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  portal_access_id UUID REFERENCES client_portal_access(id) ON DELETE CASCADE,

  -- Widget details
  widget_type TEXT NOT NULL, -- 'ranking_chart', 'audit_score', 'keyword_list', 'competitor_comparison'
  widget_title TEXT,
  widget_config JSONB, -- Configuration options

  -- Position
  section TEXT DEFAULT 'main', -- 'main', 'sidebar', 'footer'
  display_order INTEGER DEFAULT 0,
  grid_position JSONB, -- { x: 0, y: 0, width: 6, height: 4 }

  -- Visibility
  is_visible BOOLEAN DEFAULT TRUE,
  is_pinned BOOLEAN DEFAULT FALSE,

  -- Data refresh
  refresh_interval_seconds INTEGER, -- Auto-refresh interval
  last_refreshed_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_dashboard_widgets_company_id
  ON client_dashboard_widgets(company_id);
CREATE INDEX IF NOT EXISTS idx_client_dashboard_widgets_portal_access_id
  ON client_dashboard_widgets(portal_access_id);
CREATE INDEX IF NOT EXISTS idx_client_dashboard_widgets_section
  ON client_dashboard_widgets(section);
CREATE INDEX IF NOT EXISTS idx_client_dashboard_widgets_visible
  ON client_dashboard_widgets(is_visible) WHERE is_visible = TRUE;

-- ============================================================================
-- CLIENT ACTIVITY LOG (Track client portal activity)
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Company reference
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  portal_access_id UUID NOT NULL REFERENCES client_portal_access(id) ON DELETE CASCADE,

  -- Activity details
  activity_type TEXT NOT NULL, -- 'login', 'view_report', 'download_report', 'submit_feedback', 'view_rankings'
  activity_description TEXT,
  page_url TEXT,

  -- Metadata
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  duration_seconds INTEGER, -- Time spent on page/activity

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_activity_log_company_id
  ON client_activity_log(company_id);
CREATE INDEX IF NOT EXISTS idx_client_activity_log_portal_access_id
  ON client_activity_log(portal_access_id);
CREATE INDEX IF NOT EXISTS idx_client_activity_log_type
  ON client_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_client_activity_log_created_at
  ON client_activity_log(created_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to generate client portal access token
CREATE OR REPLACE FUNCTION generate_portal_token(
  p_company_id UUID,
  p_invited_by UUID,
  p_invitation_email TEXT,
  p_expires_in_days INTEGER DEFAULT 365
)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
  v_access_id UUID;
BEGIN
  -- Generate secure random token
  v_token := 'portal_' || encode(gen_random_bytes(32), 'base64');
  v_token := replace(replace(replace(v_token, '/', '_'), '+', '-'), '=', '');

  -- Insert portal access record
  INSERT INTO client_portal_access (
    company_id,
    access_token,
    invited_by,
    invitation_email,
    expires_at
  )
  VALUES (
    p_company_id,
    v_token,
    p_invited_by,
    p_invitation_email,
    NOW() + (p_expires_in_days || ' days')::INTERVAL
  )
  RETURNING id INTO v_access_id;

  RETURN v_token;
END;
$$ LANGUAGE plpgsql;

-- Function to log client activity
CREATE OR REPLACE FUNCTION log_client_activity(
  p_portal_access_id UUID,
  p_activity_type TEXT,
  p_activity_description TEXT DEFAULT NULL,
  p_page_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
  v_activity_id UUID;
BEGIN
  -- Get company_id from portal access
  SELECT company_id INTO v_company_id
  FROM client_portal_access
  WHERE id = p_portal_access_id;

  -- Update last accessed timestamp
  UPDATE client_portal_access
  SET last_accessed_at = NOW(),
      access_count = access_count + 1
  WHERE id = p_portal_access_id;

  -- Insert activity log
  INSERT INTO client_activity_log (
    company_id,
    portal_access_id,
    activity_type,
    activity_description,
    page_url
  )
  VALUES (
    v_company_id,
    p_portal_access_id,
    p_activity_type,
    p_activity_description,
    p_page_url
  )
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_portal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_client_portal_access_timestamp') THEN
    CREATE TRIGGER trigger_update_client_portal_access_timestamp
      BEFORE UPDATE ON client_portal_access
      FOR EACH ROW
      EXECUTE FUNCTION update_client_portal_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_client_reports_timestamp') THEN
    CREATE TRIGGER trigger_update_client_reports_timestamp
      BEFORE UPDATE ON client_reports
      FOR EACH ROW
      EXECUTE FUNCTION update_client_portal_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_client_dashboard_widgets_timestamp') THEN
    CREATE TRIGGER trigger_update_client_dashboard_widgets_timestamp
      BEFORE UPDATE ON client_dashboard_widgets
      FOR EACH ROW
      EXECUTE FUNCTION update_client_portal_updated_at();
  END IF;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE client_portal_access IS 'Client portal authentication and access tokens';
COMMENT ON TABLE client_reports IS 'Generated reports visible to clients in portal';
COMMENT ON TABLE client_notifications IS 'In-portal notifications for clients';
COMMENT ON TABLE client_feedback IS 'Client feedback and satisfaction tracking';
COMMENT ON TABLE client_dashboard_widgets IS 'Customizable dashboard widget configuration';
COMMENT ON TABLE client_activity_log IS 'Activity tracking for client portal usage';
COMMENT ON FUNCTION generate_portal_token IS 'Generates secure access token for client portal';
COMMENT ON FUNCTION log_client_activity IS 'Logs client activity and updates access timestamps';

-- ============================================================================
-- CLIENT PORTAL SCHEMA COMPLETE
-- ============================================================================
