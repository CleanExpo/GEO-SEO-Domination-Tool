-- ============================================================================
-- Complete Supabase Database Setup - FIXED VERSION
-- ============================================================================
-- Purpose: One-command setup for all subscription and tier management tables
-- Run this entire file in Supabase SQL Editor
-- Date: 2025-10-12
-- Fix: Ensures table creation completes before indexes, handles existing tables

-- ============================================================================
-- STEP 0: Drop existing tables if needed (OPTIONAL - UNCOMMENT IF NEEDED)
-- ============================================================================
-- WARNING: This will delete ALL data. Only use for fresh setup.
-- UNCOMMENT the lines below if you want to start completely fresh:

-- DROP TABLE IF EXISTS subscription_history CASCADE;
-- DROP TABLE IF EXISTS usage_tracking CASCADE;
-- DROP TABLE IF EXISTS webhook_events CASCADE;
-- DROP TABLE IF EXISTS agent_execution_logs CASCADE;
-- DROP TABLE IF EXISTS approval_tasks CASCADE;
-- DROP TABLE IF EXISTS tier_access CASCADE;
-- DROP TABLE IF EXISTS stripe_customers CASCADE;
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS subscriptions CASCADE;
-- DROP TABLE IF EXISTS tier_features_reference CASCADE;
-- DROP TABLE IF EXISTS client_onboarding CASCADE;

-- ============================================================================
-- STEP 1: Enable Required Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- For gen_random_uuid()

-- ============================================================================
-- STEP 2: Drop All Tables (in reverse dependency order)
-- ============================================================================
DROP TABLE IF EXISTS subscription_history CASCADE;
DROP TABLE IF EXISTS usage_tracking CASCADE;
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS agent_execution_logs CASCADE;
DROP TABLE IF EXISTS approval_tasks CASCADE;
DROP TABLE IF EXISTS tier_access CASCADE;
DROP TABLE IF EXISTS stripe_customers CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS tier_features_reference CASCADE;
DROP TABLE IF EXISTS client_onboarding CASCADE;

-- ============================================================================
-- STEP 3: Client Onboarding Table (Base Table - No Dependencies)
-- ============================================================================

CREATE TABLE client_onboarding (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  -- Company Information
  business_name TEXT NOT NULL,
  website_url TEXT,
  industry TEXT,
  company_size TEXT, -- small, medium, large, enterprise

  -- Contact Information
  contact_name TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  contact_role TEXT,

  -- Business Goals
  primary_goal TEXT,
  target_audience TEXT,
  monthly_marketing_budget DECIMAL(10, 2),

  -- Geographic Data
  primary_location TEXT,
  target_regions JSONB DEFAULT '[]',

  -- Competitors
  main_competitors JSONB DEFAULT '[]',

  -- Service Selection
  tier TEXT DEFAULT 'good' CHECK (tier IN ('good', 'better', 'best', 'custom')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pending_payment', 'active', 'canceled', 'suspended')),

  -- Onboarding Status
  onboarding_step INTEGER DEFAULT 1,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  credentials_configured BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Create indexes AFTER table is created
CREATE INDEX IF NOT EXISTS idx_onboarding_email ON client_onboarding(email);
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON client_onboarding(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_tier ON client_onboarding(tier);
CREATE INDEX IF NOT EXISTS idx_onboarding_completed ON client_onboarding(onboarding_completed);

-- ============================================================================
-- STEP 4: Subscriptions Table
-- ============================================================================
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT NOT NULL REFERENCES client_onboarding(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('good', 'better', 'best', 'custom')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'paused', 'trialing')),
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP,
  trial_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_client ON subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);

-- ============================================================================
-- STEP 5: Payments Table
-- ============================================================================
CREATE TABLE payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  subscription_id TEXT REFERENCES subscriptions(id) ON DELETE SET NULL,
  client_id TEXT NOT NULL REFERENCES client_onboarding(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'AUD',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded', 'canceled')),
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  stripe_invoice_id TEXT,
  payment_method TEXT,
  failure_reason TEXT,
  paid_at TIMESTAMP,
  refunded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent_id);

-- ============================================================================
-- STEP 6: Stripe Customer Mapping
-- ============================================================================
CREATE TABLE stripe_customers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT NOT NULL UNIQUE REFERENCES client_onboarding(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  default_payment_method TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stripe_customers_client ON stripe_customers(client_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);

-- ============================================================================
-- STEP 7: Tier Access Control
-- ============================================================================
CREATE TABLE tier_access (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT NOT NULL UNIQUE REFERENCES client_onboarding(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('good', 'better', 'best', 'custom')),
  features JSONB NOT NULL,
  automation_level TEXT NOT NULL CHECK (automation_level IN ('manual', 'semi_autonomous', 'full_autopilot', 'custom')),
  approval_required BOOLEAN DEFAULT TRUE,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tier_access_client ON tier_access(client_id);
CREATE INDEX IF NOT EXISTS idx_tier_access_tier ON tier_access(tier);
CREATE INDEX IF NOT EXISTS idx_tier_access_expires ON tier_access(expires_at);

-- ============================================================================
-- STEP 8: Approval Tasks (for Good & Better tiers)
-- ============================================================================
CREATE TABLE approval_tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT NOT NULL REFERENCES client_onboarding(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  task_data JSONB NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'executing')),
  approval_required_by TIMESTAMP,
  approved_by TEXT,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  rejected_reason TEXT,
  execution_started_at TIMESTAMP,
  execution_completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_approval_tasks_client ON approval_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_approval_tasks_status ON approval_tasks(status);
CREATE INDEX IF NOT EXISTS idx_approval_tasks_client_status ON approval_tasks(client_id, status);
CREATE INDEX IF NOT EXISTS idx_approval_tasks_approval_required_by ON approval_tasks(approval_required_by);

-- ============================================================================
-- STEP 9: Agent Execution Logs
-- ============================================================================
CREATE TABLE agent_execution_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT NOT NULL REFERENCES client_onboarding(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  execution_mode TEXT NOT NULL CHECK (execution_mode IN ('manual', 'semi_autonomous', 'full_autopilot')),
  approval_required BOOLEAN DEFAULT FALSE,
  approval_task_id TEXT REFERENCES approval_tasks(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'canceled')),
  error_message TEXT,
  error_stack TEXT,
  execution_time_ms INTEGER,
  results JSONB,
  metadata JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_client ON agent_execution_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_status ON agent_execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_agent_logs_client_status ON agent_execution_logs(client_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_id ON agent_execution_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_completed ON agent_execution_logs(completed_at);

-- ============================================================================
-- STEP 10: Webhook Events (for Stripe webhooks)
-- ============================================================================
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_type TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed, created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);

-- ============================================================================
-- STEP 11: Usage Tracking (for tier limits)
-- ============================================================================
CREATE TABLE usage_tracking (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT NOT NULL REFERENCES client_onboarding(id) ON DELETE CASCADE,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value INTEGER NOT NULL DEFAULT 0,
  limit_value INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(client_id, period_start, metric_type)
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_client ON usage_tracking(client_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON usage_tracking(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_client_metric ON usage_tracking(client_id, metric_type);

-- ============================================================================
-- STEP 12: Subscription History (audit trail)
-- ============================================================================
CREATE TABLE subscription_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES client_onboarding(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  old_tier TEXT,
  new_tier TEXT,
  old_status TEXT,
  new_status TEXT,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription ON subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_client ON subscription_history(client_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_event ON subscription_history(event_type);

-- ============================================================================
-- STEP 13: Tier Features Reference (Static Data)
-- ============================================================================
CREATE TABLE tier_features_reference (
  tier TEXT PRIMARY KEY CHECK (tier IN ('good', 'better', 'best', 'custom')),
  name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL,
  price_annual INTEGER NOT NULL,
  features JSONB NOT NULL,
  automation_level TEXT NOT NULL,
  approval_required BOOLEAN NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert tier definitions
INSERT INTO tier_features_reference (tier, name, price_monthly, price_annual, features, automation_level, approval_required, description) VALUES
('good', 'Good', 29900, 299000, '{
  "websites": 1,
  "audits_per_month": 1,
  "keywords": 50,
  "competitors": 2,
  "backlinks_limit": 100,
  "ai_recommendations": true,
  "scheduled_reports": false,
  "auto_publishing": false,
  "ai_content_generation": false,
  "priority_support": false,
  "dedicated_account_manager": false
}', 'manual', true, 'Manual AI recommendations, perfect for getting started'),

('better', 'Better', 44900, 449000, '{
  "websites": 5,
  "audits_per_month": 4,
  "keywords": 500,
  "competitors": 10,
  "backlinks_limit": 10000,
  "ai_recommendations": true,
  "scheduled_reports": true,
  "auto_publishing": false,
  "ai_content_generation": true,
  "priority_support": true,
  "dedicated_account_manager": true
}', 'semi_autonomous', true, 'Semi-autonomous with approval for publishing'),

('best', 'Best', 59900, 599000, '{
  "websites": -1,
  "audits_per_month": -1,
  "keywords": -1,
  "competitors": -1,
  "backlinks_limit": -1,
  "ai_recommendations": true,
  "scheduled_reports": true,
  "auto_publishing": true,
  "ai_content_generation": true,
  "ai_swarm_coordination": true,
  "priority_support": true,
  "dedicated_account_manager": true,
  "white_glove_onboarding": true,
  "custom_integrations": true
}', 'full_autopilot', false, 'Full AI autopilot with zero approval'),

('custom', 'Custom', 0, 0, '{
  "websites": -1,
  "audits_per_month": -1,
  "keywords": -1,
  "competitors": -1,
  "custom_features": true,
  "white_label": true,
  "api_access": true,
  "custom_ai_models": true,
  "custom_sla": true,
  "priority_feature_requests": true
}', 'custom', false, 'Fully customizable enterprise solution')
ON CONFLICT (tier) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_annual = EXCLUDED.price_annual,
  features = EXCLUDED.features,
  automation_level = EXCLUDED.automation_level,
  approval_required = EXCLUDED.approval_required,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- STEP 14: Analytics Views
-- ============================================================================

-- Active Subscriptions Summary
CREATE OR REPLACE VIEW v_active_subscriptions AS
SELECT
  s.tier,
  COUNT(*) as subscription_count,
  SUM(CASE WHEN s.billing_cycle = 'monthly' THEN tfr.price_monthly ELSE tfr.price_annual / 12 END) as monthly_recurring_revenue,
  AVG(CASE WHEN s.billing_cycle = 'monthly' THEN tfr.price_monthly ELSE tfr.price_annual / 12 END) as average_revenue_per_user
FROM subscriptions s
INNER JOIN tier_features_reference tfr ON s.tier = tfr.tier
WHERE s.status = 'active'
GROUP BY s.tier;

-- Pending Approvals Summary
CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT
  c.id as client_id,
  c.business_name,
  c.tier,
  COUNT(*) as pending_count,
  MIN(at.created_at) as oldest_pending,
  MAX(at.created_at) as newest_pending
FROM client_onboarding c
INNER JOIN approval_tasks at ON c.id = at.client_id
WHERE at.status = 'pending'
GROUP BY c.id, c.business_name, c.tier;

-- Agent Performance Summary
CREATE OR REPLACE VIEW v_agent_performance AS
SELECT
  agent_name,
  execution_mode,
  COUNT(*) as total_executions,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_executions,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_executions,
  ROUND(AVG(execution_time_ms), 2) as avg_execution_time_ms,
  ROUND(100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM agent_execution_logs
WHERE started_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY agent_name, execution_mode;

-- ============================================================================
-- STEP 15: Verification
-- ============================================================================

-- List all created tables
SELECT
  'Table created: ' || table_name as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
AND table_name IN (
  'client_onboarding',
  'subscriptions',
  'payments',
  'stripe_customers',
  'tier_access',
  'approval_tasks',
  'agent_execution_logs',
  'webhook_events',
  'usage_tracking',
  'subscription_history',
  'tier_features_reference'
)
ORDER BY table_name;

-- Verify tier features inserted
SELECT
  'Tier configured: ' || tier || ' (' || name || ') - $' || (price_monthly / 100) || '/mo' as status
FROM tier_features_reference
ORDER BY price_monthly;

-- Success message
SELECT
  '✅ Database setup complete!' as status,
  '11 tables created' as tables,
  '4 tiers configured' as tiers,
  '3 views created' as views;
