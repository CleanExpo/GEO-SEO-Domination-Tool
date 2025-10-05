-- Google Search Console Rankings Schema
-- Real ranking data from Google (100% accurate)

-- GSC Account Connections
CREATE TABLE IF NOT EXISTS gsc_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  site_url TEXT NOT NULL,
  permission_level TEXT NOT NULL, -- owner, full, restricted

  -- OAuth tokens
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Connection status
  status TEXT DEFAULT 'pending', -- pending, active, error, disconnected
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, site_url)
);

-- GSC Ranking Data (Real Google data)
CREATE TABLE IF NOT EXISTS gsc_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  gsc_connection_id UUID REFERENCES gsc_connections(id) ON DELETE CASCADE,

  keyword TEXT NOT NULL,
  page_url TEXT NOT NULL,
  country TEXT DEFAULT 'aus',
  device TEXT DEFAULT 'mobile', -- mobile, desktop, tablet

  -- Real Google metrics
  position DECIMAL(5,2) NOT NULL, -- Average position (e.g., 3.5)
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr DECIMAL(5,4) DEFAULT 0, -- Click-through rate

  -- Change tracking
  position_change DECIMAL(5,2), -- vs previous period
  clicks_change INTEGER,
  impressions_change INTEGER,

  check_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Index for fast lookups
  CONSTRAINT unique_gsc_ranking UNIQUE (gsc_connection_id, keyword, page_url, country, device, check_date)
);

-- GSC Page Performance
CREATE TABLE IF NOT EXISTS gsc_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gsc_connection_id UUID REFERENCES gsc_connections(id) ON DELETE CASCADE,

  page_url TEXT NOT NULL,

  total_clicks INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  avg_ctr DECIMAL(5,4) DEFAULT 0,
  avg_position DECIMAL(5,2),

  top_keywords JSONB, -- Array of top keywords for this page

  check_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_gsc_page UNIQUE (gsc_connection_id, page_url, check_date)
);

-- GSC Keyword History (for trending)
CREATE TABLE IF NOT EXISTS gsc_keyword_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gsc_connection_id UUID REFERENCES gsc_connections(id) ON DELETE CASCADE,

  keyword TEXT NOT NULL,

  position DECIMAL(5,2) NOT NULL,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,

  check_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_keyword_history UNIQUE (gsc_connection_id, keyword, check_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gsc_rankings_user ON gsc_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_gsc_rankings_company ON gsc_rankings(company_id);
CREATE INDEX IF NOT EXISTS idx_gsc_rankings_keyword ON gsc_rankings(keyword);
CREATE INDEX IF NOT EXISTS idx_gsc_rankings_date ON gsc_rankings(check_date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_rankings_position ON gsc_rankings(position);

CREATE INDEX IF NOT EXISTS idx_gsc_pages_user ON gsc_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_gsc_pages_url ON gsc_pages(page_url);
CREATE INDEX IF NOT EXISTS idx_gsc_pages_date ON gsc_pages(check_date DESC);

CREATE INDEX IF NOT EXISTS idx_gsc_history_keyword ON gsc_keyword_history(keyword);
CREATE INDEX IF NOT EXISTS idx_gsc_history_date ON gsc_keyword_history(check_date DESC);

-- Row-Level Security
ALTER TABLE gsc_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_keyword_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own GSC connections" ON gsc_connections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own GSC rankings" ON gsc_rankings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert GSC rankings" ON gsc_rankings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own GSC pages" ON gsc_pages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert GSC pages" ON gsc_pages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own keyword history" ON gsc_keyword_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert keyword history" ON gsc_keyword_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to calculate ranking changes
CREATE OR REPLACE FUNCTION calculate_ranking_changes()
RETURNS TRIGGER AS $$
DECLARE
  previous_record gsc_rankings%ROWTYPE;
BEGIN
  -- Find the previous record for this keyword
  SELECT * INTO previous_record
  FROM gsc_rankings
  WHERE gsc_connection_id = NEW.gsc_connection_id
    AND keyword = NEW.keyword
    AND page_url = NEW.page_url
    AND country = NEW.country
    AND device = NEW.device
    AND check_date < NEW.check_date
  ORDER BY check_date DESC
  LIMIT 1;

  IF FOUND THEN
    NEW.position_change := previous_record.position - NEW.position; -- Positive = improved
    NEW.clicks_change := NEW.clicks - previous_record.clicks;
    NEW.impressions_change := NEW.impressions - previous_record.impressions;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_ranking_changes
  BEFORE INSERT ON gsc_rankings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_ranking_changes();

-- Comments
COMMENT ON TABLE gsc_connections IS 'OAuth connections to Google Search Console';
COMMENT ON TABLE gsc_rankings IS 'Real ranking data from Google Search Console';
COMMENT ON TABLE gsc_pages IS 'Page-level performance from Google Search Console';
COMMENT ON TABLE gsc_keyword_history IS 'Historical trending data for keywords';

COMMENT ON COLUMN gsc_rankings.position IS 'Average position in Google search results (1 = top position)';
COMMENT ON COLUMN gsc_rankings.position_change IS 'Change vs previous period (positive = improved ranking)';
COMMENT ON COLUMN gsc_rankings.ctr IS 'Click-through rate (clicks / impressions)';
