-- Content Opportunities Schema (Niche Growth Engine)
-- Tracks high-value content opportunities discovered through community gap mining

-- Core opportunities table
CREATE TABLE IF NOT EXISTS content_opportunities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER,
  keyword TEXT NOT NULL,
  search_volume INTEGER DEFAULT 0,
  keyword_difficulty REAL DEFAULT 0, -- 0-1 normalized
  opportunity_score REAL DEFAULT 0, -- computed composite score

  -- Gap signals (community analysis)
  reddit_mentions INTEGER DEFAULT 0,
  repeated_questions INTEGER DEFAULT 0,
  confusion_markers INTEGER DEFAULT 0,
  dissatisfaction_markers INTEGER DEFAULT 0,
  gap_weight REAL DEFAULT 0, -- computed from signals above

  -- Intent & questions
  intents TEXT, -- JSON array of search intents
  top_questions TEXT, -- JSON array of frequently asked questions

  -- AEO (Answer Engine Optimization) fields
  canonical_answer TEXT, -- 1-3 sentence extractable summary for AI engines
  key_bullets TEXT, -- JSON array of actionable bullet points
  citations TEXT, -- JSON array of source URLs/standards

  -- Source tracking
  source_type TEXT DEFAULT 'reddit', -- reddit, discord, facebook, quora
  source_thread_ids TEXT, -- JSON array of thread IDs
  wl_keyword_id TEXT, -- white-label AHREFS keyword ID

  -- Metadata
  status TEXT DEFAULT 'discovered', -- discovered, planned, in_progress, published
  assigned_to INTEGER,
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Content plans generated from opportunities
CREATE TABLE IF NOT EXISTS content_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  opportunity_id INTEGER NOT NULL,

  -- Content types
  article_plan TEXT, -- Markdown article outline/plan
  social_pack TEXT, -- JSON: { linkedin, facebook, instagram, twitter, video_script }
  newsletter_item TEXT, -- Newsletter block copy

  -- SEO metadata
  meta_title TEXT,
  meta_description TEXT,
  focus_keyword TEXT,
  slug TEXT,

  -- Production status
  status TEXT DEFAULT 'draft', -- draft, review, approved, published
  published_url TEXT,
  published_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (opportunity_id) REFERENCES content_opportunities(id) ON DELETE CASCADE
);

-- Reddit threads tracked for gap mining
CREATE TABLE IF NOT EXISTS reddit_threads (
  id TEXT PRIMARY KEY, -- Reddit thread ID
  opportunity_id INTEGER,
  subreddit TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  num_comments INTEGER DEFAULT 0,
  created_utc INTEGER,

  -- Analysis
  extracted_questions TEXT, -- JSON array
  confusion_count INTEGER DEFAULT 0,
  dissatisfaction_count INTEGER DEFAULT 0,

  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (opportunity_id) REFERENCES content_opportunities(id) ON DELETE CASCADE
);

-- Reddit comments for detailed analysis
CREATE TABLE IF NOT EXISTS reddit_comments (
  id TEXT PRIMARY KEY, -- Reddit comment ID
  thread_id TEXT NOT NULL,
  body TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  created_utc INTEGER,
  parent_id TEXT,
  link_id TEXT,

  -- NLP analysis
  has_question BOOLEAN DEFAULT 0,
  has_confusion BOOLEAN DEFAULT 0,
  has_dissatisfaction BOOLEAN DEFAULT 0,

  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (thread_id) REFERENCES reddit_threads(id) ON DELETE CASCADE
);

-- Content opportunity searches (track what was analyzed)
CREATE TABLE IF NOT EXISTS opportunity_searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seed_keyword TEXT NOT NULL,
  company_id INTEGER,

  -- Search parameters
  database_region TEXT DEFAULT 'us', -- us, au, uk, etc.
  subreddits TEXT, -- JSON array of subreddits searched

  -- Results summary
  keywords_found INTEGER DEFAULT 0,
  opportunities_discovered INTEGER DEFAULT 0,
  avg_opportunity_score REAL DEFAULT 0,
  top_opportunity_id INTEGER,

  -- Execution
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  error_message TEXT,
  execution_time_ms INTEGER,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
  FOREIGN KEY (top_opportunity_id) REFERENCES content_opportunities(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_opportunities_company ON content_opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_score ON content_opportunities(opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON content_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_keyword ON content_opportunities(keyword);

CREATE INDEX IF NOT EXISTS idx_content_plans_opportunity ON content_plans(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_content_plans_status ON content_plans(status);

CREATE INDEX IF NOT EXISTS idx_reddit_threads_opportunity ON reddit_threads(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_reddit_comments_thread ON reddit_comments(thread_id);

CREATE INDEX IF NOT EXISTS idx_searches_company ON opportunity_searches(company_id);
CREATE INDEX IF NOT EXISTS idx_searches_created ON opportunity_searches(created_at DESC);

-- PostgreSQL compatibility (for production)
-- AUTOINCREMENT → SERIAL
-- TIMESTAMP → TIMESTAMPTZ
