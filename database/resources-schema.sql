-- Resources System Database Schema for GEO-SEO Domination Tool
-- Compatible with both SQLite and PostgreSQL

-- Components Library Table
CREATE TABLE IF NOT EXISTS crm_components (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  framework TEXT, -- 'react', 'vue', 'angular', 'html', etc.
  category TEXT, -- 'ui', 'form', 'navigation', 'layout', etc.
  tags TEXT, -- JSON array stored as text
  demo_url TEXT,
  favorite BOOLEAN DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI Tools Library Table
CREATE TABLE IF NOT EXISTS crm_ai_tools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT, -- 'content', 'seo', 'design', 'development', etc.
  pricing TEXT, -- 'free', 'freemium', 'paid', 'enterprise'
  features TEXT, -- JSON array stored as text
  tags TEXT, -- JSON array stored as text
  rating REAL, -- 0.0-5.0
  favorite BOOLEAN DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tutorials Library Table
CREATE TABLE IF NOT EXISTS crm_tutorials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT, -- 'seo', 'development', 'design', 'marketing', etc.
  difficulty TEXT DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
  duration INTEGER, -- Duration in minutes
  tags TEXT, -- JSON array stored as text
  video_url TEXT,
  resources TEXT, -- JSON array stored as text
  favorite BOOLEAN DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_components_category ON crm_components(category);
CREATE INDEX idx_components_framework ON crm_components(framework);
CREATE INDEX idx_components_favorite ON crm_components(favorite);

CREATE INDEX idx_ai_tools_category ON crm_ai_tools(category);
CREATE INDEX idx_ai_tools_pricing ON crm_ai_tools(pricing);
CREATE INDEX idx_ai_tools_favorite ON crm_ai_tools(favorite);

CREATE INDEX idx_tutorials_category ON crm_tutorials(category);
CREATE INDEX idx_tutorials_difficulty ON crm_tutorials(difficulty);
CREATE INDEX idx_tutorials_favorite ON crm_tutorials(favorite);
