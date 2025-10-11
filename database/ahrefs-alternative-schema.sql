/**
 * Ahrefs Alternative Database Schema
 *
 * Tables for:
 * - Keyword Research (Phase 2)
 * - Competitor Analysis (Phase 3)
 * - SERP Analysis (Phase 4)
 *
 * Phase 1 (Backlinks) schema already exists in backlinks-schema.sql
 */

-- =============================================================================
-- PHASE 2: KEYWORD RESEARCH TABLES
-- =============================================================================

-- Keyword Research History
CREATE TABLE IF NOT EXISTS keyword_research (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_volume INTEGER DEFAULT 0,
  difficulty INTEGER CHECK(difficulty >= 0 AND difficulty <= 100),
  competition TEXT CHECK(competition IN ('Low', 'Medium', 'High')),
  cpc REAL DEFAULT 0,
  trend TEXT CHECK(trend IN ('rising', 'falling', 'stable')),
  serp_features TEXT[], -- Array of SERP features
  current_ranking INTEGER,
  click_potential INTEGER DEFAULT 0,
  researched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_keyword_research_company ON keyword_research(company_id);
CREATE INDEX IF NOT EXISTS idx_keyword_research_keyword ON keyword_research(keyword);
CREATE INDEX IF NOT EXISTS idx_keyword_research_date ON keyword_research(researched_at);

-- Keyword Expansion Results
CREATE TABLE IF NOT EXISTS keyword_expansions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  seed_keyword TEXT NOT NULL,
  expanded_keyword TEXT NOT NULL,
  search_volume INTEGER DEFAULT 0,
  difficulty INTEGER CHECK(difficulty >= 0 AND difficulty <= 100),
  relevance INTEGER CHECK(relevance >= 0 AND relevance <= 100),
  expanded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_keyword_expansions_company ON keyword_expansions(company_id);
CREATE INDEX IF NOT EXISTS idx_keyword_expansions_seed ON keyword_expansions(seed_keyword);

-- Keyword Clusters
CREATE TABLE IF NOT EXISTS keyword_clusters (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  keywords TEXT[] NOT NULL, -- Array of keywords in cluster
  total_search_volume INTEGER DEFAULT 0,
  avg_difficulty INTEGER CHECK(avg_difficulty >= 0 AND avg_difficulty <= 100),
  priority TEXT CHECK(priority IN ('High', 'Medium', 'Low')),
  clustered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_keyword_clusters_company ON keyword_clusters(company_id);
CREATE INDEX IF NOT EXISTS idx_keyword_clusters_topic ON keyword_clusters(topic);

-- =============================================================================
-- PHASE 3: COMPETITOR ANALYSIS TABLES
-- =============================================================================

-- Competitor Analyses
CREATE TABLE IF NOT EXISTS competitor_analyses (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  competitor_domain TEXT NOT NULL,
  overall_strength TEXT CHECK(overall_strength IN ('Much Weaker', 'Weaker', 'Similar', 'Stronger', 'Much Stronger')),
  backlink_gap INTEGER DEFAULT 0, -- Positive = they have more, negative = you have more
  keyword_gap_count INTEGER DEFAULT 0,
  content_gap_count INTEGER DEFAULT 0,
  analyzed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_competitor_analyses_company ON competitor_analyses(company_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_competitor ON competitor_analyses(competitor_domain);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_date ON competitor_analyses(analyzed_at);

-- Backlink Opportunities (domains linking to competitor but not you)
CREATE TABLE IF NOT EXISTS backlink_opportunities (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  competitor_domain TEXT NOT NULL,
  opportunity_domain TEXT NOT NULL,
  domain_rating INTEGER CHECK(domain_rating >= 0 AND domain_rating <= 100),
  backlinks_to_competitor INTEGER DEFAULT 0,
  link_type TEXT,
  priority TEXT CHECK(priority IN ('High', 'Medium', 'Low')),
  reason TEXT,
  outreach_status TEXT CHECK(outreach_status IN ('pending', 'contacted', 'responded', 'acquired', 'rejected')) DEFAULT 'pending',
  identified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  contacted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_backlink_opportunities_company ON backlink_opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_backlink_opportunities_domain ON backlink_opportunities(opportunity_domain);
CREATE INDEX IF NOT EXISTS idx_backlink_opportunities_priority ON backlink_opportunities(priority);
CREATE INDEX IF NOT EXISTS idx_backlink_opportunities_status ON backlink_opportunities(outreach_status);

-- Keyword Opportunities (keywords competitor ranks for that you don't)
CREATE TABLE IF NOT EXISTS keyword_opportunities (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  competitor_domain TEXT NOT NULL,
  keyword TEXT NOT NULL,
  search_volume INTEGER DEFAULT 0,
  difficulty INTEGER CHECK(difficulty >= 0 AND difficulty <= 100),
  competitor_ranking INTEGER,
  your_ranking INTEGER,
  gap INTEGER, -- Search volume gap
  priority TEXT CHECK(priority IN ('High', 'Medium', 'Low')),
  target_status TEXT CHECK(target_status IN ('pending', 'targeted', 'ranked', 'abandoned')) DEFAULT 'pending',
  identified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_keyword_opportunities_company ON keyword_opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_keyword_opportunities_keyword ON keyword_opportunities(keyword);
CREATE INDEX IF NOT EXISTS idx_keyword_opportunities_priority ON keyword_opportunities(priority);
CREATE INDEX IF NOT EXISTS idx_keyword_opportunities_status ON keyword_opportunities(target_status);

-- Content Gaps (topics competitor covers that you don't)
CREATE TABLE IF NOT EXISTS content_gaps (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  competitor_domain TEXT NOT NULL,
  topic TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  competitor_pages TEXT[], -- URLs of competitor pages covering this topic
  estimated_traffic INTEGER DEFAULT 0,
  difficulty INTEGER CHECK(difficulty >= 0 AND difficulty <= 100),
  priority TEXT CHECK(priority IN ('High', 'Medium', 'Low')),
  content_status TEXT CHECK(content_status IN ('pending', 'planned', 'in_progress', 'published', 'abandoned')) DEFAULT 'pending',
  identified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_gaps_company ON content_gaps(company_id);
CREATE INDEX IF NOT EXISTS idx_content_gaps_topic ON content_gaps(topic);
CREATE INDEX IF NOT EXISTS idx_content_gaps_priority ON content_gaps(priority);
CREATE INDEX IF NOT EXISTS idx_content_gaps_status ON content_gaps(content_status);

-- Competitive Insights (AI-generated strategic recommendations)
CREATE TABLE IF NOT EXISTS competitive_insights (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  competitor_domain TEXT NOT NULL,
  category TEXT CHECK(category IN ('Strategy', 'Content', 'Links', 'Technical', 'Local')),
  insight TEXT NOT NULL,
  priority TEXT CHECK(priority IN ('Critical', 'High', 'Medium', 'Low')),
  actionable_steps TEXT[] NOT NULL,
  implemented BOOLEAN DEFAULT FALSE,
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_competitive_insights_company ON competitive_insights(company_id);
CREATE INDEX IF NOT EXISTS idx_competitive_insights_category ON competitive_insights(category);
CREATE INDEX IF NOT EXISTS idx_competitive_insights_priority ON competitive_insights(priority);
CREATE INDEX IF NOT EXISTS idx_competitive_insights_implemented ON competitive_insights(implemented);

-- =============================================================================
-- PHASE 4: SERP ANALYSIS TABLES
-- =============================================================================

-- SERP Analyses
CREATE TABLE IF NOT EXISTS serp_analyses (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_volume INTEGER DEFAULT 0,
  opportunity_score INTEGER CHECK(opportunity_score >= 0 AND opportunity_score <= 100),
  difficulty TEXT CHECK(difficulty IN ('Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard')),
  estimated_effort TEXT CHECK(estimated_effort IN ('Low', 'Medium', 'High')),
  estimated_timeframe TEXT,
  avg_domain_rating INTEGER,
  avg_backlinks INTEGER,
  avg_word_count INTEGER,
  avg_performance_score INTEGER,
  recommended_word_count INTEGER,
  analyzed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_serp_analyses_company ON serp_analyses(company_id);
CREATE INDEX IF NOT EXISTS idx_serp_analyses_keyword ON serp_analyses(keyword);
CREATE INDEX IF NOT EXISTS idx_serp_analyses_opportunity ON serp_analyses(opportunity_score);
CREATE INDEX IF NOT EXISTS idx_serp_analyses_date ON serp_analyses(analyzed_at);

-- SERP Features
CREATE TABLE IF NOT EXISTS serp_features (
  id TEXT PRIMARY KEY,
  serp_analysis_id TEXT NOT NULL REFERENCES serp_analyses(id) ON DELETE CASCADE,
  feature_type TEXT CHECK(feature_type IN ('featured_snippet', 'people_also_ask', 'knowledge_panel', 'local_pack', 'image_pack', 'video_pack', 'shopping', 'news')),
  present BOOLEAN DEFAULT FALSE,
  content TEXT,
  difficulty TEXT CHECK(difficulty IN ('Easy', 'Medium', 'Hard')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_serp_features_analysis ON serp_features(serp_analysis_id);
CREATE INDEX IF NOT EXISTS idx_serp_features_type ON serp_features(feature_type);

-- SERP Results (Top 10 analysis)
CREATE TABLE IF NOT EXISTS serp_results (
  id TEXT PRIMARY KEY,
  serp_analysis_id TEXT NOT NULL REFERENCES serp_analyses(id) ON DELETE CASCADE,
  position INTEGER CHECK(position >= 1 AND position <= 10),
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  title TEXT,
  description TEXT,
  domain_rating INTEGER CHECK(domain_rating >= 0 AND domain_rating <= 100),
  backlinks INTEGER DEFAULT 0,
  performance_score INTEGER CHECK(performance_score >= 0 AND performance_score <= 100),
  word_count INTEGER DEFAULT 0,
  has_schema BOOLEAN DEFAULT FALSE,
  content_type TEXT, -- Guide, Listicle, Review, Definition, Commercial, News, Informational
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_serp_results_analysis ON serp_results(serp_analysis_id);
CREATE INDEX IF NOT EXISTS idx_serp_results_position ON serp_results(position);
CREATE INDEX IF NOT EXISTS idx_serp_results_domain ON serp_results(domain);

-- SERP Recommendations (AI-powered)
CREATE TABLE IF NOT EXISTS serp_recommendations (
  id TEXT PRIMARY KEY,
  serp_analysis_id TEXT NOT NULL REFERENCES serp_analyses(id) ON DELETE CASCADE,
  recommendation TEXT NOT NULL,
  priority TEXT CHECK(priority IN ('High', 'Medium', 'Low')),
  order_index INTEGER DEFAULT 0,
  implemented BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_serp_recommendations_analysis ON serp_recommendations(serp_analysis_id);
CREATE INDEX IF NOT EXISTS idx_serp_recommendations_priority ON serp_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_serp_recommendations_implemented ON serp_recommendations(implemented);

-- Ranking Requirements (what's needed to rank)
CREATE TABLE IF NOT EXISTS ranking_requirements (
  id TEXT PRIMARY KEY,
  serp_analysis_id TEXT NOT NULL REFERENCES serp_analyses(id) ON DELETE CASCADE,
  requirement TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ranking_requirements_analysis ON ranking_requirements(serp_analysis_id);
CREATE INDEX IF NOT EXISTS idx_ranking_requirements_completed ON ranking_requirements(completed);

-- =============================================================================
-- MIGRATION NOTES
-- =============================================================================

-- This schema creates tables for Phases 2-4 of the Ahrefs Alternative system:
--
-- Phase 2 (Keyword Research):
-- - keyword_research: Historical keyword research data
-- - keyword_expansions: AI-generated keyword variations
-- - keyword_clusters: Topic-based keyword grouping
--
-- Phase 3 (Competitor Analysis):
-- - competitor_analyses: Competitor comparison summaries
-- - backlink_opportunities: Link building targets
-- - keyword_opportunities: Keyword gap targets
-- - content_gaps: Missing topic areas
-- - competitive_insights: AI strategic recommendations
--
-- Phase 4 (SERP Analysis):
-- - serp_analyses: SERP analysis summaries
-- - serp_features: SERP feature detection
-- - serp_results: Top 10 result breakdown
-- - serp_recommendations: AI ranking recommendations
-- - ranking_requirements: Checklist for ranking
--
-- Total: 14 new tables
-- Compatible with: PostgreSQL, Supabase
-- SQLite compatibility: Remove array types (TEXT[]) and use JSON columns instead
