-- Migration: Add Project Notes Table
-- Version: 002
-- Date: 2025-10-03

-- This migration adds the crm_project_notes table for the Projects/Notes page

-- UP Migration
-- Project Notes Table
CREATE TABLE IF NOT EXISTS crm_project_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT, -- JSON array stored as text
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES crm_projects(id) ON DELETE SET NULL
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_notes_project_id ON crm_project_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_notes_category ON crm_project_notes(category);
CREATE INDEX IF NOT EXISTS idx_project_notes_created_at ON crm_project_notes(created_at);

-- ROLLBACK:
DROP INDEX IF EXISTS idx_project_notes_created_at;
DROP INDEX IF EXISTS idx_project_notes_category;
DROP INDEX IF EXISTS idx_project_notes_project_id;
DROP TABLE IF EXISTS crm_project_notes;
