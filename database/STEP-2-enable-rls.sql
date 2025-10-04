-- ========================================
-- STEP 2: Enable RLS and Create Policies
-- Run this AFTER STEP-1-create-tables.sql completes
-- ========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- SEO_AUDITS POLICIES
DROP POLICY IF EXISTS "Users can view own audits" ON seo_audits;
CREATE POLICY "Users can view own audits" ON seo_audits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own audits" ON seo_audits;
CREATE POLICY "Users can insert own audits" ON seo_audits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own audits" ON seo_audits;
CREATE POLICY "Users can update own audits" ON seo_audits
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own audits" ON seo_audits;
CREATE POLICY "Users can delete own audits" ON seo_audits
  FOR DELETE USING (auth.uid() = user_id);

-- USER_SETTINGS POLICIES
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- USER_API_KEYS POLICIES
DROP POLICY IF EXISTS "Users can view own API keys" ON user_api_keys;
CREATE POLICY "Users can view own API keys" ON user_api_keys
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own API keys" ON user_api_keys;
CREATE POLICY "Users can insert own API keys" ON user_api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own API keys" ON user_api_keys;
CREATE POLICY "Users can update own API keys" ON user_api_keys
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own API keys" ON user_api_keys;
CREATE POLICY "Users can delete own API keys" ON user_api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Verify policies created
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'seo_audits', 'user_settings', 'user_api_keys')
ORDER BY tablename, policyname;
