# Automatic Fix Script for GEO-SEO Domination Tool
# This script will kill all background processes, clear caches, and start fresh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GEO-SEO Auto-Fix Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill all node processes
Write-Host "[1/5] Killing all node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "      Killed $($nodeProcesses.Count) node processes" -ForegroundColor Green
} else {
    Write-Host "      No node processes found" -ForegroundColor Gray
}

Start-Sleep -Seconds 2

# Step 2: Clear port 3000, 3001, 3002
Write-Host "[2/5] Clearing ports 3000-3002..." -ForegroundColor Yellow
$ports = @(3000, 3001, 3002)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $connections | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Write-Host "      Cleared port $port" -ForegroundColor Green
    }
}

Start-Sleep -Seconds 2

# Step 3: Clear all caches
Write-Host "[3/5] Clearing all build caches..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $env:TEMP\next-* -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $env:LOCALAPPDATA\Microsoft\TypeScript -ErrorAction SilentlyContinue
Write-Host "      All caches cleared" -ForegroundColor Green

# Step 4: Verify environment configuration
Write-Host "[4/5] Verifying environment configuration..." -ForegroundColor Yellow

# Check .env.local
$envLocal = Get-Content .env.local -Raw
if ($envLocal -match '(?m)^POSTGRES_URL="') {
    Write-Host "      WARNING: POSTGRES_URL is NOT commented in .env.local" -ForegroundColor Red
    Write-Host "      Commenting it out now..." -ForegroundColor Yellow
    $envLocal = $envLocal -replace '(?m)^POSTGRES_URL="', '# POSTGRES_URL="'
    Set-Content .env.local -Value $envLocal
    Write-Host "      Fixed .env.local" -ForegroundColor Green
} else {
    Write-Host "      .env.local is configured correctly" -ForegroundColor Green
}

# Check .env.development
$envDev = Get-Content .env.development -Raw
if ($envDev -match '(?m)^POSTGRES_URL="') {
    Write-Host "      WARNING: POSTGRES_URL is NOT commented in .env.development" -ForegroundColor Red
    Write-Host "      Commenting it out now..." -ForegroundColor Yellow
    $envDev = $envDev -replace '(?m)^POSTGRES_URL="', '# POSTGRES_URL="'
    Set-Content .env.development -Value $envDev
    Write-Host "      Fixed .env.development" -ForegroundColor Green
} else {
    Write-Host "      .env.development is configured correctly" -ForegroundColor Green
}

# Ensure SQLite flags are set
if ($envLocal -notmatch 'USE_SQLITE=true') {
    Write-Host "      Adding SQLite flags to .env.local..." -ForegroundColor Yellow
    Add-Content .env.local -Value "`n# Force SQLite for local development`nUSE_SQLITE=true`nFORCE_LOCAL_DB=true`n"
    Write-Host "      Added SQLite flags" -ForegroundColor Green
}

Start-Sleep -Seconds 1

# Step 5: Start dev server
Write-Host "[5/5] Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting dev server now..." -ForegroundColor White
Write-Host "Look for this success message:" -ForegroundColor Yellow
Write-Host "  🔧 Using SQLite database at: D:\GEO_SEO_Domination-Tool\data\geo-seo.db" -ForegroundColor Cyan
Write-Host "  ✓ Connected to SQLite database" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server anytime" -ForegroundColor Gray
Write-Host ""

# Start npm dev
npm run dev
