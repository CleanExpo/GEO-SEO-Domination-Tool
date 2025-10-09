# Start MCP Servers in Docker (PowerShell)
# Usage: .\start-mcp-servers.ps1 [-Service <puppeteer|playwright|all>]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('puppeteer', 'playwright', 'all')]
    [string]$Service = 'all'
)

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  GEO-SEO MCP Servers - Docker Startup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✓ Docker is running`n" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again" -ForegroundColor Yellow
    exit 1
}

# Change to script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Start services
switch ($Service) {
    'puppeteer' {
        Write-Host "Starting Puppeteer MCP server..." -ForegroundColor Yellow
        docker-compose up -d puppeteer-mcp
    }
    'playwright' {
        Write-Host "Starting Playwright MCP server..." -ForegroundColor Yellow
        docker-compose up -d playwright-mcp
    }
    'all' {
        Write-Host "Starting all MCP servers..." -ForegroundColor Yellow
        docker-compose up -d
    }
}

Write-Host "`nWaiting for containers to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check container status
Write-Host "`nContainer Status:`n" -ForegroundColor Cyan
docker-compose ps

# Check logs
Write-Host "`nRecent Logs:`n" -ForegroundColor Cyan
docker-compose logs --tail=20

Write-Host "`n═══════════════════════════════════════" -ForegroundColor Green
Write-Host "✓ MCP Servers Started" -ForegroundColor Green
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Green

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Copy .claude/mcp-docker.json to .claude/mcp.json"
Write-Host "2. Reload VS Code window (Ctrl+Shift+P -> Reload Window)"
Write-Host "3. Test with: docker exec -i geo-seo-puppeteer-mcp node /app/mcp-wrapper.js"

Write-Host "`nManagement Commands:" -ForegroundColor Cyan
Write-Host "• View logs:    docker-compose logs -f"
Write-Host "• Stop servers: docker-compose down"
Write-Host "• Restart:      docker-compose restart"
Write-Host "• Status:       docker-compose ps"
