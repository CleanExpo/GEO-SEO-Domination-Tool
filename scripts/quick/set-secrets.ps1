$ErrorActionPreference='Stop'

$root = Resolve-Path (Join-Path (Join-Path $PSScriptRoot '..') '..')
$dir  = Join-Path $root 'server/secrets'
$file = Join-Path $dir  'integrations.local.json'

New-Item -ItemType Directory -Force -Path $dir | Out-Null

Write-Host 'Enter tokens (press Enter to leave blank):' -ForegroundColor Cyan
$gh = Read-Host 'GITHUB_TOKEN'
$vc = Read-Host 'VERCEL_TOKEN'
$su = Read-Host 'SUPABASE_URL'
$sa = Read-Host 'SUPABASE_ANON_KEY'

$payload = [ordered]@{ github=@{token=$gh}; vercel=@{token=$vc}; supabase=@{url=$su; anonKey=$sa} }
$payload | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 $file

Write-Host "[OK] Wrote $file" -ForegroundColor Green
Write-Host 'You can now open /settings/integrations and click **Check Status**.' -ForegroundColor Green
