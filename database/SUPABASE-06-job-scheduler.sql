-- ========================================
-- FILE 6 OF 8: Job Scheduler & Reporting Tables
-- Purpose: Create job scheduling, execution tracking, and reporting tables
-- Dependencies: auth.users, companies, keywords (created in previous files)
-- Tables Created: job_executions, job_schedules, reports, job_alerts
-- Run this AFTER SUPABASE-05-resources.sql completes
-- ========================================

-- 1. JOB_EXECUTIONS TABLE
-- Used by: /api/jobs, Scheduler service
-- Purpose: Track all job execution history
CREATE TABLE IF NOT EXISTS job_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed', 'cancelled')),
  details JSONB DEFAULT '{}'::JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_job_executions_job_name ON job_executions(job_name);
CREATE INDEX IF NOT EXISTS idx_job_executions_start_time ON job_executions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_job_executions_status ON job_executions(status);
CREATE INDEX IF NOT EXISTS idx_job_executions_user ON job_executions(user_id);

COMMENT ON TABLE job_executions IS 'Tracks all job execution history with timing and status';

-- 2. JOB_SCHEDULES TABLE
-- Used by: /api/schedule, Scheduler service
-- Purpose: Store custom job schedules and enable/disable jobs
CREATE TABLE IF NOT EXISTS job_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT UNIQUE NOT NULL,
  schedule TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  description TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_job_schedules_job_name ON job_schedules(job_name);
CREATE INDEX IF NOT EXISTS idx_job_schedules_enabled ON job_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_job_schedules_user ON job_schedules(user_id);

COMMENT ON TABLE job_schedules IS 'Stores custom cron schedules for background jobs';

-- 3. REPORTS TABLE
-- Used by: Report generator service
-- Purpose: Store generated SEO reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'custom')),
  report_date TIMESTAMPTZ NOT NULL,
  date_range_start TIMESTAMPTZ NOT NULL,
  date_range_end TIMESTAMPTZ NOT NULL,
  metrics JSONB DEFAULT '{}'::JSONB,
  recommendations JSONB DEFAULT '[]'::JSONB,
  data JSONB DEFAULT '{}'::JSONB,
  file_path TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reports_company_id ON reports(company_id);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_report_date ON reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);

COMMENT ON TABLE reports IS 'Generated reports for companies with metrics and recommendations';

-- 4. JOB_ALERTS TABLE
-- Used by: Notification service
-- Purpose: Store alerts for job failures and significant events
CREATE TABLE IF NOT EXISTS job_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('failure', 'warning', 'info')),
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_job_alerts_job_name ON job_alerts(job_name);
CREATE INDEX IF NOT EXISTS idx_job_alerts_resolved ON job_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_job_alerts_created_at ON job_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_alerts_user ON job_alerts(user_id);

COMMENT ON TABLE job_alerts IS 'Alerts for job failures and significant events';

-- Helper Functions

-- Function: Clean up old job executions (keep last 1000 per user)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_job_executions IS 'Removes old job execution records, keeping only the latest 1000';

-- Function: Get job execution statistics
CREATE OR REPLACE FUNCTION get_job_statistics(
  p_job_name TEXT DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  job_name TEXT,
  total_executions BIGINT,
  successful_executions BIGINT,
  failed_executions BIGINT,
  avg_duration_ms NUMERIC,
  last_execution TIMESTAMPTZ,
  last_status TEXT
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

COMMENT ON FUNCTION get_job_statistics IS 'Get execution statistics for jobs within a date range';

-- Function: Get ranking trends
CREATE OR REPLACE FUNCTION get_ranking_trends(
  p_keyword_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  checked_at TIMESTAMPTZ,
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

COMMENT ON FUNCTION get_ranking_trends IS 'Get ranking trends for a keyword over specified number of days';

-- Insert default job schedules
INSERT INTO job_schedules (job_name, schedule, enabled, description) VALUES
  ('audit-runner', '0 2 * * *', TRUE, 'Run automated SEO audits for companies'),
  ('ranking-tracker', '0 3 * * *', TRUE, 'Track keyword rankings daily'),
  ('ranking-tracker-hourly', '0 * * * *', FALSE, 'Track high-priority keyword rankings hourly'),
  ('report-generator', '0 8 * * 1', TRUE, 'Generate and send weekly reports')
ON CONFLICT (job_name) DO NOTHING;

-- Verification: Check tables were created
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('job_executions', 'job_schedules', 'reports', 'job_alerts')
ORDER BY table_name;

-- Expected output: 4 rows showing all job scheduler tables

-- Verify functions created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('cleanup_old_job_executions', 'get_job_statistics', 'get_ranking_trends')
ORDER BY routine_name;

-- Expected output: 3 rows showing functions
