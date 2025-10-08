-- Saved Onboarding Progress Schema (PostgreSQL/Supabase)
-- Allows users to save and resume onboarding progress

CREATE TABLE IF NOT EXISTS saved_onboarding (
  id SERIAL PRIMARY KEY,
  business_name TEXT NOT NULL,
  email TEXT NOT NULL,
  form_data JSONB NOT NULL,  -- JSON data stored as JSONB for better querying
  current_step INTEGER DEFAULT 0,
  last_saved TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_business_email UNIQUE(business_name, email)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_saved_onboarding_lookup
  ON saved_onboarding(business_name, email);

CREATE INDEX IF NOT EXISTS idx_saved_onboarding_email
  ON saved_onboarding(email);

-- Comment for documentation
COMMENT ON TABLE saved_onboarding IS 'Stores saved progress from the onboarding wizard';
