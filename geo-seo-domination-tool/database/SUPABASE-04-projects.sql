-- ========================================
-- FILE 4 OF 8: Project Management Tables
-- Purpose: Create project hub, templates, and generation tracking tables
-- Dependencies: auth.users (Supabase built-in)
-- Tables Created: hub_projects, hub_collections, hub_collection_projects, project_templates, generated_projects, crm_projects, crm_project_members, crm_project_notes, crm_github_projects
-- Run this AFTER SUPABASE-03-crm.sql completes
-- ========================================

-- 1. HUB_PROJECTS TABLE
-- Used by: /app/projects, Project Hub Dashboard
-- Purpose: Central registry for all tools, builds, and projects
CREATE TABLE IF NOT EXISTS hub_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  project_type TEXT CHECK(project_type IN ('internal', 'client', 'personal', 'prototype')),

  live_url TEXT,
  dev_url TEXT,
  github_repo TEXT,
  vercel_url TEXT,

  icon TEXT,
  color TEXT,
  thumbnail_url TEXT,

  status TEXT CHECK(status IN ('active', 'development', 'paused', 'archived')),
  visibility TEXT CHECK(visibility IN ('public', 'private', 'team')),

  features JSONB DEFAULT '[]'::JSONB,
  tech_stack JSONB DEFAULT '[]'::JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_hub_projects_slug ON hub_projects(slug);
CREATE INDEX IF NOT EXISTS idx_hub_projects_status ON hub_projects(status);
CREATE INDEX IF NOT EXISTS idx_hub_projects_user ON hub_projects(user_id);

COMMENT ON TABLE hub_projects IS 'Central project registry for all tools and applications';

-- 2. HUB_COLLECTIONS TABLE
-- Used by: /app/projects
-- Purpose: Group projects into collections/workspaces
CREATE TABLE IF NOT EXISTS hub_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_hub_collections_user ON hub_collections(user_id);

COMMENT ON TABLE hub_collections IS 'Project collections and workspaces';

-- 3. HUB_COLLECTION_PROJECTS TABLE (Many-to-many)
-- Used by: /app/projects
-- Purpose: Map projects to collections
CREATE TABLE IF NOT EXISTS hub_collection_projects (
  collection_id UUID REFERENCES hub_collections(id) ON DELETE CASCADE,
  project_id UUID REFERENCES hub_projects(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (collection_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_hub_collection_projects_collection ON hub_collection_projects(collection_id);
CREATE INDEX IF NOT EXISTS idx_hub_collection_projects_project ON hub_collection_projects(project_id);

COMMENT ON TABLE hub_collection_projects IS 'Many-to-many mapping of projects to collections';

-- 4. PROJECT_TEMPLATES TABLE
-- Used by: Project generation system
-- Purpose: Store project scaffolding templates
CREATE TABLE IF NOT EXISTS project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK(category IN ('web', 'mobile', 'api', 'fullstack', 'ai', 'data', 'desktop')),

  tech_stack JSONB DEFAULT '[]'::JSONB,
  base_framework TEXT,

  template_path TEXT NOT NULL,
  entry_file TEXT,

  available_features JSONB DEFAULT '[]'::JSONB,
  required_integrations JSONB DEFAULT '[]'::JSONB,
  optional_integrations JSONB DEFAULT '[]'::JSONB,

  default_config JSONB DEFAULT '{}'::JSONB,
  env_variables JSONB DEFAULT '[]'::JSONB,

  icon TEXT,
  preview_image TEXT,
  documentation_url TEXT,
  demo_url TEXT,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_templates_category ON project_templates(category);
CREATE INDEX IF NOT EXISTS idx_project_templates_active ON project_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_project_templates_user ON project_templates(user_id);

COMMENT ON TABLE project_templates IS 'Project scaffolding templates';

-- 5. GENERATED_PROJECTS TABLE
-- Used by: Project generation system
-- Purpose: Track generated projects and their status
CREATE TABLE IF NOT EXISTS generated_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_project_id UUID REFERENCES hub_projects(id) ON DELETE CASCADE,
  template_id UUID REFERENCES project_templates(id),

  project_name TEXT NOT NULL,
  project_slug TEXT NOT NULL,
  output_path TEXT NOT NULL,

  selected_features JSONB DEFAULT '[]'::JSONB,
  selected_integrations JSONB DEFAULT '[]'::JSONB,
  custom_config JSONB DEFAULT '{}'::JSONB,

  status TEXT CHECK(status IN ('pending', 'generating', 'completed', 'failed', 'archived')) DEFAULT 'pending',
  generation_progress INTEGER DEFAULT 0,

  folder_created BOOLEAN DEFAULT FALSE,
  files_generated BOOLEAN DEFAULT FALSE,
  dependencies_installed BOOLEAN DEFAULT FALSE,
  env_configured BOOLEAN DEFAULT FALSE,
  integrations_setup BOOLEAN DEFAULT FALSE,
  database_migrated BOOLEAN DEFAULT FALSE,
  git_initialized BOOLEAN DEFAULT FALSE,
  ide_opened BOOLEAN DEFAULT FALSE,
  all_ready BOOLEAN DEFAULT FALSE,

  ide_preference TEXT CHECK(ide_preference IN ('vscode', 'cursor', 'webstorm', 'none')),
  ide_opened_at TIMESTAMPTZ,

  error_log JSONB DEFAULT '[]'::JSONB,
  last_error TEXT,

  generated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_generated_projects_status ON generated_projects(status);
CREATE INDEX IF NOT EXISTS idx_generated_projects_hub_project ON generated_projects(hub_project_id);
CREATE INDEX IF NOT EXISTS idx_generated_projects_user ON generated_projects(user_id);

COMMENT ON TABLE generated_projects IS 'Tracking for generated projects from templates';

-- 6. CRM_PROJECTS TABLE
-- Used by: /app/crm, /app/projects
-- Purpose: CRM project management (distinct from hub_projects)
CREATE TABLE IF NOT EXISTS crm_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'on-hold')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crm_projects_status ON crm_projects(status);
CREATE INDEX IF NOT EXISTS idx_crm_projects_user ON crm_projects(user_id);

COMMENT ON TABLE crm_projects IS 'CRM project management';

-- 7. CRM_PROJECT_MEMBERS TABLE (Many-to-many)
-- Used by: /app/crm
-- Purpose: Track project team members
CREATE TABLE IF NOT EXISTS crm_project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES crm_projects(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crm_project_members_project ON crm_project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_crm_project_members_user ON crm_project_members(user_id);

COMMENT ON TABLE crm_project_members IS 'Project team members (many-to-many)';

-- 8. CRM_PROJECT_NOTES TABLE
-- Used by: /app/projects/notes
-- Purpose: Project notes and documentation
CREATE TABLE IF NOT EXISTS crm_project_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES crm_projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crm_project_notes_project_id ON crm_project_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_crm_project_notes_category ON crm_project_notes(category);
CREATE INDEX IF NOT EXISTS idx_crm_project_notes_user ON crm_project_notes(user_id);

COMMENT ON TABLE crm_project_notes IS 'Project notes and documentation';

-- 9. CRM_GITHUB_PROJECTS TABLE
-- Used by: /app/projects/github
-- Purpose: Track GitHub repository integrations
CREATE TABLE IF NOT EXISTS crm_github_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  url TEXT UNIQUE NOT NULL,
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  open_prs INTEGER DEFAULT 0,
  language TEXT,
  last_updated DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crm_github_projects_url ON crm_github_projects(url);
CREATE INDEX IF NOT EXISTS idx_crm_github_projects_user ON crm_github_projects(user_id);

COMMENT ON TABLE crm_github_projects IS 'GitHub repository tracking';

-- Verification: Check tables were created
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('hub_projects', 'hub_collections', 'hub_collection_projects', 'project_templates', 'generated_projects', 'crm_projects', 'crm_project_members', 'crm_project_notes', 'crm_github_projects')
ORDER BY table_name;

-- Expected output: 9 rows showing all project-related tables
