# PowerShell script for starting development environment on Windows

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "GEO-SEO Domination Tool - Dev Environment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Error: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Navigate to project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptPath\.."

# Create required directories
New-Item -ItemType Directory -Force -Path "nginx\logs" | Out-Null
New-Item -ItemType Directory -Force -Path "backups" | Out-Null

Write-Host "Starting services..." -ForegroundColor Yellow
Write-Host ""

# Start services
docker-compose -f docker-compose.dev.yml up -d

Write-Host ""
Write-Host "Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service status
docker-compose -f docker-compose.dev.yml ps

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Services are starting!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access points:" -ForegroundColor Yellow
Write-Host "  - Web App:   http://localhost:3000"
Write-Host "  - PgAdmin:   http://localhost:5050"
Write-Host "  - PostgreSQL: localhost:5432"
Write-Host "  - Redis:     localhost:6379"
Write-Host ""
Write-Host "PgAdmin credentials:" -ForegroundColor Yellow
Write-Host "  Email:    admin@geoseo.local"
Write-Host "  Password: admin"
Write-Host ""
Write-Host "Database credentials:" -ForegroundColor Yellow
Write-Host "  User:     geoseo"
Write-Host "  Password: dev_password_change_me"
Write-Host "  Database: geo_seo_db"
Write-Host ""
Write-Host "View logs:" -ForegroundColor Yellow
Write-Host "  docker-compose -f docker-compose.dev.yml logs -f"
Write-Host ""
Write-Host "Stop services:" -ForegroundColor Yellow
Write-Host "  docker-compose -f docker-compose.dev.yml down"
Write-Host ""
