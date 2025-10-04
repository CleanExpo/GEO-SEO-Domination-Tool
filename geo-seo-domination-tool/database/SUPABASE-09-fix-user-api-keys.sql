-- ========================================
-- Fix: Add missing columns to user_api_keys table
-- Purpose: Support internal API key generation feature in Settings page
-- Run this after SUPABASE-08-create-triggers.sql completes
-- ========================================

-- Add missing columns to user_api_keys table
ALTER TABLE user_api_keys
  ADD COLUMN IF NOT EXISTS key_name TEXT,
  ADD COLUMN IF NOT EXISTS api_key_prefix TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_user_api_keys_is_active ON user_api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_key_name ON user_api_keys(key_name);

-- Update comment to reflect dual purpose
COMMENT ON TABLE user_api_keys IS 'User-managed API keys: both external service integrations (service column) and internally generated API keys (key_name column)';

-- Verification: Check new columns were added
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_api_keys'
ORDER BY ordinal_position;

-- Expected output: Should show all columns including the new ones
