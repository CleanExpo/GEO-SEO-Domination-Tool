-- SiteOne Crawler Integration Schema for Supabase
-- Technical SEO audit results storage

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Technical SEO audit runs
CREATE TABLE IF NOT EXISTS technical_audits (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    url TEXT NOT NULL,  -- Domain/URL audited
    audit_type VARCHAR(50) DEFAULT 'full',  -- full, quick, deep
    status VARCHAR(20) DEFAULT 'pending',  -- pending, running, completed, failed

    -- Overall scores
    seo_score INTEGER,  -- 0-100
    security_score INTEGER,  -- 0-100
    accessibility_score INTEGER,  -- 0-100
    performance_score INTEGER,  -- 0-100

    -- Statistics
    total_pages INTEGER DEFAULT 0,
    total_assets INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    total_warnings INTEGER DEFAULT 0,
    crawl_duration_seconds INTEGER,

    -- Metadata
    crawler_version VARCHAR(50),
    user_agent TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Detailed audit issues/findings
CREATE TABLE IF NOT EXISTS audit_issues (
    id SERIAL PRIMARY KEY,
    audit_id INTEGER REFERENCES technical_audits(id) ON DELETE CASCADE,

    -- Issue classification
    severity VARCHAR(20) NOT NULL,  -- critical, error, warning, info
    category VARCHAR(50) NOT NULL,  -- seo, security, accessibility, performance, broken-links
    issue_type VARCHAR(100) NOT NULL,  -- missing-meta-description, broken-link, slow-page, etc.

    -- Issue details
    page_url TEXT,
    element TEXT,  -- HTML element or resource causing issue
    message TEXT NOT NULL,
    recommendation TEXT,

    -- Technical details
    http_status_code INTEGER,
    response_time_ms INTEGER,
    file_size_bytes BIGINT,

    -- Context
    metadata JSONB,  -- Additional issue-specific data

    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sitemap generation results
CREATE TABLE IF NOT EXISTS generated_sitemaps (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    audit_id INTEGER REFERENCES technical_audits(id) ON DELETE CASCADE,

    -- Sitemap details
    sitemap_type VARCHAR(20),  -- xml, txt, html
    file_path TEXT,  -- Path to generated file
    file_size_bytes BIGINT,
    total_urls INTEGER,

    -- URL breakdown
    urls_by_priority JSONB,  -- {high: 100, medium: 200, low: 50}
    urls_by_change_freq JSONB,  -- {daily: 50, weekly: 100, monthly: 200}

    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW()
);

-- Broken links tracking
CREATE TABLE IF NOT EXISTS broken_links (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    audit_id INTEGER REFERENCES technical_audits(id) ON DELETE CASCADE,

    -- Link details
    source_url TEXT NOT NULL,  -- Page containing the broken link
    broken_url TEXT NOT NULL,  -- The broken link itself
    link_text TEXT,
    link_type VARCHAR(20),  -- internal, external, image, script, css

    -- Error details
    http_status_code INTEGER,
    error_message TEXT,
    redirect_chain JSONB,  -- [{url, status}, ...]

    -- Status
    is_fixed BOOLEAN DEFAULT false,
    fixed_at TIMESTAMP,

    -- Audit fields
    first_detected_at TIMESTAMP DEFAULT NOW(),
    last_checked_at TIMESTAMP DEFAULT NOW()
);

-- Page performance metrics
CREATE TABLE IF NOT EXISTS page_performance (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    audit_id INTEGER REFERENCES technical_audits(id) ON DELETE CASCADE,

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
    h1_tags JSONB,  -- Array of H1 text
    canonical_url TEXT,
    has_robots_meta BOOLEAN,

    -- Schema.org data
    structured_data JSONB,  -- Detected schema.org markup

    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW()
);

-- Crawler execution logs
CREATE TABLE IF NOT EXISTS crawler_logs (
    id SERIAL PRIMARY KEY,
    audit_id INTEGER REFERENCES technical_audits(id) ON DELETE CASCADE,

    -- Log details
    log_level VARCHAR(20),  -- debug, info, warning, error
    message TEXT NOT NULL,
    context JSONB,  -- Additional log context

    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
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

-- Update timestamp triggers
CREATE TRIGGER technical_audits_updated_at
    BEFORE UPDATE ON technical_audits
    FOR EACH ROW
    EXECUTE FUNCTION update_serpbear_updated_at();  -- Reuse existing function

-- Comments for documentation
COMMENT ON TABLE technical_audits IS 'SiteOne Crawler technical SEO audit runs';
COMMENT ON TABLE audit_issues IS 'Detailed issues found during technical audits';
COMMENT ON TABLE generated_sitemaps IS 'Auto-generated XML/TXT/HTML sitemaps';
COMMENT ON TABLE broken_links IS 'Broken link tracking with fix status';
COMMENT ON TABLE page_performance IS 'Individual page performance metrics';
COMMENT ON TABLE crawler_logs IS 'Crawler execution logs for debugging';

COMMENT ON COLUMN technical_audits.seo_score IS 'Overall SEO health score 0-100';
COMMENT ON COLUMN technical_audits.security_score IS 'Security best practices score 0-100';
COMMENT ON COLUMN technical_audits.accessibility_score IS 'WCAG accessibility compliance score 0-100';
COMMENT ON COLUMN technical_audits.performance_score IS 'Page speed and performance score 0-100';

COMMENT ON COLUMN audit_issues.severity IS 'critical=must fix now, error=fix soon, warning=improve, info=nice-to-have';
COMMENT ON COLUMN audit_issues.category IS 'Groups issues by domain: seo, security, accessibility, performance, broken-links';

COMMENT ON COLUMN page_performance.structured_data IS 'Detected Schema.org JSON-LD markup for rich results';

-- Sample queries for dashboard

-- Get latest audit summary for a company
-- SELECT
--     ta.url,
--     ta.seo_score,
--     ta.security_score,
--     ta.accessibility_score,
--     ta.performance_score,
--     ta.total_pages,
--     ta.total_errors,
--     ta.total_warnings,
--     ta.completed_at
-- FROM technical_audits ta
-- WHERE ta.company_id = 1
-- AND ta.status = 'completed'
-- ORDER BY ta.completed_at DESC
-- LIMIT 1;

-- Get critical issues from latest audit
-- SELECT
--     ai.category,
--     ai.issue_type,
--     COUNT(*) as count,
--     array_agg(DISTINCT ai.page_url) as affected_pages
-- FROM audit_issues ai
-- JOIN technical_audits ta ON ta.id = ai.audit_id
-- WHERE ta.company_id = 1
-- AND ta.status = 'completed'
-- AND ai.severity IN ('critical', 'error')
-- GROUP BY ai.category, ai.issue_type
-- ORDER BY count DESC;

-- Get all broken links that need fixing
-- SELECT
--     bl.source_url,
--     bl.broken_url,
--     bl.link_text,
--     bl.http_status_code,
--     bl.error_message
-- FROM broken_links bl
-- WHERE bl.company_id = 1
-- AND bl.is_fixed = false
-- ORDER BY bl.first_detected_at DESC;

-- Find slow-loading pages
-- SELECT
--     pp.page_url,
--     pp.response_time_ms,
--     pp.page_size_bytes / 1024 as page_size_kb,
--     pp.total_requests,
--     pp.meta_title
-- FROM page_performance pp
-- JOIN technical_audits ta ON ta.id = pp.audit_id
-- WHERE ta.company_id = 1
-- AND pp.response_time_ms > 3000  -- Slower than 3 seconds
-- ORDER BY pp.response_time_ms DESC;
