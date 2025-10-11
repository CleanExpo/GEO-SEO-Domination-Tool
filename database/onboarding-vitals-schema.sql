-- Onboarding Vitals Baseline Schema
-- Stores comprehensive SEO & GEO metrics captured at client onboarding
-- This establishes baseline metrics for measuring ROI and tracking progress over time

-- Main onboarding vitals table
CREATE TABLE IF NOT EXISTS onboarding_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Google Search Console Metrics
  gsc_impressions BIGINT,
  gsc_clicks BIGINT,
  gsc_ctr DECIMAL(5,2),
  gsc_avg_position DECIMAL(5,2),
  gsc_indexed_pages INTEGER,
  gsc_coverage_issues INTEGER,
  gsc_mobile_usability_issues INTEGER,
  gsc_manual_actions INTEGER,
  gsc_https_status BOOLEAN,
  gsc_mobile_friendly BOOLEAN,
  gsc_structured_data_errors INTEGER,

  -- Core Web Vitals
  cwv_lcp DECIMAL(6,2), -- Largest Contentful Paint (ms)
  cwv_fid DECIMAL(6,2), -- First Input Delay (ms)
  cwv_cls DECIMAL(4,3), -- Cumulative Layout Shift
  cwv_inp DECIMAL(6,2), -- Interaction to Next Paint (ms)
  cwv_fcp DECIMAL(6,2), -- First Contentful Paint (ms)
  cwv_ttfb DECIMAL(6,2), -- Time to First Byte (ms)

  -- Google My Business Metrics
  gmb_profile_completeness INTEGER, -- 0-100 score
  gmb_nap_consistency BOOLEAN,
  gmb_total_reviews INTEGER,
  gmb_avg_rating DECIMAL(3,2),
  gmb_review_response_rate DECIMAL(5,2),
  gmb_photos_count INTEGER,
  gmb_posts_last_30_days INTEGER,
  gmb_search_views INTEGER,
  gmb_map_views INTEGER,
  gmb_direction_requests INTEGER,
  gmb_phone_calls INTEGER,
  gmb_website_clicks INTEGER,

  -- Bing Webmaster Tools Metrics
  bing_impressions BIGINT,
  bing_clicks BIGINT,
  bing_ctr DECIMAL(5,2),
  bing_seo_score INTEGER, -- 0-100
  bing_pages_indexed INTEGER,
  bing_crawl_errors INTEGER,
  bing_blocked_urls INTEGER,
  bing_mobile_friendly BOOLEAN,
  bing_backlinks INTEGER,
  bing_linking_domains INTEGER,
  bing_crawl_rate INTEGER, -- pages per day
  bing_last_crawl_date TIMESTAMP WITH TIME ZONE,

  -- Technical SEO Metrics
  tech_page_speed_mobile INTEGER, -- 0-100
  tech_page_speed_desktop INTEGER, -- 0-100
  tech_total_pages INTEGER,
  tech_blog_posts INTEGER,
  tech_avg_word_count INTEGER,
  tech_thin_content_pages INTEGER, -- < 300 words
  tech_duplicate_content_pct DECIMAL(5,2),
  tech_title_tags_coverage DECIMAL(5,2), -- percentage
  tech_meta_desc_coverage DECIMAL(5,2),
  tech_h1_tags_coverage DECIMAL(5,2),
  tech_alt_text_coverage DECIMAL(5,2),
  tech_internal_linking_density DECIMAL(5,2),
  tech_has_robots_txt BOOLEAN,
  tech_has_xml_sitemap BOOLEAN,
  tech_has_ssl BOOLEAN,

  -- Schema.org Markup
  schema_local_business BOOLEAN,
  schema_organization BOOLEAN,
  schema_product BOOLEAN,
  schema_faq BOOLEAN,
  schema_review BOOLEAN,
  schema_breadcrumb BOOLEAN,

  -- E-E-A-T Scores (0-100)
  eeat_experience INTEGER,
  eeat_expertise INTEGER,
  eeat_authoritativeness INTEGER,
  eeat_trustworthiness INTEGER,
  eeat_overall INTEGER,

  -- Social Proof
  social_google_reviews INTEGER,
  social_google_rating DECIMAL(3,2),
  social_facebook_followers INTEGER,
  social_instagram_followers INTEGER,
  social_linkedin_followers INTEGER,

  -- Citations
  citations_total INTEGER,
  citations_consistent_pct DECIMAL(5,2),
  citations_inconsistent INTEGER,
  citations_missing_opportunities INTEGER,

  -- Overall Health Score (0-100)
  vitals_health_score INTEGER,

  -- Raw JSON data for detailed storage
  gsc_data JSONB, -- Full GSC response
  gmb_data JSONB, -- Full GMB response
  bing_data JSONB, -- Full Bing response
  competitors_data JSONB, -- Competitor analysis
  keywords_data JSONB, -- Top keywords snapshot

  -- Audit metadata
  audit_duration_ms INTEGER,
  data_sources TEXT[], -- e.g., ['gsc', 'gmb', 'bing', 'lighthouse']
  errors JSONB, -- Any API errors encountered

  CONSTRAINT vitals_health_score_range CHECK (vitals_health_score BETWEEN 0 AND 100),
  CONSTRAINT eeat_scores_range CHECK (
    eeat_experience BETWEEN 0 AND 100 AND
    eeat_expertise BETWEEN 0 AND 100 AND
    eeat_authoritativeness BETWEEN 0 AND 100 AND
    eeat_trustworthiness BETWEEN 0 AND 100 AND
    eeat_overall BETWEEN 0 AND 100
  )
);

-- Index for fast company lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_vitals_company_id ON onboarding_vitals(company_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_vitals_captured_at ON onboarding_vitals(captured_at DESC);

-- Top keywords tracked at baseline
CREATE TABLE IF NOT EXISTS onboarding_vitals_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vitals_id UUID NOT NULL REFERENCES onboarding_vitals(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  position DECIMAL(5,2),
  impressions BIGINT,
  clicks BIGINT,
  ctr DECIMAL(5,2),
  source TEXT, -- 'google', 'bing'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vitals_keywords_vitals_id ON onboarding_vitals_keywords(vitals_id);

-- Top pages tracked at baseline
CREATE TABLE IF NOT EXISTS onboarding_vitals_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vitals_id UUID NOT NULL REFERENCES onboarding_vitals(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  clicks BIGINT,
  impressions BIGINT,
  ctr DECIMAL(5,2),
  avg_position DECIMAL(5,2),
  source TEXT, -- 'google', 'bing'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vitals_pages_vitals_id ON onboarding_vitals_pages(vitals_id);

-- Competitor baseline snapshots
CREATE TABLE IF NOT EXISTS onboarding_vitals_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vitals_id UUID NOT NULL REFERENCES onboarding_vitals(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  competitor_url TEXT,
  domain_authority INTEGER,
  estimated_traffic BIGINT,
  backlink_count BIGINT,
  gmb_rating DECIMAL(3,2),
  gmb_review_count INTEGER,
  content_volume INTEGER,
  keywords_ranking_top_10 INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vitals_competitors_vitals_id ON onboarding_vitals_competitors(vitals_id);

-- GMB categories captured at baseline
CREATE TABLE IF NOT EXISTS onboarding_vitals_gmb_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vitals_id UUID NOT NULL REFERENCES onboarding_vitals(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vitals_gmb_categories_vitals_id ON onboarding_vitals_gmb_categories(vitals_id);

-- Local Pack rankings at baseline
CREATE TABLE IF NOT EXISTS onboarding_vitals_local_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vitals_id UUID NOT NULL REFERENCES onboarding_vitals(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  position INTEGER,
  location TEXT, -- e.g., "Brisbane, QLD"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vitals_local_rankings_vitals_id ON onboarding_vitals_local_rankings(vitals_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_onboarding_vitals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_onboarding_vitals_updated_at
  BEFORE UPDATE ON onboarding_vitals
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_vitals_updated_at();

-- Comments for documentation
COMMENT ON TABLE onboarding_vitals IS 'Comprehensive baseline SEO & GEO metrics captured at client onboarding for ROI tracking';
COMMENT ON COLUMN onboarding_vitals.vitals_health_score IS 'Overall health score (0-100) calculated from weighted category scores';
COMMENT ON COLUMN onboarding_vitals.gsc_data IS 'Full Google Search Console API response stored as JSON';
COMMENT ON COLUMN onboarding_vitals.gmb_data IS 'Full Google My Business API response stored as JSON';
COMMENT ON COLUMN onboarding_vitals.bing_data IS 'Full Bing Webmaster Tools API response stored as JSON';
COMMENT ON COLUMN onboarding_vitals.eeat_experience IS 'E-E-A-T Experience score (0-100) based on case studies, testimonials, portfolio';
COMMENT ON COLUMN onboarding_vitals.eeat_expertise IS 'E-E-A-T Expertise score (0-100) based on credentials, certifications, education';
COMMENT ON COLUMN onboarding_vitals.eeat_authoritativeness IS 'E-E-A-T Authoritativeness score (0-100) based on backlinks, media mentions, awards';
COMMENT ON COLUMN onboarding_vitals.eeat_trustworthiness IS 'E-E-A-T Trustworthiness score (0-100) based on licenses, insurance, memberships';
