# Unified AI Dev Workspace - Development Workflow Script
# Orchestrates dev server, live preview, and CRM tracking

param(
    [switch]$NoBrowser,
    [switch]$NoLivePreview,
    [switch]$NoCRM,
    [int]$Port = 3000
)

Write-Host "🚀 Starting Unified AI Dev Workspace..." -ForegroundColor Cyan
Write-Host ""

# Load configurations
$workspaceConfig = Get-Content ".\workspace-config.json" | ConvertFrom-Json
$crmConfigPath = ".\config\crm-integration.json"
$previewConfigPath = ".\config\live-preview.json"

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  Warning: .env.local not found" -ForegroundColor Yellow
    Write-Host "   Copy .env.workspace.template to .env.local and add your API keys" -ForegroundColor Gray
    Write-Host ""
}

# 1. Start Next.js Dev Server
Write-Host "📦 Starting Next.js dev server on port $Port..." -ForegroundColor Yellow

$devServerJob = Start-Job -ScriptBlock {
    param($port)
    Set-Location $using:PWD
    $env:PORT = $port
    npm run dev
} -ArgumentList $Port

Start-Sleep -Seconds 3

# Wait for dev server to be ready
$maxRetries = 30
$retries = 0
$serverReady = $false

Write-Host "⏳ Waiting for dev server to be ready..." -ForegroundColor Gray

while ($retries -lt $maxRetries -and -not $serverReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 404) {
            $serverReady = $true
            Write-Host "✅ Dev server ready at http://localhost:$Port" -ForegroundColor Green
        }
    } catch {
        $retries++
        Start-Sleep -Milliseconds 500
    }
}

if (-not $serverReady) {
    Write-Host "❌ Dev server failed to start after 15 seconds" -ForegroundColor Red
    Stop-Job -Job $devServerJob
    Remove-Job -Job $devServerJob
    exit 1
}

# 2. Send dev session start event to CRM
if (-not $NoCRM -and $workspaceConfig.crmIntegration.enabled -and (Test-Path $crmConfigPath)) {
    Write-Host "`n🔗 Sending session start event to CRM..." -ForegroundColor Yellow

    $crmConfig = Get-Content $crmConfigPath | ConvertFrom-Json
    $crmToken = $env:LOCALLIFT_API_KEY

    if ($crmToken) {
        try {
            $sessionPayload = @{
                event = "dev.session.start"
                projectId = $crmConfig.projectId
                timestamp = Get-Date -Format "o"
                metadata = @{
                    port = $Port
                    branch = (git branch --show-current)
                    lastCommit = (git log -1 --format="%h - %s")
                }
            }

            $headers = @{
                "Authorization" = "Bearer $crmToken"
                "Content-Type" = "application/json"
            }

            Invoke-RestMethod `
                -Uri "$($crmConfig.baseUrl)/api/v1/dev-events" `
                -Method Post `
                -Headers $headers `
                -Body ($sessionPayload | ConvertTo-Json) `
                -ErrorAction SilentlyContinue | Out-Null

            Write-Host "✅ CRM notified of dev session start" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Failed to send CRM event: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  LOCALLIFT_API_KEY not set - CRM tracking disabled" -ForegroundColor Yellow
    }
}

# 3. Start Live Preview (if enabled)
if (-not $NoLivePreview -and $workspaceConfig.livePreview.enabled -and (Test-Path $previewConfigPath)) {
    Write-Host "`n👁️  Starting live preview with click-to-code..." -ForegroundColor Yellow

    $previewConfig = Get-Content $previewConfigPath | ConvertFrom-Json

    # Create userscript for click-to-code injection
    $userscriptPath = Join-Path $previewConfig.sandboxDir "click-to-code.user.js"
    New-Item -ItemType Directory -Path $previewConfig.sandboxDir -Force | Out-Null

    $userscript = @"
// ==UserScript==
// @name         Click-to-Code for GEO-SEO Dev Workspace
// @namespace    http://localhost:$Port/
// @version      1.0.0
// @description  Click any element to open source in VS Code
// @author       GEO-SEO Team
// @match        http://localhost:$Port/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let inspectorEnabled = false;
    let overlay = null;

    // Create overlay for highlighting
    function createOverlay() {
        overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; pointer-events: none; border: 2px solid #10b981; background: rgba(16, 185, 129, 0.1); z-index: 999999; display: none;';
        document.body.appendChild(overlay);
    }

    // Toggle inspector with Ctrl+Shift+E
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'E') {
            e.preventDefault();
            inspectorEnabled = !inspectorEnabled;
            console.log('🔍 Click-to-Code Inspector:', inspectorEnabled ? 'ENABLED' : 'DISABLED');
            if (!inspectorEnabled && overlay) overlay.style.display = 'none';
        }
    });

    // Highlight element on hover
    document.addEventListener('mousemove', (e) => {
        if (!inspectorEnabled) return;
        if (!overlay) createOverlay();

        const rect = e.target.getBoundingClientRect();
        overlay.style.display = 'block';
        overlay.style.left = rect.left + 'px';
        overlay.style.top = rect.top + 'px';
        overlay.style.width = rect.width + 'px';
        overlay.style.height = rect.height + 'px';
    });

    // Open in VS Code on click
    document.addEventListener('click', async (e) => {
        if (!inspectorEnabled) return;
        e.preventDefault();
        e.stopPropagation();

        const target = e.target;
        const dataSource = target.getAttribute('data-source');

        if (dataSource) {
            // Extract file:line:column from data-source
            const match = dataSource.match(/^(.+):(\d+):(\d+)$/);
            if (match) {
                const [, filepath, line, column] = match;
                console.log('📂 Opening in VS Code:', filepath, 'at', line + ':' + column);

                // Call backend endpoint to open in VS Code
                await fetch('/api/dev/open-in-vscode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filepath, line, column })
                });
            }
        } else {
            // Fallback: try to find source from component hierarchy
            let current = target;
            while (current && current !== document.body) {
                const source = current.getAttribute('data-source');
                if (source) {
                    console.log('📂 Found source in parent:', source);
                    const match = source.match(/^(.+):(\d+):(\d+)$/);
                    if (match) {
                        const [, filepath, line, column] = match;
                        await fetch('/api/dev/open-in-vscode', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ filepath, line, column })
                        });
                    }
                    break;
                }
                current = current.parentElement;
            }
        }

        inspectorEnabled = false;
        if (overlay) overlay.style.display = 'none';
    }, true);

    console.log('✨ Click-to-Code loaded! Press Ctrl+Shift+E to toggle inspector.');
})();
"@

    Set-Content $userscriptPath $userscript
    Write-Host "✅ Click-to-code userscript created at $userscriptPath" -ForegroundColor Green
    Write-Host "   Install in your browser (Tampermonkey/Greasemonkey)" -ForegroundColor Gray
    Write-Host "   Press Ctrl+Shift+E in browser to toggle inspector" -ForegroundColor Gray
}

# 4. Open browser
if (-not $NoBrowser) {
    Write-Host "`n🌐 Opening browser..." -ForegroundColor Yellow
    Start-Process "http://localhost:$Port"
    Write-Host "✅ Browser opened at http://localhost:$Port" -ForegroundColor Green
}

# 5. Display agent status
Write-Host "`n🤖 Available Agents:" -ForegroundColor Yellow
foreach ($agent in $workspaceConfig.globalAgents.agents) {
    $status = if ($agent.autonomy -ge 0.8) { "🟢" } elseif ($agent.autonomy -ge 0.5) { "🟡" } else { "🔴" }
    Write-Host "  $status $($agent.name) (Priority: $($agent.priority))" -ForegroundColor Gray
    Write-Host "     Tools: $($agent.mcpTools -join ', ')" -ForegroundColor DarkGray
}

# 6. Display workflow status
Write-Host "`n⚙️  Active Workflows:" -ForegroundColor Yellow
foreach ($workflow in $workspaceConfig.workflows) {
    $triggerInfo = if ($workflow.trigger.type -eq "manual") { "Manual" } else { "$($workflow.trigger.type): $($workflow.trigger.pattern)" }
    Write-Host "  • $($workflow.name) ($triggerInfo)" -ForegroundColor Gray
}

# 7. Monitor and keep alive
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ Dev Workspace Running!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services:" -ForegroundColor Yellow
Write-Host "  • Next.js Dev Server: http://localhost:$Port"
Write-Host "  • Click-to-Code: Ctrl+Shift+E in browser"
if ($workspaceConfig.crmIntegration.enabled -and -not $NoCRM) {
    Write-Host "  • CRM Tracking: Enabled"
}
Write-Host ""
Write-Host "Commands:" -ForegroundColor Yellow
Write-Host "  • Press 'Q' to quit"
Write-Host "  • Press 'R' to restart dev server"
Write-Host "  • Press 'B' to open new browser window"
Write-Host "  • Press 'T' to run task inbox test"
Write-Host ""

# Command loop
$running = $true
while ($running) {
    if ([Console]::KeyAvailable) {
        $key = [Console]::ReadKey($true)

        switch ($key.Key) {
            'Q' {
                Write-Host "`n🛑 Shutting down dev workspace..." -ForegroundColor Yellow
                $running = $false
            }
            'R' {
                Write-Host "`n🔄 Restarting dev server..." -ForegroundColor Yellow
                Stop-Job -Job $devServerJob
                Remove-Job -Job $devServerJob

                $devServerJob = Start-Job -ScriptBlock {
                    param($port)
                    Set-Location $using:PWD
                    $env:PORT = $port
                    npm run dev
                } -ArgumentList $Port

                Write-Host "✅ Dev server restarted" -ForegroundColor Green
            }
            'B' {
                Write-Host "`n🌐 Opening new browser window..." -ForegroundColor Yellow
                Start-Process "http://localhost:$Port"
            }
            'T' {
                Write-Host "`n🧪 Opening task inbox..." -ForegroundColor Yellow
                Start-Process "http://localhost:$Port/task-inbox"
            }
        }
    }

    Start-Sleep -Milliseconds 200
}

# Cleanup
Write-Host "Stopping dev server..." -ForegroundColor Gray
Stop-Job -Job $devServerJob
Remove-Job -Job $devServerJob

# Send session end event to CRM
if (-not $NoCRM -and $workspaceConfig.crmIntegration.enabled -and (Test-Path $crmConfigPath)) {
    $crmConfig = Get-Content $crmConfigPath | ConvertFrom-Json
    $crmToken = $env:LOCALLIFT_API_KEY

    if ($crmToken) {
        try {
            $sessionEndPayload = @{
                event = "dev.session.end"
                projectId = $crmConfig.projectId
                timestamp = Get-Date -Format "o"
            }

            $headers = @{
                "Authorization" = "Bearer $crmToken"
                "Content-Type" = "application/json"
            }

            Invoke-RestMethod `
                -Uri "$($crmConfig.baseUrl)/api/v1/dev-events" `
                -Method Post `
                -Headers $headers `
                -Body ($sessionEndPayload | ConvertTo-Json) `
                -ErrorAction SilentlyContinue | Out-Null
        } catch {
            # Silent fail on shutdown
        }
    }
}

Write-Host "`n✅ Dev workspace stopped" -ForegroundColor Green
