-- ============================================================================
-- ENHANCEMENT 2: API RATE LIMITING SCHEMA
-- ============================================================================
-- Implements request tracking, rate limiting, and quota management
-- ============================================================================

-- ============================================================================
-- API REQUESTS (Request logging and monitoring)
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User identification
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  organisation_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,

  -- Request details
  endpoint TEXT NOT NULL, -- '/api/companies/123/audit'
  http_method TEXT NOT NULL, -- 'GET', 'POST', 'PUT', 'DELETE'
  request_path TEXT, -- Full URL path
  query_params JSONB, -- Query string parameters
  request_body_size INTEGER, -- Size in bytes

  -- Response details
  response_status INTEGER, -- 200, 404, 500, etc.
  response_time_ms INTEGER, -- Response time in milliseconds
  response_body_size INTEGER, -- Size in bytes
  error_message TEXT, -- If status >= 400

  -- Rate limiting
  rate_limit_key TEXT, -- Key used for rate limiting (user_id, org_id, or IP)
  rate_limit_remaining INTEGER, -- Remaining requests in current window
  rate_limit_reset_at TIMESTAMP WITH TIME ZONE, -- When limit resets

  -- Performance metrics
  database_query_count INTEGER, -- Number of DB queries
  database_query_time_ms INTEGER, -- Total DB query time
  cache_hit BOOLEAN DEFAULT FALSE, -- Whether response was cached

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_requests_user_id
  ON api_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_organisation_id
  ON api_requests(organisation_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_created_at
  ON api_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_requests_endpoint
  ON api_requests(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_requests_status
  ON api_requests(response_status);
CREATE INDEX IF NOT EXISTS idx_api_requests_slow_queries
  ON api_requests(response_time_ms DESC) WHERE response_time_ms > 1000;

-- Partitioning by month (optional, for large datasets)
-- CREATE TABLE api_requests_2025_01 PARTITION OF api_requests
--   FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- ============================================================================
-- RATE LIMITS (Rate limiting configuration and state)
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scope
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ip_address INET, -- For anonymous requests
  rate_limit_key TEXT NOT NULL UNIQUE, -- 'org:uuid' or 'user:uuid' or 'ip:x.x.x.x'

  -- Endpoint configuration
  endpoint_pattern TEXT NOT NULL, -- '/api/audits/*', '/api/companies/*', '*'
  method_pattern TEXT DEFAULT '*', -- 'GET', 'POST', or '*'

  -- Limits
  max_requests_per_minute INTEGER,
  max_requests_per_hour INTEGER,
  max_requests_per_day INTEGER,

  -- Current counters
  current_minute_count INTEGER DEFAULT 0,
  current_hour_count INTEGER DEFAULT 0,
  current_day_count INTEGER DEFAULT 0,

  -- Window tracking
  minute_window_start TIMESTAMP WITH TIME ZONE,
  hour_window_start TIMESTAMP WITH TIME ZONE,
  day_window_start TIMESTAMP WITH TIME ZONE,

  -- Rate limit exceeded tracking
  total_exceeded_count INTEGER DEFAULT 0,
  last_exceeded_at TIMESTAMP WITH TIME ZONE,

  -- Ban/throttle
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  banned_until TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_organisation_id
  ON rate_limits(organisation_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id
  ON rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key
  ON rate_limits(rate_limit_key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_banned
  ON rate_limits(is_banned) WHERE is_banned = TRUE;

-- ============================================================================
-- API QUOTAS (Subscription-based API usage limits)
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Association
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  subscription_tier_id UUID REFERENCES subscription_tiers(id) ON DELETE SET NULL,

  -- Quota limits
  quota_type TEXT NOT NULL, -- 'audits', 'keyword_checks', 'competitor_scans', 'api_calls'
  max_quota_per_month INTEGER NOT NULL,

  -- Usage tracking
  current_month_usage INTEGER DEFAULT 0,
  quota_reset_date DATE, -- When quota resets (usually 1st of month)

  -- Overage handling
  allow_overage BOOLEAN DEFAULT FALSE,
  overage_rate NUMERIC(10,2), -- Cost per unit over quota
  total_overage_this_month INTEGER DEFAULT 0,
  total_overage_cost NUMERIC(10,2) DEFAULT 0,

  -- Status
  quota_status TEXT DEFAULT 'active', -- 'active', 'exceeded', 'suspended'
  quota_exceeded_at TIMESTAMP WITH TIME ZONE,
  notification_sent_at_90_percent BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_quotas_organisation_id
  ON api_quotas(organisation_id);
CREATE INDEX IF NOT EXISTS idx_api_quotas_type
  ON api_quotas(quota_type);
CREATE INDEX IF NOT EXISTS idx_api_quotas_status
  ON api_quotas(quota_status);
CREATE INDEX IF NOT EXISTS idx_api_quotas_exceeded
  ON api_quotas(quota_status) WHERE quota_status = 'exceeded';

-- ============================================================================
-- API KEYS (API key management for external integrations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Key details
  key_name TEXT NOT NULL, -- Human-readable name
  api_key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of actual key
  key_prefix TEXT NOT NULL, -- First 8 chars for identification (e.g., 'sk-live_')

  -- Permissions
  scopes TEXT[], -- Array of allowed scopes: ['audits:read', 'audits:write', 'companies:read']
  allowed_endpoints TEXT[], -- Specific endpoints allowed
  ip_whitelist INET[], -- Optional IP whitelist

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_test_key BOOLEAN DEFAULT FALSE, -- Test vs live keys

  -- Usage tracking
  last_used_at TIMESTAMP WITH TIME ZONE,
  total_requests INTEGER DEFAULT 0,

  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_api_keys_organisation_id
  ON api_keys(organisation_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash
  ON api_keys(api_key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active
  ON api_keys(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_rate_limit_key TEXT,
  p_endpoint TEXT,
  p_method TEXT
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining INTEGER,
  reset_at TIMESTAMP WITH TIME ZONE,
  exceeded_limit TEXT
) AS $$
DECLARE
  v_limit RECORD;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Get rate limit record
  SELECT * INTO v_limit
  FROM rate_limits
  WHERE rate_limit_key = p_rate_limit_key
    AND (endpoint_pattern = p_endpoint OR endpoint_pattern = '*')
    AND (method_pattern = p_method OR method_pattern = '*')
    AND (is_banned = FALSE OR banned_until < v_now)
  LIMIT 1;

  IF NOT FOUND THEN
    -- No rate limit configured, allow request
    RETURN QUERY SELECT TRUE, 999999, v_now + INTERVAL '1 hour', NULL::TEXT;
    RETURN;
  END IF;

  -- Check minute limit
  IF v_limit.max_requests_per_minute IS NOT NULL THEN
    IF v_limit.minute_window_start IS NULL OR v_limit.minute_window_start < v_now - INTERVAL '1 minute' THEN
      -- Reset minute counter
      UPDATE rate_limits
      SET current_minute_count = 0,
          minute_window_start = v_now
      WHERE id = v_limit.id;
      v_limit.current_minute_count := 0;
    END IF;

    IF v_limit.current_minute_count >= v_limit.max_requests_per_minute THEN
      RETURN QUERY SELECT FALSE, 0, v_limit.minute_window_start + INTERVAL '1 minute', 'minute'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Check hour limit
  IF v_limit.max_requests_per_hour IS NOT NULL THEN
    IF v_limit.hour_window_start IS NULL OR v_limit.hour_window_start < v_now - INTERVAL '1 hour' THEN
      UPDATE rate_limits
      SET current_hour_count = 0,
          hour_window_start = v_now
      WHERE id = v_limit.id;
      v_limit.current_hour_count := 0;
    END IF;

    IF v_limit.current_hour_count >= v_limit.max_requests_per_hour THEN
      RETURN QUERY SELECT FALSE, 0, v_limit.hour_window_start + INTERVAL '1 hour', 'hour'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Check day limit
  IF v_limit.max_requests_per_day IS NOT NULL THEN
    IF v_limit.day_window_start IS NULL OR v_limit.day_window_start < v_now - INTERVAL '1 day' THEN
      UPDATE rate_limits
      SET current_day_count = 0,
          day_window_start = v_now
      WHERE id = v_limit.id;
      v_limit.current_day_count := 0;
    END IF;

    IF v_limit.current_day_count >= v_limit.max_requests_per_day THEN
      RETURN QUERY SELECT FALSE, 0, v_limit.day_window_start + INTERVAL '1 day', 'day'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Increment counters
  UPDATE rate_limits
  SET current_minute_count = current_minute_count + 1,
      current_hour_count = current_hour_count + 1,
      current_day_count = current_day_count + 1,
      updated_at = v_now
  WHERE id = v_limit.id;

  -- Return allowed with remaining count
  RETURN QUERY SELECT
    TRUE,
    LEAST(
      COALESCE(v_limit.max_requests_per_minute - v_limit.current_minute_count - 1, 999999),
      COALESCE(v_limit.max_requests_per_hour - v_limit.current_hour_count - 1, 999999),
      COALESCE(v_limit.max_requests_per_day - v_limit.current_day_count - 1, 999999)
    ),
    GREATEST(
      COALESCE(v_limit.minute_window_start + INTERVAL '1 minute', v_now),
      COALESCE(v_limit.hour_window_start + INTERVAL '1 hour', v_now),
      COALESCE(v_limit.day_window_start + INTERVAL '1 day', v_now)
    ),
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly quotas
CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS void AS $$
BEGIN
  UPDATE api_quotas
  SET current_month_usage = 0,
      total_overage_this_month = 0,
      total_overage_cost = 0,
      quota_status = 'active',
      notification_sent_at_90_percent = FALSE,
      quota_reset_date = CURRENT_DATE + INTERVAL '1 month',
      updated_at = NOW()
  WHERE quota_reset_date <= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rate_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_rate_limits_timestamp') THEN
    CREATE TRIGGER trigger_update_rate_limits_timestamp
      BEFORE UPDATE ON rate_limits
      FOR EACH ROW
      EXECUTE FUNCTION update_rate_limits_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_api_quotas_timestamp') THEN
    CREATE TRIGGER trigger_update_api_quotas_timestamp
      BEFORE UPDATE ON api_quotas
      FOR EACH ROW
      EXECUTE FUNCTION update_rate_limits_updated_at();
  END IF;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE api_requests IS 'Logs all API requests for monitoring and analytics';
COMMENT ON TABLE rate_limits IS 'Rate limiting configuration and counters';
COMMENT ON TABLE api_quotas IS 'Monthly usage quotas based on subscription tiers';
COMMENT ON TABLE api_keys IS 'API key management for external integrations';
COMMENT ON FUNCTION check_rate_limit IS 'Checks if request is allowed under rate limits and increments counters';
COMMENT ON FUNCTION reset_monthly_quotas IS 'Resets monthly quotas on the 1st of each month';

-- ============================================================================
-- RATE LIMITING SCHEMA COMPLETE
-- ============================================================================
