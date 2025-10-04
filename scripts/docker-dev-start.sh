#!/bin/bash
# Development environment startup script

set -e

echo "=========================================="
echo "GEO-SEO Domination Tool - Dev Environment"
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

# Create required directories
mkdir -p nginx/logs
mkdir -p backups

echo "Starting services..."
echo ""

# Start services
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 10

# Check service status
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "=========================================="
echo "Services are starting!"
echo "=========================================="
echo ""
echo "Access points:"
echo "  - Web App:   http://localhost:3000"
echo "  - PgAdmin:   http://localhost:5050"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis:     localhost:6379"
echo ""
echo "PgAdmin credentials:"
echo "  Email:    admin@geoseo.local"
echo "  Password: admin"
echo ""
echo "Database credentials:"
echo "  User:     geoseo"
echo "  Password: dev_password_change_me"
echo "  Database: geo_seo_db"
echo ""
echo "View logs:"
echo "  docker-compose -f docker-compose.dev.yml logs -f"
echo ""
echo "Stop services:"
echo "  docker-compose -f docker-compose.dev.yml down"
echo ""
