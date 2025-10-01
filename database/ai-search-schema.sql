-- AI Search SEO Strategy Database Schema

-- SEO Strategies Template Table
CREATE TABLE IF NOT EXISTS seo_strategies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  strategy_name TEXT NOT NULL,
  category TEXT CHECK(category IN ('content', 'technical', 'ai_optimization', 'local', 'citations', 'eeat', 'competitor')),
  principle TEXT NOT NULL,
  implementation_details TEXT NOT NULL,
  tools_resources TEXT, -- JSON array
  priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'critical')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Case Studies Table
CREATE TABLE IF NOT EXISTS strategy_case_studies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  strategy_id INTEGER NOT NULL,
  case_study_title TEXT NOT NULL,
  industry TEXT,
  challenge TEXT,
  implementation TEXT,
  results_achieved TEXT,
  metrics TEXT, -- JSON object (e.g., {"traffic_increase": "150%", "rankings_improved": 45})
  timeframe TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (strategy_id) REFERENCES seo_strategies(id) ON DELETE CASCADE
);

-- AI Search Campaigns Table
CREATE TABLE IF NOT EXISTS ai_search_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  campaign_name TEXT NOT NULL,
  objective TEXT,
  target_ai_platforms TEXT, -- JSON array ["Perplexity", "ChatGPT", "Gemini", "Claude"]
  start_date DATE,
  end_date DATE,
  status TEXT CHECK(status IN ('planning', 'active', 'paused', 'completed')),
  budget REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Campaign Strategies (linking campaigns to strategies)
CREATE TABLE IF NOT EXISTS campaign_strategies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  strategy_id INTEGER NOT NULL,
  implementation_status TEXT CHECK(implementation_status IN ('not_started', 'in_progress', 'completed', 'on_hold')),
  assigned_to TEXT,
  due_date DATE,
  notes TEXT,
  FOREIGN KEY (campaign_id) REFERENCES ai_search_campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (strategy_id) REFERENCES seo_strategies(id) ON DELETE CASCADE
);

-- AI Search Visibility Tracking
CREATE TABLE IF NOT EXISTS ai_search_visibility (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  campaign_id INTEGER,
  ai_platform TEXT NOT NULL, -- Perplexity, ChatGPT, etc.
  query TEXT NOT NULL,
  brand_mentioned BOOLEAN DEFAULT 0,
  position_in_response INTEGER, -- Position where brand is mentioned
  context_sentiment TEXT CHECK(context_sentiment IN ('positive', 'neutral', 'negative')),
  citation_included BOOLEAN DEFAULT 0,
  citation_url TEXT,
  full_response TEXT,
  checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES ai_search_campaigns(id) ON DELETE SET NULL
);

-- Perplexity-specific optimization tracking
CREATE TABLE IF NOT EXISTS perplexity_optimization (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  content_type TEXT, -- article, landing_page, product, etc.
  optimization_score INTEGER, -- 0-100
  ai_readability_score INTEGER,
  citation_worthiness_score INTEGER,
  key_facts_extracted TEXT, -- JSON array of key facts AI might cite
  recommended_improvements TEXT, -- JSON array
  last_analyzed DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- AI-First Content Strategy
CREATE TABLE IF NOT EXISTS ai_content_strategy (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  topic_cluster TEXT NOT NULL,
  target_ai_queries TEXT, -- JSON array of queries AI users might ask
  content_type TEXT,
  factual_angle TEXT, -- The unique factual angle to own
  expert_sources TEXT, -- JSON array of expert sources to cite
  data_points TEXT, -- JSON array of unique data points to include
  implementation_status TEXT CHECK(implementation_status IN ('planned', 'in_progress', 'published', 'optimizing')),
  published_url TEXT,
  ai_citation_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Campaign Results Tracking
CREATE TABLE IF NOT EXISTS campaign_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value TEXT NOT NULL,
  metric_type TEXT, -- traffic, rankings, citations, conversions, etc.
  measurement_date DATE,
  notes TEXT,
  FOREIGN KEY (campaign_id) REFERENCES ai_search_campaigns(id) ON DELETE CASCADE
);

-- AI Search Competitor Analysis
CREATE TABLE IF NOT EXISTS ai_competitor_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  competitor_id INTEGER,
  ai_platform TEXT NOT NULL,
  queries_analyzed INTEGER DEFAULT 0,
  mention_frequency INTEGER DEFAULT 0, -- How often competitor appears in AI responses
  average_position REAL,
  citation_quality_score INTEGER, -- 0-100
  topic_dominance TEXT, -- JSON object of topics they dominate
  last_analyzed DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE
);

-- Strategy Implementation Notes
CREATE TABLE IF NOT EXISTS strategy_implementation_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_strategy_id INTEGER NOT NULL,
  note_text TEXT NOT NULL,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_strategy_id) REFERENCES campaign_strategies(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_visibility_platform ON ai_search_visibility(ai_platform, company_id);
CREATE INDEX IF NOT EXISTS idx_ai_visibility_query ON ai_search_visibility(query);
CREATE INDEX IF NOT EXISTS idx_campaigns_company ON ai_search_campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_campaign_strategies ON campaign_strategies(campaign_id, strategy_id);
CREATE INDEX IF NOT EXISTS idx_perplexity_opt ON perplexity_optimization(company_id, url);
