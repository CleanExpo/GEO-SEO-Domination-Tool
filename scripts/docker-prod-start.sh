#!/bin/bash
# Production environment startup script

set -e

echo "=========================================="
echo "GEO-SEO Domination Tool - Production"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed."
    exit 1
fi

echo "✓ Docker is running"
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."

# Check for .env.docker file
if [ ! -f .env.docker ]; then
    echo "Error: .env.docker file not found!"
    echo "Please copy .env.docker.example to .env.docker and configure it."
    exit 1
fi

echo "✓ Environment file found"
echo ""

# Create required directories
mkdir -p nginx/logs
mkdir -p nginx/ssl
mkdir -p backups

echo "Building images..."
docker-compose -f docker-compose.prod.yml --env-file .env.docker build

echo ""
echo "Starting services..."
docker-compose -f docker-compose.prod.yml --env-file .env.docker up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 15

# Check service status
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "=========================================="
echo "Production services are running!"
echo "=========================================="
echo ""
echo "Access points:"
echo "  - Web App: Port 3000"
echo "  - Nginx:   Port 80/443"
echo ""
echo "View logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "Stop services:"
echo "  docker-compose -f docker-compose.prod.yml down"
echo ""
echo "IMPORTANT: Configure SSL certificates in nginx/ssl/"
echo ""
