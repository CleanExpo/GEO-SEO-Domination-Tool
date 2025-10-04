# PowerShell script for starting production environment on Windows

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "GEO-SEO Domination Tool - Production" -ForegroundColor Cyan
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

# Check for .env.docker file
if (-not (Test-Path ".env.docker")) {
    Write-Host "Error: .env.docker file not found!" -ForegroundColor Red
    Write-Host "Please copy .env.docker.example to .env.docker and configure it." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Environment file found" -ForegroundColor Green
Write-Host ""

# Create required directories
New-Item -ItemType Directory -Force -Path "nginx\logs" | Out-Null
New-Item -ItemType Directory -Force -Path "nginx\ssl" | Out-Null
New-Item -ItemType Directory -Force -Path "backups" | Out-Null

Write-Host "Building images..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml --env-file .env.docker build

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml --env-file .env.docker up -d

Write-Host ""
Write-Host "Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check service status
docker-compose -f docker-compose.prod.yml ps

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Production services are running!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access points:" -ForegroundColor Yellow
Write-Host "  - Web App: Port 3000"
Write-Host "  - Nginx:   Port 80/443"
Write-Host ""
Write-Host "View logs:" -ForegroundColor Yellow
Write-Host "  docker-compose -f docker-compose.prod.yml logs -f"
Write-Host ""
Write-Host "Stop services:" -ForegroundColor Yellow
Write-Host "  docker-compose -f docker-compose.prod.yml down"
Write-Host ""
Write-Host "IMPORTANT: Configure SSL certificates in nginx\ssl\" -ForegroundColor Red
Write-Host ""
