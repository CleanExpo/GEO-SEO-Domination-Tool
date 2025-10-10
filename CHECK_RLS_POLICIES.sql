-- Check RLS policies on seo_audits table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/sql/new

-- Check if RLS is enabled
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'seo_audits';

-- List all RLS policies on seo_audits
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'seo_audits';

-- If RLS is enabled and blocking, disable it for server-side operations
-- UNCOMMENT BELOW TO DISABLE RLS:
-- ALTER TABLE seo_audits DISABLE ROW LEVEL SECURITY;
