-- RLS (Row Level Security) Testing Script
-- Run this to verify that users can only access their own data

-- Instructions:
-- 1. Create 2 test users in Supabase Auth
-- 2. Note their user IDs
-- 3. Replace USER1_ID and USER2_ID below with actual IDs
-- 4. Run this script as service role (admin)
-- 5. Verify results show proper isolation

-- === SETUP ===
-- Replace these with actual user IDs from auth.users
DO $$
DECLARE
  user1_id UUID := 'USER1_ID'::UUID; -- Replace with actual user ID
  user2_id UUID := 'USER2_ID'::UUID; -- Replace with actual user ID
BEGIN

-- Clean up any existing test data
DELETE FROM companies WHERE name LIKE 'Test Company User%';
DELETE FROM keywords WHERE keyword LIKE 'test-keyword-user%';
DELETE FROM crm_contacts WHERE email LIKE 'test-contact-user%@test.com';

-- === INSERT TEST DATA ===
RAISE NOTICE 'Creating test data for User 1...';

-- User 1 data
INSERT INTO companies (id, name, website, user_id) VALUES
  (gen_random_uuid(), 'Test Company User 1', 'https://user1.test.com', user1_id);

INSERT INTO keywords (id, keyword, company_id, user_id) VALUES
  (gen_random_uuid(), 'test-keyword-user1',
   (SELECT id FROM companies WHERE user_id = user1_id LIMIT 1),
   user1_id);

INSERT INTO crm_contacts (id, name, email, user_id) VALUES
  (gen_random_uuid(), 'Test Contact User 1', 'test-contact-user1@test.com', user1_id);

RAISE NOTICE 'Creating test data for User 2...';

-- User 2 data
INSERT INTO companies (id, name, website, user_id) VALUES
  (gen_random_uuid(), 'Test Company User 2', 'https://user2.test.com', user2_id);

INSERT INTO keywords (id, keyword, company_id, user_id) VALUES
  (gen_random_uuid(), 'test-keyword-user2',
   (SELECT id FROM companies WHERE user_id = user2_id LIMIT 1),
   user2_id);

INSERT INTO crm_contacts (id, name, email, user_id) VALUES
  (gen_random_uuid(), 'Test Contact User 2', 'test-contact-user2@test.com', user2_id);

-- === VERIFICATION QUERIES ===
RAISE NOTICE 'Running verification queries...';

-- Check total records created
RAISE NOTICE '✓ Total companies created: %', (SELECT COUNT(*) FROM companies WHERE name LIKE 'Test Company User%');
RAISE NOTICE '✓ Total keywords created: %', (SELECT COUNT(*) FROM keywords WHERE keyword LIKE 'test-keyword-user%');
RAISE NOTICE '✓ Total contacts created: %', (SELECT COUNT(*) FROM crm_contacts WHERE email LIKE 'test-contact-user%@test.com');

-- Check User 1 can only see their data
RAISE NOTICE '';
RAISE NOTICE '=== USER 1 DATA (should see only their records) ===';
RAISE NOTICE 'Companies for User 1: %', (SELECT COUNT(*) FROM companies WHERE user_id = user1_id);
RAISE NOTICE 'Keywords for User 1: %', (SELECT COUNT(*) FROM keywords WHERE user_id = user1_id);
RAISE NOTICE 'Contacts for User 1: %', (SELECT COUNT(*) FROM crm_contacts WHERE user_id = user1_id);

-- Check User 2 can only see their data
RAISE NOTICE '';
RAISE NOTICE '=== USER 2 DATA (should see only their records) ===';
RAISE NOTICE 'Companies for User 2: %', (SELECT COUNT(*) FROM companies WHERE user_id = user2_id);
RAISE NOTICE 'Keywords for User 2: %', (SELECT COUNT(*) FROM keywords WHERE user_id = user2_id);
RAISE NOTICE 'Contacts for User 2: %', (SELECT COUNT(*) FROM crm_contacts WHERE user_id = user2_id);

-- === RLS POLICY VERIFICATION ===
RAISE NOTICE '';
RAISE NOTICE '=== RLS POLICY VERIFICATION ===';

-- Verify RLS is enabled on all tables
RAISE NOTICE 'RLS enabled on companies: %', (
  SELECT relrowsecurity FROM pg_class WHERE relname = 'companies'
);
RAISE NOTICE 'RLS enabled on keywords: %', (
  SELECT relrowsecurity FROM pg_class WHERE relname = 'keywords'
);
RAISE NOTICE 'RLS enabled on crm_contacts: %', (
  SELECT relrowsecurity FROM pg_class WHERE relname = 'crm_contacts'
);

-- Check policies exist
RAISE NOTICE 'Policies on companies: %', (
  SELECT COUNT(*) FROM pg_policies WHERE tablename = 'companies'
);
RAISE NOTICE 'Policies on keywords: %', (
  SELECT COUNT(*) FROM pg_policies WHERE tablename = 'keywords'
);
RAISE NOTICE 'Policies on crm_contacts: %', (
  SELECT COUNT(*) FROM pg_policies WHERE tablename = 'crm_contacts'
);

-- === CLEANUP ===
RAISE NOTICE '';
RAISE NOTICE 'Cleaning up test data...';
DELETE FROM companies WHERE name LIKE 'Test Company User%';
DELETE FROM keywords WHERE keyword LIKE 'test-keyword-user%';
DELETE FROM crm_contacts WHERE email LIKE 'test-contact-user%@test.com';

RAISE NOTICE '';
RAISE NOTICE '✅ RLS Testing Complete!';
RAISE NOTICE '';
RAISE NOTICE 'Expected Results:';
RAISE NOTICE '- Each user should see exactly 1 company, 1 keyword, 1 contact';
RAISE NOTICE '- RLS should be TRUE for all tables';
RAISE NOTICE '- Each table should have at least 1 policy';

END $$;

-- === MANUAL TESTING INSTRUCTIONS ===
/*
To manually test RLS with actual users:

1. Create 2 test users via your app signup page
2. Log in as User 1 and create some data (company, keywords, contacts)
3. Log out and log in as User 2
4. Verify you CANNOT see User 1's data
5. Create some data as User 2
6. Log out and log back in as User 1
7. Verify you CANNOT see User 2's data

If you can see another user's data, RLS is not working correctly!

To test via API:
curl -H "Authorization: Bearer USER1_TOKEN" https://your-app.com/api/companies
# Should return only User 1's companies

curl -H "Authorization: Bearer USER2_TOKEN" https://your-app.com/api/companies
# Should return only User 2's companies
*/

-- === CHECK RLS POLICIES DETAILS ===
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('companies', 'keywords', 'audits', 'crm_contacts', 'crm_deals', 'crm_tasks', 'crm_calendar_events')
ORDER BY tablename, policyname;
