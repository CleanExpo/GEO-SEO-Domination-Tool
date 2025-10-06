-- ============================================================================
-- MetaCoder Orchestrator - Sandbox Schema
-- ============================================================================
-- Purpose: Database schema for in-CRM development sandbox environment
-- Features: Terminal sessions, AI agent logs, GitHub imports, deployments
-- Created: 2025-01-06
-- Compatible with: PostgreSQL (Supabase), SQLite (development)
-- ============================================================================

-- Enable UUID extension (PostgreSQL only)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: sandbox_sessions
-- Purpose: Stores MetaCoder sandbox sessions with code state and deployments
-- ============================================================================

CREATE TABLE IF NOT EXISTS sandbox_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

    -- Session metadata
    session_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Session state
    active BOOLEAN DEFAULT true,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Code state (virtual file system stored as JSON)
    file_tree JSONB DEFAULT '{}'::jsonb,       -- { "src/": { "App.tsx": {...}, "index.tsx": {...} } }
    open_files JSONB DEFAULT '[]'::jsonb,      -- ["src/App.tsx", "src/components/Header.tsx"]
    current_file VARCHAR(500),                  -- Currently focused file

    -- Editor state
    cursor_position JSONB,                      -- { "line": 42, "column": 15 }
    scroll_position INTEGER DEFAULT 0,
    breakpoints JSONB DEFAULT '[]'::jsonb,     -- [{ "file": "App.tsx", "line": 10 }]

    -- Git state
    git_repo_url VARCHAR(500),
    git_branch VARCHAR(100) DEFAULT 'main',
    git_remote VARCHAR(100) DEFAULT 'origin',
    uncommitted_changes BOOLEAN DEFAULT false,
    last_commit_sha VARCHAR(40),

    -- Deployment state
    vercel_deployment_id VARCHAR(100),
    vercel_preview_url VARCHAR(500),
    vercel_production_url VARCHAR(500),
    last_deployment TIMESTAMP WITH TIME ZONE,
    deployment_status VARCHAR(50),              -- 'pending', 'building', 'ready', 'error'

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Table: sandbox_terminal_history
-- Purpose: Stores terminal command execution history for each sandbox session
-- ============================================================================

CREATE TABLE IF NOT EXISTS sandbox_terminal_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sandbox_sessions(id) ON DELETE CASCADE,

    -- Command details
    command TEXT NOT NULL,
    working_directory VARCHAR(500),

    -- Execution results
    stdout TEXT,
    stderr TEXT,
    exit_code INTEGER,
    execution_time INTEGER,                     -- milliseconds

    -- Command metadata
    user_initiated BOOLEAN DEFAULT true,        -- false if triggered by AI agent
    ai_agent VARCHAR(50),                       -- Which agent triggered (if applicable)

    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Table: sandbox_agent_logs
-- Purpose: Logs all AI agent interactions for debugging and cost tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS sandbox_agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sandbox_sessions(id) ON DELETE CASCADE,

    -- Agent identification
    agent_type VARCHAR(50) NOT NULL,            -- 'builder', 'ui-navigation', 'repo-importer', 'live-preview', 'router'
    ai_model VARCHAR(50) NOT NULL,              -- 'claude-code', 'gpt-5-codex', 'deepseek-v3-exp', 'qwen3-omni', 'speckit'

    -- Request details
    task_type VARCHAR(100),                     -- 'generate_component', 'review_code', 'fix_bug', 'analyze_video'
    task_description TEXT NOT NULL,
    input_params JSONB,                         -- { "componentName": "RankingWidget", "props": ["data", "onRefresh"] }

    -- Multimodal inputs (for Qwen3-Omni)
    voice_input_url VARCHAR(500),               -- URL to stored audio file
    video_input_url VARCHAR(500),               -- URL to stored video file
    image_input_urls JSONB,                     -- Array of image URLs

    -- Response details
    output_code TEXT,
    output_explanation TEXT,
    voice_output_url VARCHAR(500),              -- URL to generated audio response (Qwen3-Omni)
    success BOOLEAN DEFAULT true,
    error_message TEXT,

    -- Routing metadata
    routed_by VARCHAR(50),                      -- 'router-agent' or 'user-selection'
    routing_reason TEXT,                        -- "Task complexity: high, selected GPT-5 Codex"
    alternative_models JSONB,                   -- Models considered but not selected

    -- Performance metrics
    tokens_used INTEGER,
    tokens_prompt INTEGER,
    tokens_completion INTEGER,
    execution_time INTEGER,                     -- milliseconds
    cost_usd DECIMAL(10, 6),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Table: sandbox_repo_imports
-- Purpose: Tracks GitHub repository import operations and integration status
-- ============================================================================

CREATE TABLE IF NOT EXISTS sandbox_repo_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sandbox_sessions(id) ON DELETE CASCADE,

    -- Repository details
    repo_url VARCHAR(500) NOT NULL,
    repo_name VARCHAR(255) NOT NULL,
    repo_owner VARCHAR(255),
    repo_branch VARCHAR(100) DEFAULT 'main',

    -- Import status
    status VARCHAR(50) DEFAULT 'pending',       -- 'pending', 'cloning', 'analyzing', 'integrating', 'completed', 'failed'
    progress INTEGER DEFAULT 0,                 -- 0-100
    current_step VARCHAR(255),                  -- "Analyzing dependencies..."

    -- Repository analysis
    total_files INTEGER,
    total_size_bytes BIGINT,
    primary_language VARCHAR(50),
    languages JSONB,                            -- { "TypeScript": 75, "CSS": 15, "JavaScript": 10 }

    -- Dependency analysis
    dependencies_count INTEGER,
    dependencies JSONB,                         -- { "react": "^18.2.0", "next": "^15.0.0" }
    dev_dependencies_count INTEGER,
    dev_dependencies JSONB,

    -- Conflict detection
    conflicts_detected BOOLEAN DEFAULT false,
    conflicts JSONB DEFAULT '[]'::jsonb,        -- [{ "type": "dependency", "name": "react", "existing": "^17.0.0", "imported": "^18.2.0" }]

    -- Integration
    integrated BOOLEAN DEFAULT false,
    integration_path VARCHAR(500),              -- "integrations/serpbear"
    integration_strategy VARCHAR(50),           -- 'submodule', 'copy', 'monorepo'

    -- Git submodule details (if applicable)
    submodule_path VARCHAR(500),
    submodule_url VARCHAR(500),

    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- ============================================================================
-- Table: sandbox_live_previews
-- Purpose: Tracks live preview instances and their state
-- ============================================================================

CREATE TABLE IF NOT EXISTS sandbox_live_previews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sandbox_sessions(id) ON DELETE CASCADE,

    -- Preview details
    preview_type VARCHAR(50),                   -- 'local', 'vercel', 'docker'
    preview_url VARCHAR(500),
    port INTEGER,

    -- Preview state
    status VARCHAR(50) DEFAULT 'starting',      -- 'starting', 'running', 'error', 'stopped'
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Build information
    build_command TEXT,
    build_output TEXT,
    build_error TEXT,
    build_time INTEGER,                         -- milliseconds

    -- Console logs (last 100 lines)
    console_logs JSONB DEFAULT '[]'::jsonb,     -- [{ "type": "log", "message": "...", "timestamp": "..." }]

    -- Network requests (last 50 requests)
    network_requests JSONB DEFAULT '[]'::jsonb, -- [{ "method": "GET", "url": "/api/data", "status": 200, "duration": 150 }]

    -- Error tracking
    errors_count INTEGER DEFAULT 0,
    last_error TEXT,
    last_error_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stopped_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- Table: sandbox_deployments
-- Purpose: Tracks Vercel deployments initiated from sandbox
-- ============================================================================

CREATE TABLE IF NOT EXISTS sandbox_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sandbox_sessions(id) ON DELETE CASCADE,

    -- Deployment details
    deployment_id VARCHAR(100) NOT NULL,        -- Vercel deployment ID
    deployment_url VARCHAR(500),
    production_url VARCHAR(500),
    is_production BOOLEAN DEFAULT false,

    -- Deployment state
    status VARCHAR(50) DEFAULT 'pending',       -- 'pending', 'building', 'ready', 'error', 'canceled'
    ready_state VARCHAR(50),                    -- 'QUEUED', 'BUILDING', 'READY', 'ERROR'

    -- Build information
    build_logs TEXT,
    build_error TEXT,
    build_time INTEGER,                         -- seconds

    -- Git information
    git_commit_sha VARCHAR(40),
    git_commit_message TEXT,
    git_branch VARCHAR(100),
    git_author VARCHAR(255),

    -- Environment
    environment VARCHAR(50) DEFAULT 'preview',  -- 'preview', 'production'
    framework VARCHAR(50),                      -- 'nextjs', 'vite', 'remix'
    node_version VARCHAR(20),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deployed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- Table: sandbox_voice_commands
-- Purpose: Stores voice command history for Qwen3-Omni integration
-- ============================================================================

CREATE TABLE IF NOT EXISTS sandbox_voice_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sandbox_sessions(id) ON DELETE CASCADE,

    -- Voice input
    audio_input_url VARCHAR(500),               -- URL to stored audio file
    audio_duration INTEGER,                     -- milliseconds

    -- Transcription
    transcribed_text TEXT,
    language VARCHAR(10),                       -- 'en', 'es', 'fr', etc.
    confidence DECIMAL(3, 2),                   -- 0.00 - 1.00

    -- Intent analysis
    intent VARCHAR(100),                        -- 'generate_component', 'review_code', 'deploy', 'import_repo'
    extracted_params JSONB,                     -- { "componentName": "RankingWidget", "framework": "React" }

    -- Execution
    agent_type VARCHAR(50),                     -- Which agent handled the command
    ai_model VARCHAR(50),                       -- Which model processed it
    executed BOOLEAN DEFAULT false,
    execution_result TEXT,

    -- Voice response
    response_text TEXT,
    audio_response_url VARCHAR(500),            -- URL to generated audio response

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Sandbox sessions
CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_user ON sandbox_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_company ON sandbox_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_active ON sandbox_sessions(active);
CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_updated ON sandbox_sessions(updated_at DESC);

-- Terminal history
CREATE INDEX IF NOT EXISTS idx_terminal_history_session ON sandbox_terminal_history(session_id);
CREATE INDEX IF NOT EXISTS idx_terminal_history_executed ON sandbox_terminal_history(executed_at DESC);

-- Agent logs
CREATE INDEX IF NOT EXISTS idx_agent_logs_session ON sandbox_agent_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_type ON sandbox_agent_logs(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_logs_ai_model ON sandbox_agent_logs(ai_model);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created ON sandbox_agent_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_cost ON sandbox_agent_logs(cost_usd);

-- Repo imports
CREATE INDEX IF NOT EXISTS idx_repo_imports_session ON sandbox_repo_imports(session_id);
CREATE INDEX IF NOT EXISTS idx_repo_imports_status ON sandbox_repo_imports(status);
CREATE INDEX IF NOT EXISTS idx_repo_imports_started ON sandbox_repo_imports(started_at DESC);

-- Live previews
CREATE INDEX IF NOT EXISTS idx_live_previews_session ON sandbox_live_previews(session_id);
CREATE INDEX IF NOT EXISTS idx_live_previews_status ON sandbox_live_previews(status);

-- Deployments
CREATE INDEX IF NOT EXISTS idx_deployments_session ON sandbox_deployments(session_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON sandbox_deployments(status);
CREATE INDEX IF NOT EXISTS idx_deployments_created ON sandbox_deployments(created_at DESC);

-- Voice commands
CREATE INDEX IF NOT EXISTS idx_voice_commands_session ON sandbox_voice_commands(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_intent ON sandbox_voice_commands(intent);
CREATE INDEX IF NOT EXISTS idx_voice_commands_created ON sandbox_voice_commands(created_at DESC);

-- ============================================================================
-- Triggers for Auto-Update Timestamps
-- ============================================================================

-- Update sandbox_sessions.updated_at on modification
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
-- Views for Dashboard Analytics
-- ============================================================================

-- View: Active sandbox sessions with recent activity
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

-- View: AI model cost analysis
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

-- View: Agent performance metrics
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

-- View: Recent deployments with status
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
-- Functions for Session Management
-- ============================================================================

-- Function: Get session statistics
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

-- Function: Clean up old inactive sessions
CREATE OR REPLACE FUNCTION cleanup_inactive_sandbox_sessions(days_inactive INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Mark sessions as inactive if not accessed in X days
    UPDATE sandbox_sessions
    SET active = false
    WHERE last_accessed < NOW() - (days_inactive || ' days')::INTERVAL
    AND active = true;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Sample Data for Testing (Optional - Comment out for production)
-- ============================================================================

-- Uncomment to insert sample data for development testing
/*
INSERT INTO sandbox_sessions (id, user_id, company_id, session_name, description, file_tree)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM auth.users LIMIT 1),
    (SELECT id FROM companies LIMIT 1),
    'My First Sandbox',
    'Testing MetaCoder Orchestrator',
    '{"src": {"App.tsx": {"content": "import React from \"react\";", "language": "typescript"}}}'::jsonb
);
*/

-- ============================================================================
-- Migration Success Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ MetaCoder Orchestrator sandbox schema migration completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Created tables:';
    RAISE NOTICE '  - sandbox_sessions (8 columns)';
    RAISE NOTICE '  - sandbox_terminal_history (9 columns)';
    RAISE NOTICE '  - sandbox_agent_logs (19 columns)';
    RAISE NOTICE '  - sandbox_repo_imports (19 columns)';
    RAISE NOTICE '  - sandbox_live_previews (14 columns)';
    RAISE NOTICE '  - sandbox_deployments (17 columns)';
    RAISE NOTICE '  - sandbox_voice_commands (13 columns)';
    RAISE NOTICE '';
    RAISE NOTICE 'Created views:';
    RAISE NOTICE '  - active_sandbox_sessions';
    RAISE NOTICE '  - sandbox_ai_cost_analysis';
    RAISE NOTICE '  - sandbox_agent_performance';
    RAISE NOTICE '  - recent_sandbox_deployments';
    RAISE NOTICE '';
    RAISE NOTICE 'Created functions:';
    RAISE NOTICE '  - get_sandbox_session_stats(session_uuid)';
    RAISE NOTICE '  - cleanup_inactive_sandbox_sessions(days_inactive)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Download Qwen3-Omni models (~100GB)';
    RAISE NOTICE '  2. Implement PTY terminal server';
    RAISE NOTICE '  3. Create live preview bridge';
    RAISE NOTICE '  4. Build Router Agent';
    RAISE NOTICE '  5. Integrate voice commands with Qwen3-Omni';
END $$;
