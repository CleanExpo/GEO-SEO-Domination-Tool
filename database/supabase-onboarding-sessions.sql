-- =====================================================
-- Onboarding Sessions Table for PostgreSQL/Supabase
-- =====================================================
-- Run this in Supabase SQL Editor to create the onboarding_sessions table
-- =====================================================

CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id TEXT PRIMARY KEY,
  company_id UUID,  -- Changed from TEXT to UUID to match companies.id

  -- Business Information
  business_name TEXT NOT NULL,
  industry TEXT,
  email TEXT NOT NULL,
  phone TEXT,

  -- Progress Tracking
  status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'completed', 'failed')),
  current_step TEXT,

  -- Request Data (full intake form stored as JSONB in PostgreSQL)
  request_data JSONB,

  -- Step Progress Data (stored as JSONB in PostgreSQL)
  steps_data JSONB,

  -- Error Tracking
  error TEXT,

  -- Timestamps (use TIMESTAMP WITH TIME ZONE for PostgreSQL)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON onboarding_sessions(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_email ON onboarding_sessions(email);
CREATE INDEX IF NOT EXISTS idx_onboarding_created ON onboarding_sessions(created_at DESC);

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth setup)
CREATE POLICY "Allow all operations on onboarding_sessions" ON onboarding_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Note: In production, replace the above policy with proper auth-based policies like:
-- CREATE POLICY "Users can view their own onboarding sessions" ON onboarding_sessions
--   FOR SELECT
--   USING (auth.uid() = user_id);
