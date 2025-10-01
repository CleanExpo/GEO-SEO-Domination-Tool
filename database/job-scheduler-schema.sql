-- Job Scheduler Database Schema
-- Tables for managing scheduled jobs and their executions

-- Job Executions table - tracks all job runs
CREATE TABLE IF NOT EXISTS job_executions (
  id SERIAL PRIMARY KEY,
  job_name VARCHAR(100) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_ms INTEGER,
  status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'success', 'failed', 'cancelled')),
  details JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_executions_job_name ON job_executions(job_name);
CREATE INDEX IF NOT EXISTS idx_job_executions_start_time ON job_executions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_job_executions_status ON job_executions(status);

-- Job Schedules table - stores custom job schedules
CREATE TABLE IF NOT EXISTS job_schedules (
  id SERIAL PRIMARY KEY,
  job_name VARCHAR(100) UNIQUE NOT NULL,
  schedule VARCHAR(100) NOT NULL, -- Cron pattern
  enabled BOOLEAN DEFAULT true,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_schedules_job_name ON job_schedules(job_name);
CREATE INDEX IF NOT EXISTS idx_job_schedules_enabled ON job_schedules(enabled);

-- Rankings table - stores keyword ranking history
CREATE TABLE IF NOT EXISTS rankings (
  id SERIAL PRIMARY KEY,
  keyword_id INTEGER NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  rank_change INTEGER DEFAULT 0,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_rankings_keyword_id ON rankings(keyword_id);
CREATE INDEX IF NOT EXISTS idx_rankings_checked_at ON rankings(checked_at DESC);

-- Reports table - stores generated reports
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL, -- 'weekly', 'monthly', 'custom'
  report_date TIMESTAMP NOT NULL,
  date_range_start TIMESTAMP NOT NULL,
  date_range_end TIMESTAMP NOT NULL,
  metrics JSONB,
  recommendations JSONB,
  data JSONB,
  file_path TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_reports_company_id ON reports(company_id);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_report_date ON reports(report_date DESC);

-- Job Alerts table - stores alerts for job failures or significant events
CREATE TABLE IF NOT EXISTS job_alerts (
  id SERIAL PRIMARY KEY,
  job_name VARCHAR(100) NOT NULL,
  alert_type VARCHAR(50) NOT NULL, -- 'failure', 'warning', 'info'
  message TEXT NOT NULL,
  details JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_alerts_job_name ON job_alerts(job_name);
CREATE INDEX IF NOT EXISTS idx_job_alerts_resolved ON job_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_job_alerts_created_at ON job_alerts(created_at DESC);

-- Add metadata column to companies table if it doesn't exist
-- This stores settings like scheduled_audits, weekly_reports, etc.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE companies ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add metadata column to keywords table if it doesn't exist
-- This stores settings like is_priority, etc.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'keywords' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE keywords ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Function to clean up old job executions (keep last 1000)
CREATE OR REPLACE FUNCTION cleanup_old_job_executions()
RETURNS void AS $$
BEGIN
  DELETE FROM job_executions
  WHERE id NOT IN (
    SELECT id FROM job_executions
    ORDER BY start_time DESC
    LIMIT 1000
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get job execution statistics
CREATE OR REPLACE FUNCTION get_job_statistics(
  p_job_name VARCHAR DEFAULT NULL,
  p_start_date TIMESTAMP DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP DEFAULT NOW()
)
RETURNS TABLE (
  job_name VARCHAR,
  total_executions BIGINT,
  successful_executions BIGINT,
  failed_executions BIGINT,
  avg_duration_ms NUMERIC,
  last_execution TIMESTAMP,
  last_status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    je.job_name,
    COUNT(*) as total_executions,
    COUNT(CASE WHEN je.status = 'success' THEN 1 END) as successful_executions,
    COUNT(CASE WHEN je.status = 'failed' THEN 1 END) as failed_executions,
    AVG(je.duration_ms) as avg_duration_ms,
    MAX(je.start_time) as last_execution,
    (
      SELECT status FROM job_executions
      WHERE job_name = je.job_name
      ORDER BY start_time DESC
      LIMIT 1
    ) as last_status
  FROM job_executions je
  WHERE je.start_time BETWEEN p_start_date AND p_end_date
    AND (p_job_name IS NULL OR je.job_name = p_job_name)
  GROUP BY je.job_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get ranking trends
CREATE OR REPLACE FUNCTION get_ranking_trends(
  p_keyword_id INTEGER,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  checked_at TIMESTAMP,
  rank INTEGER,
  rank_change INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.checked_at,
    r.rank,
    r.rank_change
  FROM rankings r
  WHERE r.keyword_id = p_keyword_id
    AND r.checked_at >= NOW() - (p_days || ' days')::INTERVAL
  ORDER BY r.checked_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Insert default job schedules
INSERT INTO job_schedules (job_name, schedule, enabled, description) VALUES
  ('audit-runner', '0 2 * * *', true, 'Run automated SEO audits for companies'),
  ('ranking-tracker', '0 3 * * *', true, 'Track keyword rankings daily'),
  ('ranking-tracker-hourly', '0 * * * *', false, 'Track high-priority keyword rankings hourly'),
  ('report-generator', '0 8 * * 1', true, 'Generate and send weekly reports')
ON CONFLICT (job_name) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE job_executions IS 'Tracks all job execution history with timing and status';
COMMENT ON TABLE job_schedules IS 'Stores custom cron schedules for background jobs';
COMMENT ON TABLE rankings IS 'Historical keyword ranking data';
COMMENT ON TABLE reports IS 'Generated reports for companies';
COMMENT ON TABLE job_alerts IS 'Alerts for job failures and significant events';

COMMENT ON COLUMN companies.metadata IS 'JSON metadata including scheduled_audits, weekly_reports settings';
COMMENT ON COLUMN keywords.metadata IS 'JSON metadata including is_priority flag';
