-- Client Onboarding & Credential Management Schema
--
-- Security Features:
-- 1. All API keys encrypted with AES-256-GCM
-- 2. Credentials stored separately from client data
-- 3. Audit log for all credential access
-- 4. Self-service credential management (clients can update their own keys)
-- 5. Admin/owner NEVER sees plaintext credentials

-- Client onboarding data (non-sensitive)
CREATE TABLE IF NOT EXISTS client_onboarding (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),

  -- Company Information
  company_name TEXT NOT NULL,
  company_website TEXT,
  industry TEXT NOT NULL,
  company_size TEXT, -- small, medium, large, enterprise

  -- Contact Information
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL UNIQUE,
  contact_phone TEXT,
  contact_role TEXT, -- owner, marketing_manager, ceo, etc.

  -- Business Goals
  primary_goal TEXT NOT NULL, -- lead_generation, brand_awareness, market_dominance, thought_leadership
  target_audience TEXT,
  monthly_marketing_budget REAL,
  current_marketing_spend REAL,

  -- Geographic Data
  primary_location TEXT, -- city, state, country
  target_regions TEXT DEFAULT '[]', -- JSON array of regions

  -- Competitors
  main_competitors TEXT DEFAULT '[]', -- JSON array of competitor URLs

  -- Current Marketing
  existing_website TEXT,
  existing_social_profiles TEXT DEFAULT '{}', -- JSON object {linkedin: "url", facebook: "url"}
  current_ranking_keywords TEXT DEFAULT '[]', -- JSON array

  -- Service Selection
  selected_tier TEXT NOT NULL DEFAULT 'starter', -- starter, growth, empire
  selected_services TEXT DEFAULT '[]', -- JSON array of service IDs

  -- Onboarding Status
  onboarding_step INTEGER NOT NULL DEFAULT 1, -- 1-5 (multi-step wizard)
  onboarding_completed BOOLEAN NOT NULL DEFAULT 0,
  credentials_configured BOOLEAN NOT NULL DEFAULT 0,
  first_campaign_launched BOOLEAN NOT NULL DEFAULT 0,

  -- Metadata
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,

  -- Linked Portfolio (after onboarding complete)
  portfolio_id TEXT,
  FOREIGN KEY (portfolio_id) REFERENCES company_portfolios(id)
);

-- Encrypted credentials vault (HIGHLY SENSITIVE)
CREATE TABLE IF NOT EXISTS client_credentials (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  client_id TEXT NOT NULL,

  -- Credential Type
  credential_type TEXT NOT NULL, -- google_ads, meta_ads, linkedin, twitter, openai, etc.
  credential_name TEXT NOT NULL, -- "Google Ads API Key", "Facebook Access Token", etc.

  -- Encrypted Data (AES-256-GCM)
  encrypted_value TEXT NOT NULL, -- Format: iv:authTag:encryptedData
  credential_hash TEXT NOT NULL, -- SHA-256 hash for validation (without decryption)

  -- Metadata (for display - NOT sensitive)
  masked_value TEXT NOT NULL, -- "••••••••ab12" (last 4 chars only)
  is_active BOOLEAN NOT NULL DEFAULT 1,
  expires_at TEXT, -- For credentials that expire (OAuth tokens)

  -- Audit
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at TEXT,

  FOREIGN KEY (client_id) REFERENCES client_onboarding(id)
);

-- Credential access audit log (track every time a credential is decrypted)
CREATE TABLE IF NOT EXISTS credential_access_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credential_id TEXT NOT NULL,
  client_id TEXT NOT NULL,

  -- Access Details
  accessed_by TEXT NOT NULL, -- 'agent:seo-optimization' or 'user:client@example.com'
  access_purpose TEXT NOT NULL, -- 'campaign_execution', 'credential_validation', 'user_update'
  access_successful BOOLEAN NOT NULL,

  -- Context
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamp
  accessed_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (credential_id) REFERENCES client_credentials(id),
  FOREIGN KEY (client_id) REFERENCES client_onboarding(id)
);

-- Platform connection status
CREATE TABLE IF NOT EXISTS platform_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,

  -- Platform Details
  platform_name TEXT NOT NULL, -- google_ads, meta, linkedin, wordpress, etc.
  connection_status TEXT NOT NULL DEFAULT 'pending', -- pending, connected, disconnected, error

  -- Connection Metadata
  account_id TEXT, -- Platform-specific account ID
  account_name TEXT, -- Platform-specific account name (for display)
  connected_at TEXT,
  last_sync_at TEXT,

  -- Error Handling
  last_error TEXT,
  error_count INTEGER DEFAULT 0,

  -- Features Enabled
  features_enabled TEXT DEFAULT '[]', -- JSON array ["ads", "analytics", "posting"]

  FOREIGN KEY (client_id) REFERENCES client_onboarding(id)
);

-- Onboarding checklist (track completion of each step)
CREATE TABLE IF NOT EXISTS onboarding_checklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,

  -- Checklist Item
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_description TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, skipped
  completed_at TEXT,

  -- Metadata
  data TEXT DEFAULT '{}', -- JSON object with step-specific data

  FOREIGN KEY (client_id) REFERENCES client_onboarding(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_email ON client_onboarding(contact_email);
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON client_onboarding(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_credentials_client ON client_credentials(client_id);
CREATE INDEX IF NOT EXISTS idx_credentials_type ON client_credentials(credential_type);
CREATE INDEX IF NOT EXISTS idx_credential_log_client ON credential_access_log(client_id);
CREATE INDEX IF NOT EXISTS idx_credential_log_time ON credential_access_log(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_connections_client ON platform_connections(client_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON platform_connections(connection_status);
CREATE INDEX IF NOT EXISTS idx_checklist_client ON onboarding_checklist(client_id);

-- Sample onboarding checklist items
INSERT OR IGNORE INTO onboarding_checklist (client_id, step_number, step_name, step_description, status)
SELECT
  'template',
  1,
  'Company Information',
  'Provide your company details, industry, and goals',
  'pending'
UNION ALL SELECT 'template', 2, 'Target Audience', 'Define who you want to reach', 'pending'
UNION ALL SELECT 'template', 3, 'Platform Credentials', 'Securely connect your marketing platforms', 'pending'
UNION ALL SELECT 'template', 4, 'Campaign Setup', 'Configure your first automated campaign', 'pending'
UNION ALL SELECT 'template', 5, 'Launch', 'Review and launch your autonomous marketing empire', 'pending';
