-- Migration: Make seo_audits.user_id nullable for server-side audits
-- Purpose: Allow SEO audits to be created by server-side processes without a user session

-- UP Migration

-- Step 1: Handle existing NULL values by assigning them to a system user
DO $$
DECLARE
  system_user_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Update existing NULL user_id values to system user
  UPDATE seo_audits
  SET user_id = system_user_id
  WHERE user_id IS NULL;
END $$;

-- Step 2: Now we can safely make the column nullable
ALTER TABLE seo_audits ALTER COLUMN user_id DROP NOT NULL;

COMMENT ON COLUMN seo_audits.user_id IS 'User who created the audit (nullable for server-side/automated audits)';

-- ROLLBACK:
-- Note: Rollback is more complex due to NULL handling
-- First, assign system user to any NULL values
UPDATE seo_audits SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
-- Then set NOT NULL constraint
ALTER TABLE seo_audits ALTER COLUMN user_id SET NOT NULL;
