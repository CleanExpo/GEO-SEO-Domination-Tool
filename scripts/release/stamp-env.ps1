$ErrorActionPreference='Stop'
param(
  [Parameter(Mandatory=$true)][string]$Tag
)

$root = Resolve-Path (Join-Path $PSScriptRoot '..' '..')
$envFile = Join-Path $root 'server/release.env'
New-Item -ItemType Directory -Force -Path (Split-Path $envFile -Parent) | Out-Null
"NEXT_PUBLIC_RELEASE_TAG=$Tag" | Out-File -FilePath $envFile -Encoding utf8 -Force
Write-Host "Stamped release.env with NEXT_PUBLIC_RELEASE_TAG=$Tag" -ForegroundColor Green
