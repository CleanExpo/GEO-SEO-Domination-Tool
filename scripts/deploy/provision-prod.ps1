param(
  [string]$Compose = 'infra/docker/compose.bluegreen.prod.yml',
  [string]$ReleaseTag = 'v1.0.0',
  [int]$ProxyPort = 8080,
  [switch]$PublicImage,
  [string]$GhcrUser = $env:GITHUB_ACTOR,
  [string]$GhcrToken = $env:GITHUB_TOKEN
)
$ErrorActionPreference='Stop'

function Require-Cmd($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $name. Install it and re-run."
  }
}

Write-Host '▶ Pre-flight checks' -ForegroundColor Cyan
Require-Cmd docker

# Resolve repo root
$root = Resolve-Path (Join-Path (Join-Path $PSScriptRoot '..') '..')
$composePath = Join-Path $root $Compose
if (-not (Test-Path $composePath)) { throw "Compose file not found: $composePath" }

# Ensure Nginx config exists
$nginxTpl = Join-Path $root 'infra/docker/nginx/conf.d/active.conf.tpl'
$nginxActive = Join-Path $root 'infra/docker/nginx/conf.d/active.conf'
if (-not (Test-Path $nginxActive)) {
  if (-not (Test-Path $nginxTpl)) { throw "Missing Nginx template: $nginxTpl" }
  (Get-Content $nginxTpl -Raw).Replace('{{TARGET}}','blue') | Set-Content -Encoding UTF8 $nginxActive
  Write-Host '✓ Created active.conf → BLUE' -ForegroundColor Green
}

# Ensure env files
$envLocal = Join-Path $root 'geo-seo-domination-tool/web-app/.env.local'
if (-not (Test-Path $envLocal)) {
  Write-Warning ".env.local not found at $envLocal. The app may rely on defaults; create it if needed."
}

$releaseEnvDir = Join-Path $root 'server'
$releaseEnv = Join-Path $releaseEnvDir 'release.env'
New-Item -ItemType Directory -Force -Path $releaseEnvDir | Out-Null
"NEXT_PUBLIC_RELEASE_TAG=$ReleaseTag" | Out-File -FilePath $releaseEnv -Encoding utf8 -Force
Write-Host "✓ Stamped NEXT_PUBLIC_RELEASE_TAG=$ReleaseTag" -ForegroundColor Green

# GHCR login (if private)
if (-not $PublicImage) {
  if (-not $GhcrToken) { throw 'GHCR token missing. Pass -GhcrToken or set $env:GITHUB_TOKEN. Or use -PublicImage if your image is public.' }
  Write-Host '▶ Logging in to ghcr.io' -ForegroundColor Cyan
  $GhcrToken | docker login ghcr.io -u ($GhcrUser ? $GhcrUser : 'USERNAME') --password-stdin
  Write-Host '✓ GHCR login ok' -ForegroundColor Green
}

# Bring up reverse proxy and BLUE by default
Write-Host '▶ Starting reverse proxy + BLUE stack' -ForegroundColor Cyan
& docker compose -f $composePath up -d reverse_proxy web_blue

# Verify proxy port mapping
Write-Host ("✓ Proxy should be available at http://localhost:{0}" -f $ProxyPort) -ForegroundColor Green

# Optional: Pull GREEN image and start it (staged)
Write-Host '▶ Pulling GREEN image and starting (staged)' -ForegroundColor Cyan
& docker compose -f $composePath pull web_green
& docker compose -f $composePath up -d web_green

# Show status
Write-Host '▶ docker compose ps' -ForegroundColor Cyan
& docker compose -f $composePath ps

Write-Host '✓ Provisioning complete.' -ForegroundColor Green
Write-Host ''
Write-Host 'Next:' -ForegroundColor Cyan
Write-Host ('  1) Open  http://localhost:{0}  (should serve BLUE)' -f $ProxyPort)
Write-Host '  2) When ready, switch traffic → GREEN in /deploy/bluegreen (prod controls)'
Write-Host '  3) If you update the release tag, re-run Up on the target color to reload env'
