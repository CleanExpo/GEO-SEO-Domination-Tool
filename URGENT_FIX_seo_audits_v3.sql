-- URGENT FIX v3: Handle foreign key constraint properly
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/sql/new

-- OPTION 1: Drop the foreign key constraint (RECOMMENDED)
-- This allows server-side audits without requiring a user

-- Step 1: Check current constraints
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'seo_audits'::regclass;

-- Step 2: Drop the foreign key constraint
ALTER TABLE seo_audits DROP CONSTRAINT IF EXISTS seo_audits_user_id_fkey;

-- Step 3: Make user_id nullable
ALTER TABLE seo_audits ALTER COLUMN user_id DROP NOT NULL;

-- Step 4: Add a check constraint instead (optional - validates UUID format but doesn't require FK)
ALTER TABLE seo_audits
ADD CONSTRAINT seo_audits_user_id_check
CHECK (user_id IS NULL OR user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- Step 5: Add helpful comment
COMMENT ON COLUMN seo_audits.user_id IS 'User who created the audit (nullable for server-side/automated audits, no FK constraint to allow system audits)';

-- Step 6: Verify the change
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'seo_audits' AND column_name = 'user_id';

-- Expected result: is_nullable = 'YES'

-- Step 7: Verify FK constraint is gone
SELECT
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'seo_audits'::regclass
  AND conname LIKE '%user_id%';

-- Expected result: No rows (FK constraint removed)

-- Step 8: Check existing data
SELECT
  CASE
    WHEN user_id IS NULL THEN 'NULL (Server Audits)'
    ELSE 'Has User ID'
  END as audit_type,
  COUNT(*) as count
FROM seo_audits
GROUP BY
  CASE
    WHEN user_id IS NULL THEN 'NULL (Server Audits)'
    ELSE 'Has User ID'
  END;
