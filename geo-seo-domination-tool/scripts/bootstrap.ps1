$ErrorActionPreference='Stop'
Write-Host '▶ Bootstrap starting…' -ForegroundColor Cyan
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force | Out-Null

# 1) Install & build MCP
if (Test-Path 'tools/geo-builders-mcp') {
  Push-Location 'tools/geo-builders-mcp'
  npm i
  npm run build
  Pop-Location
}

# 2) Install web-app deps (skip if missing)
if (Test-Path 'web-app') {
  Push-Location 'web-app'
  npm i
  Pop-Location
}

# 3) Link geo CLI
if (Test-Path 'tools/geo-cli') {
  Push-Location 'tools/geo-cli'
  npm i
  npm run build
  try { npm link } catch {}
  Pop-Location
}

# 4) Health check via CRM
try {
  $resp = Invoke-WebRequest -UseBasicParsing http://localhost:3000/api/health -TimeoutSec 5
  Write-Host 'ℹ CRM already running; /api/health queried.' -ForegroundColor DarkYellow
} catch {
  Write-Host 'ℹ Starting CRM is manual (use VS Code Run All or npm run dev in web-app). You can still run geo doctor once it is up.' -ForegroundColor DarkYellow
}

Write-Host '✓ Bootstrap complete. Next: open VS Code and run "Run All: Web + MCP + Worker" or run `geo doctor` once CRM is up.' -ForegroundColor Green
