-- ========================================
-- STEP 1: Create Tables WITHOUT RLS Policies
-- This avoids column reference errors during creation
-- ========================================

-- 1. PROFILES TABLE
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

-- 2. SEO_AUDITS TABLE
CREATE TABLE IF NOT EXISTS seo_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  overall_score INTEGER NOT NULL,
  performance_score INTEGER NOT NULL,
  seo_score INTEGER NOT NULL,
  accessibility_score INTEGER NOT NULL,
  best_practices_score INTEGER,
  issues JSONB DEFAULT '[]'::JSONB,
  recommendations JSONB DEFAULT '[]'::JSONB,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_seo_audits_company ON seo_audits(company_id);
CREATE INDEX IF NOT EXISTS idx_seo_audits_user ON seo_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_seo_audits_url ON seo_audits(url);
CREATE INDEX IF NOT EXISTS idx_seo_audits_created ON seo_audits(created_at DESC);

-- 3. USER_SETTINGS TABLE
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

-- 4. USER_API_KEYS TABLE
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

-- Verify tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'seo_audits', 'user_settings', 'user_api_keys')
ORDER BY table_name;
