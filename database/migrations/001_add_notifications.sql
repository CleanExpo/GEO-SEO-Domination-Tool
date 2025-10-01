-- Migration: Add Notification System Tables
-- Version: 001
-- Date: 2025-10-02

-- This migration adds all necessary tables for the notification system

-- Notification Queue Table
CREATE TABLE IF NOT EXISTS notification_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_type TEXT NOT NULL CHECK(notification_type IN (
    'weekly_report',
    'ranking_alert',
    'audit_complete',
    'system_notification',
    'keyword_ranking_change',
    'competitor_alert',
    'citation_issue',
    'scheduled_report'
  )),
  priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK(status IN ('pending', 'queued', 'sent', 'failed')),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  payload TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at DATETIME,
  error_message TEXT,
  scheduled_for DATETIME,
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  email TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT 1,
  channels TEXT NOT NULL,
  types TEXT NOT NULL,
  frequency TEXT NOT NULL,
  quiet_hours TEXT,
  unsubscribe_token TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('sent', 'delivered', 'bounced', 'failed')),
  message_id TEXT,
  provider TEXT,
  metadata TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  delivered_at DATETIME,
  opened_at DATETIME,
  clicked_at DATETIME
);

CREATE TABLE IF NOT EXISTS notification_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER,
  notification_type TEXT NOT NULL,
  name TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  text_template TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  subscription_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  entity_type TEXT NOT NULL,
  notification_types TEXT NOT NULL,
  enabled BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_queue_recipient ON notification_queue(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notification_queue_priority ON notification_queue(priority);
CREATE INDEX IF NOT EXISTS idx_notification_queue_created ON notification_queue(created_at);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_email ON notification_preferences(email);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_enabled ON notification_preferences(enabled);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_token ON notification_preferences(unsubscribe_token);

CREATE INDEX IF NOT EXISTS idx_notification_history_recipient ON notification_history(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notification_history_type ON notification_history(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent ON notification_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_history_status ON notification_history(status);

CREATE INDEX IF NOT EXISTS idx_notification_templates_company ON notification_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_email ON notification_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_entity ON notification_subscriptions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_enabled ON notification_subscriptions(enabled);
