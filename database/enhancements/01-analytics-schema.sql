-- ============================================================================
-- ENHANCEMENT 1: ADVANCED ANALYTICS SCHEMA
-- ============================================================================
-- Adds competitor tracking over time, SEO trend analysis, and visibility metrics
-- ============================================================================

-- ============================================================================
-- COMPETITOR SNAPSHOTS (Historical tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS competitor_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  competitor_id UUID, -- Can be NULL for new/untracked competitors
  competitor_name TEXT NOT NULL,
  competitor_website TEXT,

  -- Snapshot data
  snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ranking_data JSONB, -- { "keyword": rank, ... }
  local_pack_position INTEGER, -- 1-3 for local pack, NULL if not in pack

  -- Review metrics
  review_count INTEGER,
  avg_rating NUMERIC(3,2),
  review_velocity INTEGER, -- Reviews per month

  -- SEO metrics
  domain_authority INTEGER,
  page_authority INTEGER,
  backlink_count INTEGER,
  referring_domains INTEGER,

  -- Content metrics
  indexed_pages INTEGER,
  blog_post_count INTEGER,
  last_content_update TIMESTAMP WITH TIME ZONE,

  -- Social metrics
  social_signals JSONB, -- { "facebook": likes, "instagram": followers, ... }

  -- Visibility score (calculated)
  visibility_score NUMERIC(5,2), -- 0-100 composite score

  -- Metadata
  data_source TEXT, -- 'manual', 'semrush', 'ahrefs', 'scraper'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_company_id
  ON competitor_snapshots(company_id);
CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_competitor_id
  ON competitor_snapshots(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_date
  ON competitor_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_company_date
  ON competitor_snapshots(company_id, snapshot_date DESC);

-- ============================================================================
-- SEO TRENDS (Time-series metrics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS seo_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Metric identification
  metric_name TEXT NOT NULL, -- 'organic_traffic', 'keyword_rankings', 'backlinks', etc.
  metric_category TEXT, -- 'traffic', 'rankings', 'technical', 'content', 'social'

  -- Metric value
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT, -- 'count', 'percentage', 'score', 'seconds'

  -- Context
  metric_context JSONB, -- Additional context like page URL, keyword, etc.

  -- Comparison
  previous_value NUMERIC,
  change_amount NUMERIC,
  change_percentage NUMERIC,

  -- Time tracking
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  period_type TEXT, -- 'daily', 'weekly', 'monthly'

  -- Data source
  data_source TEXT, -- 'google_analytics', 'search_console', 'lighthouse', 'manual'

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_trends_company_id
  ON seo_trends(company_id);
CREATE INDEX IF NOT EXISTS idx_seo_trends_metric_name
  ON seo_trends(metric_name);
CREATE INDEX IF NOT EXISTS idx_seo_trends_recorded_at
  ON seo_trends(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_trends_company_metric_date
  ON seo_trends(company_id, metric_name, recorded_at DESC);

-- ============================================================================
-- RANKING HISTORY (Detailed keyword ranking over time)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ranking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  keyword_id UUID REFERENCES keywords(id) ON DELETE SET NULL,

  -- Keyword details
  keyword_text TEXT NOT NULL,
  location TEXT, -- City, State, or Country

  -- Ranking data
  rank_position INTEGER, -- NULL if not ranking
  rank_url TEXT, -- Which page is ranking
  rank_type TEXT, -- 'organic', 'local_pack', 'maps', 'featured_snippet'

  -- SERP features
  in_local_pack BOOLEAN DEFAULT FALSE,
  local_pack_position INTEGER, -- 1-3 if in local pack
  has_featured_snippet BOOLEAN DEFAULT FALSE,
  has_knowledge_panel BOOLEAN DEFAULT FALSE,

  -- Search volume (if available)
  search_volume INTEGER,

  -- Competition metrics
  top_competitor_rank INTEGER, -- Rank of top competitor
  top_competitor_name TEXT,

  -- Recorded timestamp
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Data source
  data_source TEXT DEFAULT 'manual', -- 'manual', 'serpapi', 'semrush', 'ahrefs'

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ranking_history_company_id
  ON ranking_history(company_id);
CREATE INDEX IF NOT EXISTS idx_ranking_history_keyword_id
  ON ranking_history(keyword_id);
CREATE INDEX IF NOT EXISTS idx_ranking_history_checked_at
  ON ranking_history(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_history_company_keyword_date
  ON ranking_history(company_id, keyword_text, checked_at DESC);

-- ============================================================================
-- VISIBILITY SCORE HISTORY (Overall visibility tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS visibility_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Overall scores
  organic_visibility_score NUMERIC(5,2), -- 0-100
  local_visibility_score NUMERIC(5,2), -- 0-100
  total_visibility_score NUMERIC(5,2), -- 0-100 (weighted average)

  -- Component scores
  ranking_score NUMERIC(5,2), -- Based on keyword rankings
  traffic_score NUMERIC(5,2), -- Based on organic traffic
  local_pack_score NUMERIC(5,2), -- Based on local pack appearances
  review_score NUMERIC(5,2), -- Based on reviews and ratings
  citation_score NUMERIC(5,2), -- Based on citation accuracy and count

  -- Competitive analysis
  market_share NUMERIC(5,2), -- Share of voice vs competitors
  competitive_position INTEGER, -- Rank among tracked competitors

  -- Change tracking
  previous_score NUMERIC(5,2),
  score_change NUMERIC(5,2),
  change_percentage NUMERIC(5,2),

  -- Time tracking
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visibility_history_company_id
  ON visibility_history(company_id);
CREATE INDEX IF NOT EXISTS idx_visibility_history_calculated_at
  ON visibility_history(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_visibility_history_company_date
  ON visibility_history(company_id, calculated_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate visibility score
CREATE OR REPLACE FUNCTION calculate_visibility_score(
  p_company_id UUID,
  p_period_start TIMESTAMP WITH TIME ZONE,
  p_period_end TIMESTAMP WITH TIME ZONE
)
RETURNS NUMERIC AS $$
DECLARE
  v_ranking_score NUMERIC := 0;
  v_traffic_score NUMERIC := 0;
  v_local_pack_score NUMERIC := 0;
  v_total_score NUMERIC := 0;
BEGIN
  -- Calculate ranking score (average of top rankings)
  SELECT AVG(
    CASE
      WHEN rank_position BETWEEN 1 AND 3 THEN 100
      WHEN rank_position BETWEEN 4 AND 10 THEN 70
      WHEN rank_position BETWEEN 11 AND 20 THEN 40
      WHEN rank_position BETWEEN 21 AND 50 THEN 20
      ELSE 5
    END
  ) INTO v_ranking_score
  FROM ranking_history
  WHERE company_id = p_company_id
    AND checked_at BETWEEN p_period_start AND p_period_end;

  -- Calculate local pack score
  SELECT (COUNT(*) FILTER (WHERE in_local_pack = TRUE)::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0)) * 100
  INTO v_local_pack_score
  FROM ranking_history
  WHERE company_id = p_company_id
    AND checked_at BETWEEN p_period_start AND p_period_end;

  -- Weighted average
  v_total_score := (
    COALESCE(v_ranking_score, 0) * 0.5 +
    COALESCE(v_local_pack_score, 0) * 0.3 +
    COALESCE(v_traffic_score, 0) * 0.2
  );

  RETURN ROUND(v_total_score, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-calculate visibility score when ranking history is added
CREATE OR REPLACE FUNCTION update_visibility_on_ranking_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new visibility history record
  INSERT INTO visibility_history (
    company_id,
    total_visibility_score,
    calculated_at
  )
  VALUES (
    NEW.company_id,
    calculate_visibility_score(NEW.company_id, NOW() - INTERVAL '30 days', NOW()),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_visibility_on_ranking'
  ) THEN
    CREATE TRIGGER trigger_update_visibility_on_ranking
      AFTER INSERT ON ranking_history
      FOR EACH ROW
      EXECUTE FUNCTION update_visibility_on_ranking_change();
  END IF;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE competitor_snapshots IS 'Historical snapshots of competitor metrics for trend analysis';
COMMENT ON TABLE seo_trends IS 'Time-series SEO metrics for tracking performance over time';
COMMENT ON TABLE ranking_history IS 'Detailed keyword ranking history with SERP feature tracking';
COMMENT ON TABLE visibility_history IS 'Overall visibility score history and competitive positioning';
COMMENT ON FUNCTION calculate_visibility_score IS 'Calculates weighted visibility score based on rankings and local pack presence';

-- ============================================================================
-- ANALYTICS SCHEMA COMPLETE
-- ============================================================================
