-- ============================================================================
-- QUICK FIX: Create sandbox_sessions table only
-- ============================================================================
-- This is the minimal fix to get the site working
-- Run this FIRST, then re-run migration 011
-- ============================================================================

-- Step 1: Create sandbox_sessions table (the one that's missing)
CREATE TABLE IF NOT EXISTS sandbox_sessions (
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

-- Step 2: Create other required tables
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

-- Step 3: Add basic indexes
CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_active ON sandbox_sessions(active);
CREATE INDEX IF NOT EXISTS idx_terminal_history_session ON sandbox_terminal_history(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_session ON sandbox_agent_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_repo_imports_session ON sandbox_repo_imports(session_id);
CREATE INDEX IF NOT EXISTS idx_deployments_session ON sandbox_deployments(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_session ON sandbox_voice_commands(session_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Base sandbox tables created!';
    RAISE NOTICE 'Now you can re-run migration 011 (011_add_sandbox_tasks.sql)';
END $$;
