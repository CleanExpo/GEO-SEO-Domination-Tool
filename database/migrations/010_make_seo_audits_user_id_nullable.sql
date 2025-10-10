-- Migration: Make seo_audits.user_id nullable for server-side audits
-- Purpose: Allow SEO audits to be created by server-side processes without a user session

-- UP Migration

-- Step 1: Drop the foreign key constraint (prevents FK violation with NULL values)
ALTER TABLE seo_audits DROP CONSTRAINT IF EXISTS seo_audits_user_id_fkey;

-- Step 2: Make user_id nullable
ALTER TABLE seo_audits ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: Add check constraint for UUID format validation (optional)
ALTER TABLE seo_audits
ADD CONSTRAINT seo_audits_user_id_check
CHECK (user_id IS NULL OR user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- Step 4: Add helpful comment
COMMENT ON COLUMN seo_audits.user_id IS 'User who created the audit (nullable for server-side/automated audits, no FK to allow system audits)';

-- ROLLBACK:
-- Step 1: Remove check constraint
ALTER TABLE seo_audits DROP CONSTRAINT IF EXISTS seo_audits_user_id_check;

-- Step 2: If you want to restore FK (requires all audits to have valid user_id)
-- WARNING: This will fail if there are NULL values or invalid user_ids
-- DELETE FROM seo_audits WHERE user_id IS NULL;
-- ALTER TABLE seo_audits ADD CONSTRAINT seo_audits_user_id_fkey
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Restore NOT NULL (requires all audits to have user_id)
-- ALTER TABLE seo_audits ALTER COLUMN user_id SET NOT NULL;
