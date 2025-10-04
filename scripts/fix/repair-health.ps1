$ErrorActionPreference = 'Stop'

# --- Paths (auto-detect both common layouts) ----------------------------------
$repoRoot = Resolve-Path (Join-Path (Join-Path $PSScriptRoot '..') '..')
$toolA = Join-Path $repoRoot 'tools/geo-builders-mcp'
$toolB = Join-Path $repoRoot 'geo-seo-domination-tool/tools/geo-builders-mcp'
$toolDir = if (Test-Path $toolA) { $toolA } elseif (Test-Path $toolB) { $toolB } else { $null }
if (-not $toolDir) { throw 'Cannot locate tools/geo-builders-mcp. Please verify repo layout.' }

$distJs = Join-Path $toolDir 'dist/index.js'
$secretsDir = Join-Path $repoRoot 'server/secrets'
$integrationsFile = Join-Path $secretsDir 'integrations.local.json'

Write-Host "[INFO] Using MCP path: $toolDir" -ForegroundColor Cyan

# --- Step 1: Build MCP (dist/index.js) ----------------------------------------
if (-not (Test-Path $distJs)) {
  Write-Host '[INFO] Building MCP server (TypeScript to dist)' -ForegroundColor Cyan
  Push-Location $toolDir
  try {
    if (Test-Path 'package-lock.json') { npm ci } else { npm i }
    npm run build
  } finally { Pop-Location }
} else {
  Write-Host '[INFO] MCP dist already exists, skipping build' -ForegroundColor DarkGray
}

if (-not (Test-Path $distJs)) { throw "Build succeeded but dist/index.js not found at: $distJs" }
Write-Host "[OK] MCP dist present at $distJs" -ForegroundColor Green

# --- Step 2: Create integrations.local.json safely ----------------------------
New-Item -ItemType Directory -Force -Path $secretsDir | Out-Null

# Pull from environment when available; otherwise use empty strings
$payload = [ordered]@{
  github   = @{ token = ($env:GITHUB_TOKEN   | ForEach-Object { $_ }) }
  vercel   = @{ token = ($env:VERCEL_TOKEN   | ForEach-Object { $_ }) }
  supabase = @{ url   = ($env:SUPABASE_URL   | ForEach-Object { $_ }); anonKey = ($env:SUPABASE_ANON_KEY | ForEach-Object { $_ }) }
}
# Normalize nulls to empty strings so file always validates
if (-not $payload.github.token)   { $payload.github.token   = '' }
if (-not $payload.vercel.token)   { $payload.vercel.token   = '' }
if (-not $payload.supabase.url)   { $payload.supabase.url   = '' }
if (-not $payload.supabase.anonKey) { $payload.supabase.anonKey = '' }

$payload | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 $integrationsFile
Write-Host "[OK] Wrote secrets file to $integrationsFile" -ForegroundColor Green

# --- Summary ------------------------------------------------------------------
Write-Host ''
Write-Host '[DONE] All set' -ForegroundColor Green
Write-Host 'Re-run the health page or: curl http://localhost:3004/api/health' -ForegroundColor Green
