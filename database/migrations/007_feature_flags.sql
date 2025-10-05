-- Migration: 007_feature_flags.sql
-- Description: Feature flag system for gradual rollouts and A/B testing
-- Dependencies: 003_multi_tenancy_foundation.sql
-- Author: Orchestra Coordinator (Phase 3)
-- Date: 2025-10-05

-- ============================================================
-- FEATURE FLAGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Flag identification
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,

  -- Global toggle
  enabled boolean DEFAULT false,

  -- Rollout strategy
  rollout_percentage integer DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),

  -- Variants for A/B testing
  variants jsonb, -- {"control": {...}, "variant_a": {...}, "variant_b": {...}}

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);

-- ============================================================
-- ORGANISATION FEATURE FLAG OVERRIDES
-- ============================================================

CREATE TABLE IF NOT EXISTS organisation_feature_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  feature_flag_id uuid REFERENCES feature_flags(id) ON DELETE CASCADE NOT NULL,

  -- Override value
  enabled boolean NOT NULL,

  -- Override reason (audit trail)
  reason text,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),

  CONSTRAINT unique_org_flag_override UNIQUE(organisation_id, feature_flag_id)
);

CREATE INDEX idx_org_feature_overrides_org_id ON organisation_feature_overrides(organisation_id);
CREATE INDEX idx_org_feature_overrides_flag_id ON organisation_feature_overrides(feature_flag_id);

-- ============================================================
-- USER FEATURE FLAG ASSIGNMENTS (for percentage rollouts)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_feature_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature_flag_id uuid REFERENCES feature_flags(id) ON DELETE CASCADE NOT NULL,

  -- Assignment
  enabled boolean NOT NULL,
  variant text, -- Variant key if A/B testing

  -- Metadata
  assigned_at timestamptz DEFAULT now(),

  CONSTRAINT unique_user_flag_assignment UNIQUE(user_id, feature_flag_id)
);

CREATE INDEX idx_user_feature_assignments_user_id ON user_feature_assignments(user_id);
CREATE INDEX idx_user_feature_assignments_flag_id ON user_feature_assignments(feature_flag_id);

-- ============================================================
-- FEATURE FLAG ANALYTICS (track usage)
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_flag_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_flag_id uuid REFERENCES feature_flags(id) ON DELETE CASCADE NOT NULL,

  -- Event data
  event_type text NOT NULL CHECK (event_type IN ('evaluation', 'impression', 'conversion')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organisation_id uuid REFERENCES organisations(id) ON DELETE SET NULL,

  -- Result
  enabled boolean NOT NULL,
  variant text,

  -- Timing
  recorded_at timestamptz DEFAULT now(),

  -- Context
  metadata jsonb -- Additional event context
);

CREATE INDEX idx_feature_analytics_flag_id ON feature_flag_analytics(feature_flag_id);
CREATE INDEX idx_feature_analytics_event_type ON feature_flag_analytics(event_type);
CREATE INDEX idx_feature_analytics_recorded_at ON feature_flag_analytics(recorded_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_feature_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_analytics ENABLE ROW LEVEL SECURITY;

-- Feature flags: All authenticated users can view
CREATE POLICY feature_flags_select ON feature_flags
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Feature flags: Admins can manage
CREATE POLICY feature_flags_manage ON feature_flags
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM organisation_members WHERE role = 'owner'
    )
  );

-- Organisation overrides: Org members can view
CREATE POLICY org_overrides_select ON organisation_feature_overrides
  FOR SELECT
  USING (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members WHERE user_id = auth.uid()
    )
  );

-- Organisation overrides: Org admins can manage
CREATE POLICY org_overrides_manage ON organisation_feature_overrides
  FOR ALL
  USING (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- User assignments: Users can view their own
CREATE POLICY user_assignments_select ON user_feature_assignments
  FOR SELECT
  USING (user_id = auth.uid());

-- Analytics: No direct access (API only)
-- Analytics table is write-only via API

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_feature_flag_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feature_flag_timestamp
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_feature_flag_updated_at();

CREATE TRIGGER trigger_update_org_override_timestamp
  BEFORE UPDATE ON organisation_feature_overrides
  FOR EACH ROW EXECUTE FUNCTION update_feature_flag_updated_at();

-- ============================================================
-- SEED DATA (Core Feature Flags)
-- ============================================================

INSERT INTO feature_flags (key, name, description, enabled, rollout_percentage)
VALUES
  ('secrets-vault-enabled', 'Secrets Vault', 'Encrypted secrets management system (VAULT-001)', true, 100),
  ('multi-tenancy-enabled', 'Multi-Tenancy', 'Organisation-based multi-tenancy (TENANT-001)', true, 100),
  ('command-palette-enabled', 'Command Palette', 'Keyboard-driven command interface (CMD-001)', true, 100),
  ('usage-tracking-enabled', 'Usage Tracking', 'API usage metering and quotas (BILLING-001)', true, 100),
  ('white-label-theming', 'White-Label Theming', 'Per-tenant theme customisation (THEME-001)', true, 100),
  ('github-webhooks', 'GitHub Webhooks', 'GitHub integration and auto-sync (WEBHOOK-001)', true, 100),
  ('observability-suite', 'Observability Suite', 'Sentry and Winston monitoring (MONITOR-001)', true, 100)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE feature_flags IS 'Feature flags for gradual rollouts and A/B testing';
COMMENT ON TABLE organisation_feature_overrides IS 'Per-organisation feature flag overrides';
COMMENT ON TABLE user_feature_assignments IS 'User-level feature flag assignments for percentage rollouts';
COMMENT ON TABLE feature_flag_analytics IS 'Feature flag usage analytics and A/B test results';
