-- Saved Onboarding Progress Schema
-- Allows users to save and resume onboarding progress

CREATE TABLE IF NOT EXISTS saved_onboarding (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_name TEXT NOT NULL,
  email TEXT NOT NULL,
  form_data TEXT NOT NULL,  -- JSON string of all form fields
  current_step INTEGER DEFAULT 0,
  last_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(business_name, email)
);

CREATE INDEX IF NOT EXISTS idx_saved_onboarding_lookup
ON saved_onboarding(business_name, email);

CREATE INDEX IF NOT EXISTS idx_saved_onboarding_email
ON saved_onboarding(email);

-- PostgreSQL compatibility
-- For production deployment, use:
-- id SERIAL PRIMARY KEY
-- last_saved TIMESTAMPTZ
-- created_at TIMESTAMPTZ
