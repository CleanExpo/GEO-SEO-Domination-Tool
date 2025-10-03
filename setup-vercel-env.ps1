# Vercel Environment Variables Setup Helper
# GEO SEO Domination Tool - Quick Setup Script

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Vercel Environment Setup - Quick Helper" -ForegroundColor Cyan
Write-Host "  GEO SEO Domination Tool" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Change to web-app directory
$webAppPath = "d:\GEO_SEO_Domination-Tool\geo-seo-domination-tool\web-app"
Set-Location $webAppPath

Write-Host "Current directory: $webAppPath" -ForegroundColor Yellow
Write-Host ""

# Function to add environment variable
function Add-VercelEnv {
    param(
        [string]$Name,
        [string]$Description,
        [bool]$Required = $false
    )
    
    $marker = if ($Required) { "[REQUIRED]" } else { "[OPTIONAL]" }
    Write-Host "$marker $Name" -ForegroundColor $(if ($Required) { "Red" } else { "Yellow" })
    Write-Host "  Description: $Description" -ForegroundColor Gray
    
    $response = Read-Host "  Do you want to add this variable? (y/n)"
    
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "  Running: vercel env add $Name production" -ForegroundColor Green
        Write-Host "  (You'll be prompted to enter the value)" -ForegroundColor Gray
        Write-Host ""
        
        & vercel env add $Name production
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ $Name added successfully!" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Failed to add $Name" -ForegroundColor Red
        }
        Write-Host ""
    } else {
        Write-Host "  ⏭️  Skipped $Name" -ForegroundColor Gray
        Write-Host ""
    }
}

# Function to generate secret
function New-Secret {
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RNGCryptoServiceProvider]::new().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

Write-Host "This script will help you add environment variables to Vercel." -ForegroundColor Cyan
Write-Host "Make sure you have the Vercel CLI installed and are logged in." -ForegroundColor Cyan
Write-Host ""

$start = Read-Host "Ready to start? (y/n)"
if ($start -ne 'y' -and $start -ne 'Y') {
    Write-Host "Setup cancelled." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  PHASE 1: CRITICAL API KEYS" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# OpenAI API Key
Add-VercelEnv -Name "OPENAI_API_KEY" -Description "OpenAI API key for AI features (get from platform.openai.com)" -Required $true

# Supabase Configuration
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  SUPABASE CONFIGURATION" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Get these from: https://supabase.com/dashboard" -ForegroundColor Yellow
Write-Host "  Settings → API for URL and keys" -ForegroundColor Gray
Write-Host "  Settings → Database for connection string" -ForegroundColor Gray
Write-Host ""

Add-VercelEnv -Name "NEXT_PUBLIC_SUPABASE_URL" -Description "Supabase Project URL (https://your-project.supabase.co)" -Required $true
Add-VercelEnv -Name "NEXT_PUBLIC_SUPABASE_ANON_KEY" -Description "Supabase anon/public key" -Required $true
Add-VercelEnv -Name "SUPABASE_SERVICE_ROLE_KEY" -Description "Supabase service_role key (KEEP SECRET!)" -Required $true
Add-VercelEnv -Name "DATABASE_URL" -Description "PostgreSQL connection string" -Required $true

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  PHASE 2: ENHANCED FEATURES (Optional)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$phase2 = Read-Host "Do you want to configure enhanced features? (y/n)"
if ($phase2 -eq 'y' -or $phase2 -eq 'Y') {
    Add-VercelEnv -Name "SEMRUSH_API_KEY" -Description "SEMrush API key for SEO features" -Required $false
    Add-VercelEnv -Name "PERPLEXITY_API_KEY" -Description "Perplexity API key for enhanced search" -Required $false
    Add-VercelEnv -Name "FIRECRAWL_API_KEY" -Description "Firecrawl API key for web scraping" -Required $false
    Add-VercelEnv -Name "GOOGLE_API_KEY" -Description "Google API key for integrations" -Required $false
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  PHASE 3: SECURITY SECRETS (Recommended)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$phase3 = Read-Host "Do you want to add security secrets? (y/n)"
if ($phase3 -eq 'y' -or $phase3 -eq 'Y') {
    Write-Host ""
    Write-Host "Generating JWT_SECRET..." -ForegroundColor Yellow
    $jwtSecret = New-Secret
    Write-Host "Generated: $jwtSecret" -ForegroundColor Green
    Write-Host ""
    
    $addJWT = Read-Host "Add JWT_SECRET to Vercel? (y/n)"
    if ($addJWT -eq 'y' -or $addJWT -eq 'Y') {
        Write-Host $jwtSecret | & vercel env add JWT_SECRET production
        Write-Host "✅ JWT_SECRET added!" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Generating SESSION_SECRET..." -ForegroundColor Yellow
    $sessionSecret = New-Secret
    Write-Host "Generated: $sessionSecret" -ForegroundColor Green
    Write-Host ""
    
    $addSession = Read-Host "Add SESSION_SECRET to Vercel? (y/n)"
    if ($addSession -eq 'y' -or $addSession -eq 'Y') {
        Write-Host $sessionSecret | & vercel env add SESSION_SECRET production
        Write-Host "✅ SESSION_SECRET added!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  SETUP COMPLETE!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Verify variables were added:" -ForegroundColor White
Write-Host "   vercel env ls" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Redeploy to apply changes:" -ForegroundColor White
Write-Host "   vercel --prod" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test your application:" -ForegroundColor White
Write-Host "   https://geo-seo-domination-tool.vercel.app" -ForegroundColor Gray
Write-Host ""

$redeploy = Read-Host "Deploy now? (y/n)"
if ($redeploy -eq 'y' -or $redeploy -eq 'Y') {
    Write-Host ""
    Write-Host "Deploying to production..." -ForegroundColor Yellow
    & vercel --prod
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Deployment successful!" -ForegroundColor Green
        Write-Host "Visit: https://geo-seo-domination-tool.vercel.app" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "For more information, see:" -ForegroundColor Yellow
Write-Host "  - VERCEL_SETUP_ACTION_PLAN.md" -ForegroundColor Gray
Write-Host "  - VERCEL_ENVIRONMENT_SETUP.md" -ForegroundColor Gray
Write-Host ""
