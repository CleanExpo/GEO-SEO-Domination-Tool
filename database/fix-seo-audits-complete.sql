-- Complete fix for seo_audits table - recreate with all required columns
-- Run this in your Supabase SQL Editor

-- Drop the existing table if you want a clean start (CAUTION: This deletes all audit data)
-- DROP TABLE IF EXISTS seo_audits CASCADE;

-- Or safer: Add all missing columns to existing table
DO $$
BEGIN
  -- Add url if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_audits' AND column_name = 'url'
  ) THEN
    ALTER TABLE seo_audits ADD COLUMN url TEXT NOT NULL DEFAULT '';
  END IF;

  -- Add overall_score if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_audits' AND column_name = 'overall_score'
  ) THEN
    ALTER TABLE seo_audits ADD COLUMN overall_score INTEGER;
  END IF;

  -- Add performance_score if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_audits' AND column_name = 'performance_score'
  ) THEN
    ALTER TABLE seo_audits ADD COLUMN performance_score INTEGER;
  END IF;

  -- Add seo_score if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_audits' AND column_name = 'seo_score'
  ) THEN
    ALTER TABLE seo_audits ADD COLUMN seo_score INTEGER;
  END IF;

  -- Add accessibility_score if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_audits' AND column_name = 'accessibility_score'
  ) THEN
    ALTER TABLE seo_audits ADD COLUMN accessibility_score INTEGER;
  END IF;

  -- Add best_practices_score if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_audits' AND column_name = 'best_practices_score'
  ) THEN
    ALTER TABLE seo_audits ADD COLUMN best_practices_score INTEGER;
  END IF;

  -- Add issues if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_audits' AND column_name = 'issues'
  ) THEN
    ALTER TABLE seo_audits ADD COLUMN issues JSONB;
  END IF;

  -- Add recommendations if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_audits' AND column_name = 'recommendations'
  ) THEN
    ALTER TABLE seo_audits ADD COLUMN recommendations JSONB;
  END IF;

  -- Add metadata if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_audits' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE seo_audits ADD COLUMN metadata JSONB;
  END IF;

  -- Add created_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_audits' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE seo_audits ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Verify the final schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'seo_audits'
ORDER BY ordinal_position;
