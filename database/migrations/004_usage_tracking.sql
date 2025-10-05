-- Migration: 004_usage_tracking.sql
-- Description: Implements per-tenant usage tracking for billing and quota enforcement
-- Author: Orchestra-Coordinator
-- Date: 2025-10-05

-- ============================================================================
-- USAGE TRACKING TABLES
-- ============================================================================

-- Usage logs table for recording all resource consumption
CREATE TABLE IF NOT EXISTS usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('api_call', 'storage', 'compute', 'search', 'export')),
  resource text NOT NULL, -- API endpoint, file path, function name, etc.
  quantity integer DEFAULT 1 CHECK (quantity > 0),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,

  -- Indexes for performance
  CONSTRAINT usage_logs_event_type_check CHECK (event_type IN ('api_call', 'storage', 'compute', 'search', 'export'))
);

CREATE INDEX idx_usage_logs_organisation ON usage_logs(organisation_id, created_at DESC);
CREATE INDEX idx_usage_logs_event_type ON usage_logs(event_type);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at DESC);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id) WHERE user_id IS NOT NULL;

-- Organisation usage quotas table
CREATE TABLE IF NOT EXISTS organisation_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL UNIQUE REFERENCES organisations(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),

  -- API quotas
  api_calls_limit integer DEFAULT 100,
  api_calls_used integer DEFAULT 0,

  -- Storage quotas (in MB)
  storage_limit integer DEFAULT 100,
  storage_used integer DEFAULT 0,

  -- Compute quotas (in minutes)
  compute_limit integer DEFAULT 60,
  compute_used integer DEFAULT 0,

  -- Search quotas
  search_limit integer DEFAULT 50,
  search_used integer DEFAULT 0,

  -- Export quotas
  export_limit integer DEFAULT 10,
  export_used integer DEFAULT 0,

  -- Reset tracking
  quota_period_start timestamptz DEFAULT now() NOT NULL,
  quota_period_end timestamptz DEFAULT (now() + interval '1 month') NOT NULL,

  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT organisation_quotas_plan_check CHECK (plan IN ('free', 'starter', 'pro', 'enterprise'))
);

CREATE INDEX idx_organisation_quotas_org ON organisation_quotas(organisation_id);
CREATE INDEX idx_organisation_quotas_plan ON organisation_quotas(plan);

-- Usage alerts table for quota notifications
CREATE TABLE IF NOT EXISTS usage_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('warning_80', 'warning_90', 'limit_reached')),
  resource_type text NOT NULL CHECK (resource_type IN ('api_calls', 'storage', 'compute', 'search', 'export')),
  threshold_percentage integer NOT NULL,
  current_usage integer NOT NULL,
  limit_value integer NOT NULL,
  acknowledged boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT usage_alerts_alert_type_check CHECK (alert_type IN ('warning_80', 'warning_90', 'limit_reached')),
  CONSTRAINT usage_alerts_resource_type_check CHECK (resource_type IN ('api_calls', 'storage', 'compute', 'search', 'export'))
);

CREATE INDEX idx_usage_alerts_organisation ON usage_alerts(organisation_id, created_at DESC);
CREATE INDEX idx_usage_alerts_acknowledged ON usage_alerts(acknowledged) WHERE NOT acknowledged;

-- ============================================================================
-- AGGREGATED VIEWS
-- ============================================================================

-- Daily usage summary per organisation
CREATE OR REPLACE VIEW organisation_daily_usage AS
SELECT
  organisation_id,
  event_type,
  DATE_TRUNC('day', created_at) as usage_date,
  COUNT(*) as event_count,
  SUM(quantity) as total_quantity
FROM usage_logs
GROUP BY organisation_id, event_type, DATE_TRUNC('day', created_at);

-- Monthly usage summary per organisation
CREATE OR REPLACE VIEW organisation_monthly_usage AS
SELECT
  organisation_id,
  event_type,
  DATE_TRUNC('month', created_at) as usage_month,
  COUNT(*) as event_count,
  SUM(quantity) as total_quantity
FROM usage_logs
GROUP BY organisation_id, event_type, DATE_TRUNC('month', created_at);

-- Current quota status view
CREATE OR REPLACE VIEW organisation_quota_status AS
SELECT
  oq.organisation_id,
  o.name as organisation_name,
  oq.plan,

  -- API usage
  oq.api_calls_used,
  oq.api_calls_limit,
  ROUND((oq.api_calls_used::numeric / NULLIF(oq.api_calls_limit, 0)) * 100, 2) as api_usage_percentage,

  -- Storage usage
  oq.storage_used,
  oq.storage_limit,
  ROUND((oq.storage_used::numeric / NULLIF(oq.storage_limit, 0)) * 100, 2) as storage_usage_percentage,

  -- Compute usage
  oq.compute_used,
  oq.compute_limit,
  ROUND((oq.compute_used::numeric / NULLIF(oq.compute_limit, 0)) * 100, 2) as compute_usage_percentage,

  -- Search usage
  oq.search_used,
  oq.search_limit,
  ROUND((oq.search_used::numeric / NULLIF(oq.search_limit, 0)) * 100, 2) as search_usage_percentage,

  -- Export usage
  oq.export_used,
  oq.export_limit,
  ROUND((oq.export_used::numeric / NULLIF(oq.export_limit, 0)) * 100, 2) as export_usage_percentage,

  -- Period info
  oq.quota_period_start,
  oq.quota_period_end,
  (oq.quota_period_end - now()) as time_remaining
FROM organisation_quotas oq
JOIN organisations o ON o.id = oq.organisation_id;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to log usage event
CREATE OR REPLACE FUNCTION log_usage_event(
  p_organisation_id uuid,
  p_user_id uuid,
  p_event_type text,
  p_resource text,
  p_quantity integer DEFAULT 1,
  p_metadata jsonb DEFAULT '{}'
) RETURNS void AS $$
BEGIN
  INSERT INTO usage_logs (organisation_id, user_id, event_type, resource, quantity, metadata)
  VALUES (p_organisation_id, p_user_id, p_event_type, p_resource, p_quantity, p_metadata);

  -- Update quota usage
  UPDATE organisation_quotas
  SET
    api_calls_used = api_calls_used + CASE WHEN p_event_type = 'api_call' THEN p_quantity ELSE 0 END,
    storage_used = storage_used + CASE WHEN p_event_type = 'storage' THEN p_quantity ELSE 0 END,
    compute_used = compute_used + CASE WHEN p_event_type = 'compute' THEN p_quantity ELSE 0 END,
    search_used = search_used + CASE WHEN p_event_type = 'search' THEN p_quantity ELSE 0 END,
    export_used = export_used + CASE WHEN p_event_type = 'export' THEN p_quantity ELSE 0 END,
    updated_at = now()
  WHERE organisation_id = p_organisation_id;

  -- Check for quota alerts
  PERFORM check_quota_alerts(p_organisation_id);
END;
$$ LANGUAGE plpgsql;

-- Function to check and create quota alerts
CREATE OR REPLACE FUNCTION check_quota_alerts(p_organisation_id uuid) RETURNS void AS $$
DECLARE
  v_quota RECORD;
  v_resource text;
  v_usage_percentage numeric;
BEGIN
  SELECT * INTO v_quota FROM organisation_quotas WHERE organisation_id = p_organisation_id;

  -- Check each resource type
  FOR v_resource, v_usage_percentage IN
    SELECT * FROM (VALUES
      ('api_calls', (v_quota.api_calls_used::numeric / NULLIF(v_quota.api_calls_limit, 0)) * 100),
      ('storage', (v_quota.storage_used::numeric / NULLIF(v_quota.storage_limit, 0)) * 100),
      ('compute', (v_quota.compute_used::numeric / NULLIF(v_quota.compute_limit, 0)) * 100),
      ('search', (v_quota.search_used::numeric / NULLIF(v_quota.search_limit, 0)) * 100),
      ('export', (v_quota.export_used::numeric / NULLIF(v_quota.export_limit, 0)) * 100)
    ) AS t(resource, percentage)
  LOOP
    -- 100% alert
    IF v_usage_percentage >= 100 THEN
      INSERT INTO usage_alerts (organisation_id, alert_type, resource_type, threshold_percentage, current_usage, limit_value)
      VALUES (p_organisation_id, 'limit_reached', v_resource, 100,
        CASE v_resource
          WHEN 'api_calls' THEN v_quota.api_calls_used
          WHEN 'storage' THEN v_quota.storage_used
          WHEN 'compute' THEN v_quota.compute_used
          WHEN 'search' THEN v_quota.search_used
          WHEN 'export' THEN v_quota.export_used
        END,
        CASE v_resource
          WHEN 'api_calls' THEN v_quota.api_calls_limit
          WHEN 'storage' THEN v_quota.storage_limit
          WHEN 'compute' THEN v_quota.compute_limit
          WHEN 'search' THEN v_quota.search_limit
          WHEN 'export' THEN v_quota.export_limit
        END)
      ON CONFLICT DO NOTHING;
    -- 90% alert
    ELSIF v_usage_percentage >= 90 THEN
      INSERT INTO usage_alerts (organisation_id, alert_type, resource_type, threshold_percentage, current_usage, limit_value)
      VALUES (p_organisation_id, 'warning_90', v_resource, 90,
        CASE v_resource
          WHEN 'api_calls' THEN v_quota.api_calls_used
          WHEN 'storage' THEN v_quota.storage_used
          WHEN 'compute' THEN v_quota.compute_used
          WHEN 'search' THEN v_quota.search_used
          WHEN 'export' THEN v_quota.export_used
        END,
        CASE v_resource
          WHEN 'api_calls' THEN v_quota.api_calls_limit
          WHEN 'storage' THEN v_quota.storage_limit
          WHEN 'compute' THEN v_quota.compute_limit
          WHEN 'search' THEN v_quota.search_limit
          WHEN 'export' THEN v_quota.export_limit
        END)
      ON CONFLICT DO NOTHING;
    -- 80% alert
    ELSIF v_usage_percentage >= 80 THEN
      INSERT INTO usage_alerts (organisation_id, alert_type, resource_type, threshold_percentage, current_usage, limit_value)
      VALUES (p_organisation_id, 'warning_80', v_resource, 80,
        CASE v_resource
          WHEN 'api_calls' THEN v_quota.api_calls_used
          WHEN 'storage' THEN v_quota.storage_used
          WHEN 'compute' THEN v_quota.compute_used
          WHEN 'search' THEN v_quota.search_used
          WHEN 'export' THEN v_quota.export_used
        END,
        CASE v_resource
          WHEN 'api_calls' THEN v_quota.api_calls_limit
          WHEN 'storage' THEN v_quota.storage_limit
          WHEN 'compute' THEN v_quota.compute_limit
          WHEN 'search' THEN v_quota.search_limit
          WHEN 'export' THEN v_quota.export_limit
        END)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly quotas
CREATE OR REPLACE FUNCTION reset_monthly_quotas() RETURNS void AS $$
BEGIN
  UPDATE organisation_quotas
  SET
    api_calls_used = 0,
    storage_used = 0,
    compute_used = 0,
    search_used = 0,
    export_used = 0,
    quota_period_start = now(),
    quota_period_end = now() + interval '1 month',
    updated_at = now()
  WHERE quota_period_end < now();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to create default quota on organisation creation
CREATE OR REPLACE FUNCTION create_default_quota() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organisation_quotas (organisation_id, plan)
  VALUES (NEW.id, COALESCE(NEW.plan, 'free'))
  ON CONFLICT (organisation_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_default_quota
  AFTER INSERT ON organisations
  FOR EACH ROW
  EXECUTE FUNCTION create_default_quota();

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_alerts ENABLE ROW LEVEL SECURITY;

-- Usage logs policies
CREATE POLICY "Users can view their organisation's usage logs"
  ON usage_logs FOR SELECT
  USING (organisation_id IN (
    SELECT organisation_id FROM organisation_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can insert usage logs"
  ON usage_logs FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS anyway

-- Organisation quotas policies
CREATE POLICY "Users can view their organisation's quotas"
  ON organisation_quotas FOR SELECT
  USING (organisation_id IN (
    SELECT organisation_id FROM organisation_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Only owners/admins can update quotas"
  ON organisation_quotas FOR UPDATE
  USING (organisation_id IN (
    SELECT organisation_id FROM organisation_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Usage alerts policies
CREATE POLICY "Users can view their organisation's alerts"
  ON usage_alerts FOR SELECT
  USING (organisation_id IN (
    SELECT organisation_id FROM organisation_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can acknowledge alerts"
  ON usage_alerts FOR UPDATE
  USING (organisation_id IN (
    SELECT organisation_id FROM organisation_members WHERE user_id = auth.uid()
  ))
  WITH CHECK (acknowledged = true);

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Set default quotas for existing organisations
INSERT INTO organisation_quotas (organisation_id, plan, api_calls_limit, storage_limit, compute_limit, search_limit, export_limit)
SELECT
  id,
  COALESCE(plan, 'free'),
  CASE COALESCE(plan, 'free')
    WHEN 'free' THEN 100
    WHEN 'starter' THEN 1000
    WHEN 'pro' THEN 10000
    WHEN 'enterprise' THEN 100000
  END,
  CASE COALESCE(plan, 'free')
    WHEN 'free' THEN 100
    WHEN 'starter' THEN 1000
    WHEN 'pro' THEN 10000
    WHEN 'enterprise' THEN 100000
  END,
  CASE COALESCE(plan, 'free')
    WHEN 'free' THEN 60
    WHEN 'starter' THEN 600
    WHEN 'pro' THEN 6000
    WHEN 'enterprise' THEN 60000
  END,
  CASE COALESCE(plan, 'free')
    WHEN 'free' THEN 50
    WHEN 'starter' THEN 500
    WHEN 'pro' THEN 5000
    WHEN 'enterprise' THEN 50000
  END,
  CASE COALESCE(plan, 'free')
    WHEN 'free' THEN 10
    WHEN 'starter' THEN 100
    WHEN 'pro' THEN 1000
    WHEN 'enterprise' THEN 10000
  END
FROM organisations
ON CONFLICT (organisation_id) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE usage_logs IS 'Tracks all resource consumption events per organisation';
COMMENT ON TABLE organisation_quotas IS 'Defines and tracks usage quotas per organisation';
COMMENT ON TABLE usage_alerts IS 'Records quota threshold alerts for organisations';
COMMENT ON FUNCTION log_usage_event IS 'Logs a usage event and updates quota counters';
COMMENT ON FUNCTION check_quota_alerts IS 'Checks usage against quotas and creates alerts';
COMMENT ON FUNCTION reset_monthly_quotas IS 'Resets monthly quota counters (run via cron)';
