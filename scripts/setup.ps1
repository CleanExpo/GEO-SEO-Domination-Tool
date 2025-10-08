# Unified AI Dev Workspace Setup Script
# Wires up Claude Code CLI, VS Code tasks, and CRM webhooks

param(
    [switch]$Force,
    [string]$ConfigPath = ".\workspace-config.json"
)

Write-Host "🚀 Setting up Unified AI Dev Workspace..." -ForegroundColor Cyan

# Load workspace configuration
if (-not (Test-Path $ConfigPath)) {
    Write-Error "Configuration file not found: $ConfigPath"
    exit 1
}

$config = Get-Content $ConfigPath | ConvertFrom-Json
Write-Host "✅ Loaded configuration from $ConfigPath" -ForegroundColor Green

# 1. Create Global Directory Structure
Write-Host "`n📁 Creating global directory structure..." -ForegroundColor Yellow

$globalDirs = @(
    $config.globalAgents.registryPath,
    $config.globalMcpServers.path,
    $config.livePreview.sandboxDir,
    $config.livePreview.logsDir,
    $config.livePreview.artifactsDir
)

foreach ($dir in $globalDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  Created: $dir" -ForegroundColor Gray
    } else {
        Write-Host "  Exists: $dir" -ForegroundColor DarkGray
    }
}

# 2. Initialize MCP Server Configuration
Write-Host "`n🔌 Configuring MCP servers..." -ForegroundColor Yellow

$mcpConfigPath = ".\.claude\mcp-config.json"
if (Test-Path $mcpConfigPath) {
    $mcpConfig = Get-Content $mcpConfigPath | ConvertFrom-Json
} else {
    $mcpConfig = @{ mcpServers = @{} }
}

# Add global MCP servers from config
foreach ($server in $config.globalMcpServers.servers) {
    Write-Host "  Adding MCP server: $($server.name)" -ForegroundColor Gray
    $mcpConfig.mcpServers[$server.name] = @{
        command = $server.command
        args = $server.args
        env = $server.env
        description = $server.description
    }
}

# Save updated MCP config
$mcpConfig | ConvertTo-Json -Depth 10 | Set-Content $mcpConfigPath
Write-Host "✅ MCP configuration updated" -ForegroundColor Green

# 3. Set up Global Agent Registry
Write-Host "`n🤖 Setting up global agent registry..." -ForegroundColor Yellow

$registryMetaPath = Join-Path $config.globalAgents.registryPath "registry.json"
$registry = @{
    version = "1.0.0"
    agents = @()
    lastUpdated = Get-Date -Format "o"
}

foreach ($agent in $config.globalAgents.agents) {
    Write-Host "  Registering agent: $($agent.id)" -ForegroundColor Gray
    $registry.agents += @{
        id = $agent.id
        name = $agent.name
        capabilities = $agent.capabilities
        mcpTools = $agent.mcpTools
        autonomy = $agent.autonomy
        priority = $agent.priority
    }
}

$registry | ConvertTo-Json -Depth 10 | Set-Content $registryMetaPath
Write-Host "✅ Agent registry created at $registryMetaPath" -ForegroundColor Green

# 4. Configure VS Code Tasks
Write-Host "`n⚙️  Configuring VS Code tasks..." -ForegroundColor Yellow

$vscodeDir = ".\.vscode"
if (-not (Test-Path $vscodeDir)) {
    New-Item -ItemType Directory -Path $vscodeDir -Force | Out-Null
}

$tasksConfig = @{
    version = "2.0.0"
    tasks = @(
        @{
            label = "Start Dev Workspace"
            type = "shell"
            command = "pwsh"
            args = @("-File", "scripts\dev.ps1")
            problemMatcher = @()
            presentation = @{
                reveal = "always"
                panel = "new"
            }
        },
        @{
            label = "Execute Agent Task"
            type = "shell"
            command = "pwsh"
            args = @("-File", "scripts\execute-agent.ps1", "-TaskId", "`${input:taskId}")
            problemMatcher = @()
        },
        @{
            label = "Deploy to Vercel"
            type = "shell"
            command = "vercel"
            args = @("--prod")
            problemMatcher = @()
        }
    )
    inputs = @(
        @{
            id = "taskId"
            type = "promptString"
            description = "Enter task ID to execute"
        }
    )
}

$tasksConfig | ConvertTo-Json -Depth 10 | Set-Content "$vscodeDir\tasks.json"
Write-Host "✅ VS Code tasks configured" -ForegroundColor Green

# 5. Set up Git Hooks
Write-Host "`n📝 Setting up Git hooks..." -ForegroundColor Yellow

$hooksDir = ".\.git\hooks"
if (Test-Path $hooksDir) {
    # Pre-commit hook
    $preCommitHook = @"
#!/bin/sh
# Auto-format commit message and track to CRM
pwsh -File scripts/git-hooks/pre-commit.ps1
"@
    Set-Content "$hooksDir\pre-commit" $preCommitHook -NoNewline

    # Post-commit hook
    $postCommitHook = @"
#!/bin/sh
# Send commit event to CRM
pwsh -File scripts/git-hooks/post-commit.ps1
"@
    Set-Content "$hooksDir\post-commit" $postCommitHook -NoNewline

    Write-Host "✅ Git hooks installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Not a git repository - skipping hooks" -ForegroundColor Yellow
}

# 6. Initialize CRM Integration
Write-Host "`n🔗 Initializing CRM integration..." -ForegroundColor Yellow

if ($config.crmIntegration.enabled) {
    $crmConfig = @{
        baseUrl = $config.crmIntegration.baseUrl
        projectId = $config.crmIntegration.projectId
        bearerToken = $env:LOCALLIFT_API_KEY
        events = $config.crmIntegration.events
    }

    $crmConfigPath = ".\config\crm-integration.json"
    New-Item -ItemType Directory -Path ".\config" -Force | Out-Null
    $crmConfig | ConvertTo-Json -Depth 10 | Set-Content $crmConfigPath

    Write-Host "✅ CRM integration configured" -ForegroundColor Green
    Write-Host "  Base URL: $($config.crmIntegration.baseUrl)" -ForegroundColor Gray
} else {
    Write-Host "⚠️  CRM integration disabled in config" -ForegroundColor Yellow
}

# 7. Set up Live Preview
Write-Host "`n👁️  Configuring live preview..." -ForegroundColor Yellow

$previewConfig = @{
    enabled = $config.livePreview.enabled
    clickToCode = $config.livePreview.clickToCode.enabled
    resolver = $config.livePreview.clickToCode.resolver
    vscodeCommand = $config.livePreview.clickToCode.vscodeCommand
    sandboxDir = $config.livePreview.sandboxDir
}

$previewConfigPath = ".\config\live-preview.json"
$previewConfig | ConvertTo-Json -Depth 10 | Set-Content $previewConfigPath
Write-Host "✅ Live preview configured" -ForegroundColor Green

# 8. Create Environment Template
Write-Host "`n🔐 Creating environment template..." -ForegroundColor Yellow

$envTemplate = @"
# Unified AI Dev Workspace Environment Variables
# Copy to .env.local and fill in your actual values

# LocalLift CRM API
LOCALLIFT_API_KEY=your_api_key_here
LOCALLIFT_PROJECT_ID=$($config.crmIntegration.projectId)

# GitHub Integration
GITHUB_TOKEN=your_github_token_here

# Vercel Integration
VERCEL_TOKEN=your_vercel_token_here
VERCEL_PROJECT_ID=your_vercel_project_id_here

# Supabase Integration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Telemetry
TELEMETRY_ENABLED=$($config.telemetry.enabled.ToString().ToLower())
TELEMETRY_ENDPOINT=$($config.telemetry.endpoint)
"@

Set-Content ".env.workspace.template" $envTemplate
Write-Host "✅ Environment template created (.env.workspace.template)" -ForegroundColor Green

# Summary
Write-Host "`n" -NoNewline
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ Unified AI Dev Workspace Setup Complete!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Copy .env.workspace.template to .env.local and add your API keys"
Write-Host "  2. Run 'pwsh scripts\dev.ps1' to start the dev workspace"
Write-Host "  3. Open VS Code and use 'Tasks: Run Task' → 'Start Dev Workspace'"
Write-Host ""
Write-Host "Configuration Files Created:" -ForegroundColor Yellow
Write-Host "  • $mcpConfigPath (MCP servers)"
Write-Host "  • $registryMetaPath (Agent registry)"
Write-Host "  • .vscode\tasks.json (VS Code tasks)"
Write-Host "  • config\crm-integration.json (CRM settings)"
Write-Host "  • config\live-preview.json (Preview settings)"
Write-Host ""
Write-Host "Global Directories:" -ForegroundColor Yellow
Write-Host "  • $($config.globalAgents.registryPath)"
Write-Host "  • $($config.globalMcpServers.path)"
Write-Host "  • $($config.livePreview.sandboxDir)"
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Cyan
