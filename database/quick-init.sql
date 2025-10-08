-- ============================================================================
-- QUICK INITIALIZATION FOR CLIENT AUTOPILOT & ONBOARDING
-- ============================================================================
-- Creates only the essential tables needed for immediate functionality
-- ============================================================================

-- ============================================================================
-- 1. COMPANIES TABLE (Foundation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Australia',
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_website ON companies(website);

-- ============================================================================
-- 2. SAVED ONBOARDING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_onboarding (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_name TEXT NOT NULL,
  email TEXT NOT NULL,
  form_data TEXT NOT NULL,
  current_step INTEGER DEFAULT 0,
  last_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(business_name, email)
);

CREATE INDEX IF NOT EXISTS idx_saved_onboarding_lookup ON saved_onboarding(business_name, email);
CREATE INDEX IF NOT EXISTS idx_saved_onboarding_email ON saved_onboarding(email);

-- ============================================================================
-- 3. SUBSCRIPTION TIERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_tiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  monthly_price_usd DECIMAL(10, 2) NOT NULL,
  seo_audits_per_month INTEGER DEFAULT 0,
  blog_posts_per_month INTEGER DEFAULT 0,
  social_posts_per_month INTEGER DEFAULT 0,
  research_papers_per_month INTEGER DEFAULT 0,
  gmb_posts_per_month INTEGER DEFAULT 0,
  white_papers_per_month INTEGER DEFAULT 0,
  competitor_monitoring_frequency TEXT DEFAULT 'weekly',
  autopilot_enabled BOOLEAN DEFAULT 1,
  auto_publish_enabled BOOLEAN DEFAULT 0,
  ruler_quality_threshold INTEGER DEFAULT 85,
  priority_level INTEGER DEFAULT 1,
  max_concurrent_tasks INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate tiers
INSERT OR IGNORE INTO subscription_tiers (name, display_name, description, monthly_price_usd,
  seo_audits_per_month, blog_posts_per_month, social_posts_per_month, research_papers_per_month,
  gmb_posts_per_month, white_papers_per_month, competitor_monitoring_frequency,
  autopilot_enabled, auto_publish_enabled, ruler_quality_threshold, priority_level, max_concurrent_tasks, display_order)
VALUES
  ('starter', 'Starter', 'Perfect for small businesses starting their SEO journey', 500.00,
    2, 4, 20, 0, 8, 0, 'weekly', 1, 0, 85, 1, 2, 1),
  ('growth', 'Growth', 'Ideal for growing businesses ready to scale their online presence', 1000.00,
    4, 8, 40, 1, 16, 0, '3x_week', 1, 1, 80, 2, 3, 2),
  ('scale', 'Scale', 'For established businesses dominating their market', 2500.00,
    8, 16, 80, 2, 32, 1, 'daily', 1, 1, 75, 3, 5, 3),
  ('empire', 'Empire', 'Industry leaders building unassailable authority', 5000.00,
    16, 32, 160, 4, 64, 2, 'realtime', 1, 1, 70, 4, 10, 4);

-- ============================================================================
-- 4. CLIENT SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  portfolio_id INTEGER,
  tier_id INTEGER NOT NULL,
  tier_name TEXT NOT NULL,
  monthly_spend_usd DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'active',
  autopilot_status TEXT DEFAULT 'active',
  billing_cycle TEXT DEFAULT 'monthly',
  billing_day INTEGER DEFAULT 1,
  next_billing_date DATE,
  last_billing_date DATE,
  seo_audits_quota INTEGER,
  blog_posts_quota INTEGER,
  social_posts_quota INTEGER,
  research_papers_quota INTEGER,
  gmb_posts_quota INTEGER,
  white_papers_quota INTEGER,
  seo_audits_used INTEGER DEFAULT 0,
  blog_posts_used INTEGER DEFAULT 0,
  social_posts_used INTEGER DEFAULT 0,
  research_papers_used INTEGER DEFAULT 0,
  gmb_posts_used INTEGER DEFAULT 0,
  white_papers_used INTEGER DEFAULT 0,
  preferred_content_topics TEXT,
  target_keywords TEXT,
  competitor_urls TEXT,
  exclude_days TEXT,
  notification_email TEXT,
  weekly_report_enabled BOOLEAN DEFAULT 1,
  total_tasks_completed INTEGER DEFAULT 0,
  avg_ruler_score DECIMAL(5, 2),
  seo_score_change DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activated_at TIMESTAMP,
  paused_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (tier_id) REFERENCES subscription_tiers(id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON client_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON client_subscriptions(status) WHERE status = 'active';

-- ============================================================================
-- 5. TASK EXECUTION CALENDAR TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_execution_calendar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME DEFAULT '09:00:00',
  task_type TEXT NOT NULL,
  task_category TEXT,
  priority TEXT DEFAULT 'medium',
  task_config TEXT,
  status TEXT DEFAULT 'scheduled',
  autonomous_task_id INTEGER,
  result_summary TEXT,
  ruler_score INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  execution_started_at TIMESTAMP,
  execution_completed_at TIMESTAMP,
  FOREIGN KEY (subscription_id) REFERENCES client_subscriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calendar_subscription ON task_execution_calendar(subscription_id);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON task_execution_calendar(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_calendar_status ON task_execution_calendar(status) WHERE status IN ('scheduled', 'created');

-- ============================================================================
-- 6. SUBSCRIPTION EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT,
  triggered_by TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscription_id) REFERENCES client_subscriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_subscription ON subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON subscription_events(event_type);

-- ============================================================================
-- INITIALIZATION COMPLETE
-- ============================================================================
-- Tables Created:
--   ✓ companies (foundation)
--   ✓ saved_onboarding (save progress feature)
--   ✓ subscription_tiers (4 tiers pre-loaded)
--   ✓ client_subscriptions (autopilot management)
--   ✓ task_execution_calendar (30-day schedules)
--   ✓ subscription_events (audit trail)
-- 
-- Status: Ready for Client Autopilot System!
-- ============================================================================
