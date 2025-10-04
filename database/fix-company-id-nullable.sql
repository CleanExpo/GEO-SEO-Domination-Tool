-- Make company_id nullable in seo_audits table
-- This allows audits for custom URLs without a company

ALTER TABLE seo_audits 
ALTER COLUMN company_id DROP NOT NULL;

-- Verify the change
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'seo_audits' AND column_name = 'company_id';
