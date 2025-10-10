-- Migration: Make seo_audits.user_id nullable for server-side audits
-- Purpose: Allow SEO audits to be created by server-side processes without a user session

-- UP Migration
ALTER TABLE seo_audits
ALTER COLUMN user_id DROP NOT NULL;

COMMENT ON COLUMN seo_audits.user_id IS 'User who created the audit (nullable for server-side/automated audits)';

-- ROLLBACK:
ALTER TABLE seo_audits
ALTER COLUMN user_id SET NOT NULL;
