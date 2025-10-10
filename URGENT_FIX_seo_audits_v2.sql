-- URGENT FIX v2: Handle existing NULL values before making column nullable
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/sql/new

-- Step 1: Check current state
SELECT
  COUNT(*) as total_audits,
  COUNT(user_id) as audits_with_user,
  COUNT(*) - COUNT(user_id) as audits_without_user
FROM seo_audits;

-- Step 2: Create a system user ID for orphaned audits (if needed)
-- This is a special UUID that represents "system-generated audits"
DO $$
DECLARE
  system_user_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Update existing NULL user_id values to system user
  UPDATE seo_audits
  SET user_id = system_user_id
  WHERE user_id IS NULL;

  RAISE NOTICE 'Updated % audits with system user ID', (SELECT COUNT(*) FROM seo_audits WHERE user_id = system_user_id);
END $$;

-- Step 3: Now we can safely make the column nullable
ALTER TABLE seo_audits ALTER COLUMN user_id DROP NOT NULL;

-- Step 4: Add helpful comment
COMMENT ON COLUMN seo_audits.user_id IS 'User who created the audit (nullable for server-side/automated audits, 00000000-0000-0000-0000-000000000000 for legacy system audits)';

-- Step 5: Verify the change
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'seo_audits' AND column_name = 'user_id';

-- Expected result: is_nullable = 'YES'

-- Step 6: Check distribution of user_ids
SELECT
  CASE
    WHEN user_id = '00000000-0000-0000-0000-000000000000' THEN 'System Audits'
    WHEN user_id IS NULL THEN 'NULL (should be 0 now)'
    ELSE 'User Audits'
  END as audit_type,
  COUNT(*) as count
FROM seo_audits
GROUP BY
  CASE
    WHEN user_id = '00000000-0000-0000-0000-000000000000' THEN 'System Audits'
    WHEN user_id IS NULL THEN 'NULL (should be 0 now)'
    ELSE 'User Audits'
  END;
