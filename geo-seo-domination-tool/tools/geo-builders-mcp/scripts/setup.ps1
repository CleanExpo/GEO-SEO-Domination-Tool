# Setup script for GEO Builders MCP Server (PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "🔧 Setting up GEO Builders MCP Server..." -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from tools/geo-builders-mcp/" -ForegroundColor Red
    exit 1
}

# Install dependencies (skip optional to avoid Windows build issues)
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install --no-optional

# Build the server with tsc (pure TypeScript, no bundler)
Write-Host "🏗️  Building TypeScript with tsc..." -ForegroundColor Yellow
npm run build

# Verify build
if (-not (Test-Path "dist/index.js")) {
    Write-Host "❌ Build failed: dist/index.js not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Add to Claude Desktop config (%AppData%\Claude\claude_desktop_config.json):" -ForegroundColor White
Write-Host ""
Write-Host '   "geo-builders": {' -ForegroundColor Gray
Write-Host '     "command": "node",' -ForegroundColor Gray
$currentPath = (Get-Location).Path
Write-Host "     `"args`": [`"$currentPath\dist\index.js`"]" -ForegroundColor Gray
Write-Host '   }' -ForegroundColor Gray
Write-Host ""
Write-Host "2. Restart Claude Desktop" -ForegroundColor White
Write-Host ""
Write-Host "3. Test with: 'List all available builders'" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
