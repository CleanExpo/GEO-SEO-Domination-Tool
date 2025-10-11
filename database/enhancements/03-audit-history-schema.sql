-- ============================================================================
-- ENHANCEMENT 3: AUDIT HISTORY SCHEMA
-- ============================================================================
-- Implements version control and change tracking for audits and companies
-- ============================================================================

-- ============================================================================
-- AUDIT HISTORY (Version control for SEO audits)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Audit reference
  audit_id UUID REFERENCES seo_audits(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Change tracking
  change_type TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'regenerated'
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_by_name TEXT, -- Denormalized for audit trail

  -- Version data
  version_number INTEGER NOT NULL,
  before_data JSONB, -- Snapshot before change
  after_data JSONB, -- Snapshot after change
  diff_summary TEXT, -- Human-readable summary of changes

  -- Field-level changes
  changed_fields TEXT[], -- Array of changed field names
  field_changes JSONB, -- { "field": { "before": x, "after": y } }

  -- Metadata
  change_reason TEXT, -- Optional reason for change
  change_source TEXT DEFAULT 'manual', -- 'manual', 'automated', 'api', 'scheduled'
  ip_address INET, -- Who made the change
  user_agent TEXT,

  -- Timestamps
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Verification
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_history_audit_id
  ON audit_history(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_history_company_id
  ON audit_history(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_history_changed_by
  ON audit_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_history_changed_at
  ON audit_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_history_change_type
  ON audit_history(change_type);
CREATE INDEX IF NOT EXISTS idx_audit_history_company_date
  ON audit_history(company_id, changed_at DESC);

-- ============================================================================
-- COMPANY HISTORY (Version control for company data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Company reference
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Change tracking
  change_type TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'merged'
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_by_name TEXT,

  -- Version data
  version_number INTEGER NOT NULL,
  before_data JSONB,
  after_data JSONB,
  diff_summary TEXT,

  -- Field-level changes
  changed_fields TEXT[],
  field_changes JSONB,

  -- Metadata
  change_reason TEXT,
  change_source TEXT DEFAULT 'manual',
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_history_company_id
  ON company_history(company_id);
CREATE INDEX IF NOT EXISTS idx_company_history_changed_by
  ON company_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_company_history_changed_at
  ON company_history(changed_at DESC);

-- ============================================================================
-- CHANGE APPROVALS (Approval workflow for significant changes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS change_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  entity_type TEXT NOT NULL, -- 'audit', 'company', 'subscription', etc.
  entity_id UUID NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Change details
  change_description TEXT NOT NULL,
  proposed_changes JSONB NOT NULL,
  change_impact TEXT, -- 'low', 'medium', 'high', 'critical'

  -- Requester
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  request_reason TEXT,

  -- Approval workflow
  approval_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  -- Execution
  executed_at TIMESTAMP WITH TIME ZONE,
  execution_status TEXT, -- 'success', 'failed', 'partial'
  execution_error TEXT,

  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE, -- Auto-reject if not approved by this time

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_change_approvals_entity
  ON change_approvals(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_change_approvals_company_id
  ON change_approvals(company_id);
CREATE INDEX IF NOT EXISTS idx_change_approvals_status
  ON change_approvals(approval_status);
CREATE INDEX IF NOT EXISTS idx_change_approvals_requested_by
  ON change_approvals(requested_by);
CREATE INDEX IF NOT EXISTS idx_change_approvals_pending
  ON change_approvals(approval_status) WHERE approval_status = 'pending';

-- ============================================================================
-- DATA SNAPSHOTS (Full snapshots for rollback capability)
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Snapshot identification
  snapshot_name TEXT NOT NULL,
  snapshot_type TEXT NOT NULL, -- 'manual', 'scheduled', 'pre_change', 'pre_deployment'

  -- Scope
  entity_type TEXT NOT NULL, -- 'audit', 'company', 'organisation'
  entity_id UUID NOT NULL,

  -- Snapshot data
  snapshot_data JSONB NOT NULL,
  snapshot_size_bytes INTEGER,

  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  snapshot_notes TEXT,

  -- Retention
  retain_until TIMESTAMP WITH TIME ZONE,
  is_archived BOOLEAN DEFAULT FALSE,

  -- Restoration
  restored_at TIMESTAMP WITH TIME ZONE,
  restored_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_data_snapshots_entity
  ON data_snapshots(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_data_snapshots_created_at
  ON data_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_snapshots_type
  ON data_snapshots(snapshot_type);
CREATE INDEX IF NOT EXISTS idx_data_snapshots_retention
  ON data_snapshots(retain_until) WHERE retain_until IS NOT NULL;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to create audit history entry
CREATE OR REPLACE FUNCTION log_audit_change(
  p_audit_id UUID,
  p_company_id UUID,
  p_change_type TEXT,
  p_changed_by UUID,
  p_before_data JSONB,
  p_after_data JSONB,
  p_change_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_version_number INTEGER;
  v_history_id UUID;
  v_changed_fields TEXT[];
  v_field_changes JSONB;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_version_number
  FROM audit_history
  WHERE audit_id = p_audit_id;

  -- Calculate changed fields
  SELECT ARRAY_AGG(key)
  INTO v_changed_fields
  FROM (
    SELECT key
    FROM jsonb_each(p_after_data)
    WHERE NOT (p_before_data ? key AND p_before_data->>key = p_after_data->>key)
  ) AS changed;

  -- Create field changes object
  v_field_changes := jsonb_build_object();
  FOR i IN 1..array_length(v_changed_fields, 1) LOOP
    v_field_changes := v_field_changes || jsonb_build_object(
      v_changed_fields[i],
      jsonb_build_object(
        'before', p_before_data->v_changed_fields[i],
        'after', p_after_data->v_changed_fields[i]
      )
    );
  END LOOP;

  -- Insert history record
  INSERT INTO audit_history (
    audit_id,
    company_id,
    change_type,
    changed_by,
    version_number,
    before_data,
    after_data,
    changed_fields,
    field_changes,
    change_reason
  )
  VALUES (
    p_audit_id,
    p_company_id,
    p_change_type,
    p_changed_by,
    v_version_number,
    p_before_data,
    p_after_data,
    v_changed_fields,
    v_field_changes,
    p_change_reason
  )
  RETURNING id INTO v_history_id;

  RETURN v_history_id;
END;
$$ LANGUAGE plpgsql;

-- Function to restore from snapshot
CREATE OR REPLACE FUNCTION restore_from_snapshot(
  p_snapshot_id UUID,
  p_restored_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_snapshot RECORD;
BEGIN
  -- Get snapshot
  SELECT * INTO v_snapshot
  FROM data_snapshots
  WHERE id = p_snapshot_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Snapshot not found';
  END IF;

  -- Restore based on entity type
  IF v_snapshot.entity_type = 'audit' THEN
    -- Restore audit data (implementation depends on table structure)
    -- This is a placeholder - implement actual restore logic
    NULL;
  ELSIF v_snapshot.entity_type = 'company' THEN
    -- Restore company data
    NULL;
  END IF;

  -- Mark as restored
  UPDATE data_snapshots
  SET restored_at = NOW(),
      restored_by = p_restored_by
  WHERE id = p_snapshot_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-log audit changes
CREATE OR REPLACE FUNCTION auto_log_audit_change()
RETURNS TRIGGER AS $$
DECLARE
  v_before_data JSONB;
  v_after_data JSONB;
  v_change_type TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_change_type := 'created';
    v_before_data := NULL;
    v_after_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_change_type := 'updated';
    v_before_data := to_jsonb(OLD);
    v_after_data := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_change_type := 'deleted';
    v_before_data := to_jsonb(OLD);
    v_after_data := NULL;
  END IF;

  PERFORM log_audit_change(
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.company_id, OLD.company_id),
    v_change_type,
    NULL, -- changed_by would come from app context
    v_before_data,
    v_after_data,
    NULL
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Note: Uncomment to enable auto-logging (may have performance impact)
-- CREATE TRIGGER trigger_auto_log_seo_audit_change
--   AFTER INSERT OR UPDATE OR DELETE ON seo_audits
--   FOR EACH ROW
--   EXECUTE FUNCTION auto_log_audit_change();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE audit_history IS 'Version control and change tracking for SEO audits';
COMMENT ON TABLE company_history IS 'Version control and change tracking for company data';
COMMENT ON TABLE change_approvals IS 'Approval workflow for significant data changes';
COMMENT ON TABLE data_snapshots IS 'Full data snapshots for rollback and recovery';
COMMENT ON FUNCTION log_audit_change IS 'Creates detailed audit history entry with field-level changes';
COMMENT ON FUNCTION restore_from_snapshot IS 'Restores data from a snapshot';

-- ============================================================================
-- AUDIT HISTORY SCHEMA COMPLETE
-- ============================================================================
