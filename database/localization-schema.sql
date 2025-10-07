-- Localization & Market Intelligence Schema
-- Stores language preferences, regional variations, and local market knowledge

CREATE TABLE IF NOT EXISTS company_localization (
  id TEXT PRIMARY KEY DEFAULT ('loc_' || lower(hex(randomblob(8)))),
  company_id TEXT NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,

  -- Language & Spelling
  language_code TEXT NOT NULL DEFAULT 'en-US' CHECK(language_code IN (
    'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-NZ', 'en-ZA', 'en-IE',
    'es-ES', 'es-MX', 'pt-PT', 'pt-BR', 'fr-FR', 'fr-CA', 'de-DE'
  )),
  spelling_variant TEXT NOT NULL DEFAULT 'US' CHECK(spelling_variant IN (
    'US', 'UK', 'Australian', 'Canadian'
  )),
  date_format TEXT NOT NULL DEFAULT 'MM/DD/YYYY' CHECK(date_format IN (
    'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'
  )),
  currency_code TEXT NOT NULL DEFAULT 'USD',
  currency_symbol TEXT NOT NULL DEFAULT '$',
  measurement_system TEXT NOT NULL DEFAULT 'imperial' CHECK(measurement_system IN ('imperial', 'metric')),

  -- Market Scope
  market_type TEXT NOT NULL DEFAULT 'local' CHECK(market_type IN (
    'local', 'regional', 'national', 'international'
  )),
  primary_service_area TEXT, -- City, State/Province, Country
  service_radius_km INTEGER, -- For local businesses
  timezone TEXT NOT NULL DEFAULT 'America/New_York',

  -- Industry Context
  industry_category TEXT NOT NULL CHECK(industry_category IN (
    'building_construction', 'legal_services', 'accounting_financial',
    'trades_services', 'healthcare', 'retail', 'hospitality',
    'professional_services', 'real_estate', 'automotive',
    'home_services', 'technology', 'education', 'other'
  )),
  industry_subcategory TEXT,

  -- Tone & Voice
  brand_voice TEXT NOT NULL DEFAULT 'professional' CHECK(brand_voice IN (
    'professional', 'friendly', 'authoritative', 'casual',
    'luxury', 'technical', 'conversational'
  )),
  formality_level INTEGER NOT NULL DEFAULT 7 CHECK(formality_level BETWEEN 1 AND 10),

  -- Local Knowledge Flags
  uses_local_slang BOOLEAN DEFAULT 0,
  emphasize_local_expertise BOOLEAN DEFAULT 1,
  requires_local_licenses BOOLEAN DEFAULT 0,
  seasonal_business BOOLEAN DEFAULT 0,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS spelling_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_us TEXT NOT NULL,
  word_uk TEXT NOT NULL,
  word_au TEXT,
  category TEXT NOT NULL, -- 'common', 'industry_specific', 'technical'
  industry TEXT, -- NULL for common words, specific for industry terms
  usage_frequency TEXT DEFAULT 'high' CHECK(usage_frequency IN ('high', 'medium', 'low'))
);

-- Common spelling variations
INSERT OR IGNORE INTO spelling_variants (word_us, word_uk, word_au, category, usage_frequency) VALUES
('color', 'colour', 'colour', 'common', 'high'),
('labor', 'labour', 'labour', 'common', 'high'),
('favor', 'favour', 'favour', 'common', 'high'),
('center', 'centre', 'centre', 'common', 'high'),
('meter', 'metre', 'metre', 'common', 'high'),
('fiber', 'fibre', 'fibre', 'common', 'high'),
('liter', 'litre', 'litre', 'common', 'medium'),
('theater', 'theatre', 'theatre', 'common', 'medium'),
('defense', 'defence', 'defence', 'common', 'high'),
('license', 'licence', 'licence', 'common', 'high'),
('practice (noun)', 'practice (noun)', 'practice (noun)', 'common', 'high'),
('practice (verb)', 'practise (verb)', 'practise (verb)', 'common', 'high'),
('analyze', 'analyse', 'analyse', 'common', 'high'),
('organize', 'organise', 'organise', 'common', 'high'),
('recognize', 'recognise', 'recognise', 'common', 'high'),
('realize', 'realise', 'realise', 'common', 'high'),
('optimization', 'optimisation', 'optimisation', 'common', 'high'),
('specialized', 'specialised', 'specialised', 'common', 'medium'),
('gray', 'grey', 'grey', 'common', 'medium'),
('check', 'cheque', 'cheque', 'common', 'medium');

CREATE TABLE IF NOT EXISTS industry_terminology (
  id TEXT PRIMARY KEY DEFAULT ('term_' || lower(hex(randomblob(8)))),
  industry TEXT NOT NULL,
  region TEXT NOT NULL, -- 'US', 'UK', 'AU', 'CA', 'global'
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  alternate_terms TEXT, -- JSON array of synonyms/regional variations
  usage_context TEXT, -- When to use this term
  formality_level INTEGER CHECK(formality_level BETWEEN 1 AND 10),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Industry-specific terminology examples
INSERT OR IGNORE INTO industry_terminology (industry, region, term, definition, alternate_terms, usage_context, formality_level) VALUES
('building_construction', 'AU', 'Builder', 'Licensed construction professional', '["contractor", "construction_professional"]', 'Australian market - builder is the standard term', 7),
('building_construction', 'US', 'General Contractor', 'Licensed construction professional overseeing projects', '["contractor", "builder", "GC"]', 'US market - GC is standard for commercial', 7),
('building_construction', 'AU', 'Tradie', 'Tradesperson or skilled worker', '["tradesperson", "trades_worker"]', 'Informal Australian term, use in casual content', 4),
('building_construction', 'UK', 'Builder', 'Construction professional', '["contractor", "construction_professional"]', 'UK standard term', 7),
('legal_services', 'AU', 'Solicitor', 'Legal professional providing advice', '["lawyer", "legal_practitioner"]', 'Australian/UK term for lawyer', 9),
('legal_services', 'US', 'Attorney', 'Legal professional', '["lawyer", "legal_counsel"]', 'US standard term', 9),
('accounting_financial', 'global', 'Chartered Accountant', 'Certified accounting professional', '["CA", "CPA", "accountant"]', 'UK/AU/Commonwealth - CA designation', 9),
('accounting_financial', 'US', 'Certified Public Accountant', 'Licensed accounting professional', '["CPA", "accountant"]', 'US designation - CPA', 9),
('trades_services', 'AU', 'Sparky', 'Electrician (informal)', '["electrician", "electrical_contractor"]', 'Casual Australian slang, use carefully', 3),
('trades_services', 'AU', 'Chippy', 'Carpenter (informal)', '["carpenter", "cabinet_maker"]', 'Casual Australian slang', 3);

CREATE TABLE IF NOT EXISTS local_search_terms (
  id TEXT PRIMARY KEY DEFAULT ('lst_' || lower(hex(randomblob(8)))),
  base_keyword TEXT NOT NULL,
  region TEXT NOT NULL,
  localized_variant TEXT NOT NULL,
  search_volume INTEGER,
  competition TEXT CHECK(competition IN ('low', 'medium', 'high')),
  intent TEXT CHECK(intent IN ('informational', 'navigational', 'transactional', 'commercial')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Localized search term examples
INSERT OR IGNORE INTO local_search_terms (base_keyword, region, localized_variant, search_volume, competition, intent) VALUES
('plumber', 'AU', 'plumber near me', 18000, 'high', 'transactional'),
('plumber', 'AU', 'emergency plumber', 9900, 'high', 'transactional'),
('lawyer', 'AU', 'solicitor [city]', 5400, 'high', 'commercial'),
('lawyer', 'US', 'attorney near me', 27000, 'high', 'commercial'),
('contractor', 'AU', 'builder [suburb]', 3600, 'medium', 'commercial'),
('contractor', 'US', 'general contractor [city]', 12000, 'high', 'commercial'),
('accountant', 'AU', 'tax accountant [city]', 2900, 'medium', 'commercial'),
('accountant', 'US', 'CPA near me', 8100, 'high', 'commercial');

CREATE TABLE IF NOT EXISTS ranking_factors_regional (
  id TEXT PRIMARY KEY DEFAULT ('rf_' || lower(hex(randomblob(8)))),
  region TEXT NOT NULL,
  search_engine TEXT NOT NULL CHECK(search_engine IN ('google', 'bing', 'baidu', 'yandex')),
  factor_name TEXT NOT NULL,
  importance_weight REAL NOT NULL CHECK(importance_weight BETWEEN 0 AND 1),
  category TEXT NOT NULL CHECK(category IN (
    'content', 'technical', 'backlinks', 'user_signals',
    'local_seo', 'mobile', 'security', 'freshness'
  )),
  description TEXT NOT NULL,
  optimization_tips TEXT, -- JSON array
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Google Ranking Factors (Global + Regional nuances)
INSERT OR IGNORE INTO ranking_factors_regional (region, search_engine, factor_name, importance_weight, category, description, optimization_tips) VALUES
('global', 'google', 'Quality Content', 0.95, 'content', 'Comprehensive, valuable content that satisfies user intent', '["E-E-A-T principles", "Answer search intent fully", "Use semantic keywords", "Original research/insights", "Multimedia content"]'),
('global', 'google', 'Backlinks Authority', 0.90, 'backlinks', 'High-quality backlinks from authoritative domains', '["Earn links naturally", "Guest posting on relevant sites", "Digital PR campaigns", "Broken link building", "Competitor backlink analysis"]'),
('global', 'google', 'Page Experience', 0.85, 'user_signals', 'Core Web Vitals + mobile-friendliness + safe browsing + HTTPS', '["Optimize LCP < 2.5s", "FID < 100ms", "CLS < 0.1", "Mobile-first design", "SSL certificate"]'),
('global', 'google', 'Content Freshness', 0.75, 'freshness', 'Regular updates signal relevance and timeliness', '["Update old content quarterly", "Add new sections", "Refresh statistics", "Update publish date strategically", "News-worthy angles"]'),
('global', 'google', 'Mobile-First Indexing', 0.88, 'mobile', 'Mobile version is primary index', '["Responsive design", "Mobile speed optimization", "Touch-friendly UI", "Avoid intrusive interstitials", "Test with Mobile-Friendly tool"]'),
('global', 'google', 'Internal Linking', 0.70, 'technical', 'Strategic internal links distribute authority', '["Use descriptive anchor text", "Link to important pages from high-traffic pages", "Breadcrumb navigation", "Hub & spoke content model", "Fix orphan pages"]'),
('global', 'google', 'Domain Authority', 0.80, 'backlinks', 'Overall site authority and trust signals', '["Build diverse backlink profile", "Remove toxic backlinks", "Maintain consistent NAP citations", "Earn mentions from authoritative sources", "Long-term link building"]'),
('global', 'google', 'User Engagement Signals', 0.78, 'user_signals', 'Dwell time, bounce rate, click-through rate', '["Engaging headlines", "Clear CTAs", "Internal link suggestions", "Improve readability", "Video content to increase time on page"]'),
('global', 'google', 'Semantic Search', 0.82, 'content', 'Understanding context and intent beyond keywords', '["Use topic clusters", "Answer related questions", "Natural language", "Structured data markup", "Entity optimization"]'),
('global', 'google', 'Site Architecture', 0.73, 'technical', 'Crawlable, logical site structure', '["XML sitemap", "Robots.txt optimization", "Flat site architecture", "Canonical tags", "No more than 3 clicks to any page"]'),

-- Local SEO factors (critical for service area businesses)
('global', 'google', 'Google Business Profile Optimization', 0.92, 'local_seo', 'Complete and optimized GBP listing', '["Verify GBP", "100% profile completion", "Weekly posts", "Respond to all reviews", "Q&A optimization", "Service area setup"]'),
('global', 'google', 'NAP Consistency', 0.87, 'local_seo', 'Name, Address, Phone consistent across web', '["Audit all citations", "Fix inconsistencies", "Update closed listings", "Schema markup NAP", "Match GBP exactly"]'),
('global', 'google', 'Local Citations', 0.80, 'local_seo', 'Mentions on local directories and industry sites', '["Build citations on industry directories", "Local chamber of commerce", "Industry associations", "Regional news sites", "Avoid duplicate listings"]'),
('global', 'google', 'Reviews Quantity & Quality', 0.91, 'local_seo', 'Positive reviews with keyword-rich responses', '["Request reviews post-service", "Respond to all reviews within 24h", "Use review schema markup", "Display reviews on website", "Address negative reviews professionally"]'),
('global', 'google', 'Localized Content', 0.84, 'local_seo', 'Location-specific pages and content', '["City/suburb landing pages", "Local news and events", "Neighborhood-specific blog posts", "Embed Google Map", "Local customer success stories"]'),

-- Bing-specific factors (important for certain markets)
('global', 'bing', 'Social Signals', 0.75, 'user_signals', 'Bing weights social media engagement higher than Google', '["Active social media presence", "Encourage social sharing", "Link to social profiles", "Engage with followers", "Share content on LinkedIn"]'),
('global', 'bing', 'Exact Match Domains', 0.65, 'technical', 'Bing gives more weight to EMDs than Google', '["Consider EMD if starting fresh", "Use hyphens sparingly", "Balance brand vs keyword domain"]'),
('global', 'bing', 'Page Load Speed', 0.80, 'technical', 'Critical factor for Bing rankings', '["Optimize images", "Enable compression", "Minimize redirects", "Leverage browser caching", "CDN implementation"]'),
('global', 'bing', 'Multimedia Content', 0.72, 'content', 'Bing rewards rich media (images, videos)', '["Optimize image alt text", "Video transcriptions", "Image sitemaps", "Schema markup for media"]');

CREATE INDEX idx_company_localization ON company_localization(company_id);
CREATE INDEX idx_spelling_category ON spelling_variants(category);
CREATE INDEX idx_industry_terminology ON industry_terminology(industry, region);
CREATE INDEX idx_local_search_region ON local_search_terms(region);
CREATE INDEX idx_ranking_factors ON ranking_factors_regional(search_engine, importance_weight DESC);
