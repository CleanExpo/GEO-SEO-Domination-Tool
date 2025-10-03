Param()
$ErrorActionPreference = 'Stop'
Write-Host '>> Cleaning node_modules and lockfile' -ForegroundColor Cyan
if (Test-Path 'node_modules') { Remove-Item -Recurse -Force 'node_modules' }
if (Test-Path 'package-lock.json') { Remove-Item -Force 'package-lock.json' }
Write-Host '>> npm install' -ForegroundColor Cyan
npm install --no-optional
if ($LASTEXITCODE -ne 0) { throw 'npm install failed' }
Write-Host '>> Building with tsc' -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw 'tsc build failed' }
Write-Host '>> Done. dist/index.js should exist.' -ForegroundColor Green
