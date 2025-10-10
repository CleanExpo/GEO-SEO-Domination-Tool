-- URGENT FIX: Make seo_audits.user_id nullable
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/sql/new

-- This allows server-side SEO audits to be created without a user session
ALTER TABLE seo_audits ALTER COLUMN user_id DROP NOT NULL;

-- Verify the change
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'seo_audits' AND column_name = 'user_id';

-- Expected result: is_nullable = 'YES'
