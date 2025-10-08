-- ============================================================================
-- GEO-SEO DOMINATION TOOL - MASTER INITIALIZATION SCRIPT
-- ============================================================================
-- This file loads all schema files in the correct order
-- Run this to initialize the complete database from scratch
-- ============================================================================

-- Core company and SEO data (foundation)
.read schema.sql
.read 02-core-seo.sql

-- User and authentication
.read user-settings-schema.sql
.read add-user-id-columns.sql

-- Onboarding system
.read onboarding-schema.sql
.read client-onboarding-schema.sql
.read saved-onboarding-schema.sql

-- Client subscriptions and autopilot (NEW!)
.read client-subscriptions-schema.sql

-- Autonomous tasks and agents
.read autonomous-tasks-schema.sql
.read agent-system-schema.sql

-- Content and SEO features
.read content-opportunities-schema.sql
.read ai-search-schema.sql
.read marketing-knowledge-schema.sql

-- CRM and project management
.read empire-crm-schema-sqlite.sql

-- Integrations
.read integrations-schema.sql
.read integrations-migration.sql
.read google-search-console-schema.sql

-- Monitoring and tracking
.read seo-monitor-schema.sql
.read serpbear-schema.sql
.read siteone-crawler-schema.sql

-- Notifications and scheduling
.read notifications-schema.sql
.read scheduled-jobs-schema.sql

-- Support and tickets
.read support-tickets-schema.sql

-- Sandbox and development
.read sandbox-schema.sql

-- Localization
.read localization-schema.sql

-- ============================================================================
-- INITIALIZATION COMPLETE
-- ============================================================================
-- Total schemas loaded: 26
-- Database ready for use
-- ============================================================================
