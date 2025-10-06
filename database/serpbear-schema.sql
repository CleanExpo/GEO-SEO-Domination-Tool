-- SerpBear Integration Schema for Supabase
-- Rank tracking tables integrated with our existing GEO-SEO system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Domains table for SerpBear
CREATE TABLE IF NOT EXISTS serpbear_domains (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    keyword_count INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP,
    added TIMESTAMP DEFAULT NOW(),
    tags JSONB DEFAULT '[]'::jsonb,
    notification BOOLEAN DEFAULT true,
    notification_interval VARCHAR(50) DEFAULT 'daily',
    notification_emails TEXT,
    search_console TEXT,

    -- Integration with our companies table
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,

    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Keywords table for SerpBear
CREATE TABLE IF NOT EXISTS serpbear_keywords (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(500) NOT NULL,
    device VARCHAR(20) DEFAULT 'desktop',
    country VARCHAR(10) DEFAULT 'US',
    city VARCHAR(255) DEFAULT '',
    latlong VARCHAR(100) DEFAULT '',
    domain VARCHAR(255) NOT NULL,
    last_updated TIMESTAMP,
    added TIMESTAMP DEFAULT NOW(),
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
    geo_seo_keyword_id INTEGER REFERENCES keywords(id) ON DELETE SET NULL,

    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_serpbear_domains_company ON serpbear_domains(company_id);
CREATE INDEX IF NOT EXISTS idx_serpbear_domains_slug ON serpbear_domains(slug);
CREATE INDEX IF NOT EXISTS idx_serpbear_domains_domain ON serpbear_domains(domain);

CREATE INDEX IF NOT EXISTS idx_serpbear_keywords_keyword ON serpbear_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_serpbear_keywords_domain ON serpbear_keywords(domain);
CREATE INDEX IF NOT EXISTS idx_serpbear_keywords_country ON serpbear_keywords(country);
CREATE INDEX IF NOT EXISTS idx_serpbear_keywords_device ON serpbear_keywords(device);
CREATE INDEX IF NOT EXISTS idx_serpbear_keywords_position ON serpbear_keywords(position);
CREATE INDEX IF NOT EXISTS idx_serpbear_keywords_geo_seo_id ON serpbear_keywords(geo_seo_keyword_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_serpbear_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER serpbear_domains_updated_at
    BEFORE UPDATE ON serpbear_domains
    FOR EACH ROW
    EXECUTE FUNCTION update_serpbear_updated_at();

CREATE TRIGGER serpbear_keywords_updated_at
    BEFORE UPDATE ON serpbear_keywords
    FOR EACH ROW
    EXECUTE FUNCTION update_serpbear_updated_at();

-- Comments for documentation
COMMENT ON TABLE serpbear_domains IS 'SerpBear domain tracking integrated with GEO-SEO companies';
COMMENT ON TABLE serpbear_keywords IS 'SerpBear keyword tracking with SERP position history';
COMMENT ON COLUMN serpbear_domains.company_id IS 'Links to our companies table for unified CRM';
COMMENT ON COLUMN serpbear_keywords.geo_seo_keyword_id IS 'Links to our keywords table for unified tracking';
COMMENT ON COLUMN serpbear_keywords.history IS 'Array of historical ranking positions [{date, position, url}]';
COMMENT ON COLUMN serpbear_keywords.last_result IS 'Latest SERP scraping result details';
COMMENT ON COLUMN serpbear_keywords.volume IS 'Monthly search volume for the keyword';

-- Sample query to link SerpBear data with our companies
-- SELECT
--     c.name as company_name,
--     d.domain,
--     COUNT(k.id) as total_keywords,
--     AVG(k.position) as avg_position
-- FROM companies c
-- JOIN serpbear_domains d ON d.company_id = c.id
-- JOIN serpbear_keywords k ON k.domain = d.domain
-- GROUP BY c.name, d.domain;
