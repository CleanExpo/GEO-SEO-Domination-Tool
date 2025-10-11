-- Verification queries to run in Supabase SQL Editor
-- After running the migration, execute these to confirm success

-- 1. Verify all 4 tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'agent_schedules',
    'agent_alerts',
    'agent_alert_config',
    'company_autopilot'
  )
ORDER BY table_name;
-- Expected: 4 rows (agent_alert_config, agent_alerts, agent_schedules, company_autopilot)

-- 2. Verify all 11 indexes were created
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('agent_schedules', 'agent_alerts', 'agent_alert_config', 'company_autopilot')
ORDER BY tablename, indexname;
-- Expected: 11+ indexes (including primary keys)

-- 3. Verify RLS is enabled on all 4 tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('agent_schedules', 'agent_alerts', 'agent_alert_config', 'company_autopilot')
ORDER BY tablename;
-- Expected: All should show rowsecurity = true

-- 4. Verify RLS policies exist
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('agent_schedules', 'agent_alerts', 'agent_alert_config', 'company_autopilot')
ORDER BY tablename, policyname;
-- Expected: 4 policies (one per table, all permissive for service role)

-- 5. Test insert into agent_schedules (should work with service role key)
INSERT INTO agent_schedules (type, frequency, enabled, companies, config)
VALUES ('audit', 'daily', true, '[]'::jsonb, '{}'::jsonb)
RETURNING id, type, frequency, enabled, created_at;
-- Expected: Returns 1 row with generated UUID and timestamp

-- 6. Test query from agent_schedules
SELECT id, type, frequency, enabled, created_at
FROM agent_schedules
ORDER BY created_at DESC
LIMIT 5;
-- Expected: Shows the test row created above

-- 7. Clean up test data
DELETE FROM agent_schedules WHERE type = 'audit' AND frequency = 'daily';
-- Expected: Deletes the test row
