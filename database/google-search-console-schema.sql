-- Google Search Console Integration Schema for Supabase
-- ETL pipeline for Google Search organic traffic data

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Daily organic traffic data (combined all devices)
CREATE TABLE IF NOT EXISTS gsc_daily_traffic (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    clicks DECIMAL(10,2) NOT NULL DEFAULT 0,
    impressions DECIMAL(10,2) NOT NULL DEFAULT 0,
    ctr DECIMAL(5,4) NOT NULL DEFAULT 0,  -- Click-through rate
    position DECIMAL(5,2) NOT NULL DEFAULT 0,  -- Average position
    date DATE NOT NULL,
    device VARCHAR(20) DEFAULT 'all',  -- all, mobile, desktop, tablet

    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Unique constraint: one record per company/date/device
    UNIQUE(company_id, date, device)
);

-- Top performing keywords from Google Search Console
CREATE TABLE IF NOT EXISTS gsc_keywords (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    clicks DECIMAL(10,2) NOT NULL DEFAULT 0,
    impressions DECIMAL(10,2) NOT NULL DEFAULT 0,
    ctr DECIMAL(5,4) NOT NULL DEFAULT 0,
    position DECIMAL(5,2) NOT NULL DEFAULT 0,
    device VARCHAR(20) DEFAULT 'all',  -- all, mobile, desktop, tablet
    date_range_start DATE,
    date_range_end DATE,

    -- Link to our existing keywords table
    geo_seo_keyword_id INTEGER REFERENCES keywords(id) ON DELETE SET NULL,

    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Top performing URLs/pages from Google Search Console
CREATE TABLE IF NOT EXISTS gsc_urls (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    clicks DECIMAL(10,2) NOT NULL DEFAULT 0,
    impressions DECIMAL(10,2) NOT NULL DEFAULT 0,
    ctr DECIMAL(5,4) NOT NULL DEFAULT 0,
    position DECIMAL(5,2) NOT NULL DEFAULT 0,
    device VARCHAR(20) DEFAULT 'all',  -- all, mobile, desktop, tablet
    date_range_start DATE,
    date_range_end DATE,

    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Google Search Console integration settings per company
CREATE TABLE IF NOT EXISTS gsc_integrations (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    site_url TEXT NOT NULL,  -- Verified property URL in GSC
    access_token TEXT,  -- Encrypted OAuth access token
    refresh_token TEXT,  -- Encrypted OAuth refresh token
    token_expires_at TIMESTAMP,

    -- Sync settings
    auto_sync BOOLEAN DEFAULT true,
    sync_frequency VARCHAR(20) DEFAULT 'daily',  -- daily, weekly, monthly
    last_sync_at TIMESTAMP,
    next_sync_at TIMESTAMP,

    -- API quota tracking
    api_calls_today INTEGER DEFAULT 0,
    api_quota_limit INTEGER DEFAULT 200,  -- GSC API limit

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_error TEXT,

    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sync history for tracking ETL jobs
CREATE TABLE IF NOT EXISTS gsc_sync_history (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    sync_type VARCHAR(50),  -- 'daily_traffic', 'keywords', 'urls', 'all'
    status VARCHAR(20),  -- 'started', 'completed', 'failed'
    records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    duration_seconds INTEGER,

    -- Metadata
    metadata JSONB  -- Store additional sync details
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_gsc_daily_traffic_company ON gsc_daily_traffic(company_id);
CREATE INDEX IF NOT EXISTS idx_gsc_daily_traffic_date ON gsc_daily_traffic(date);
CREATE INDEX IF NOT EXISTS idx_gsc_daily_traffic_device ON gsc_daily_traffic(device);
CREATE INDEX IF NOT EXISTS idx_gsc_daily_traffic_company_date ON gsc_daily_traffic(company_id, date);

CREATE INDEX IF NOT EXISTS idx_gsc_keywords_company ON gsc_keywords(company_id);
CREATE INDEX IF NOT EXISTS idx_gsc_keywords_keyword ON gsc_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_gsc_keywords_device ON gsc_keywords(device);
CREATE INDEX IF NOT EXISTS idx_gsc_keywords_clicks ON gsc_keywords(clicks DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_keywords_geo_seo_id ON gsc_keywords(geo_seo_keyword_id);

CREATE INDEX IF NOT EXISTS idx_gsc_urls_company ON gsc_urls(company_id);
CREATE INDEX IF NOT EXISTS idx_gsc_urls_url ON gsc_urls(url);
CREATE INDEX IF NOT EXISTS idx_gsc_urls_device ON gsc_urls(device);
CREATE INDEX IF NOT EXISTS idx_gsc_urls_clicks ON gsc_urls(clicks DESC);

CREATE INDEX IF NOT EXISTS idx_gsc_integrations_company ON gsc_integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_gsc_sync_history_company ON gsc_sync_history(company_id);
CREATE INDEX IF NOT EXISTS idx_gsc_sync_history_status ON gsc_sync_history(status);

-- Update timestamp triggers
CREATE TRIGGER gsc_daily_traffic_updated_at
    BEFORE UPDATE ON gsc_daily_traffic
    FOR EACH ROW
    EXECUTE FUNCTION update_serpbear_updated_at();  -- Reuse existing function

CREATE TRIGGER gsc_keywords_updated_at
    BEFORE UPDATE ON gsc_keywords
    FOR EACH ROW
    EXECUTE FUNCTION update_serpbear_updated_at();

CREATE TRIGGER gsc_urls_updated_at
    BEFORE UPDATE ON gsc_urls
    FOR EACH ROW
    EXECUTE FUNCTION update_serpbear_updated_at();

CREATE TRIGGER gsc_integrations_updated_at
    BEFORE UPDATE ON gsc_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_serpbear_updated_at();

-- Comments for documentation
COMMENT ON TABLE gsc_daily_traffic IS 'Daily Google Search Console traffic metrics by device';
COMMENT ON TABLE gsc_keywords IS 'Top performing keywords from Google Search Console';
COMMENT ON TABLE gsc_urls IS 'Top performing URLs/pages from Google Search Console';
COMMENT ON TABLE gsc_integrations IS 'Google Search Console OAuth integration settings per company';
COMMENT ON TABLE gsc_sync_history IS 'ETL sync job history for tracking and debugging';

COMMENT ON COLUMN gsc_daily_traffic.ctr IS 'Click-through rate (clicks/impressions)';
COMMENT ON COLUMN gsc_daily_traffic.position IS 'Average SERP position for all queries';
COMMENT ON COLUMN gsc_keywords.geo_seo_keyword_id IS 'Links to our existing keywords table for unified tracking';
COMMENT ON COLUMN gsc_integrations.access_token IS 'OAuth access token (encrypted at application layer)';
COMMENT ON COLUMN gsc_integrations.refresh_token IS 'OAuth refresh token (encrypted at application layer)';
COMMENT ON COLUMN gsc_integrations.api_calls_today IS 'Track API usage to avoid hitting quota limits';

-- Sample queries for analysis

-- Get traffic trends for a company
-- SELECT
--     date,
--     device,
--     clicks,
--     impressions,
--     ctr,
--     position
-- FROM gsc_daily_traffic
-- WHERE company_id = 1
-- ORDER BY date DESC, device;

-- Get top keywords across all devices
-- SELECT
--     keyword,
--     SUM(clicks) as total_clicks,
--     SUM(impressions) as total_impressions,
--     AVG(ctr) as avg_ctr,
--     AVG(position) as avg_position
-- FROM gsc_keywords
-- WHERE company_id = 1
-- GROUP BY keyword
-- ORDER BY total_clicks DESC
-- LIMIT 50;

-- Compare device performance
-- SELECT
--     device,
--     COUNT(*) as total_days,
--     AVG(clicks) as avg_daily_clicks,
--     AVG(impressions) as avg_daily_impressions,
--     AVG(ctr) as avg_ctr,
--     AVG(position) as avg_position
-- FROM gsc_daily_traffic
-- WHERE company_id = 1
-- AND date >= NOW() - INTERVAL '30 days'
-- GROUP BY device;

-- Find pages that need optimization (high impressions, low clicks)
-- SELECT
--     url,
--     impressions,
--     clicks,
--     ctr,
--     position
-- FROM gsc_urls
-- WHERE company_id = 1
-- AND impressions > 100
-- AND ctr < 0.02  -- Less than 2% CTR
-- ORDER BY impressions DESC;
