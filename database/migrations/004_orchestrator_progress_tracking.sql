-- UP Migration: Orchestrator Progress Tracking
-- Tracks autonomous value generation across all engines

CREATE TABLE IF NOT EXISTS orchestrator_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id TEXT NOT NULL,
  tier TEXT NOT NULL CHECK(tier IN ('critical', 'sub-critical', 'must-have')),
  engines_status TEXT NOT NULL, -- JSON array of EngineStatus objects
  total_value_delivered REAL DEFAULT 0, -- Dollar value of automation
  started_at DATETIME NOT NULL,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES company_portfolios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orchestrator_company ON orchestrator_progress(company_id);
CREATE INDEX IF NOT EXISTS idx_orchestrator_tier ON orchestrator_progress(tier);
CREATE INDEX IF NOT EXISTS idx_orchestrator_started ON orchestrator_progress(started_at);

-- Competitors table enhancement (add threat tracking)
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS threat_level TEXT CHECK(threat_level IN ('low', 'medium', 'high', 'critical'));
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS counter_strategy TEXT;

-- ROLLBACK:
DROP TABLE IF EXISTS orchestrator_progress;
ALTER TABLE competitors DROP COLUMN IF EXISTS threat_level;
ALTER TABLE competitors DROP COLUMN IF EXISTS counter_strategy;
