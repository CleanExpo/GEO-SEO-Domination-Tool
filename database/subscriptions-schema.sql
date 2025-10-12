-- ============================================================================
-- Subscriptions & Tier Management Schema
-- ============================================================================
-- Purpose: Manage Stripe subscriptions, payments, tier access, and approval workflows
-- Supports: Good ($299), Better ($449), Best ($599), Custom tiers
-- Date: 2025-10-12

-- ============================================================================
-- Subscriptions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
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

CREATE INDEX idx_subscriptions_client ON subscriptions(client_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);

-- ============================================================================
-- Payments Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  subscription_id TEXT REFERENCES subscriptions(id) ON DELETE SET NULL,
  client_id TEXT NOT NULL REFERENCES client_onboarding(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'AUD',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded', 'canceled')),
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  stripe_invoice_id TEXT,
  payment_method TEXT, -- card, bank_transfer, etc.
  failure_reason TEXT,
  paid_at TIMESTAMP,
  refunded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_client ON payments(client_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);

-- ============================================================================
-- Stripe Customer Mapping
-- ============================================================================
CREATE TABLE IF NOT EXISTS stripe_customers (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE REFERENCES client_onboarding(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  default_payment_method TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stripe_customers_client ON stripe_customers(client_id);
CREATE INDEX idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);

-- ============================================================================
-- Tier Access Control
-- ============================================================================
CREATE TABLE IF NOT EXISTS tier_access (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE REFERENCES client_onboarding(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('good', 'better', 'best', 'custom')),
  features JSONB NOT NULL, -- { "websites": 1, "audits_per_month": 1, "keywords": 50, "competitors": 2 }
  automation_level TEXT NOT NULL CHECK (automation_level IN ('manual', 'semi_autonomous', 'full_autopilot', 'custom')),
  approval_required BOOLEAN DEFAULT TRUE,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP -- NULL for active subscriptions, set on cancellation
);

CREATE INDEX idx_tier_access_client ON tier_access(client_id);
CREATE INDEX idx_tier_access_tier ON tier_access(tier);
CREATE INDEX idx_tier_access_expires ON tier_access(expires_at);

-- ============================================================================
-- Approval Tasks (for Good & Better tiers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS approval_tasks (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES client_onboarding(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL, -- 'SEO Audit Agent', 'Content Generator Agent'
  task_type TEXT NOT NULL, -- 'seo_audit', 'content_publish', 'backlink_analysis'
  task_data JSONB NOT NULL, -- Task details, recommendations, content draft
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'executing')),
  approval_required_by TIMESTAMP, -- Deadline for approval
  approved_by TEXT, -- User who approved
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  rejected_reason TEXT,
  execution_started_at TIMESTAMP,
  execution_completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_approval_tasks_client ON approval_tasks(client_id);
CREATE INDEX idx_approval_tasks_status ON approval_tasks(status);
CREATE INDEX idx_approval_tasks_client_status ON approval_tasks(client_id, status);
CREATE INDEX idx_approval_tasks_approval_required_by ON approval_tasks(approval_required_by);

-- ============================================================================
-- Agent Execution Logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_execution_logs (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES client_onboarding(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL, -- 'SEO Audit Agent', 'Keyword Tracker Agent'
  agent_id TEXT NOT NULL, -- 'seo-audit-agent', 'keyword-tracker-agent'
  task_type TEXT NOT NULL,
  execution_mode TEXT NOT NULL CHECK (execution_mode IN ('manual', 'semi_autonomous', 'full_autopilot')),
  approval_required BOOLEAN DEFAULT FALSE,
  approval_task_id TEXT REFERENCES approval_tasks(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'canceled')),
  error_message TEXT,
  error_stack TEXT,
  execution_time_ms INTEGER,
  results JSONB, -- Execution results, recommendations, data
  metadata JSONB, -- Additional context (trigger type, schedule, etc.)
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_logs_client ON agent_execution_logs(client_id);
CREATE INDEX idx_agent_logs_status ON agent_execution_logs(status);
CREATE INDEX idx_agent_logs_client_status ON agent_execution_logs(client_id, status);
CREATE INDEX idx_agent_logs_agent_id ON agent_execution_logs(agent_id);
CREATE INDEX idx_agent_logs_completed ON agent_execution_logs(completed_at);

-- ============================================================================
-- Webhook Events (for Stripe webhooks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'checkout.session.completed', 'invoice.paid', 'customer.subscription.updated'
  stripe_event_id TEXT UNIQUE NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_events_processed ON webhook_events(processed, created_at);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);

-- ============================================================================
-- Usage Tracking (for tier limits)
-- ============================================================================
CREATE TABLE IF NOT EXISTS usage_tracking (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES client_onboarding(id) ON DELETE CASCADE,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  metric_type TEXT NOT NULL, -- 'websites', 'keywords', 'audits', 'api_calls'
  metric_value INTEGER NOT NULL DEFAULT 0,
  limit_value INTEGER, -- NULL for unlimited
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(client_id, period_start, metric_type)
);

CREATE INDEX idx_usage_tracking_client ON usage_tracking(client_id);
CREATE INDEX idx_usage_tracking_period ON usage_tracking(period_start, period_end);
CREATE INDEX idx_usage_tracking_client_metric ON usage_tracking(client_id, metric_type);

-- ============================================================================
-- Subscription History (audit trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_history (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES client_onboarding(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'created', 'upgraded', 'downgraded', 'canceled', 'reactivated', 'expired'
  old_tier TEXT,
  new_tier TEXT,
  old_status TEXT,
  new_status TEXT,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscription_history_subscription ON subscription_history(subscription_id);
CREATE INDEX idx_subscription_history_client ON subscription_history(client_id);
CREATE INDEX idx_subscription_history_event ON subscription_history(event_type);

-- ============================================================================
-- Tier Features Definition (Static Reference)
-- ============================================================================
-- This table stores the canonical tier features for reference
-- Actual enforcement uses tier_access.features JSONB
CREATE TABLE IF NOT EXISTS tier_features_reference (
  tier TEXT PRIMARY KEY CHECK (tier IN ('good', 'better', 'best', 'custom')),
  name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL, -- In cents (AUD)
  price_annual INTEGER NOT NULL,
  features JSONB NOT NULL,
  automation_level TEXT NOT NULL,
  approval_required BOOLEAN NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert tier definitions (PostgreSQL upsert syntax)
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
-- Views for Analytics
-- ============================================================================

-- Active Subscriptions Summary
CREATE VIEW IF NOT EXISTS v_active_subscriptions AS
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
CREATE VIEW IF NOT EXISTS v_pending_approvals AS
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
CREATE VIEW IF NOT EXISTS v_agent_performance AS
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
-- Note: PostgreSQL Triggers
-- ============================================================================
-- PostgreSQL triggers require stored procedure functions which are not included here
-- to maintain compatibility with both SQLite (local dev) and PostgreSQL (production).
--
-- For production PostgreSQL, you can create these triggers:
--
-- 1. Auto-update updated_at timestamp:
--    CREATE OR REPLACE FUNCTION update_updated_at_column()
--    RETURNS TRIGGER AS $$
--    BEGIN
--      NEW.updated_at = CURRENT_TIMESTAMP;
--      RETURN NEW;
--    END;
--    $$ LANGUAGE plpgsql;
--
--    CREATE TRIGGER trg_subscriptions_updated_at
--    BEFORE UPDATE ON subscriptions
--    FOR EACH ROW
--    EXECUTE FUNCTION update_updated_at_column();
--
-- 2. Log subscription history:
--    CREATE OR REPLACE FUNCTION log_subscription_history()
--    RETURNS TRIGGER AS $$
--    BEGIN
--      IF (OLD.tier IS DISTINCT FROM NEW.tier OR OLD.status IS DISTINCT FROM NEW.status) THEN
--        INSERT INTO subscription_history (
--          id, subscription_id, client_id, event_type, old_tier, new_tier, old_status, new_status
--        ) VALUES (
--          gen_random_uuid()::text,
--          NEW.id,
--          NEW.client_id,
--          CASE
--            WHEN OLD.tier != NEW.tier AND NEW.tier > OLD.tier THEN 'upgraded'
--            WHEN OLD.tier != NEW.tier AND NEW.tier < OLD.tier THEN 'downgraded'
--            WHEN OLD.status = 'active' AND NEW.status = 'canceled' THEN 'canceled'
--            WHEN OLD.status = 'canceled' AND NEW.status = 'active' THEN 'reactivated'
--            ELSE 'updated'
--          END,
--          OLD.tier,
--          NEW.tier,
--          OLD.status,
--          NEW.status
--        );
--      END IF;
--      RETURN NEW;
--    END;
--    $$ LANGUAGE plpgsql;
--
--    CREATE TRIGGER trg_subscription_history
--    AFTER UPDATE ON subscriptions
--    FOR EACH ROW
--    EXECUTE FUNCTION log_subscription_history();
--
-- 3. Cancel tier access:
--    CREATE OR REPLACE FUNCTION cancel_tier_access()
--    RETURNS TRIGGER AS $$
--    BEGIN
--      IF OLD.status != 'canceled' AND NEW.status = 'canceled' THEN
--        UPDATE tier_access
--        SET expires_at = NEW.current_period_end
--        WHERE client_id = NEW.client_id;
--      END IF;
--      RETURN NEW;
--    END;
--    $$ LANGUAGE plpgsql;
--
--    CREATE TRIGGER trg_subscription_canceled
--    AFTER UPDATE ON subscriptions
--    FOR EACH ROW
--    EXECUTE FUNCTION cancel_tier_access();

-- ============================================================================
-- Functions / Helpers (via SQL comments for implementation)
-- ============================================================================

-- To implement in TypeScript:
-- - getTierFeatures(tier: string): TierFeatures
-- - checkTierAccess(clientId: string, feature: string): boolean
-- - updateUsageMetric(clientId: string, metric: string, value: number): void
-- - isFeatureLimitReached(clientId: string, metric: string): boolean
-- - getApprovalTasks(clientId: string, status?: string): ApprovalTask[]
-- - createApprovalTask(clientId: string, agentName: string, taskData: any): string
-- - approveTask(approvalTaskId: string, approvedBy: string): void
-- - rejectTask(approvalTaskId: string, reason: string): void

-- ============================================================================
-- Sample Queries
-- ============================================================================

-- Get client's current tier and limits
-- SELECT c.id, c.business_name, t.tier, t.features, t.automation_level
-- FROM client_onboarding c
-- INNER JOIN tier_access t ON c.id = t.client_id
-- WHERE c.id = ?;

-- Check if client is approaching keyword limit
-- SELECT
--   c.business_name,
--   json_extract(t.features, '$.keywords') as keyword_limit,
--   u.metric_value as keywords_used,
--   ROUND(100.0 * u.metric_value / json_extract(t.features, '$.keywords'), 2) as usage_percent
-- FROM client_onboarding c
-- INNER JOIN tier_access t ON c.id = t.client_id
-- INNER JOIN usage_tracking u ON c.id = u.client_id
-- WHERE u.metric_type = 'keywords' AND usage_percent > 80;

-- Get all pending approval tasks with client info
-- SELECT
--   at.id,
--   at.task_type,
--   at.created_at,
--   at.approval_required_by,
--   c.business_name,
--   c.email
-- FROM approval_tasks at
-- INNER JOIN client_onboarding c ON at.client_id = c.id
-- WHERE at.status = 'pending'
-- ORDER BY at.approval_required_by ASC;

-- Monthly revenue breakdown by tier
-- SELECT * FROM v_active_subscriptions;

-- Agent performance in last 30 days
-- SELECT * FROM v_agent_performance ORDER BY success_rate DESC;
