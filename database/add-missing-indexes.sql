-- Migration: Add Missing Database Indexes
-- Date: 2025-10-09
-- Purpose: Fix N+1 query problems and improve performance on foreign key lookups
-- Estimated Performance Impact: +25% on company detail pages and CRM queries

-- UP Migration

-- Core SEO Tables
CREATE INDEX IF NOT EXISTS idx_individuals_company_id ON individuals(company_id);
CREATE INDEX IF NOT EXISTS idx_audits_company_id ON audits(company_id);
CREATE INDEX IF NOT EXISTS idx_keywords_company_id ON keywords(company_id);
CREATE INDEX IF NOT EXISTS idx_competitors_company_id ON competitors(company_id);
CREATE INDEX IF NOT EXISTS idx_citations_company_id ON citations(company_id);
CREATE INDEX IF NOT EXISTS idx_service_areas_company_id ON service_areas(company_id);

-- Ranking Performance Indexes
CREATE INDEX IF NOT EXISTS idx_rankings_keyword_id ON rankings(keyword_id);
CREATE INDEX IF NOT EXISTS idx_rankings_created_at ON rankings(created_at);
CREATE INDEX IF NOT EXISTS idx_rankings_company_keyword ON rankings(company_id, keyword_id);

-- Audit Performance Indexes
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at);
CREATE INDEX IF NOT EXISTS idx_audits_company_created ON audits(company_id, created_at);

-- CRM Tables (PostgreSQL/Supabase)
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline_stage_id ON deals(pipeline_stage_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);

-- User Authentication
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Integration Tables
CREATE INDEX IF NOT EXISTS idx_webhooks_provider ON webhooks(provider);
CREATE INDEX IF NOT EXISTS idx_webhooks_created_at ON webhooks(created_at);

-- ROLLBACK:
-- DROP INDEX IF EXISTS idx_individuals_company_id;
-- DROP INDEX IF EXISTS idx_audits_company_id;
-- DROP INDEX IF EXISTS idx_keywords_company_id;
-- DROP INDEX IF EXISTS idx_competitors_company_id;
-- DROP INDEX IF EXISTS idx_citations_company_id;
-- DROP INDEX IF EXISTS idx_service_areas_company_id;
-- DROP INDEX IF EXISTS idx_rankings_keyword_id;
-- DROP INDEX IF EXISTS idx_rankings_created_at;
-- DROP INDEX IF EXISTS idx_rankings_company_keyword;
-- DROP INDEX IF EXISTS idx_audits_created_at;
-- DROP INDEX IF EXISTS idx_audits_company_created;
-- DROP INDEX IF EXISTS idx_deals_contact_id;
-- DROP INDEX IF EXISTS idx_deals_pipeline_stage_id;
-- DROP INDEX IF EXISTS idx_tasks_assigned_to;
-- DROP INDEX IF EXISTS idx_calendar_events_user_id;
-- DROP INDEX IF EXISTS idx_users_last_login;
-- DROP INDEX IF EXISTS idx_users_is_active;
-- DROP INDEX IF EXISTS idx_webhooks_provider;
-- DROP INDEX IF EXISTS idx_webhooks_created_at;
