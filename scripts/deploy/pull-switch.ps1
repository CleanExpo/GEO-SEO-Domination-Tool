$ErrorActionPreference='Stop'
param(
  [ValidateSet('blue','green')] [string]$Target = 'green',
  [switch]$Prod
)

$compose = if ($Prod) { 'infra/docker/compose.bluegreen.prod.yml' } else { 'infra/docker/compose.bluegreen.yml' }
Write-Host "▶ Using compose: $compose" -ForegroundColor Cyan

Write-Host "▶ Pulling image for web_$Target..." -ForegroundColor Cyan
& docker compose -f $compose pull web_$Target

Write-Host "▶ Bringing up reverse_proxy + web_$Target..." -ForegroundColor Cyan
& docker compose -f $compose up -d reverse_proxy web_$Target

Write-Host "▶ Switching traffic → $Target..." -ForegroundColor Cyan
$body = @{ action='switch'; target=$Target; prod=([bool]$Prod) } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri http://localhost:3000/api/bluegreen -ContentType 'application/json' -Body $body | Out-Null

Write-Host "✓ Switched to $Target" -ForegroundColor Green
