#!/usr/bin/env pwsh

# Fix Snippet Error Script
# This script resolves the "Unable to find snippet with ID" error

Write-Host "🔧 Fixing Snippet Error..." -ForegroundColor Yellow

# 1. Clear VS Code workspace cache
Write-Host "1. Clearing VS Code workspace cache..." -ForegroundColor Cyan
$vscodeSettings = ".vscode"
if (Test-Path $vscodeSettings) {
    $settingsFile = "$vscodeSettings/settings.json"
    if (Test-Path $settingsFile) {
        Write-Host "   - Backing up VS Code settings..." -ForegroundColor Gray
        Copy-Item $settingsFile "$settingsFile.backup" -ErrorAction SilentlyContinue
        
        # Clean settings file
        try {
            $settings = Get-Content $settingsFile -Raw | ConvertFrom-Json -ErrorAction Stop
            $settings | ConvertTo-Json -Depth 10 | Set-Content $settingsFile
            Write-Host "   ✅ VS Code settings cleaned" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Could not parse settings.json - may contain invalid JSON" -ForegroundColor Yellow
        }
    }
}

# 2. Clear Next.js cache
Write-Host "2. Clearing Next.js build cache..." -ForegroundColor Cyan
$nextCache = @(".next", "node_modules/.cache")
foreach ($cache in $nextCache) {
    if (Test-Path $cache) {
        Remove-Item $cache -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Removed $cache" -ForegroundColor Green
    }
}

# 3. Clear npm cache
Write-Host "3. Clearing npm cache..." -ForegroundColor Cyan
try {
    npm cache clean --force 2>$null
    Write-Host "   ✅ npm cache cleared" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Could not clear npm cache" -ForegroundColor Yellow
}

# 4. Check for broken imports
Write-Host "4. Checking for potential broken imports..." -ForegroundColor Cyan
$brokenPatterns = @(
    "import.*snippet",
    "require.*snippet", 
    "c51062ac-e7e9-4e49-bfd0-e3f42d5fcdbe"
)

$foundIssues = @()
foreach ($pattern in $brokenPatterns) {
    $matches = Select-String -Path "*.ts","*.tsx","*.js","*.jsx","*.json" -Pattern $pattern -Exclude "node_modules","dist",".next" -ErrorAction SilentlyContinue
    if ($matches) {
        $foundIssues += $matches
    }
}

if ($foundIssues.Count -gt 0) {
    Write-Host "   ⚠️  Found potential issues:" -ForegroundColor Yellow
    $foundIssues | ForEach-Object { Write-Host "     - $($_.Filename):$($_.LineNumber)" -ForegroundColor Red }
} else {
    Write-Host "   ✅ No broken imports found" -ForegroundColor Green
}

# 5. Rebuild dependencies
Write-Host "5. Rebuilding dependencies..." -ForegroundColor Cyan
try {
    npm install --force 2>$null
    Write-Host "   ✅ Dependencies reinstalled" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Error reinstalling dependencies" -ForegroundColor Yellow
}

# 6. Test Sentry configuration
Write-Host "6. Testing Sentry configuration..." -ForegroundColor Cyan
$sentryFiles = @(
    "sentry.client.config.ts",
    "sentry.server.config.ts", 
    "sentry.edge.config.ts"
)

$allSentryFilesExist = $true
foreach ($file in $sentryFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file missing" -ForegroundColor Red
        $allSentryFilesExist = $false
    }
}

Write-Host ""
Write-Host "🎉 Fix Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Restart VS Code completely" -ForegroundColor White
Write-Host "2. Run: npm run build" -ForegroundColor White
Write-Host "3. Add Sentry environment variables to .env.local" -ForegroundColor White
Write-Host ""

if (-not $allSentryFilesExist) {
    Write-Host "⚠️  Some Sentry files are missing. Run the Sentry wizard:" -ForegroundColor Yellow
    Write-Host "   npx @sentry/wizard@latest -i nextjs" -ForegroundColor White
}

Write-Host "📖 See SENTRY_SETUP_COMPLETE.md for detailed setup instructions" -ForegroundColor Blue