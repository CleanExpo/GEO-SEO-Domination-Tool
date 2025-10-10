-- UP Migration: Add missing onboarding columns to company_portfolios

-- Add email column
ALTER TABLE company_portfolios
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add phone column
ALTER TABLE company_portfolios
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Add target_keywords column (JSONB for PostgreSQL, TEXT for SQLite)
ALTER TABLE company_portfolios
ADD COLUMN IF NOT EXISTS target_keywords JSONB;

-- Add target_locations column (JSONB for PostgreSQL, TEXT for SQLite)
ALTER TABLE company_portfolios
ADD COLUMN IF NOT EXISTS target_locations JSONB;

-- Add content_preferences column (JSONB for PostgreSQL, TEXT for SQLite)
ALTER TABLE company_portfolios
ADD COLUMN IF NOT EXISTS content_preferences JSONB;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolios_email ON company_portfolios(email);
CREATE INDEX IF NOT EXISTS idx_portfolios_phone ON company_portfolios(phone);

-- ROLLBACK:
-- ALTER TABLE company_portfolios DROP COLUMN IF EXISTS email;
-- ALTER TABLE company_portfolios DROP COLUMN IF EXISTS phone;
-- ALTER TABLE company_portfolios DROP COLUMN IF EXISTS target_keywords;
-- ALTER TABLE company_portfolios DROP COLUMN IF EXISTS target_locations;
-- ALTER TABLE company_portfolios DROP COLUMN IF EXISTS content_preferences;
-- DROP INDEX IF EXISTS idx_portfolios_email;
-- DROP INDEX IF EXISTS idx_portfolios_phone;
