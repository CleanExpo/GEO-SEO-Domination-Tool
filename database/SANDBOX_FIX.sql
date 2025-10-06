-- ============================================================================
-- Sandbox Schema Fix - Run this to resolve the view conflict
-- ============================================================================
-- This drops the conflicting view created by migration 011, then recreates
-- the base sandbox schema properly
-- ============================================================================

-- Step 1: Drop the conflicting view from migration 011
DROP VIEW IF EXISTS active_sandbox_sessions CASCADE;
DROP VIEW IF EXISTS sandbox_task_analytics CASCADE;

-- Step 2: Drop sandbox_tasks table (we'll recreate it after base schema)
DROP TABLE IF EXISTS sandbox_tasks CASCADE;

-- Step 3: Now run the base sandbox schema
-- ============================================================================

-- Enable UUID extension (PostgreSQL only)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: sandbox_sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS sandbox_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    session_name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_tree JSONB DEFAULT '{}'::jsonb,
    open_files JSONB DEFAULT '[]'::jsonb,
    current_file VARCHAR(500),
    cursor_position JSONB,
    scroll_position INTEGER DEFAULT 0,
    breakpoints JSONB DEFAULT '[]'::jsonb,
    git_repo_url VARCHAR(500),
    git_branch VARCHAR(100) DEFAULT 'main',
    git_remote VARCHAR(100) DEFAULT 'origin',
    uncommitted_changes BOOLEAN DEFAULT false,
    last_commit_sha VARCHAR(40),
    vercel_deployment_id VARCHAR(100),
    vercel_preview_url VARCHAR(500),
    vercel_production_url VARCHAR(500),
    last_deployment TIMESTAMP WITH TIME ZONE,
    deployment_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Table: sandbox_terminal_history
-- ============================================================================

CREATE TABLE IF NOT EXISTS sandbox_terminal_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sandbox_sessions(id) ON DELETE CASCADE,
    command TEXT NOT NULL,
    working_directory VARCHAR(500),
    stdout TEXT,
    stderr TEXT,
    exit_code INTEGER,
    execution_time INTEGER,
    user_initiated BOOLEAN DEFAULT true,
    ai_agent VARCHAR(50),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Table: sandbox_agent_logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS sandbox_agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sandbox_sessions(id) ON DELETE CASCADE,
    agent_type VARCHAR(50) NOT NULL,
    ai_model VARCHAR(50) NOT NULL,
    task_type VARCHAR(100),
    task_description TEXT NOT NULL,
    input_params JSONB,
    voice_input_url VARCHAR(500),
    video_input_url VARCHAR(500),
    image_input_urls JSONB,
    output_code TEXT,
    output_explanation TEXT,
    voice_output_url VARCHAR(500),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    routed_by VARCHAR(50),
    routing_reason TEXT,
    alternative_models JSONB,
    tokens_used INTEGER,
    tokens_prompt INTEGER,
    tokens_completion INTEGER,
    execution_time INTEGER,
    cost_usd DECIMAL(10, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Table: sandbox_repo_imports
-- ============================================================================

CREATE TABLE IF NOT EXISTS sandbox_repo_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sandbox_sessions(id) ON DELETE CASCADE,
    repo_url VARCHAR(500) NOT NULL,
    repo_name VARCHAR(255) NOT NULL,
    repo_owner VARCHAR(255),
    repo_branch VARCHAR(100) DEFAULT 'main',
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    current_step VARCHAR(255),
    total_files INTEGER,
    total_size_bytes BIGINT,
    primary_language VARCHAR(50),
    languages JSONB,
    dependencies_count INTEGER,
    dependencies JSONB,
    dev_dependencies_count INTEGER,
    dev_dependencies JSONB,
    conflicts_detected BOOLEAN DEFAULT false,
    conflicts JSONB DEFAULT '[]'::jsonb,
    integrated BOOLEAN DEFAULT false,
    integration_path VARCHAR(500),
    integration_strategy VARCHAR(50),
    submodule_path VARCHAR(500),
    submodule_url VARCHAR(500),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- ============================================================================
-- Table: sandbox_live_previews
-- ============================================================================

CREATE TABLE IF NOT EXISTS sandbox_live_previews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sandbox_sessions(id) ON DELETE CASCADE,
    preview_type VARCHAR(50),
    preview_url VARCHAR(500),
    port INTEGER,
    status VARCHAR(50) DEFAULT 'starting',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    build_command TEXT,
    build_output TEXT,
    build_error TEXT,
    build_time INTEGER,
    console_logs JSONB DEFAULT '[]'::jsonb,
    network_requests JSONB DEFAULT '[]'::jsonb,
    errors_count INTEGER DEFAULT 0,
    last_error TEXT,
    last_error_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stopped_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- Table: sandbox_deployments
-- ============================================================================

CREATE TABLE IF NOT EXISTS sandbox_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sandbox_sessions(id) ON DELETE CASCADE,
    deployment_id VARCHAR(100) NOT NULL,
    deployment_url VARCHAR(500),
    production_url VARCHAR(500),
    is_production BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'pending',
    ready_state VARCHAR(50),
    build_logs TEXT,
    build_error TEXT,
    build_time INTEGER,
    git_commit_sha VARCHAR(40),
    git_commit_message TEXT,
    git_branch VARCHAR(100),
    git_author VARCHAR(255),
    environment VARCHAR(50) DEFAULT 'preview',
    framework VARCHAR(50),
    node_version VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deployed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- Table: sandbox_voice_commands
-- ============================================================================

CREATE TABLE IF NOT EXISTS sandbox_voice_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sandbox_sessions(id) ON DELETE CASCADE,
    audio_input_url VARCHAR(500),
    audio_duration INTEGER,
    transcribed_text TEXT,
    language VARCHAR(10),
    confidence DECIMAL(3, 2),
    intent VARCHAR(100),
    extracted_params JSONB,
    agent_type VARCHAR(50),
    ai_model VARCHAR(50),
    executed BOOLEAN DEFAULT false,
    execution_result TEXT,
    response_text TEXT,
    audio_response_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_user ON sandbox_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_company ON sandbox_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_active ON sandbox_sessions(active);
CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_updated ON sandbox_sessions(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_terminal_history_session ON sandbox_terminal_history(session_id);
CREATE INDEX IF NOT EXISTS idx_terminal_history_executed ON sandbox_terminal_history(executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_logs_session ON sandbox_agent_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_type ON sandbox_agent_logs(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_logs_ai_model ON sandbox_agent_logs(ai_model);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created ON sandbox_agent_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_cost ON sandbox_agent_logs(cost_usd);

CREATE INDEX IF NOT EXISTS idx_repo_imports_session ON sandbox_repo_imports(session_id);
CREATE INDEX IF NOT EXISTS idx_repo_imports_status ON sandbox_repo_imports(status);
CREATE INDEX IF NOT EXISTS idx_repo_imports_started ON sandbox_repo_imports(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_previews_session ON sandbox_live_previews(session_id);
CREATE INDEX IF NOT EXISTS idx_live_previews_status ON sandbox_live_previews(status);

CREATE INDEX IF NOT EXISTS idx_deployments_session ON sandbox_deployments(session_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON sandbox_deployments(status);
CREATE INDEX IF NOT EXISTS idx_deployments_created ON sandbox_deployments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_voice_commands_session ON sandbox_voice_commands(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_intent ON sandbox_voice_commands(intent);
CREATE INDEX IF NOT EXISTS idx_voice_commands_created ON sandbox_voice_commands(created_at DESC);

-- ============================================================================
-- Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_sandbox_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sandbox_sessions_updated_at ON sandbox_sessions;
CREATE TRIGGER sandbox_sessions_updated_at
    BEFORE UPDATE ON sandbox_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_sandbox_session_timestamp();

-- ============================================================================
-- Views (without task columns - we'll add those in migration 011)
-- ============================================================================

CREATE OR REPLACE VIEW active_sandbox_sessions AS
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
    (SELECT SUM(cost_usd) FROM sandbox_agent_logs WHERE session_id = s.id) as total_ai_cost,
    s.created_at,
    s.updated_at
FROM sandbox_sessions s
LEFT JOIN companies c ON c.id = s.company_id
WHERE s.active = true
ORDER BY s.last_accessed DESC;

CREATE OR REPLACE VIEW sandbox_ai_cost_analysis AS
SELECT
    ai_model,
    COUNT(*) as request_count,
    SUM(tokens_used) as total_tokens,
    AVG(tokens_used) as avg_tokens,
    SUM(cost_usd) as total_cost,
    AVG(cost_usd) as avg_cost,
    AVG(execution_time) as avg_execution_time_ms,
    COUNT(CASE WHEN success = true THEN 1 END) as successful_requests,
    COUNT(CASE WHEN success = false THEN 1 END) as failed_requests
FROM sandbox_agent_logs
GROUP BY ai_model
ORDER BY total_cost DESC;

CREATE OR REPLACE VIEW sandbox_agent_performance AS
SELECT
    agent_type,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN success = true THEN 1 END) as successful_tasks,
    COUNT(CASE WHEN success = false THEN 1 END) as failed_tasks,
    ROUND(100.0 * COUNT(CASE WHEN success = true THEN 1 END) / COUNT(*), 2) as success_rate,
    AVG(execution_time) as avg_execution_time_ms,
    SUM(cost_usd) as total_cost
FROM sandbox_agent_logs
GROUP BY agent_type
ORDER BY total_tasks DESC;

CREATE OR REPLACE VIEW recent_sandbox_deployments AS
SELECT
    d.id,
    s.session_name,
    d.deployment_url,
    d.status,
    d.build_time,
    d.git_commit_message,
    d.git_branch,
    d.environment,
    d.created_at,
    d.deployed_at
FROM sandbox_deployments d
JOIN sandbox_sessions s ON s.id = d.session_id
ORDER BY d.created_at DESC
LIMIT 50;

-- ============================================================================
-- Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_sandbox_session_stats(session_uuid UUID)
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'commands_executed', (SELECT COUNT(*) FROM sandbox_terminal_history WHERE session_id = session_uuid),
        'ai_interactions', (SELECT COUNT(*) FROM sandbox_agent_logs WHERE session_id = session_uuid),
        'total_ai_cost', (SELECT COALESCE(SUM(cost_usd), 0) FROM sandbox_agent_logs WHERE session_id = session_uuid),
        'repos_imported', (SELECT COUNT(*) FROM sandbox_repo_imports WHERE session_id = session_uuid),
        'deployments', (SELECT COUNT(*) FROM sandbox_deployments WHERE session_id = session_uuid),
        'voice_commands', (SELECT COUNT(*) FROM sandbox_voice_commands WHERE session_id = session_uuid),
        'last_activity', (SELECT MAX(executed_at) FROM sandbox_terminal_history WHERE session_id = session_uuid)
    ) INTO stats;

    RETURN stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_inactive_sandbox_sessions(days_inactive INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE sandbox_sessions
    SET active = false
    WHERE last_accessed < NOW() - (days_inactive || ' days')::INTERVAL
    AND active = true;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Base sandbox schema created successfully!';
    RAISE NOTICE 'Now run migration 011 to add sandbox_tasks table.';
END $$;
