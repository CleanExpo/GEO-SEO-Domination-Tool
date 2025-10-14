-- =====================================================
-- Credentials Schema
-- Secure storage for client platform credentials
-- Created: October 14, 2025
-- PostgreSQL Compatible Version
-- =====================================================

-- Enable UUID extension for PostgreSQL (no-op if already exists)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CLIENT CREDENTIALS
-- Stores encrypted credentials for all platforms
-- =====================================================

CREATE TABLE IF NOT EXISTS client_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Platform identification
  platform_type TEXT NOT NULL CHECK (platform_type IN (
    'website_hosting',
    'website_cms',
    'website_dns',
    'social_media',
    'google_ecosystem',
    'email_marketing',
    'crm',
    'analytics',
    'advertising',
    'review_platform'
  )),
  platform_name TEXT NOT NULL, -- e.g., 'WordPress', 'Facebook Business', 'Google Analytics'

  -- Encrypted credentials (AES-256-GCM)
  -- Format: { username, password, apiKey, accessToken, etc. }
  encrypted_data TEXT NOT NULL, -- JSON encrypted with ENCRYPTION_KEY
  encryption_iv TEXT NOT NULL,  -- Initialization vector for AES-256-GCM
  encryption_tag TEXT NOT NULL, -- Authentication tag for AES-256-GCM

  -- Metadata
  credential_type TEXT CHECK (credential_type IN (
    'username_password',
    'api_key',
    'oauth_token',
    'ftp_credentials',
    'ssh_key',
    'access_token'
  )),

  -- Status tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'invalid')),
  last_validated_at TIMESTAMP,
  validation_status TEXT CHECK (validation_status IN ('valid', 'invalid', 'pending', 'not_tested')),
  validation_error TEXT,

  -- Access control
  tier_required TEXT DEFAULT 'basic' CHECK (tier_required IN ('basic', 'standard', 'premium', 'enterprise')),
  permissions TEXT, -- JSON array of what we can do with these credentials

  -- Audit trail
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  last_accessed_at TIMESTAMP,

  UNIQUE(company_id, platform_type, platform_name)
);

-- Index for fast lookups by company
CREATE INDEX IF NOT EXISTS idx_credentials_company
ON client_credentials(company_id);

-- Index for platform type queries
CREATE INDEX IF NOT EXISTS idx_credentials_platform
ON client_credentials(platform_type, status);

-- =====================================================
-- CREDENTIAL ACCESS LOG
-- Audit trail for credential usage
-- =====================================================

CREATE TABLE IF NOT EXISTS credential_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL REFERENCES client_credentials(id) ON DELETE CASCADE,

  -- Access details
  accessed_by TEXT NOT NULL, -- Agent or user that accessed credentials
  access_type TEXT NOT NULL CHECK (access_type IN (
    'read',
    'write',
    'api_call',
    'validation_test',
    'auto_action'
  )),
  access_purpose TEXT, -- e.g., 'Running SEO audit', 'Publishing blog post'

  -- Result
  success BOOLEAN NOT NULL,
  error_message TEXT,

  -- Metadata
  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_access_log_credential
ON credential_access_log(credential_id, created_at DESC);

-- =====================================================
-- PLATFORM CAPABILITIES
-- Track what we can do with each platform based on credentials
-- =====================================================

CREATE TABLE IF NOT EXISTS platform_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL REFERENCES client_credentials(id) ON DELETE CASCADE,

  -- Capability
  capability TEXT NOT NULL, -- e.g., 'read_posts', 'write_posts', 'manage_schema', 'post_to_feed'
  enabled BOOLEAN DEFAULT true,

  -- Tier requirements
  tier_required TEXT DEFAULT 'basic' CHECK (tier_required IN ('basic', 'standard', 'premium', 'enterprise')),

  -- Auto-action control
  auto_action_enabled BOOLEAN DEFAULT false,
  auto_action_approval_required BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(credential_id, capability)
);

-- =====================================================
-- WEBSITE ACCESS DETAILS
-- Additional metadata for website credentials
-- =====================================================

CREATE TABLE IF NOT EXISTS website_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Hosting details
  hosting_provider TEXT,
  hosting_control_panel TEXT, -- cPanel, Plesk, etc.
  hosting_credential_id UUID REFERENCES client_credentials(id),

  -- CMS details
  cms_platform TEXT, -- WordPress, Shopify, Wix, Custom
  cms_version TEXT,
  cms_admin_url TEXT,
  cms_credential_id UUID REFERENCES client_credentials(id),

  -- FTP/SFTP access
  ftp_host TEXT,
  ftp_port INTEGER,
  ftp_protocol TEXT CHECK (ftp_protocol IN ('ftp', 'sftp', 'ftps')),
  ftp_credential_id UUID REFERENCES client_credentials(id),

  -- DNS management
  dns_provider TEXT,
  dns_credential_id UUID REFERENCES client_credentials(id),

  -- Database access
  db_type TEXT, -- MySQL, PostgreSQL, etc.
  db_host TEXT,
  db_port INTEGER,
  db_name TEXT,
  db_credential_id UUID REFERENCES client_credentials(id),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(company_id)
);

-- =====================================================
-- SOCIAL MEDIA ACCOUNTS
-- Track social media platform connections
-- =====================================================

CREATE TABLE IF NOT EXISTS social_media_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  credential_id UUID REFERENCES client_credentials(id),

  -- Platform identification
  platform TEXT NOT NULL CHECK (platform IN (
    'facebook',
    'instagram',
    'linkedin',
    'twitter',
    'youtube',
    'tiktok',
    'pinterest',
    'reddit',
    'snapchat'
  )),

  -- Account details
  account_id TEXT, -- Platform-specific account ID
  account_name TEXT,
  account_url TEXT,
  account_type TEXT, -- 'business', 'personal', 'creator'

  -- Metrics (updated periodically)
  followers_count INTEGER,
  engagement_rate REAL,
  last_post_date TIMESTAMP,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disconnected')),
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(company_id, platform)
);

-- =====================================================
-- GOOGLE ECOSYSTEM ACCESS
-- Track Google platform connections
-- =====================================================

CREATE TABLE IF NOT EXISTS google_ecosystem_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Google Business Profile
  gbp_credential_id UUID REFERENCES client_credentials(id),
  gbp_location_id TEXT,
  gbp_location_name TEXT,

  -- Google Analytics 4
  ga4_credential_id UUID REFERENCES client_credentials(id),
  ga4_property_id TEXT,
  ga4_property_name TEXT,

  -- Google Search Console
  gsc_credential_id UUID REFERENCES client_credentials(id),
  gsc_site_url TEXT,

  -- Google Ads
  gads_credential_id UUID REFERENCES client_credentials(id),
  gads_customer_id TEXT,
  gads_account_name TEXT,

  -- Google Tag Manager
  gtm_credential_id UUID REFERENCES client_credentials(id),
  gtm_container_id TEXT,
  gtm_container_name TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(company_id)
);

-- =====================================================
-- CREDENTIAL VALIDATION SCHEDULES
-- Automatic credential validation
-- =====================================================

CREATE TABLE IF NOT EXISTS credential_validation_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL REFERENCES client_credentials(id) ON DELETE CASCADE,

  -- Schedule
  validation_frequency TEXT DEFAULT 'weekly' CHECK (validation_frequency IN (
    'daily',
    'weekly',
    'monthly',
    'on_demand'
  )),
  next_validation_at TIMESTAMP,

  -- History
  last_validation_at TIMESTAMP,
  last_validation_status TEXT CHECK (last_validation_status IN ('valid', 'invalid', 'error')),
  consecutive_failures INTEGER DEFAULT 0,

  -- Alerts
  alert_on_failure BOOLEAN DEFAULT true,
  alert_email TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(credential_id)
);

-- Index for scheduled validations
CREATE INDEX IF NOT EXISTS idx_validation_schedules
ON credential_validation_schedules(next_validation_at)
WHERE next_validation_at IS NOT NULL;

-- =====================================================
-- AUTO-ACTION PERMISSIONS
-- Control what auto-actions are allowed per company
-- =====================================================

CREATE TABLE IF NOT EXISTS auto_action_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Permission details
  action_category TEXT NOT NULL CHECK (action_category IN (
    'technical_seo',
    'content_publishing',
    'social_media',
    'review_management',
    'schema_implementation',
    'gbp_management',
    'advertising'
  )),
  action_type TEXT NOT NULL, -- e.g., 'publish_blog_post', 'respond_to_review', 'add_faq_schema'

  -- Permission status
  enabled BOOLEAN DEFAULT false,
  approval_required BOOLEAN DEFAULT true,
  tier_required TEXT DEFAULT 'premium' CHECK (tier_required IN ('basic', 'standard', 'premium', 'enterprise')),

  -- Limits
  daily_limit INTEGER, -- Max auto-actions per day
  actions_today INTEGER DEFAULT 0,
  last_action_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(company_id, action_category, action_type)
);

-- =====================================================
-- TRIGGERS (PostgreSQL Compatible)
-- =====================================================

-- Update timestamps automatically
-- PostgreSQL syntax (no IF NOT EXISTS in CREATE TRIGGER, use OR REPLACE for functions)

-- Drop existing triggers if they exist (PostgreSQL)
DROP TRIGGER IF EXISTS update_credentials_timestamp ON client_credentials;
DROP TRIGGER IF EXISTS update_website_access_timestamp ON website_access;
DROP TRIGGER IF EXISTS update_social_accounts_timestamp ON social_media_accounts;
DROP TRIGGER IF EXISTS update_google_access_timestamp ON google_ecosystem_access;

-- Create trigger function for updating timestamps (PostgreSQL)
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers using the function
CREATE TRIGGER update_credentials_timestamp
BEFORE UPDATE ON client_credentials
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_website_access_timestamp
BEFORE UPDATE ON website_access
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_social_accounts_timestamp
BEFORE UPDATE ON social_media_accounts
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_google_access_timestamp
BEFORE UPDATE ON google_ecosystem_access
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- =====================================================
-- NOTES
-- =====================================================

-- Security:
-- 1. All credentials encrypted at rest with AES-256-GCM
-- 2. Encryption key stored in environment variable ENCRYPTION_KEY
-- 3. Never log decrypted credentials
-- 4. Access log tracks all credential usage

-- Tier Requirements:
-- - Basic: Read-only access to analytics
-- - Standard: Limited auto-actions (with approval)
-- - Premium: Full auto-actions, auto-publishing
-- - Enterprise: White-label, custom workflows
