-- Notification System Database Schema
-- Add these tables to your existing database

-- Notification Queue Table
-- Stores notifications that need to be sent or retried
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
  payload TEXT NOT NULL, -- JSON stringified notification data
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at DATETIME,
  error_message TEXT,
  scheduled_for DATETIME,
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notification Preferences Table
-- Stores user preferences for receiving notifications
CREATE TABLE IF NOT EXISTS notification_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT, -- Optional: link to user authentication system
  email TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT 1,
  channels TEXT NOT NULL, -- JSON: {email: true, sms: false, push: false, inApp: true}
  types TEXT NOT NULL, -- JSON: {weekly_report: true, ranking_alert: true, ...}
  frequency TEXT NOT NULL, -- JSON: {weekly_report: 'weekly', ranking_alert: 'immediate', ...}
  quiet_hours TEXT, -- JSON: {enabled: true, start: '22:00', end: '08:00', timezone: 'UTC'}
  unsubscribe_token TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notification History Table
-- Tracks all sent notifications for audit and analytics
CREATE TABLE IF NOT EXISTS notification_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('sent', 'delivered', 'bounced', 'failed')),
  message_id TEXT, -- Provider's message ID
  provider TEXT, -- 'resend' or 'sendgrid'
  metadata TEXT, -- JSON: additional tracking data
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  delivered_at DATETIME,
  opened_at DATETIME,
  clicked_at DATETIME
);

-- Notification Templates Table (optional)
-- Store custom email templates for companies/users
CREATE TABLE IF NOT EXISTS notification_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER,
  notification_type TEXT NOT NULL,
  name TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL, -- HTML template with placeholders
  text_template TEXT, -- Plain text version
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Notification Subscriptions Table
-- Track specific subscriptions (e.g., subscribe to specific keyword alerts)
CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  subscription_type TEXT NOT NULL, -- 'keyword', 'company', 'competitor', etc.
  entity_id INTEGER NOT NULL, -- ID of the entity being subscribed to
  entity_type TEXT NOT NULL, -- 'keyword', 'company', 'competitor', etc.
  notification_types TEXT NOT NULL, -- JSON array of notification types
  enabled BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
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
