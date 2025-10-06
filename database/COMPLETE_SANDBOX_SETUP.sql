-- ============================================================================
-- COMPLETE SANDBOX SETUP - Run this ONCE to fix everything
-- ============================================================================
-- This script completely removes all sandbox tables/views/functions
-- and recreates everything in the correct order
-- ============================================================================

-- STEP 1: Drop everything sandbox-related (CASCADE removes all dependencies)
-- ============================================================================

DROP VIEW IF EXISTS sandbox_task_analytics CASCADE;
DROP VIEW IF EXISTS active_sandbox_sessions CASCADE;
DROP VIEW IF EXISTS sandbox_ai_cost_analysis CASCADE;
DROP VIEW IF EXISTS sandbox_agent_performance CASCADE;
DROP VIEW IF EXISTS recent_sandbox_deployments CASCADE;

DROP FUNCTION IF EXISTS get_sandbox_session_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS cleanup_inactive_sandbox_sessions(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_sandbox_task_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_sandbox_session_timestamp() CASCADE;

DROP TABLE IF EXISTS sandbox_tasks CASCADE;
DROP TABLE IF EXISTS sandbox_voice_commands CASCADE;
DROP TABLE IF EXISTS sandbox_deployments CASCADE;
DROP TABLE IF EXISTS sandbox_live_previews CASCADE;
DROP TABLE IF EXISTS sandbox_repo_imports CASCADE;
DROP TABLE IF EXISTS sandbox_agent_logs CASCADE;
DROP TABLE IF EXISTS sandbox_terminal_history CASCADE;
DROP TABLE IF EXISTS sandbox_sessions CASCADE;

-- STEP 2: Create all base tables
-- ============================================================================

CREATE TABLE sandbox_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    company_id UUID,
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

CREATE TABLE sandbox_terminal_history (
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

CREATE TABLE sandbox_agent_logs (
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

CREATE TABLE sandbox_repo_imports (
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

CREATE TABLE sandbox_deployments (
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

CREATE TABLE sandbox_voice_commands (
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

-- STEP 3: Create sandbox_tasks table (from migration 011)
-- ============================================================================

CREATE TABLE sandbox_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sandbox_sessions(id) ON DELETE CASCADE NOT NULL,
    prompt TEXT NOT NULL,
    repo_url VARCHAR(500),
    selected_agent VARCHAR(50) DEFAULT 'claude',
    selected_model VARCHAR(100),
    install_dependencies BOOLEAN DEFAULT false,
    max_duration INTEGER DEFAULT 5,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    logs JSONB,
    error TEXT,
    branch_name VARCHAR(255),
    sandbox_url VARCHAR(500),
    tokens_used INTEGER,
    tokens_prompt INTEGER,
    tokens_completion INTEGER,
    execution_time INTEGER,
    cost_usd DECIMAL(10, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- STEP 4: Create all indexes
-- ============================================================================

CREATE INDEX idx_sandbox_sessions_active ON sandbox_sessions(active);
CREATE INDEX idx_sandbox_sessions_updated ON sandbox_sessions(updated_at DESC);
CREATE INDEX idx_terminal_history_session ON sandbox_terminal_history(session_id);
CREATE INDEX idx_agent_logs_session ON sandbox_agent_logs(session_id);
CREATE INDEX idx_agent_logs_cost ON sandbox_agent_logs(cost_usd);
CREATE INDEX idx_repo_imports_session ON sandbox_repo_imports(session_id);
CREATE INDEX idx_deployments_session ON sandbox_deployments(session_id);
CREATE INDEX idx_voice_commands_session ON sandbox_voice_commands(session_id);
CREATE INDEX idx_sandbox_tasks_session ON sandbox_tasks(session_id);
CREATE INDEX idx_sandbox_tasks_status ON sandbox_tasks(status);
CREATE INDEX idx_sandbox_tasks_agent ON sandbox_tasks(selected_agent);
CREATE INDEX idx_sandbox_tasks_created ON sandbox_tasks(created_at DESC);

-- STEP 5: Create constraints
-- ============================================================================

ALTER TABLE sandbox_tasks ADD CONSTRAINT sandbox_tasks_status_check
    CHECK (status IN ('pending', 'processing', 'completed', 'error', 'stopped'));

ALTER TABLE sandbox_tasks ADD CONSTRAINT sandbox_tasks_agent_check
    CHECK (selected_agent IN ('claude', 'codex', 'cursor', 'gemini', 'opencode'));

-- STEP 6: Create triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_sandbox_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sandbox_sessions_updated_at
    BEFORE UPDATE ON sandbox_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_sandbox_session_timestamp();

CREATE OR REPLACE FUNCTION update_sandbox_task_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF (NEW.status = 'completed' OR NEW.status = 'error') AND OLD.status != NEW.status THEN
        NEW.completed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sandbox_tasks_updated_at
    BEFORE UPDATE ON sandbox_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_sandbox_task_timestamp();

-- STEP 7: Create views
-- ============================================================================

CREATE VIEW sandbox_task_analytics AS
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

CREATE VIEW active_sandbox_sessions AS
SELECT
    s.id,
    s.session_name,
    s.company_id,
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
WHERE s.active = true
ORDER BY s.last_accessed DESC;

CREATE VIEW sandbox_ai_cost_analysis AS
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

-- STEP 8: Create functions
-- ============================================================================

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

-- Success message
DO $$
BEGIN
    RAISE NOTICE '════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ COMPLETE SANDBOX SETUP SUCCESSFUL!';
    RAISE NOTICE '════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '  ✓ 7 tables (sessions, tasks, terminal, agents, repos, deployments, voice)';
    RAISE NOTICE '  ✓ 12 indexes for performance';
    RAISE NOTICE '  ✓ 2 constraints (status, agent validation)';
    RAISE NOTICE '  ✓ 2 triggers (auto-update timestamps)';
    RAISE NOTICE '  ✓ 3 views (analytics, cost analysis, active sessions)';
    RAISE NOTICE '  ✓ 1 function (get_sandbox_session_stats)';
    RAISE NOTICE '';
    RAISE NOTICE 'Your site should now work at:';
    RAISE NOTICE '  https://geo-seo-domination-tool.vercel.app/';
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;
