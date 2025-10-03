-- Scheduled Jobs Schema for Automated Ranking Checks
-- Run this in Supabase SQL Editor

-- Scheduled jobs table
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL, -- 'ranking_check', 'audit', 'report'
  name TEXT NOT NULL,
  description TEXT,
  schedule TEXT NOT NULL, -- Cron expression (e.g., '0 9 * * *' for daily at 9am)
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  config JSONB NOT NULL, -- Job-specific configuration
  created_by UUID, -- References users table (optional)
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job execution history
CREATE TABLE IF NOT EXISTS job_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES scheduled_jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- 'success', 'failed', 'running'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  result JSONB, -- Execution results
  error TEXT, -- Error message if failed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences for jobs
CREATE TABLE IF NOT EXISTS job_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES scheduled_jobs(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'email', 'slack', 'webhook'
  config JSONB NOT NULL, -- Notification-specific config (email address, webhook URL, etc.)
  notify_on_success BOOLEAN DEFAULT false,
  notify_on_failure BOOLEAN DEFAULT true,
  notify_on_significant_change BOOLEAN DEFAULT true, -- For ranking changes > threshold
  change_threshold INTEGER DEFAULT 3, -- Notify if ranking change > 3 positions
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_active ON scheduled_jobs(is_active, next_run_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_company ON scheduled_jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_job_executions_job ON job_executions(job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_executions_status ON job_executions(status, created_at DESC);

-- Function to update next_run_at based on cron schedule
-- Note: This is a placeholder - actual calculation will be done in application code
CREATE OR REPLACE FUNCTION update_job_next_run()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_job_timestamp
  BEFORE UPDATE ON scheduled_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_job_next_run();

-- Sample data for testing
INSERT INTO scheduled_jobs (job_type, name, description, schedule, config)
VALUES
  (
    'ranking_check',
    'Daily Ranking Check',
    'Check keyword rankings every day at 9 AM',
    '0 9 * * *',
    '{"keywords": ["seo", "keyword research"], "search_engine": "google", "location": "United States"}'::JSONB
  )
ON CONFLICT DO NOTHING;

-- Verify schema
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('scheduled_jobs', 'job_executions', 'job_notifications')
ORDER BY table_name, ordinal_position;
