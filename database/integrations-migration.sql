-- ============================================
-- GEO-SEO Domination Tool - Integrations Migration
-- ============================================
-- Unified migration for all forked GitHub project schemas
-- Run this after initial database setup to add integration tables
--
-- IMPORTANT: This requires the base schema.sql to be run first
-- as it creates the companies and keywords tables that are referenced
--
-- Usage:
--   psql $DATABASE_URL -f database/integrations-migration.sql
--   OR
--   Run via Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. SERPBEAR - RANK TRACKING
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Domains table for SerpBear
CREATE TABLE IF NOT EXISTS serpbear_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    keyword_count INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE,
    added TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tags JSONB DEFAULT '[]'::jsonb,
    notification BOOLEAN DEFAULT true,
    notification_interval VARCHAR(50) DEFAULT 'daily',
    notification_emails TEXT,
    search_console TEXT,

    -- Integration with our companies table
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Keywords table for SerpBear
CREATE TABLE IF NOT EXISTS serpbear_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword VARCHAR(500) NOT NULL,
    device VARCHAR(20) DEFAULT 'desktop',
    country VARCHAR(10) DEFAULT 'US',
    city VARCHAR(255) DEFAULT '',
    latlong VARCHAR(100) DEFAULT '',
    domain VARCHAR(255) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE,
    added TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    position INTEGER DEFAULT 0,
    history JSONB DEFAULT '[]'::jsonb,
    volume INTEGER DEFAULT 0,
    url JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    last_result JSONB DEFAULT '[]'::jsonb,
    sticky BOOLEAN DEFAULT true,
    updating BOOLEAN DEFAULT false,
    last_update_error VARCHAR(500) DEFAULT 'false',
    settings JSONB,

    -- Integration with our keywords table
    geo_seo_keyword_id UUID REFERENCES keywords(id) ON DELETE SET NULL,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for SerpBear
CREATE INDEX IF NOT EXISTS idx_serpbear_domains_company ON serpbear_domains(company_id);
CREATE INDEX IF NOT EXISTS idx_serpbear_domains_slug ON serpbear_domains(slug);
CREATE INDEX IF NOT EXISTS idx_serpbear_domains_domain ON serpbear_domains(domain);

CREATE INDEX IF NOT EXISTS idx_serpbear_keywords_keyword ON serpbear_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_serpbear_keywords_domain ON serpbear_keywords(domain);
CREATE INDEX IF NOT EXISTS idx_serpbear_keywords_country ON serpbear_keywords(country);
CREATE INDEX IF NOT EXISTS idx_serpbear_keywords_device ON serpbear_keywords(device);
CREATE INDEX IF NOT EXISTS idx_serpbear_keywords_position ON serpbear_keywords(position);
CREATE INDEX IF NOT EXISTS idx_serpbear_keywords_geo_seo_id ON serpbear_keywords(geo_seo_keyword_id);

-- Update timestamp trigger for SerpBear
CREATE OR REPLACE FUNCTION update_serpbear_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS serpbear_domains_updated_at ON serpbear_domains;
CREATE TRIGGER serpbear_domains_updated_at
    BEFORE UPDATE ON serpbear_domains
    FOR EACH ROW
    EXECUTE FUNCTION update_serpbear_updated_at();

DROP TRIGGER IF EXISTS serpbear_keywords_updated_at ON serpbear_keywords;
CREATE TRIGGER serpbear_keywords_updated_at
    BEFORE UPDATE ON serpbear_keywords
    FOR EACH ROW
    EXECUTE FUNCTION update_serpbear_updated_at();

-- ============================================
-- 2. GOOGLE SEARCH CONSOLE - TRAFFIC ANALYTICS
-- ============================================

-- Daily traffic metrics from Google Search Console
CREATE TABLE IF NOT EXISTS gsc_daily_traffic (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

    -- Core metrics
    clicks DECIMAL(10,2) NOT NULL DEFAULT 0,
    impressions DECIMAL(10,2) NOT NULL DEFAULT 0,
    ctr DECIMAL(5,4) NOT NULL DEFAULT 0,
    position DECIMAL(5,2) NOT NULL DEFAULT 0,

    -- Dimensions
    date DATE NOT NULL,
    device VARCHAR(20) DEFAULT 'all',

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(company_id, date, device)
);

-- Top performing keywords from GSC
CREATE TABLE IF NOT EXISTS gsc_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

    -- Keyword details
    keyword VARCHAR(500) NOT NULL,
    clicks DECIMAL(10,2) NOT NULL DEFAULT 0,
    impressions DECIMAL(10,2) NOT NULL DEFAULT 0,
    ctr DECIMAL(5,4) NOT NULL DEFAULT 0,
    position DECIMAL(5,2) NOT NULL DEFAULT 0,

    -- Time dimension
    date DATE NOT NULL,
    device VARCHAR(20) DEFAULT 'all',

    -- Integration with our keywords table
    geo_seo_keyword_id UUID REFERENCES keywords(id) ON DELETE SET NULL,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(company_id, keyword, date, device)
);

-- Top performing URLs from GSC
CREATE TABLE IF NOT EXISTS gsc_urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

    -- URL details
    url TEXT NOT NULL,
    clicks DECIMAL(10,2) NOT NULL DEFAULT 0,
    impressions DECIMAL(10,2) NOT NULL DEFAULT 0,
    ctr DECIMAL(5,4) NOT NULL DEFAULT 0,
    position DECIMAL(5,2) NOT NULL DEFAULT 0,

    -- Time dimension
    date DATE NOT NULL,
    device VARCHAR(20) DEFAULT 'all',

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(company_id, url, date, device)
);

-- Google Search Console integration settings
CREATE TABLE IF NOT EXISTS gsc_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,

    -- Integration settings
    site_url TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,

    -- Sync settings
    is_active BOOLEAN DEFAULT true,
    auto_sync BOOLEAN DEFAULT true,
    sync_frequency VARCHAR(20) DEFAULT 'daily',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    next_sync_at TIMESTAMP WITH TIME ZONE,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync history for ETL pipeline
CREATE TABLE IF NOT EXISTS gsc_sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

    -- Sync details
    status VARCHAR(20) NOT NULL,
    sync_type VARCHAR(50) DEFAULT 'manual',
    rows_synced INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for GSC
CREATE INDEX IF NOT EXISTS idx_gsc_daily_traffic_company ON gsc_daily_traffic(company_id);
CREATE INDEX IF NOT EXISTS idx_gsc_daily_traffic_date ON gsc_daily_traffic(date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_daily_traffic_device ON gsc_daily_traffic(device);

CREATE INDEX IF NOT EXISTS idx_gsc_keywords_company ON gsc_keywords(company_id);
CREATE INDEX IF NOT EXISTS idx_gsc_keywords_keyword ON gsc_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_gsc_keywords_date ON gsc_keywords(date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_keywords_geo_seo_id ON gsc_keywords(geo_seo_keyword_id);

CREATE INDEX IF NOT EXISTS idx_gsc_urls_company ON gsc_urls(company_id);
CREATE INDEX IF NOT EXISTS idx_gsc_urls_date ON gsc_urls(date DESC);

CREATE INDEX IF NOT EXISTS idx_gsc_integrations_company ON gsc_integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_gsc_integrations_active ON gsc_integrations(is_active);

CREATE INDEX IF NOT EXISTS idx_gsc_sync_history_company ON gsc_sync_history(company_id);
CREATE INDEX IF NOT EXISTS idx_gsc_sync_history_status ON gsc_sync_history(status);

-- ============================================
-- 3. SITEONE CRAWLER - TECHNICAL SEO AUDITS
-- ============================================

-- Technical SEO audit runs
CREATE TABLE IF NOT EXISTS technical_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    audit_type VARCHAR(50) DEFAULT 'full',
    status VARCHAR(20) DEFAULT 'pending',

    -- Overall scores
    seo_score INTEGER,
    security_score INTEGER,
    accessibility_score INTEGER,
    performance_score INTEGER,

    -- Statistics
    total_pages INTEGER DEFAULT 0,
    total_assets INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    total_warnings INTEGER DEFAULT 0,
    crawl_duration_seconds INTEGER,

    -- Metadata
    crawler_version VARCHAR(50),
    user_agent TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detailed audit issues/findings
CREATE TABLE IF NOT EXISTS audit_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID REFERENCES technical_audits(id) ON DELETE CASCADE,

    -- Issue classification
    severity VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    issue_type VARCHAR(100) NOT NULL,

    -- Issue details
    page_url TEXT,
    element TEXT,
    message TEXT NOT NULL,
    recommendation TEXT,

    -- Technical details
    http_status_code INTEGER,
    response_time_ms INTEGER,
    file_size_bytes BIGINT,

    -- Context
    metadata JSONB,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sitemap generation results
CREATE TABLE IF NOT EXISTS generated_sitemaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    audit_id UUID REFERENCES technical_audits(id) ON DELETE CASCADE,

    -- Sitemap details
    sitemap_type VARCHAR(20),
    file_path TEXT,
    file_size_bytes BIGINT,
    total_urls INTEGER,

    -- URL breakdown
    urls_by_priority JSONB,
    urls_by_change_freq JSONB,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Broken links tracking
CREATE TABLE IF NOT EXISTS broken_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    audit_id UUID REFERENCES technical_audits(id) ON DELETE CASCADE,

    -- Link details
    source_url TEXT NOT NULL,
    broken_url TEXT NOT NULL,
    link_text TEXT,
    link_type VARCHAR(20),

    -- Error details
    http_status_code INTEGER,
    error_message TEXT,
    redirect_chain JSONB,

    -- Status
    is_fixed BOOLEAN DEFAULT false,
    fixed_at TIMESTAMP WITH TIME ZONE,

    -- Audit fields
    first_detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Page performance metrics
CREATE TABLE IF NOT EXISTS page_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    audit_id UUID REFERENCES technical_audits(id) ON DELETE CASCADE,

    -- Page details
    page_url TEXT NOT NULL,
    page_title TEXT,

    -- Performance metrics
    response_time_ms INTEGER,
    time_to_first_byte_ms INTEGER,
    page_size_bytes BIGINT,
    total_requests INTEGER,

    -- Resource breakdown
    html_size_bytes BIGINT,
    css_size_bytes BIGINT,
    js_size_bytes BIGINT,
    image_size_bytes BIGINT,

    -- SEO elements
    meta_title VARCHAR(500),
    meta_description VARCHAR(1000),
    h1_tags JSONB,
    canonical_url TEXT,
    has_robots_meta BOOLEAN,

    -- Schema.org data
    structured_data JSONB,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crawler execution logs
CREATE TABLE IF NOT EXISTS crawler_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID REFERENCES technical_audits(id) ON DELETE CASCADE,

    -- Log details
    log_level VARCHAR(20),
    message TEXT NOT NULL,
    context JSONB,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for SiteOne Crawler
CREATE INDEX IF NOT EXISTS idx_technical_audits_company ON technical_audits(company_id);
CREATE INDEX IF NOT EXISTS idx_technical_audits_status ON technical_audits(status);
CREATE INDEX IF NOT EXISTS idx_technical_audits_created ON technical_audits(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_issues_audit ON audit_issues(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_issues_severity ON audit_issues(severity);
CREATE INDEX IF NOT EXISTS idx_audit_issues_category ON audit_issues(category);
CREATE INDEX IF NOT EXISTS idx_audit_issues_type ON audit_issues(issue_type);

CREATE INDEX IF NOT EXISTS idx_broken_links_company ON broken_links(company_id);
CREATE INDEX IF NOT EXISTS idx_broken_links_audit ON broken_links(audit_id);
CREATE INDEX IF NOT EXISTS idx_broken_links_fixed ON broken_links(is_fixed);
CREATE INDEX IF NOT EXISTS idx_broken_links_source ON broken_links(source_url);

CREATE INDEX IF NOT EXISTS idx_page_performance_audit ON page_performance(audit_id);
CREATE INDEX IF NOT EXISTS idx_page_performance_url ON page_performance(page_url);

CREATE INDEX IF NOT EXISTS idx_crawler_logs_audit ON crawler_logs(audit_id);
CREATE INDEX IF NOT EXISTS idx_crawler_logs_level ON crawler_logs(log_level);

-- Update timestamp trigger for technical audits
DROP TRIGGER IF EXISTS technical_audits_updated_at ON technical_audits;
CREATE TRIGGER technical_audits_updated_at
    BEFORE UPDATE ON technical_audits
    FOR EACH ROW
    EXECUTE FUNCTION update_serpbear_updated_at();

-- ============================================
-- INTEGRATION STATUS VIEW
-- ============================================

-- Create a unified view to see all integrations for a company
CREATE OR REPLACE VIEW company_integrations AS
SELECT
    c.id as company_id,
    c.name as company_name,
    c.website,

    -- SerpBear integration
    (SELECT COUNT(*) FROM serpbear_domains WHERE company_id = c.id) as serpbear_domains,
    (SELECT COUNT(*) FROM serpbear_keywords WHERE domain IN (
        SELECT domain FROM serpbear_domains WHERE company_id = c.id
    )) as serpbear_keywords,

    -- Google Search Console integration
    (SELECT is_active FROM gsc_integrations WHERE company_id = c.id LIMIT 1) as gsc_active,
    (SELECT last_sync_at FROM gsc_integrations WHERE company_id = c.id LIMIT 1) as gsc_last_sync,
    (SELECT SUM(clicks) FROM gsc_daily_traffic
     WHERE company_id = c.id
     AND date >= NOW() - INTERVAL '30 days') as gsc_clicks_30d,

    -- Technical audits
    (SELECT COUNT(*) FROM technical_audits
     WHERE company_id = c.id
     AND status = 'completed') as total_audits,
    (SELECT seo_score FROM technical_audits
     WHERE company_id = c.id
     AND status = 'completed'
     ORDER BY completed_at DESC LIMIT 1) as latest_seo_score,
    (SELECT completed_at FROM technical_audits
     WHERE company_id = c.id
     AND status = 'completed'
     ORDER BY completed_at DESC LIMIT 1) as latest_audit_date

FROM companies c
ORDER BY c.name;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get integration health for a company
CREATE OR REPLACE FUNCTION get_company_integration_health(p_company_id INTEGER)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'company_id', company_id,
        'company_name', company_name,
        'integrations', json_build_object(
            'serpbear', json_build_object(
                'enabled', serpbear_domains > 0,
                'domains', serpbear_domains,
                'keywords', serpbear_keywords
            ),
            'google_search_console', json_build_object(
                'enabled', gsc_active,
                'last_sync', gsc_last_sync,
                'clicks_30d', COALESCE(gsc_clicks_30d, 0)
            ),
            'technical_audits', json_build_object(
                'total_completed', total_audits,
                'latest_score', latest_seo_score,
                'latest_date', latest_audit_date
            )
        )
    )
    INTO result
    FROM company_integrations
    WHERE company_id = p_company_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INTEGRATION STATISTICS
-- ============================================

-- Create materialized view for dashboard statistics (refresh daily)
CREATE MATERIALIZED VIEW IF NOT EXISTS integration_statistics AS
SELECT
    -- Timestamp
    NOW() as last_updated,

    -- SerpBear stats
    (SELECT COUNT(*) FROM serpbear_domains) as total_tracked_domains,
    (SELECT COUNT(*) FROM serpbear_keywords) as total_tracked_keywords,
    (SELECT AVG(position) FROM serpbear_keywords WHERE position > 0) as avg_keyword_position,

    -- GSC stats
    (SELECT COUNT(*) FROM gsc_integrations WHERE is_active = true) as active_gsc_integrations,
    (SELECT SUM(clicks) FROM gsc_daily_traffic
     WHERE date >= NOW() - INTERVAL '30 days') as total_clicks_30d,
    (SELECT SUM(impressions) FROM gsc_daily_traffic
     WHERE date >= NOW() - INTERVAL '30 days') as total_impressions_30d,

    -- Technical audit stats
    (SELECT COUNT(*) FROM technical_audits WHERE status = 'completed') as total_completed_audits,
    (SELECT AVG(seo_score) FROM technical_audits
     WHERE status = 'completed'
     AND completed_at >= NOW() - INTERVAL '30 days') as avg_seo_score_30d,
    (SELECT COUNT(*) FROM broken_links WHERE is_fixed = false) as total_broken_links;

CREATE UNIQUE INDEX ON integration_statistics (last_updated);

-- ============================================
-- REFRESH FUNCTION
-- ============================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_integration_stats()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY integration_statistics;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

-- SerpBear comments
COMMENT ON TABLE serpbear_domains IS 'SerpBear domain tracking integrated with GEO-SEO companies';
COMMENT ON TABLE serpbear_keywords IS 'SerpBear keyword tracking with SERP position history';

-- GSC comments
COMMENT ON TABLE gsc_daily_traffic IS 'Google Search Console daily traffic metrics';
COMMENT ON TABLE gsc_keywords IS 'Top performing keywords from Google Search Console';
COMMENT ON TABLE gsc_urls IS 'Top performing URLs from Google Search Console';
COMMENT ON TABLE gsc_integrations IS 'Google Search Console OAuth integration settings';
COMMENT ON TABLE gsc_sync_history IS 'ETL sync job execution history';

-- SiteOne Crawler comments
COMMENT ON TABLE technical_audits IS 'SiteOne Crawler technical SEO audit runs';
COMMENT ON TABLE audit_issues IS 'Detailed issues found during technical audits';
COMMENT ON TABLE generated_sitemaps IS 'Auto-generated XML/TXT/HTML sitemaps';
COMMENT ON TABLE broken_links IS 'Broken link tracking with fix status';
COMMENT ON TABLE page_performance IS 'Individual page performance metrics';
COMMENT ON TABLE crawler_logs IS 'Crawler execution logs for debugging';

-- View comments
COMMENT ON VIEW company_integrations IS 'Unified view of all integration statuses per company';
COMMENT ON MATERIALIZED VIEW integration_statistics IS 'Cached integration statistics for dashboard (refresh daily)';

-- Function comments
COMMENT ON FUNCTION get_company_integration_health IS 'Returns JSON summary of all integrations for a company';
COMMENT ON FUNCTION refresh_integration_stats IS 'Refresh integration statistics materialized view';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Integration migration completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  • SerpBear: serpbear_domains, serpbear_keywords';
    RAISE NOTICE '  • GSC: gsc_daily_traffic, gsc_keywords, gsc_urls, gsc_integrations, gsc_sync_history';
    RAISE NOTICE '  • Technical Audits: technical_audits, audit_issues, broken_links, page_performance, generated_sitemaps, crawler_logs';
    RAISE NOTICE '';
    RAISE NOTICE 'Views created:';
    RAISE NOTICE '  • company_integrations';
    RAISE NOTICE '  • integration_statistics (materialized)';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '  • get_company_integration_health(company_id)';
    RAISE NOTICE '  • refresh_integration_stats()';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Test queries: SELECT * FROM company_integrations;';
    RAISE NOTICE '  2. Check stats: SELECT * FROM integration_statistics;';
    RAISE NOTICE '  3. Get company health: SELECT get_company_integration_health(1);';
END $$;
