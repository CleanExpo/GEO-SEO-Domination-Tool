-- ========================================
-- FILE 5 OF 8: Resource Library Tables
-- Purpose: Create resource library tables for prompts, components, AI tools, and tutorials
-- Dependencies: auth.users (Supabase built-in)
-- Tables Created: crm_prompts, crm_components, crm_ai_tools, crm_tutorials, resource_categories
-- Run this AFTER SUPABASE-04-projects.sql completes
-- ========================================

-- 1. CRM_PROMPTS TABLE
-- Used by: /app/resources/prompts
-- Purpose: Store AI prompt templates library
CREATE TABLE IF NOT EXISTS crm_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags JSONB DEFAULT '[]'::JSONB,
  favorite BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crm_prompts_category ON crm_prompts(category);
CREATE INDEX IF NOT EXISTS idx_crm_prompts_favorite ON crm_prompts(favorite);
CREATE INDEX IF NOT EXISTS idx_crm_prompts_user ON crm_prompts(user_id);

COMMENT ON TABLE crm_prompts IS 'AI prompt templates library';

-- 2. CRM_COMPONENTS TABLE
-- Used by: /app/resources/components
-- Purpose: Store reusable code components library
CREATE TABLE IF NOT EXISTS crm_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  framework TEXT,
  category TEXT,
  tags JSONB DEFAULT '[]'::JSONB,
  demo_url TEXT,
  favorite BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crm_components_category ON crm_components(category);
CREATE INDEX IF NOT EXISTS idx_crm_components_framework ON crm_components(framework);
CREATE INDEX IF NOT EXISTS idx_crm_components_favorite ON crm_components(favorite);
CREATE INDEX IF NOT EXISTS idx_crm_components_user ON crm_components(user_id);

COMMENT ON TABLE crm_components IS 'Reusable code components library';

-- 3. CRM_AI_TOOLS TABLE
-- Used by: /app/resources/ai-tools
-- Purpose: Store AI tools directory/catalog
-- Note: Also aliased as 'resource_ai_tools' in some API routes
CREATE TABLE IF NOT EXISTS crm_ai_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT,
  pricing TEXT CHECK (pricing IN ('free', 'freemium', 'paid', 'enterprise')),
  features JSONB DEFAULT '[]'::JSONB,
  tags JSONB DEFAULT '[]'::JSONB,
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  favorite BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crm_ai_tools_category ON crm_ai_tools(category);
CREATE INDEX IF NOT EXISTS idx_crm_ai_tools_pricing ON crm_ai_tools(pricing);
CREATE INDEX IF NOT EXISTS idx_crm_ai_tools_favorite ON crm_ai_tools(favorite);
CREATE INDEX IF NOT EXISTS idx_crm_ai_tools_user ON crm_ai_tools(user_id);

COMMENT ON TABLE crm_ai_tools IS 'AI tools directory and catalog (aliased as resource_ai_tools)';

-- Create view alias for backward compatibility with API routes
CREATE OR REPLACE VIEW resource_ai_tools AS SELECT * FROM crm_ai_tools;

COMMENT ON VIEW resource_ai_tools IS 'View alias for crm_ai_tools - used by API routes';

-- 4. CRM_TUTORIALS TABLE
-- Used by: /app/resources/tutorials
-- Purpose: Store tutorials and learning content
CREATE TABLE IF NOT EXISTS crm_tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT,
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration INTEGER,
  tags JSONB DEFAULT '[]'::JSONB,
  video_url TEXT,
  resources JSONB DEFAULT '[]'::JSONB,
  favorite BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crm_tutorials_category ON crm_tutorials(category);
CREATE INDEX IF NOT EXISTS idx_crm_tutorials_difficulty ON crm_tutorials(difficulty);
CREATE INDEX IF NOT EXISTS idx_crm_tutorials_favorite ON crm_tutorials(favorite);
CREATE INDEX IF NOT EXISTS idx_crm_tutorials_user ON crm_tutorials(user_id);

COMMENT ON TABLE crm_tutorials IS 'Tutorials and learning content library';

-- 5. RESOURCE_CATEGORIES TABLE
-- Used by: All resource pages for categorization
-- Purpose: Manage resource categories across all resource types
CREATE TABLE IF NOT EXISTS resource_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  resource_type TEXT CHECK (resource_type IN ('prompt', 'component', 'ai_tool', 'tutorial')),
  description TEXT,
  icon TEXT,
  color TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resource_categories_resource_type ON resource_categories(resource_type);
CREATE INDEX IF NOT EXISTS idx_resource_categories_slug ON resource_categories(slug);
CREATE INDEX IF NOT EXISTS idx_resource_categories_user ON resource_categories(user_id);

COMMENT ON TABLE resource_categories IS 'Resource categories for organizing library content';

-- Verification: Check tables were created
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('crm_prompts', 'crm_components', 'crm_ai_tools', 'crm_tutorials', 'resource_categories')
ORDER BY table_name;

-- Expected output: 5 rows showing all resource library tables

-- Verify view created
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'resource_ai_tools';

-- Expected output: 1 row showing resource_ai_tools as VIEW
