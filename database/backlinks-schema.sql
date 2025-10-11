-- Backlinks Schema - Ahrefs Alternative
-- Stores backlink data from multiple sources (GSC, Common Crawl, OpenPageRank)

-- Main backlinks table
CREATE TABLE IF NOT EXISTS backlinks (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  target_domain TEXT NOT NULL,
  anchor_text TEXT,
  link_type TEXT CHECK(link_type IN ('dofollow', 'nofollow', 'redirect')) DEFAULT 'dofollow',
  discovered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT CHECK(status IN ('active', 'lost', 'broken')) DEFAULT 'active',
  authority_score INTEGER CHECK(authority_score >= 0 AND authority_score <= 100),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backlink profiles (aggregated data)
CREATE TABLE IF NOT EXISTS backlink_profiles (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  total_backlinks INTEGER DEFAULT 0,
  referring_domains INTEGER DEFAULT 0,
  domain_rating INTEGER CHECK(domain_rating >= 0 AND domain_rating <= 100),
  url_rating INTEGER CHECK(url_rating >= 0 AND url_rating <= 100),
  dofollow_links INTEGER DEFAULT 0,
  nofollow_links INTEGER DEFAULT 0,
  broken_links INTEGER DEFAULT 0,
  link_velocity_gained INTEGER DEFAULT 0, -- Last 30 days
  link_velocity_lost INTEGER DEFAULT 0,   -- Last 30 days
  last_analyzed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id)
);

-- Anchor text distribution
CREATE TABLE IF NOT EXISTS anchor_text_distribution (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES backlink_profiles(id) ON DELETE CASCADE,
  anchor_text TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  percentage REAL DEFAULT 0,
  type TEXT CHECK(type IN ('exact', 'partial', 'branded', 'generic', 'naked')) DEFAULT 'partial',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Referring domains
CREATE TABLE IF NOT EXISTS referring_domains (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES backlink_profiles(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  backlinks INTEGER DEFAULT 0,
  domain_rating INTEGER CHECK(domain_rating >= 0 AND domain_rating <= 100),
  first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  link_type TEXT CHECK(link_type IN ('dofollow', 'nofollow', 'mixed')) DEFAULT 'mixed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, domain)
);

-- Historical domain rating data
CREATE TABLE IF NOT EXISTS domain_rating_history (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  referring_domains INTEGER DEFAULT 0,
  total_backlinks INTEGER DEFAULT 0,
  domain_rating INTEGER CHECK(domain_rating >= 0 AND domain_rating <= 100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, date)
);

-- Backlink recommendations (AI-generated)
CREATE TABLE IF NOT EXISTS backlink_recommendations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES backlink_profiles(id) ON DELETE CASCADE,
  recommendation TEXT NOT NULL,
  priority TEXT CHECK(priority IN ('Critical', 'High', 'Medium', 'Low')) DEFAULT 'Medium',
  status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'dismissed')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_backlinks_company ON backlinks(company_id);
CREATE INDEX IF NOT EXISTS idx_backlinks_target_url ON backlinks(target_url);
CREATE INDEX IF NOT EXISTS idx_backlinks_source_domain ON backlinks(source_domain);
CREATE INDEX IF NOT EXISTS idx_backlinks_status ON backlinks(status);
CREATE INDEX IF NOT EXISTS idx_backlinks_discovered_date ON backlinks(discovered_date);
CREATE INDEX IF NOT EXISTS idx_backlinks_authority_score ON backlinks(authority_score DESC);

CREATE INDEX IF NOT EXISTS idx_backlink_profiles_company ON backlink_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_backlink_profiles_last_analyzed ON backlink_profiles(last_analyzed);

CREATE INDEX IF NOT EXISTS idx_anchor_text_profile ON anchor_text_distribution(profile_id);
CREATE INDEX IF NOT EXISTS idx_anchor_text_company ON anchor_text_distribution(company_id);

CREATE INDEX IF NOT EXISTS idx_referring_domains_profile ON referring_domains(profile_id);
CREATE INDEX IF NOT EXISTS idx_referring_domains_company ON referring_domains(company_id);
CREATE INDEX IF NOT EXISTS idx_referring_domains_domain ON referring_domains(domain);

CREATE INDEX IF NOT EXISTS idx_domain_rating_history_company ON domain_rating_history(company_id);
CREATE INDEX IF NOT EXISTS idx_domain_rating_history_date ON domain_rating_history(date);

CREATE INDEX IF NOT EXISTS idx_backlink_recommendations_company ON backlink_recommendations(company_id);
CREATE INDEX IF NOT EXISTS idx_backlink_recommendations_status ON backlink_recommendations(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_backlink_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_backlinks_timestamp
  BEFORE UPDATE ON backlinks
  FOR EACH ROW
  EXECUTE FUNCTION update_backlink_updated_at();

CREATE TRIGGER update_backlink_profiles_timestamp
  BEFORE UPDATE ON backlink_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_backlink_updated_at();

CREATE TRIGGER update_anchor_text_timestamp
  BEFORE UPDATE ON anchor_text_distribution
  FOR EACH ROW
  EXECUTE FUNCTION update_backlink_updated_at();

CREATE TRIGGER update_referring_domains_timestamp
  BEFORE UPDATE ON referring_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_backlink_updated_at();

CREATE TRIGGER update_recommendations_timestamp
  BEFORE UPDATE ON backlink_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_backlink_updated_at();
