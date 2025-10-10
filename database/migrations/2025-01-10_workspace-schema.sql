-- UP Migration
-- Phase 1.2 Day 8-9: Workspace persistence schema

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  layout TEXT DEFAULT '{}',  -- JSON: panel sizes, collapsed states
  context TEXT DEFAULT '{}', -- JSON: currentClient, currentProject, filters
  open_files TEXT DEFAULT '[]', -- JSON: array of OpenFile objects
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_workspaces_updated_at ON workspaces(updated_at DESC);

-- ROLLBACK:
DROP TABLE IF EXISTS workspaces;
DROP INDEX IF EXISTS idx_workspaces_updated_at;
