-- GEO-SEO Domination Tool Database Schema

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  phone TEXT NOT NULL,
  website TEXT NOT NULL,
  email TEXT,
  industry TEXT,
  services TEXT, -- JSON array
  description TEXT,
  gbp_url TEXT,
  social_profiles TEXT, -- JSON object
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Individuals (team members) table
CREATE TABLE IF NOT EXISTS individuals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  credentials TEXT, -- JSON array
  experience_years INTEGER,
  bio TEXT,
  expertise_areas TEXT, -- JSON array
  author_page_url TEXT,
  social_profiles TEXT, -- JSON object
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Audits table
CREATE TABLE IF NOT EXISTS audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  audit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  lighthouse_scores TEXT, -- JSON object (performance, accessibility, best_practices, seo, pwa)
  eeat_scores TEXT, -- JSON object (experience, expertise, authoritativeness, trustworthiness)
  local_pack_positions TEXT, -- JSON array
  competitor_data TEXT, -- JSON object
  recommendations TEXT, -- JSON array
  priority_level TEXT CHECK(priority_level IN ('low', 'medium', 'high', 'critical')),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Keywords table
CREATE TABLE IF NOT EXISTS keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  keyword TEXT NOT NULL,
  location TEXT NOT NULL,
  search_volume INTEGER,
  difficulty INTEGER,
  current_rank INTEGER,
  competition_level TEXT CHECK(competition_level IN ('low', 'medium', 'high')),
  last_checked DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Competitors table
CREATE TABLE IF NOT EXISTS competitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  competitor_name TEXT NOT NULL,
  website TEXT,
  gbp_url TEXT,
  rankings TEXT, -- JSON object
  review_count INTEGER,
  avg_rating REAL,
  last_analyzed DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Citations table
CREATE TABLE IF NOT EXISTS citations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  nap_accurate BOOLEAN DEFAULT 0,
  last_checked DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT CHECK(status IN ('active', 'pending', 'inactive')),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Service areas table
CREATE TABLE IF NOT EXISTS service_areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  area_name TEXT NOT NULL,
  area_type TEXT CHECK(area_type IN ('city', 'state', 'radius', 'custom')),
  latitude REAL,
  longitude REAL,
  radius_miles INTEGER,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Local pack tracking table
CREATE TABLE IF NOT EXISTS local_pack_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  keyword TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  position INTEGER,
  competitor_in_pack TEXT, -- JSON array of competitors
  checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Backlinks table
CREATE TABLE IF NOT EXISTS backlinks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT,
  domain_authority INTEGER,
  follow_type TEXT CHECK(follow_type IN ('dofollow', 'nofollow')),
  discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Content gaps table
CREATE TABLE IF NOT EXISTS content_gaps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  topic TEXT NOT NULL,
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  competitor_has_content BOOLEAN DEFAULT 0,
  priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
  status TEXT CHECK(status IN ('identified', 'in_progress', 'completed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Scheduled audits table
CREATE TABLE IF NOT EXISTS scheduled_audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  audit_type TEXT NOT NULL,
  frequency TEXT CHECK(frequency IN ('daily', 'weekly', 'monthly')),
  last_run DATETIME,
  next_run DATETIME,
  enabled BOOLEAN DEFAULT 1,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_keywords_company ON keywords(company_id);
CREATE INDEX IF NOT EXISTS idx_audits_company ON audits(company_id);
CREATE INDEX IF NOT EXISTS idx_competitors_company ON competitors(company_id);
CREATE INDEX IF NOT EXISTS idx_citations_company ON citations(company_id);
CREATE INDEX IF NOT EXISTS idx_local_pack_company ON local_pack_tracking(company_id);
