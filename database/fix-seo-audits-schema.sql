-- Fix seo_audits table schema - add missing columns if they don't exist
-- Run this in your Supabase SQL Editor

-- Add issues column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_audits' AND column_name = 'issues'
  ) THEN
    ALTER TABLE seo_audits ADD COLUMN issues JSONB;
  END IF;
END $$;

-- Add recommendations column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_audits' AND column_name = 'recommendations'
  ) THEN
    ALTER TABLE seo_audits ADD COLUMN recommendations JSONB;
  END IF;
END $$;

-- Add metadata column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_audits' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE seo_audits ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Add all other potentially missing columns
DO $$
BEGIN
  -- overall_score
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_audits' AND column_name = 'overall_score'
  ) THEN
    ALTER TABLE seo_audits ADD COLUMN overall_score INTEGER;
  END IF;

  -- performance_score
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_audits' AND column_name = 'performance_score'
  ) THEN
    ALTER TABLE seo_audits ADD COLUMN performance_score INTEGER;
  END IF;

  -- seo_score
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_audits' AND column_name = 'seo_score'
  ) THEN
    ALTER TABLE seo_audits ADD COLUMN seo_score INTEGER;
  END IF;

  -- accessibility_score
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_audits' AND column_name = 'accessibility_score'
  ) THEN
    ALTER TABLE seo_audits ADD COLUMN accessibility_score INTEGER;
  END IF;

  -- best_practices_score
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_audits' AND column_name = 'best_practices_score'
  ) THEN
    ALTER TABLE seo_audits ADD COLUMN best_practices_score INTEGER;
  END IF;
END $$;

-- Verify the schema
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'seo_audits'
ORDER BY ordinal_position;
