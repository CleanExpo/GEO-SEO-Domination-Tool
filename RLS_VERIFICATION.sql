-- RLS Policy Verification Script
-- Run this in Supabase SQL Editor to verify all RLS policies are correct

-- ============================================================================
-- 1. CHECK RLS IS ENABLED ON ALL CRITICAL TABLES
-- ============================================================================

SELECT
  schemaname,
  tablename,
  rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'companies',
    'audits',
    'keywords',
    'competitors',
    'citations',
    'service_areas',
    'local_pack_tracking',
    'backlinks',
    'content_gaps',
    'scheduled_audits',
    'crm_contacts',
    'crm_deals',
    'crm_tasks',
    'crm_calendar_events',
    'crm_projects',
    'crm_github_projects',
    'crm_prompts'
  )
ORDER BY tablename;

-- Expected: All should show "RLS Enabled" = true
-- If any show false, run: ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. LIST ALL RLS POLICIES
-- ============================================================================

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
ORDER BY tablename, policyname;

-- Expected: Multiple policies per table for SELECT, INSERT, UPDATE, DELETE

-- ============================================================================
-- 3. VERIFY ORGANISATIONS TABLE
-- ============================================================================

-- Check organisations exist
SELECT id, name, slug, plan, created_at
FROM organisations
ORDER BY created_at;

-- Expected: At least default organisation exists
-- ID: 00000000-0000-0000-0000-000000000001
-- Slug: default

-- ============================================================================
-- 4. VERIFY ORGANISATION_MEMBERS TABLE
-- ============================================================================

-- Check membership structure
SELECT
  om.id,
  om.user_id,
  om.role,
  o.name AS organisation_name,
  o.slug,
  om.created_at
FROM organisation_members om
JOIN organisations o ON o.id = om.organisation_id
ORDER BY om.created_at DESC
LIMIT 10;

-- Expected: Users should be members of organisations with appropriate roles

-- ============================================================================
-- 5. CHECK TRIGGER IS INSTALLED
-- ============================================================================

SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name = 'on_auth_user_created';

-- Expected: Trigger exists on auth.users table
-- Action: EXECUTE FUNCTION public.handle_new_user()

-- ============================================================================
-- 6. VERIFY FUNCTION EXISTS
-- ============================================================================

SELECT
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- Expected: Function exists and returns TRIGGER

-- ============================================================================
-- 7. TEST RLS POLICIES (MANUAL)
-- ============================================================================

-- First, create a test user in Supabase Auth UI
-- Email: rls-test@example.com
-- Password: Test123456!

-- Get the user's ID from Supabase Auth dashboard, then:

-- Set the session to the test user
-- SET request.jwt.claim.sub = 'USER_ID_HERE';

-- Try to select companies (should only see their org's data)
-- SELECT * FROM companies;

-- Try to insert a company with their org_id (should work)
-- INSERT INTO companies (name, website, organisation_id)
-- VALUES ('My Test Company', 'https://test.com', 'THEIR_ORG_ID');

-- Try to insert with different org_id (should fail)
-- INSERT INTO companies (name, website, organisation_id)
-- VALUES ('Hacker Company', 'https://hack.com', 'DIFFERENT_ORG_ID');

-- Reset session
-- RESET request.jwt.claim.sub;

-- ============================================================================
-- 8. VERIFY ORGANISATION_ID COLUMNS EXIST
-- ============================================================================

SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'organisation_id'
ORDER BY table_name;

-- Expected: All critical tables should have organisation_id column (UUID)

-- ============================================================================
-- 9. CHECK FOREIGN KEY CONSTRAINTS
-- ============================================================================

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'organisation_id'
ORDER BY tc.table_name;

-- Expected: All organisation_id columns reference organisations(id)

-- ============================================================================
-- 10. PERFORMANCE CHECK: INDEX VERIFICATION
-- ============================================================================

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE '%organisation%'
    OR indexname LIKE '%organization%'
  )
ORDER BY tablename, indexname;

-- Expected: Indexes on organisation_id for all tables

-- ============================================================================
-- 11. DATA ISOLATION TEST (REQUIRES TWO USERS)
-- ============================================================================

-- Create two test users:
-- User A: test-a@example.com
-- User B: test-b@example.com

-- As User A, create a company:
-- SET request.jwt.claim.sub = 'USER_A_ID';
-- INSERT INTO companies (name, website, organisation_id)
-- VALUES ('Company A', 'https://a.com', 'USER_A_ORG_ID');

-- As User B, try to see User A's company:
-- SET request.jwt.claim.sub = 'USER_B_ID';
-- SELECT * FROM companies WHERE name = 'Company A';

-- Expected: No rows returned (data isolation working)

-- ============================================================================
-- 12. ROLE PERMISSION TEST
-- ============================================================================

-- Update a user to be a viewer
-- UPDATE organisation_members
-- SET role = 'viewer'
-- WHERE user_id = 'TEST_USER_ID';

-- As viewer, try to create a company:
-- SET request.jwt.claim.sub = 'VIEWER_USER_ID';
-- INSERT INTO companies (name, website, organisation_id)
-- VALUES ('Test', 'https://test.com', 'VIEWER_ORG_ID');

-- Expected: Permission denied (viewers can't insert)

-- Restore role
-- UPDATE organisation_members
-- SET role = 'member'
-- WHERE user_id = 'TEST_USER_ID';

-- ============================================================================
-- 13. CLEANUP TEST DATA
-- ============================================================================

-- Remove test companies
-- DELETE FROM companies WHERE name LIKE 'Test%' OR name LIKE 'Company A%';

-- Remove test users (do this in Supabase Auth UI)

-- ============================================================================
-- SUMMARY CHECKLIST
-- ============================================================================

-- [ ] All critical tables have RLS enabled
-- [ ] All tables have SELECT policies for org members
-- [ ] All tables have INSERT policies for appropriate roles
-- [ ] All tables have UPDATE/DELETE policies for admins/owners
-- [ ] Trigger on auth.users fires on INSERT
-- [ ] Function handle_new_user() exists and works
-- [ ] New users automatically get organisation
-- [ ] New users automatically get added to organisation_members
-- [ ] organisation_id columns exist on all tables
-- [ ] Foreign key constraints to organisations table
-- [ ] Performance indexes on organisation_id columns
-- [ ] Data isolation between organisations works
-- [ ] Role-based permissions work correctly

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- If RLS is not enabled on a table:
-- ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- If policies are missing, refer to:
-- D:\GEO_SEO_Domination-Tool\database\migrations\003_multi_tenancy_foundation.sql

-- If trigger is not firing:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.handle_new_user();

-- If users are not being added to organisations:
-- Check trigger and function exist
-- Check for errors in Supabase logs
-- Manually test function:
-- SELECT handle_new_user();

-- ============================================================================
-- END OF RLS VERIFICATION
-- ============================================================================
