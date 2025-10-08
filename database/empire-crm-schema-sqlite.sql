-- ============================================================================
-- EMPIRE CRM - Autonomous Swarm Database Schema (SQLite Version)
-- ============================================================================
-- Purpose: Transform CRM into fully autonomous AI empire operating system
-- Showcase: Unite Group (https://www.unite-group.in) as industry leader
-- ============================================================================

-- ============================================================================
-- COMPANY PORTFOLIOS (Enhanced - The Empire)
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_portfolios (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  company_id TEXT,

  -- Basic Information
  company_name TEXT NOT NULL,
  industry TEXT,
  services TEXT, -- JSON array
  target_audience TEXT,
  brand_voice TEXT DEFAULT 'professional',

  -- Digital Presence
  website_url TEXT,
  gmb_id TEXT,
  social_accounts TEXT DEFAULT '{}', -- JSON object

  -- Audit Status
  last_full_audit TEXT,
  audit_frequency TEXT DEFAULT 'weekly',
  audit_score INTEGER,

  -- Detailed Scores
  seo_score INTEGER,
  social_score INTEGER,
  gmb_score INTEGER,
  content_quality_score INTEGER,
  brand_authority_score INTEGER,

  -- Automation Configuration
  autopilot_enabled INTEGER DEFAULT 0,
  automation_level TEXT DEFAULT 'basic',
  auto_publish INTEGER DEFAULT 0,
  requires_approval INTEGER DEFAULT 1,

  -- Research & Expertise Profile
  expertise_areas TEXT, -- JSON array
  content_topics TEXT, -- JSON array
  competitive_advantages TEXT, -- JSON array
  target_keywords TEXT, -- JSON array

  -- Competitive Intelligence
  competitors TEXT DEFAULT '[]', -- JSON array
  market_position TEXT,

  -- Content Strategy
  content_frequency TEXT DEFAULT '{}', -- JSON object
  content_quality_threshold INTEGER DEFAULT 85,

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portfolios_company_id ON company_portfolios(company_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_autopilot ON company_portfolios(autopilot_enabled) WHERE autopilot_enabled = 1;

-- ============================================================================
-- PORTFOLIO AUDITS (Complete Multi-Channel Audit History)
-- ============================================================================

CREATE TABLE IF NOT EXISTS portfolio_audits (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  portfolio_id TEXT NOT NULL,
  audit_type TEXT NOT NULL,

  -- Overall Scores
  overall_score INTEGER,
  seo_score INTEGER,
  social_score INTEGER,
  gmb_score INTEGER,
  content_quality_score INTEGER,
  brand_authority_score INTEGER,

  -- Detailed Findings (JSON)
  findings TEXT DEFAULT '{}',
  recommendations TEXT DEFAULT '[]',
  opportunities TEXT DEFAULT '[]',
  auto_actions_taken TEXT DEFAULT '[]',

  manual_review_needed INTEGER DEFAULT 0,
  manual_review_reason TEXT,

  -- Performance Metrics
  audit_duration_seconds INTEGER,
  data_sources_used TEXT, -- JSON array

  -- Metadata
  started_at TEXT,
  completed_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (portfolio_id) REFERENCES company_portfolios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_audits_portfolio_id ON portfolio_audits(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_audits_completed ON portfolio_audits(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audits_review_needed ON portfolio_audits(manual_review_needed) WHERE manual_review_needed = 1;

-- ============================================================================
-- RESEARCH CACHE (Deep Research Intelligence)
-- ============================================================================

CREATE TABLE IF NOT EXISTS research_cache (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  portfolio_id TEXT,

  -- Research Query
  topic TEXT NOT NULL,
  industry TEXT,
  query_hash TEXT UNIQUE,

  -- Research Results (JSON)
  sources TEXT, -- JSON array of source objects
  key_findings TEXT, -- JSON array
  data_points TEXT, -- JSON object
  statistics TEXT, -- JSON object

  -- Generated Content
  white_paper_summary TEXT,
  white_paper_full TEXT,
  citations_formatted TEXT,

  -- Quality Metrics
  originality_score INTEGER,
  credibility_score INTEGER,
  technical_depth INTEGER,

  -- Usage Tracking
  citation_count INTEGER DEFAULT 0,
  used_in_content_ids TEXT, -- JSON array of UUIDs

  -- Freshness
  research_date TEXT DEFAULT (datetime('now')),
  expires_at TEXT,
  last_verified TEXT,
  is_current INTEGER DEFAULT 1,

  FOREIGN KEY (portfolio_id) REFERENCES company_portfolios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_research_portfolio ON research_cache(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_research_topic ON research_cache(topic);
CREATE INDEX IF NOT EXISTS idx_research_current ON research_cache(is_current) WHERE is_current = 1;
CREATE INDEX IF NOT EXISTS idx_research_expires ON research_cache(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- AUTONOMOUS ACTIONS LOG (Swarm Activity Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS autonomous_actions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  portfolio_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,

  -- Action Details
  action_type TEXT NOT NULL,
  action_category TEXT,
  action_description TEXT NOT NULL,
  action_data TEXT DEFAULT '{}', -- JSON

  -- Target
  target_url TEXT,
  target_platform TEXT,

  -- Execution Status
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Results (JSON)
  result TEXT DEFAULT '{}',
  impact_metrics TEXT DEFAULT '{}',

  -- RULER Evaluation
  ruler_score INTEGER,
  ruler_feedback TEXT,
  ruler_strengths TEXT, -- JSON array
  ruler_improvements TEXT, -- JSON array
  ruler_evaluated_at TEXT,

  -- Approval Workflow
  requires_approval INTEGER DEFAULT 0,
  approved_by TEXT,
  approved_at TEXT,
  approval_notes TEXT,

  -- Timing
  scheduled_for TEXT,
  started_at TEXT,
  completed_at TEXT,
  executed_at TEXT DEFAULT (datetime('now')),

  -- Cost Tracking
  api_calls_made INTEGER DEFAULT 0,
  estimated_cost_usd REAL DEFAULT 0.0,

  FOREIGN KEY (portfolio_id) REFERENCES company_portfolios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_actions_portfolio ON autonomous_actions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON autonomous_actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_agent ON autonomous_actions(agent_name);
CREATE INDEX IF NOT EXISTS idx_actions_scheduled ON autonomous_actions(scheduled_for) WHERE status = 'pending';

-- ============================================================================
-- INDUSTRY INTELLIGENCE (Original Research Database)
-- ============================================================================

CREATE TABLE IF NOT EXISTS industry_intelligence (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),

  -- Topic Classification
  industry TEXT NOT NULL,
  category TEXT NOT NULL,
  topic TEXT NOT NULL,
  tags TEXT, -- JSON array

  -- Intelligence Content
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_content TEXT,
  key_insights TEXT, -- JSON array

  -- Data Sources (JSON array)
  sources TEXT NOT NULL,
  citations TEXT, -- JSON array

  -- Quality & Impact Metrics
  credibility_score INTEGER,
  technical_level INTEGER,
  business_impact TEXT,
  competitive_advantage_score INTEGER,

  -- Usage & Engagement
  usage_count INTEGER DEFAULT 0,
  content_pieces_used_in TEXT, -- JSON array of UUIDs
  external_citations INTEGER DEFAULT 0,

  -- Metadata
  discovered_at TEXT DEFAULT (datetime('now')),
  last_verified TEXT,
  verified_by TEXT,
  expires_at TEXT,
  is_evergreen INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_intelligence_industry ON industry_intelligence(industry);
CREATE INDEX IF NOT EXISTS idx_intelligence_category ON industry_intelligence(category);
CREATE INDEX IF NOT EXISTS idx_intelligence_credibility ON industry_intelligence(credibility_score DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_impact ON industry_intelligence(business_impact);

-- ============================================================================
-- CONTENT EMPIRE (Generated Content Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_empire (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  portfolio_id TEXT NOT NULL,

  -- Content Classification
  content_type TEXT NOT NULL,
  content_category TEXT,

  -- Content Details
  title TEXT,
  content TEXT NOT NULL,
  summary TEXT,

  -- SEO Metadata
  meta_title TEXT,
  meta_description TEXT,
  slug TEXT,
  keywords TEXT, -- JSON array

  -- Research Integration
  research_ids TEXT, -- JSON array of UUIDs
  intelligence_ids TEXT, -- JSON array of UUIDs
  citations TEXT, -- JSON array

  -- Quality Metrics
  originality_score INTEGER,
  seo_score INTEGER,
  readability_score INTEGER,
  technical_depth INTEGER,
  overall_quality_score INTEGER,

  -- Publishing Status
  status TEXT DEFAULT 'draft',
  published_to TEXT DEFAULT '{}', -- JSON
  scheduled_publish_at TEXT,
  published_at TEXT,

  -- Performance Metrics
  views INTEGER DEFAULT 0,
  engagement_count INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ranking_improvements TEXT DEFAULT '{}', -- JSON

  -- RULER Evaluation
  ruler_score INTEGER,
  ruler_feedback TEXT,
  ruler_evaluated_at TEXT,

  -- Version Control
  version INTEGER DEFAULT 1,
  previous_version_id TEXT,

  -- Metadata
  created_by TEXT DEFAULT 'ContentGenerationAgent',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (portfolio_id) REFERENCES company_portfolios(id) ON DELETE CASCADE,
  FOREIGN KEY (previous_version_id) REFERENCES content_empire(id)
);

CREATE INDEX IF NOT EXISTS idx_content_portfolio ON content_empire(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_content_type ON content_empire(content_type);
CREATE INDEX IF NOT EXISTS idx_content_status ON content_empire(status);
CREATE INDEX IF NOT EXISTS idx_content_published ON content_empire(published_at DESC) WHERE published_at IS NOT NULL;

-- ============================================================================
-- SWARM COORDINATION (Agent Orchestration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS swarm_coordination (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  portfolio_id TEXT NOT NULL,

  -- Swarm Session
  session_id TEXT DEFAULT (lower(hex(randomblob(16)))),
  orchestrator TEXT DEFAULT 'OverseerAgent',

  -- Coordination Type
  coordination_type TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',

  -- Agent Deployment (JSON array)
  agents_deployed TEXT NOT NULL,
  results TEXT DEFAULT '{}',
  combined_score INTEGER,

  -- Status
  status TEXT DEFAULT 'initializing',
  completion_percentage INTEGER DEFAULT 0,

  -- Timing
  started_at TEXT DEFAULT (datetime('now')),
  estimated_completion TEXT,
  completed_at TEXT,

  FOREIGN KEY (portfolio_id) REFERENCES company_portfolios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_swarm_portfolio ON swarm_coordination(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_swarm_status ON swarm_coordination(status) WHERE status IN ('initializing', 'running');
CREATE INDEX IF NOT EXISTS idx_swarm_session ON swarm_coordination(session_id);

-- ============================================================================
-- COMPETITIVE INTELLIGENCE (Competitor Monitoring)
-- ============================================================================

CREATE TABLE IF NOT EXISTS competitive_intelligence (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  portfolio_id TEXT NOT NULL,

  -- Competitor Info
  competitor_name TEXT NOT NULL,
  competitor_url TEXT NOT NULL,
  competitor_domain TEXT,

  -- Monitoring Metrics
  seo_score INTEGER,
  content_output_monthly INTEGER,
  social_engagement_avg INTEGER,
  estimated_traffic INTEGER,
  estimated_revenue REAL,

  -- Content Analysis (JSON arrays)
  content_topics TEXT,
  keyword_overlap TEXT,
  keyword_gaps TEXT,
  content_gaps TEXT,

  -- Competitive Position
  relative_position TEXT,
  threat_level TEXT,
  identified_opportunities TEXT DEFAULT '[]', -- JSON array

  -- Monitoring Schedule
  last_analyzed TEXT DEFAULT (datetime('now')),
  next_analysis TEXT,
  analysis_frequency TEXT DEFAULT 'weekly',

  FOREIGN KEY (portfolio_id) REFERENCES company_portfolios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_competitive_portfolio ON competitive_intelligence(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_competitive_next_analysis ON competitive_intelligence(next_analysis) WHERE next_analysis IS NOT NULL;

-- ============================================================================
-- EMPIRE METRICS (Dashboard Aggregations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS empire_metrics (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  portfolio_id TEXT NOT NULL,

  -- Time Period
  metric_date TEXT NOT NULL,
  period_type TEXT DEFAULT 'daily',

  -- Performance Metrics
  overall_score INTEGER,
  seo_score INTEGER,
  social_score INTEGER,
  content_score INTEGER,
  authority_score INTEGER,

  -- Volume Metrics
  content_published INTEGER DEFAULT 0,
  actions_executed INTEGER DEFAULT 0,
  research_conducted INTEGER DEFAULT 0,

  -- Impact Metrics
  ranking_improvements INTEGER DEFAULT 0,
  traffic_change_percent REAL,
  engagement_total INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,

  -- Competitive Metrics
  share_of_voice REAL,
  market_position INTEGER,

  -- RULER Learning
  avg_ruler_score REAL,
  total_optimizations INTEGER DEFAULT 0,

  -- Metadata
  calculated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (portfolio_id) REFERENCES company_portfolios(id) ON DELETE CASCADE,
  UNIQUE(portfolio_id, metric_date, period_type)
);

CREATE INDEX IF NOT EXISTS idx_metrics_portfolio_date ON empire_metrics(portfolio_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_period ON empire_metrics(period_type);

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
-- Total Tables: 10
-- Total Indexes: 30+
-- Status: Ready for Empire Mode (SQLite Compatible)
-- ============================================================================
