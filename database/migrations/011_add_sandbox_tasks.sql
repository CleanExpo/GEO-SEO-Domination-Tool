-- ============================================================================
-- Migration 011: Add sandbox_tasks table
-- ============================================================================
-- Purpose: Extends MetaCoder sandbox schema with Vercel coding-agent compatibility
-- Creates: sandbox_tasks table for tracking code generation tasks
-- Links: sandbox_sessions (existing)
-- Date: 2025-01-06
-- ============================================================================

-- UP Migration

-- Create sandbox_tasks table
CREATE TABLE IF NOT EXISTS sandbox_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Link to MetaCoder sandbox session
    session_id UUID REFERENCES sandbox_sessions(id) ON DELETE CASCADE NOT NULL,

    -- Task details
    prompt TEXT NOT NULL,
    repo_url VARCHAR(500),
    selected_agent VARCHAR(50) DEFAULT 'claude',
    selected_model VARCHAR(100),
    install_dependencies BOOLEAN DEFAULT false,
    max_duration INTEGER DEFAULT 5,                 -- minutes

    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'error', 'stopped'
    progress INTEGER DEFAULT 0,                     -- 0-100

    -- Execution logs
    logs JSONB,                                     -- Array of { type, message, timestamp }
    error TEXT,

    -- Results
    branch_name VARCHAR(255),
    sandbox_url VARCHAR(500),

    -- Cost tracking (matches sandbox_agent_logs)
    tokens_used INTEGER,
    tokens_prompt INTEGER,
    tokens_completion INTEGER,
    execution_time INTEGER,                         -- milliseconds
    cost_usd DECIMAL(10, 6),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sandbox_tasks_session ON sandbox_tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_tasks_status ON sandbox_tasks(status);
CREATE INDEX IF NOT EXISTS idx_sandbox_tasks_agent ON sandbox_tasks(selected_agent);
CREATE INDEX IF NOT EXISTS idx_sandbox_tasks_created ON sandbox_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sandbox_tasks_cost ON sandbox_tasks(cost_usd);

-- Add constraint for valid status values
ALTER TABLE sandbox_tasks
ADD CONSTRAINT sandbox_tasks_status_check
CHECK (status IN ('pending', 'processing', 'completed', 'error', 'stopped'));

-- Add constraint for valid agent values
ALTER TABLE sandbox_tasks
ADD CONSTRAINT sandbox_tasks_agent_check
CHECK (selected_agent IN ('claude', 'codex', 'cursor', 'gemini', 'opencode'));

-- Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sandbox_task_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();

    -- Auto-set completed_at when status changes to completed or error
    IF (NEW.status = 'completed' OR NEW.status = 'error') AND OLD.status != NEW.status THEN
        NEW.completed_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sandbox_tasks_updated_at ON sandbox_tasks;
CREATE TRIGGER sandbox_tasks_updated_at
    BEFORE UPDATE ON sandbox_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_sandbox_task_timestamp();

-- Add view for task analytics
CREATE OR REPLACE VIEW sandbox_task_analytics AS
SELECT
    selected_agent,
    selected_model,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as failed_tasks,
    COUNT(CASE WHEN status = 'processing' THEN 1 END) as active_tasks,
    ROUND(100.0 * COUNT(CASE WHEN status = 'completed' THEN 1 END) / COUNT(*), 2) as success_rate,
    AVG(execution_time) as avg_execution_time_ms,
    SUM(cost_usd) as total_cost_usd,
    AVG(cost_usd) as avg_cost_usd
FROM sandbox_tasks
GROUP BY selected_agent, selected_model
ORDER BY total_tasks DESC;

-- Drop and recreate view to include task counts
DROP VIEW IF EXISTS active_sandbox_sessions;
CREATE VIEW active_sandbox_sessions AS
SELECT
    s.id,
    s.session_name,
    s.company_id,
    c.name as company_name,
    s.active,
    s.last_accessed,
    s.git_repo_url,
    s.vercel_preview_url,
    s.deployment_status,
    (SELECT COUNT(*) FROM sandbox_terminal_history WHERE session_id = s.id) as command_count,
    (SELECT COUNT(*) FROM sandbox_agent_logs WHERE session_id = s.id) as agent_interaction_count,
    (SELECT COUNT(*) FROM sandbox_tasks WHERE session_id = s.id) as task_count,
    (SELECT COUNT(*) FROM sandbox_tasks WHERE session_id = s.id AND status = 'processing') as active_task_count,
    (SELECT SUM(cost_usd) FROM sandbox_agent_logs WHERE session_id = s.id) as total_ai_cost,
    s.created_at,
    s.updated_at
FROM sandbox_sessions s
LEFT JOIN companies c ON c.id = s.company_id
WHERE s.active = true
ORDER BY s.last_accessed DESC;

-- Update session stats function to include tasks
CREATE OR REPLACE FUNCTION get_sandbox_session_stats(session_uuid UUID)
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'commands_executed', (SELECT COUNT(*) FROM sandbox_terminal_history WHERE session_id = session_uuid),
        'ai_interactions', (SELECT COUNT(*) FROM sandbox_agent_logs WHERE session_id = session_uuid),
        'tasks_created', (SELECT COUNT(*) FROM sandbox_tasks WHERE session_id = session_uuid),
        'tasks_completed', (SELECT COUNT(*) FROM sandbox_tasks WHERE session_id = session_uuid AND status = 'completed'),
        'tasks_active', (SELECT COUNT(*) FROM sandbox_tasks WHERE session_id = session_uuid AND status = 'processing'),
        'total_ai_cost', (SELECT COALESCE(SUM(cost_usd), 0) FROM sandbox_agent_logs WHERE session_id = session_uuid),
        'total_task_cost', (SELECT COALESCE(SUM(cost_usd), 0) FROM sandbox_tasks WHERE session_id = session_uuid),
        'repos_imported', (SELECT COUNT(*) FROM sandbox_repo_imports WHERE session_id = session_uuid),
        'deployments', (SELECT COUNT(*) FROM sandbox_deployments WHERE session_id = session_uuid),
        'voice_commands', (SELECT COUNT(*) FROM sandbox_voice_commands WHERE session_id = session_uuid),
        'last_activity', (SELECT MAX(executed_at) FROM sandbox_terminal_history WHERE session_id = session_uuid)
    ) INTO stats;

    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Migration Success Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration 011: sandbox_tasks table created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  - Vercel coding-agent-template compatibility';
    RAISE NOTICE '  - Task status tracking (pending → processing → completed/error)';
    RAISE NOTICE '  - Cost tracking per task';
    RAISE NOTICE '  - Auto-updating timestamps';
    RAISE NOTICE '  - Task analytics view';
    RAISE NOTICE '';
    RAISE NOTICE 'New view: sandbox_task_analytics';
    RAISE NOTICE 'Updated view: active_sandbox_sessions (now includes task counts)';
    RAISE NOTICE 'Updated function: get_sandbox_session_stats (now includes task metrics)';
END $$;

-- ROLLBACK:
-- DROP VIEW IF EXISTS sandbox_task_analytics;
-- DROP TRIGGER IF EXISTS sandbox_tasks_updated_at ON sandbox_tasks;
-- DROP FUNCTION IF EXISTS update_sandbox_task_timestamp();
-- DROP TABLE IF EXISTS sandbox_tasks;
--
-- -- Restore original active_sandbox_sessions view
-- DROP VIEW IF EXISTS active_sandbox_sessions;
-- CREATE VIEW active_sandbox_sessions AS
-- SELECT
--     s.id,
--     s.session_name,
--     s.company_id,
--     c.name as company_name,
--     s.active,
--     s.last_accessed,
--     s.git_repo_url,
--     s.vercel_preview_url,
--     s.deployment_status,
--     (SELECT COUNT(*) FROM sandbox_terminal_history WHERE session_id = s.id) as command_count,
--     (SELECT COUNT(*) FROM sandbox_agent_logs WHERE session_id = s.id) as agent_interaction_count,
--     (SELECT SUM(cost_usd) FROM sandbox_agent_logs WHERE session_id = s.id) as total_ai_cost,
--     s.created_at,
--     s.updated_at
-- FROM sandbox_sessions s
-- LEFT JOIN companies c ON c.id = s.company_id
-- WHERE s.active = true
-- ORDER BY s.last_accessed DESC;
