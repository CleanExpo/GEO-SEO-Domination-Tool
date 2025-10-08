-- ============================================================================
-- EMPIRE CRM - Autonomous Swarm Database Schema
-- ============================================================================
-- Purpose: Transform CRM into fully autonomous AI empire operating system
-- Showcase: Unite Group (https://www.unite-group.in) as industry leader
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- COMPANY PORTFOLIOS (Enhanced - The Empire)
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Basic Information
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100), -- 'disaster_recovery', 'construction', 'healthcare', etc.
  services TEXT[], -- Array of services provided
  target_audience TEXT,
  brand_voice VARCHAR(50) DEFAULT 'professional', -- 'professional', 'friendly', 'authoritative', etc.

  -- Digital Presence
  website_url VARCHAR(500),
  gmb_id VARCHAR(100), -- Google My Business ID
  social_accounts JSONB DEFAULT '{}'::jsonb, -- {platform: username}
  -- Example: {"linkedin": "unite-group", "facebook": "unitegroup", "instagram": "unite_group"}

  -- Audit Status
  last_full_audit TIMESTAMP,
  audit_frequency VARCHAR(20) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
  audit_score INTEGER CHECK (audit_score BETWEEN 0 AND 100),

  -- Detailed Scores
  seo_score INTEGER CHECK (seo_score BETWEEN 0 AND 100),
  social_score INTEGER CHECK (social_score BETWEEN 0 AND 100),
  gmb_score INTEGER CHECK (gmb_score BETWEEN 0 AND 100),
  content_quality_score INTEGER CHECK (content_quality_score BETWEEN 0 AND 100),
  brand_authority_score INTEGER CHECK (brand_authority_score BETWEEN 0 AND 100),

  -- Automation Configuration
  autopilot_enabled BOOLEAN DEFAULT false,
  automation_level VARCHAR(20) DEFAULT 'basic', -- 'basic', 'advanced', 'empire'
  auto_publish BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT true,

  -- Research & Expertise Profile
  expertise_areas TEXT[], -- Topics to research and dominate
  content_topics TEXT[], -- Content themes
  competitive_advantages TEXT[],
  target_keywords TEXT[], -- Primary keywords to rank for

  -- Competitive Intelligence
  competitors JSONB DEFAULT '[]'::jsonb, -- [{"name": "...", "url": "...", "score": 85}]
  market_position VARCHAR(50), -- 'leader', 'challenger', 'follower', 'niche'

  -- Content Strategy
  content_frequency JSONB DEFAULT '{}'::jsonb, -- {"blog": "2/week", "social": "2/day", "whitepaper": "1/month"}
  content_quality_threshold INTEGER DEFAULT 85, -- Minimum quality score to publish

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(company_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_portfolios_company_id ON company_portfolios(company_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_autopilot ON company_portfolios(autopilot_enabled) WHERE autopilot_enabled = true;

-- ============================================================================
-- PORTFOLIO AUDITS (Complete Multi-Channel Audit History)
-- ============================================================================

CREATE TABLE IF NOT EXISTS portfolio_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES company_portfolios(id) ON DELETE CASCADE,
  audit_type VARCHAR(50) NOT NULL, -- 'initial', 'scheduled', 'triggered', 'competitive'

  -- Overall Scores
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  seo_score INTEGER CHECK (seo_score BETWEEN 0 AND 100),
  social_score INTEGER CHECK (social_score BETWEEN 0 AND 100),
  gmb_score INTEGER CHECK (gmb_score BETWEEN 0 AND 100),
  content_quality_score INTEGER CHECK (content_quality_score BETWEEN 0 AND 100),
  brand_authority_score INTEGER CHECK (brand_authority_score BETWEEN 0 AND 100),

  -- Detailed Findings (JSON structure)
  findings JSONB DEFAULT '{}'::jsonb,
  -- Example: {
  --   "seo": {"technical": [...], "onPage": [...], "offPage": [...]},
  --   "social": {"engagement": [...], "growth": [...], "content": [...]},
  --   "gmb": {"completeness": [...], "reviews": [...], "posts": [...]}
  -- }

  -- Recommendations (Prioritized Actions)
  recommendations JSONB DEFAULT '[]'::jsonb,
  -- Example: [
  --   {"priority": "critical", "category": "seo", "action": "Fix broken links", "impact": 85},
  --   {"priority": "high", "category": "content", "action": "Improve originality", "impact": 72}
  -- ]

  -- Opportunities Identified
  opportunities JSONB DEFAULT '[]'::jsonb,
  -- Example: [
  --   {"type": "keyword", "opportunity": "Rank for 'fire resistant materials'", "difficulty": 45, "value": 890},
  --   {"type": "content", "opportunity": "Create white paper on VOC testing", "value": 750}
  -- ]

  -- Actions Taken (Autonomous)
  auto_actions_taken JSONB DEFAULT '[]'::jsonb,
  manual_review_needed BOOLEAN DEFAULT false,
  manual_review_reason TEXT,

  -- Performance Metrics
  audit_duration_seconds INTEGER,
  data_sources_used TEXT[], -- Which APIs/tools were used

  -- Metadata
  started_at TIMESTAMP,
  completed_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CHECK (completed_at >= started_at)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audits_portfolio_id ON portfolio_audits(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_audits_completed ON portfolio_audits(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audits_review_needed ON portfolio_audits(manual_review_needed) WHERE manual_review_needed = true;

-- ============================================================================
-- RESEARCH CACHE (Deep Research Intelligence)
-- ============================================================================

CREATE TABLE IF NOT EXISTS research_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES company_portfolios(id) ON DELETE CASCADE,

  -- Research Query
  topic VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  query_hash VARCHAR(64) UNIQUE, -- MD5 hash of full query parameters for deduplication

  -- Research Results
  sources JSONB[], -- Array of source objects
  -- Example: [
  --   {"url": "...", "title": "...", "credibility": 92, "type": "scientific_paper", "date": "2024-09-15"},
  --   {"url": "...", "title": "...", "credibility": 88, "type": "regulatory_doc", "date": "2024-08-01"}
  -- ]

  key_findings TEXT[], -- Bullet points of novel insights
  data_points JSONB, -- Structured data extracted
  statistics JSONB, -- Numerical data for citations

  -- Generated Content
  white_paper_summary TEXT,
  white_paper_full TEXT,
  citations_formatted TEXT, -- APA/MLA formatted citations

  -- Quality Metrics
  originality_score INTEGER CHECK (originality_score BETWEEN 0 AND 100), -- How novel vs LLM training data
  credibility_score INTEGER CHECK (credibility_score BETWEEN 0 AND 100), -- Source quality average
  technical_depth INTEGER CHECK (technical_depth BETWEEN 1 AND 5), -- 1=consumer, 5=PhD level

  -- Usage Tracking
  citation_count INTEGER DEFAULT 0,
  used_in_content_ids UUID[], -- Track which content pieces used this research

  -- Freshness
  research_date TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Refresh after expiration
  last_verified TIMESTAMP,
  is_current BOOLEAN DEFAULT true,

  UNIQUE(query_hash)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_research_portfolio ON research_cache(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_research_topic ON research_cache(topic);
CREATE INDEX IF NOT EXISTS idx_research_current ON research_cache(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_research_expires ON research_cache(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- AUTONOMOUS ACTIONS LOG (Swarm Activity Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS autonomous_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES company_portfolios(id) ON DELETE CASCADE,
  agent_name VARCHAR(100) NOT NULL, -- 'SEOAuditAgent', 'ContentGenerationAgent', etc.

  -- Action Details
  action_type VARCHAR(50) NOT NULL, -- 'content_publish', 'seo_optimize', 'social_post', 'research', etc.
  action_category VARCHAR(50), -- 'seo', 'social', 'content', 'research', 'monitoring'
  action_description TEXT NOT NULL,
  action_data JSONB DEFAULT '{}'::jsonb, -- Full action parameters

  -- Target
  target_url VARCHAR(500),
  target_platform VARCHAR(50), -- 'website', 'linkedin', 'facebook', etc.

  -- Execution Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'executing', 'completed', 'failed', 'cancelled'
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Results
  result JSONB DEFAULT '{}'::jsonb,
  impact_metrics JSONB DEFAULT '{}'::jsonb,
  -- Example: {"ranking_change": +3, "traffic_change": "+12%", "engagement": 847}

  -- RULER Evaluation (After Action Impact)
  ruler_score INTEGER CHECK (ruler_score BETWEEN 0 AND 100),
  ruler_feedback TEXT,
  ruler_strengths TEXT[],
  ruler_improvements TEXT[],
  ruler_evaluated_at TIMESTAMP,

  -- Approval Workflow (if autopilot disabled)
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID, -- User ID
  approved_at TIMESTAMP,
  approval_notes TEXT,

  -- Timing
  scheduled_for TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  executed_at TIMESTAMP DEFAULT NOW(),

  -- Cost Tracking
  api_calls_made INTEGER DEFAULT 0,
  estimated_cost_usd DECIMAL(10, 4) DEFAULT 0.0000
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_actions_portfolio ON autonomous_actions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON autonomous_actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_agent ON autonomous_actions(agent_name);
CREATE INDEX IF NOT EXISTS idx_actions_scheduled ON autonomous_actions(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_actions_approval ON autonomous_actions(requires_approval) WHERE requires_approval = true AND approved_at IS NULL;

-- ============================================================================
-- INDUSTRY INTELLIGENCE (Original Research Database)
-- ============================================================================

CREATE TABLE IF NOT EXISTS industry_intelligence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Topic Classification
  industry VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'materials', 'safety', 'regulations', 'technology', 'methods'
  topic VARCHAR(255) NOT NULL,
  tags TEXT[], -- Searchable tags

  -- Intelligence Content
  title VARCHAR(500) NOT NULL,
  summary TEXT NOT NULL,
  full_content TEXT,
  key_insights TEXT[],

  -- Data Sources (Credible Only)
  sources JSONB[] NOT NULL,
  -- Example: [
  --   {"type": "scientific_paper", "title": "...", "authors": [...], "journal": "...", "year": 2024, "url": "...", "doi": "..."},
  --   {"type": "regulatory", "title": "...", "agency": "EPA", "document_id": "...", "year": 2024, "url": "..."},
  --   {"type": "industry_report", "title": "...", "publisher": "...", "year": 2024, "url": "..."}
  -- ]

  citations TEXT[], -- Formatted citations for white papers

  -- Quality & Impact Metrics
  credibility_score INTEGER CHECK (credibility_score BETWEEN 0 AND 100),
  technical_level INTEGER CHECK (technical_level BETWEEN 1 AND 5), -- 1=consumer, 5=PhD
  business_impact VARCHAR(50), -- 'critical', 'high', 'medium', 'low'
  competitive_advantage_score INTEGER CHECK (competitive_advantage_score BETWEEN 0 AND 100),

  -- Usage & Engagement
  usage_count INTEGER DEFAULT 0,
  content_pieces_used_in UUID[], -- Array of content IDs
  external_citations INTEGER DEFAULT 0, -- How many times others cited our content

  -- Metadata
  discovered_at TIMESTAMP DEFAULT NOW(),
  last_verified TIMESTAMP,
  verified_by VARCHAR(100), -- Agent name
  expires_at TIMESTAMP,
  is_evergreen BOOLEAN DEFAULT false,

  -- Full-text search
  search_vector tsvector
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_intelligence_industry ON industry_intelligence(industry);
CREATE INDEX IF NOT EXISTS idx_intelligence_category ON industry_intelligence(category);
CREATE INDEX IF NOT EXISTS idx_intelligence_credibility ON industry_intelligence(credibility_score DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_impact ON industry_intelligence(business_impact);
CREATE INDEX IF NOT EXISTS idx_intelligence_search ON industry_intelligence USING gin(search_vector);

-- Full-text search trigger
CREATE OR REPLACE FUNCTION intelligence_search_trigger() RETURNS trigger AS $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.key_insights, ' '), '')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.tags, ' '), '')), 'D');
  return new;
end
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvector_update_intelligence BEFORE INSERT OR UPDATE
  ON industry_intelligence FOR EACH ROW EXECUTE FUNCTION intelligence_search_trigger();

-- ============================================================================
-- CONTENT EMPIRE (Generated Content Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_empire (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES company_portfolios(id) ON DELETE CASCADE,

  -- Content Classification
  content_type VARCHAR(50) NOT NULL, -- 'white_paper', 'blog_article', 'social_post', 'gmb_post', 'email', etc.
  content_category VARCHAR(100), -- 'technical', 'educational', 'promotional', 'news'

  -- Content Details
  title VARCHAR(500),
  content TEXT NOT NULL,
  summary TEXT,

  -- SEO Metadata
  meta_title VARCHAR(60),
  meta_description VARCHAR(160),
  slug VARCHAR(255),
  keywords TEXT[],

  -- Research Integration
  research_ids UUID[], -- Links to research_cache
  intelligence_ids UUID[], -- Links to industry_intelligence
  citations TEXT[],

  -- Quality Metrics
  originality_score INTEGER CHECK (originality_score BETWEEN 0 AND 100),
  seo_score INTEGER CHECK (seo_score BETWEEN 0 AND 100),
  readability_score INTEGER CHECK (readability_score BETWEEN 0 AND 100),
  technical_depth INTEGER CHECK (technical_depth BETWEEN 1 AND 5),
  overall_quality_score INTEGER CHECK (overall_quality_score BETWEEN 0 AND 100),

  -- Publishing Status
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'scheduled', 'published', 'archived'
  published_to JSONB DEFAULT '{}'::jsonb, -- {"website": true, "linkedin": true, "facebook": false}
  scheduled_publish_at TIMESTAMP,
  published_at TIMESTAMP,

  -- Performance Metrics (Updated Post-Publish)
  views INTEGER DEFAULT 0,
  engagement_count INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ranking_improvements JSONB DEFAULT '{}'::jsonb, -- {"keyword1": +3, "keyword2": +7}

  -- RULER Evaluation
  ruler_score INTEGER CHECK (ruler_score BETWEEN 0 AND 100),
  ruler_feedback TEXT,
  ruler_evaluated_at TIMESTAMP,

  -- Version Control
  version INTEGER DEFAULT 1,
  previous_version_id UUID REFERENCES content_empire(id),

  -- Metadata
  created_by VARCHAR(100) DEFAULT 'ContentGenerationAgent',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_portfolio ON content_empire(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_content_type ON content_empire(content_type);
CREATE INDEX IF NOT EXISTS idx_content_status ON content_empire(status);
CREATE INDEX IF NOT EXISTS idx_content_published ON content_empire(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_scheduled ON content_empire(scheduled_publish_at) WHERE status = 'scheduled';

-- ============================================================================
-- SWARM COORDINATION (Agent Orchestration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS swarm_coordination (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES company_portfolios(id) ON DELETE CASCADE,

  -- Swarm Session
  session_id UUID DEFAULT uuid_generate_v4(),
  orchestrator VARCHAR(100) DEFAULT 'OverseerAgent',

  -- Coordination Type
  coordination_type VARCHAR(50) NOT NULL, -- 'audit', 'research', 'content_generation', 'optimization', 'monitoring'
  priority VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'

  -- Agent Deployment
  agents_deployed JSONB[] NOT NULL,
  -- Example: [
  --   {"agent": "SEOAuditAgent", "status": "completed", "started": "...", "completed": "...", "result_id": "..."},
  --   {"agent": "SocialMediaAuditAgent", "status": "running", "started": "...", "progress": 67}
  -- ]

  -- Results Aggregation
  results JSONB DEFAULT '{}'::jsonb,
  combined_score INTEGER CHECK (combined_score BETWEEN 0 AND 100),

  -- Status
  status VARCHAR(20) DEFAULT 'initializing', -- 'initializing', 'running', 'completed', 'failed', 'partial'
  completion_percentage INTEGER DEFAULT 0,

  -- Timing
  started_at TIMESTAMP DEFAULT NOW(),
  estimated_completion TIMESTAMP,
  completed_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_swarm_portfolio ON swarm_coordination(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_swarm_status ON swarm_coordination(status) WHERE status IN ('initializing', 'running');
CREATE INDEX IF NOT EXISTS idx_swarm_session ON swarm_coordination(session_id);

-- ============================================================================
-- COMPETITIVE INTELLIGENCE (Competitor Monitoring)
-- ============================================================================

CREATE TABLE IF NOT EXISTS competitive_intelligence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES company_portfolios(id) ON DELETE CASCADE,

  -- Competitor Info
  competitor_name VARCHAR(255) NOT NULL,
  competitor_url VARCHAR(500) NOT NULL,
  competitor_domain VARCHAR(255),

  -- Monitoring Metrics
  seo_score INTEGER CHECK (seo_score BETWEEN 0 AND 100),
  content_output_monthly INTEGER, -- How many pieces of content they publish
  social_engagement_avg INTEGER,
  estimated_traffic INTEGER,
  estimated_revenue DECIMAL(12, 2),

  -- Content Analysis
  content_topics TEXT[],
  keyword_overlap TEXT[], -- Keywords we both target
  keyword_gaps TEXT[], -- Keywords they rank for but we don't
  content_gaps TEXT[], -- Content types they have but we don't

  -- Competitive Position
  relative_position VARCHAR(50), -- 'ahead', 'tied', 'behind'
  threat_level VARCHAR(20), -- 'high', 'medium', 'low'

  -- Opportunities
  identified_opportunities JSONB[] DEFAULT ARRAY[]::JSONB[],

  -- Monitoring Schedule
  last_analyzed TIMESTAMP DEFAULT NOW(),
  next_analysis TIMESTAMP,
  analysis_frequency VARCHAR(20) DEFAULT 'weekly'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competitive_portfolio ON competitive_intelligence(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_competitive_next_analysis ON competitive_intelligence(next_analysis) WHERE next_analysis IS NOT NULL;

-- ============================================================================
-- EMPIRE METRICS (Dashboard Aggregations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS empire_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES company_portfolios(id) ON DELETE CASCADE,

  -- Time Period
  metric_date DATE NOT NULL,
  period_type VARCHAR(20) DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'

  -- Performance Metrics
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  seo_score INTEGER CHECK (seo_score BETWEEN 0 AND 100),
  social_score INTEGER CHECK (social_score BETWEEN 0 AND 100),
  content_score INTEGER CHECK (content_score BETWEEN 0 AND 100),
  authority_score INTEGER CHECK (authority_score BETWEEN 0 AND 100),

  -- Volume Metrics
  content_published INTEGER DEFAULT 0,
  actions_executed INTEGER DEFAULT 0,
  research_conducted INTEGER DEFAULT 0,

  -- Impact Metrics
  ranking_improvements INTEGER DEFAULT 0,
  traffic_change_percent DECIMAL(5, 2),
  engagement_total INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,

  -- Competitive Metrics
  share_of_voice DECIMAL(5, 2), -- Percentage
  market_position INTEGER, -- Rank among competitors

  -- RULER Learning
  avg_ruler_score DECIMAL(5, 2),
  total_optimizations INTEGER DEFAULT 0,

  -- Metadata
  calculated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(portfolio_id, metric_date, period_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_metrics_portfolio_date ON empire_metrics(portfolio_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_period ON empire_metrics(period_type);

-- ============================================================================
-- AUTO-UPDATE TRIGGERS
-- ============================================================================

-- Update portfolio scores after audit
CREATE OR REPLACE FUNCTION update_portfolio_scores() RETURNS trigger AS $$
BEGIN
  UPDATE company_portfolios
  SET
    audit_score = NEW.overall_score,
    seo_score = NEW.seo_score,
    social_score = NEW.social_score,
    gmb_score = NEW.gmb_score,
    content_quality_score = NEW.content_quality_score,
    brand_authority_score = NEW.brand_authority_score,
    last_full_audit = NEW.completed_at,
    updated_at = NOW()
  WHERE id = NEW.portfolio_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_portfolio_scores
  AFTER INSERT ON portfolio_audits
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_scores();

-- Update research usage count
CREATE OR REPLACE FUNCTION increment_research_usage() RETURNS trigger AS $$
BEGIN
  -- Increment citation_count for each research_id used
  IF NEW.research_ids IS NOT NULL AND array_length(NEW.research_ids, 1) > 0 THEN
    UPDATE research_cache
    SET citation_count = citation_count + 1,
        used_in_content_ids = array_append(used_in_content_ids, NEW.id)
    WHERE id = ANY(NEW.research_ids);
  END IF;

  -- Increment usage_count for each intelligence_id used
  IF NEW.intelligence_ids IS NOT NULL AND array_length(NEW.intelligence_ids, 1) > 0 THEN
    UPDATE industry_intelligence
    SET usage_count = usage_count + 1,
        content_pieces_used_in = array_append(content_pieces_used_in, NEW.id)
    WHERE id = ANY(NEW.intelligence_ids);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_research_usage
  AFTER INSERT ON content_empire
  FOR EACH ROW
  EXECUTE FUNCTION increment_research_usage();

-- ============================================================================
-- INITIAL DATA & EXAMPLES
-- ============================================================================

-- Example: Unite Group Portfolio (Commented out - run manually)
/*
INSERT INTO company_portfolios (
  company_name,
  industry,
  services,
  target_audience,
  website_url,
  gmb_id,
  social_accounts,
  expertise_areas,
  content_topics,
  competitive_advantages,
  autopilot_enabled,
  automation_level,
  content_frequency
) VALUES (
  'Unite Group',
  'disaster_recovery',
  ARRAY['fire damage restoration', 'water damage restoration', 'mould remediation', 'trauma cleaning', 'asbestos removal'],
  'Property owners, insurance companies, facility managers',
  'https://www.unite-group.in',
  'unite-group-disaster-recovery',
  '{"linkedin": "unite-group", "facebook": "unitegroup", "instagram": "unite_group_restoration"}'::jsonb,
  ARRAY['fire damage science', 'structural drying', 'mould biology', 'VOC testing', 'building materials', 'safety protocols'],
  ARRAY['disaster recovery', 'fire safety', 'water damage', 'mould prevention', 'indoor air quality', 'building restoration'],
  ARRAY['24/7 emergency response', 'IICRC certified technicians', 'advanced equipment', 'insurance liaison'],
  true,
  'empire',
  '{"blog": "2/week", "social": "2/day", "whitepaper": "1/month", "gmb": "2/week"}'::jsonb
);
*/

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
-- Total Tables: 10
-- Total Indexes: 30+
-- Total Triggers: 3
-- Status: Ready for Empire Mode
-- ============================================================================
