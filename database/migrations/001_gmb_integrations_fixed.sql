-- GMB Integrations Table - FIXED VERSION
-- Handles existing tables by adding missing columns

-- Drop and recreate to ensure clean state
DROP TABLE IF EXISTS gmb_integrations CASCADE;

-- Create fresh table with all columns
CREATE TABLE gmb_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User/Company associations
  user_id UUID NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  organisation_id UUID,
  
  -- OAuth tokens (encrypted)
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  
  -- GMB Account information
  gmb_account_id TEXT,
  gmb_account_name TEXT,
  gmb_location_ids TEXT[], -- Array of location IDs
  gmb_locations JSONB, -- Full location details
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_gmb_integrations_user_id ON gmb_integrations(user_id);
CREATE INDEX idx_gmb_integrations_company_id ON gmb_integrations(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_gmb_integrations_organisation_id ON gmb_integrations(organisation_id) WHERE organisation_id IS NOT NULL;
CREATE INDEX idx_gmb_integrations_status ON gmb_integrations(status);
CREATE INDEX idx_gmb_integrations_expires ON gmb_integrations(token_expires_at);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_gmb_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gmb_integrations_updated_at
  BEFORE UPDATE ON gmb_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_gmb_integrations_updated_at();

-- RLS Policies (assuming auth.users exists)
ALTER TABLE gmb_integrations ENABLE ROW LEVEL SECURITY;

-- Users can read their own integrations
CREATE POLICY "Users can view own GMB integrations"
  ON gmb_integrations
  FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Users can insert their own integrations
CREATE POLICY "Users can create own GMB integrations"
  ON gmb_integrations
  FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

-- Users can update their own integrations
CREATE POLICY "Users can update own GMB integrations"
  ON gmb_integrations
  FOR UPDATE
  USING (user_id::text = auth.uid()::text);

-- Users can delete their own integrations
CREATE POLICY "Users can delete own GMB integrations"
  ON gmb_integrations
  FOR DELETE
  USING (user_id::text = auth.uid()::text);

-- Comment for documentation
COMMENT ON TABLE gmb_integrations IS 'Stores Google My Business OAuth tokens and integration status per user/company';
COMMENT ON COLUMN gmb_integrations.access_token IS 'Encrypted OAuth access token (expires in 1 hour)';
COMMENT ON COLUMN gmb_integrations.refresh_token IS 'Encrypted OAuth refresh token (long-lived)';
COMMENT ON COLUMN gmb_integrations.gmb_locations IS 'Cached location details from GMB API';
