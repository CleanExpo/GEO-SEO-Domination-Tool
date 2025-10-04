-- ========================================
-- FILE 1 OF 8: Auth & User Tables
-- Purpose: Create authentication and user management tables
-- Dependencies: auth.users (Supabase built-in)
-- Tables Created: profiles, user_settings, user_api_keys
-- ========================================

-- 1. PROFILES TABLE
-- Used by: /api/admin/users, /api/audit
-- Purpose: Store user roles and profile information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'free' CHECK (role IN ('free', 'pro', 'admin')),
  full_name TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

COMMENT ON TABLE profiles IS 'User profiles with role-based access control (free, pro, admin)';

-- 2. USER_SETTINGS TABLE
-- Used by: /api/settings
-- Purpose: Store user preferences and account settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  preferences JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

COMMENT ON TABLE user_settings IS 'User preferences and account settings';

-- 3. USER_API_KEYS TABLE
-- Used by: /api/settings/api-keys
-- Purpose: Store user-managed API keys for external integrations
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  api_key TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, service)
);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_service ON user_api_keys(service);

COMMENT ON TABLE user_api_keys IS 'User-managed API keys for external service integrations';

-- Verification: Check tables were created
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'user_settings', 'user_api_keys')
ORDER BY table_name;

-- Expected output: 3 rows showing profiles, user_api_keys, user_settings
