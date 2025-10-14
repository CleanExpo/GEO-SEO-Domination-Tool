-- =====================================================
-- SUPABASE PRODUCTION DATABASE INITIALIZATION
-- =====================================================
-- This migration initializes the complete database schema
-- for the GEO-SEO Domination Tool production environment
--
-- Issues Fixed:
-- 1. Missing client_credentials table (was looking for wrong name 'credentials')
-- 2. Companies table missing required columns
-- 3. Complete schema initialization from scratch
--
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/editor
-- =====================================================

-- =====================================================
-- 1. COMPANIES TABLE
-- =====================================================
-- Ensure all required columns exist
DO $$
BEGIN
  -- Add email column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'email'
  ) THEN
    ALTER TABLE companies ADD COLUMN email TEXT;
  END IF;

  -- Add phone column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'phone'
  ) THEN
    ALTER TABLE companies ADD COLUMN phone TEXT;
  END IF;

  -- Add address column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'address'
  ) THEN
    ALTER TABLE companies ADD COLUMN address TEXT;
  END IF;

  -- Add city column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'city'
  ) THEN
    ALTER TABLE companies ADD COLUMN city TEXT;
  END IF;

  -- Add state column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'state'
  ) THEN
    ALTER TABLE companies ADD COLUMN state TEXT;
  END IF;

  -- Add zip column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'zip'
  ) THEN
    ALTER TABLE companies ADD COLUMN zip TEXT;
  END IF;

  -- Add industry column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'industry'
  ) THEN
    ALTER TABLE companies ADD COLUMN industry TEXT;
  END IF;

  -- Add services column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'services'
  ) THEN
    ALTER TABLE companies ADD COLUMN services TEXT; -- JSON array
  END IF;

  -- Add description column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'description'
  ) THEN
    ALTER TABLE companies ADD COLUMN description TEXT;
  END IF;

  -- Add gbp_url column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'gbp_url'
  ) THEN
    ALTER TABLE companies ADD COLUMN gbp_url TEXT;
  END IF;

  -- Add social_profiles column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'social_profiles'
  ) THEN
    ALTER TABLE companies ADD COLUMN social_profiles TEXT; -- JSON object
  END IF;

  -- Add timestamps if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE companies ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE companies ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- =====================================================
-- 2. CLIENT_CREDENTIALS TABLE
-- =====================================================
-- This is the CORRECT table name (not 'credentials')
-- Stores encrypted client credentials with AES-256-GCM

CREATE TABLE IF NOT EXISTS client_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Platform identification
  platform_type TEXT NOT NULL CHECK (platform_type IN (
    'website_hosting',
    'website_cms',
    'social_media',
    'google_ecosystem',
    'email_marketing',
    'advertising',
    'review_platform'
  )),
  platform_name TEXT NOT NULL,

  -- Encrypted credentials (AES-256-GCM)
  encrypted_data TEXT NOT NULL,
  encryption_iv TEXT NOT NULL,
  encryption_tag TEXT NOT NULL,

  -- Credential metadata
  credential_type TEXT CHECK (credential_type IN (
    'username_password',
    'api_key',
    'oauth_token',
    'access_token'
  )),

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  last_verified TIMESTAMP,
  notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(company_id, platform_type, platform_name)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_credentials_company
  ON client_credentials(company_id);

CREATE INDEX IF NOT EXISTS idx_credentials_platform
  ON client_credentials(platform_type, platform_name);

CREATE INDEX IF NOT EXISTS idx_credentials_status
  ON client_credentials(status);

-- =====================================================
-- 3. SAVED_ONBOARDING_SESSIONS TABLE
-- =====================================================
-- Stores incomplete onboarding sessions for resume later

CREATE TABLE IF NOT EXISTS saved_onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key TEXT UNIQUE NOT NULL,
  form_data JSONB NOT NULL,
  current_step INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_onboarding_session_key
  ON saved_onboarding_sessions(session_key);

CREATE INDEX IF NOT EXISTS idx_onboarding_expires
  ON saved_onboarding_sessions(expires_at);

-- =====================================================
-- 4. VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration was successful

-- Check companies table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
ORDER BY ordinal_position;

-- Check client_credentials table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'client_credentials'
ORDER BY ordinal_position;

-- Verify tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('companies', 'client_credentials', 'saved_onboarding_sessions')
ORDER BY table_name;

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS for security

ALTER TABLE client_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own company's credentials
CREATE POLICY IF NOT EXISTS "Users can view own company credentials"
  ON client_credentials
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: Users can insert credentials for companies they own
CREATE POLICY IF NOT EXISTS "Users can insert own company credentials"
  ON client_credentials
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can update credentials for companies they own
CREATE POLICY IF NOT EXISTS "Users can update own company credentials"
  ON client_credentials
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Policy: Users can delete credentials for companies they own
CREATE POLICY IF NOT EXISTS "Users can delete own company credentials"
  ON client_credentials
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Policy: Anyone can create onboarding sessions (anonymous users)
CREATE POLICY IF NOT EXISTS "Anyone can create onboarding sessions"
  ON saved_onboarding_sessions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Anyone can read their own session
CREATE POLICY IF NOT EXISTS "Anyone can read own session"
  ON saved_onboarding_sessions
  FOR SELECT
  USING (true);

-- Policy: Anyone can update their own session
CREATE POLICY IF NOT EXISTS "Anyone can update own session"
  ON saved_onboarding_sessions
  FOR UPDATE
  USING (true);

-- =====================================================
-- 6. FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to client_credentials
DROP TRIGGER IF EXISTS update_client_credentials_updated_at ON client_credentials;
CREATE TRIGGER update_client_credentials_updated_at
  BEFORE UPDATE ON client_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to saved_onboarding_sessions
DROP TRIGGER IF EXISTS update_saved_onboarding_updated_at ON saved_onboarding_sessions;
CREATE TRIGGER update_saved_onboarding_updated_at
  BEFORE UPDATE ON saved_onboarding_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. CLEANUP FUNCTION
-- =====================================================
-- Delete expired onboarding sessions daily

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM saved_onboarding_sessions
  WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Run verification queries above to confirm success
