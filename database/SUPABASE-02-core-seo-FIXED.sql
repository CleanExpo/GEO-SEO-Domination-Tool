-- ========================================
-- FILE 2 OF 8: Core SEO Tables (FIXED VERSION)
-- Purpose: Create core SEO tracking tables
-- Dependencies: auth.users (Supabase built-in)
-- Tables Created: companies, keywords, rankings, seo_audits
-- Run this AFTER SUPABASE-01-auth-tables.sql completes
-- ========================================

-- IMPORTANT: Drop old tables if they exist without user_id columns
DROP TABLE IF EXISTS rankings CASCADE;
DROP TABLE IF EXISTS keywords CASCADE;
DROP TABLE IF EXISTS seo_audits CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- 1. COMPANIES TABLE (Base table for all SEO tracking)
-- Used by: /api/companies, /api/dashboard
-- Purpose: Store company/client information for SEO tracking
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website TEXT,
  description TEXT,
  industry TEXT,
  location TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_user ON companies(user_id);
CREATE INDEX idx_companies_created_at ON companies(created_at DESC);

COMMENT ON TABLE companies IS 'Companies/clients being tracked for SEO performance';

-- 2. KEYWORDS TABLE (References companies)
-- Used by: /api/keywords, /api/companies/[id]/keywords
-- Purpose: Track keywords for ranking monitoring
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  difficulty INTEGER,
  current_rank INTEGER,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_keywords_company ON keywords(company_id);
CREATE INDEX idx_keywords_user ON keywords(user_id);
CREATE INDEX idx_keywords_keyword ON keywords(keyword);

COMMENT ON TABLE keywords IS 'Keywords being tracked for ranking performance';

-- 3. RANKINGS TABLE (References keywords)
-- Used by: /api/rankings, /api/companies/[id]/rankings
-- Purpose: Store historical keyword ranking data
CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  rank_change INTEGER DEFAULT 0,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}'::JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rankings_keyword_id ON rankings(keyword_id);
CREATE INDEX idx_rankings_checked_at ON rankings(checked_at DESC);
CREATE INDEX idx_rankings_user ON rankings(user_id);
CREATE INDEX idx_rankings_date ON rankings(date DESC);

COMMENT ON TABLE rankings IS 'Historical keyword ranking data for trend analysis';

-- 4. SEO_AUDITS TABLE (References companies, nullable)
-- Used by: /api/audits, /api/companies/[id]/seo-audit
-- Purpose: Store SEO audit results from Lighthouse and Firecrawl
CREATE TABLE seo_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  overall_score INTEGER NOT NULL,
  performance_score INTEGER NOT NULL,
  seo_score INTEGER NOT NULL,
  accessibility_score INTEGER NOT NULL,
  best_practices_score INTEGER,
  issues JSONB DEFAULT '[]'::JSONB,
  recommendations JSONB DEFAULT '[]'::JSONB,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_seo_audits_company ON seo_audits(company_id);
CREATE INDEX idx_seo_audits_user ON seo_audits(user_id);
CREATE INDEX idx_seo_audits_url ON seo_audits(url);
CREATE INDEX idx_seo_audits_created ON seo_audits(created_at DESC);
CREATE INDEX idx_seo_audits_overall_score ON seo_audits(overall_score DESC);

COMMENT ON TABLE seo_audits IS 'SEO audit results from Lighthouse and Firecrawl integrations';

-- Verification: Check tables were created
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('companies', 'keywords', 'rankings', 'seo_audits')
ORDER BY table_name;

-- Expected output: 4 rows showing companies, keywords, rankings, seo_audits
