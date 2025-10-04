#!/bin/bash
# Database backup script for production

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/postgres_backup_$TIMESTAMP.sql"

echo "=========================================="
echo "GEO-SEO Database Backup"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running."
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check which environment is running
if docker ps | grep -q "geo-seo-postgres-prod"; then
    CONTAINER="geo-seo-postgres-prod"
    DB_USER="geoseo"
    DB_NAME="geo_seo_db"
    echo "Backing up PRODUCTION database..."
elif docker ps | grep -q "geo-seo-postgres-dev"; then
    CONTAINER="geo-seo-postgres-dev"
    DB_USER="geoseo"
    DB_NAME="geo_seo_db"
    echo "Backing up DEVELOPMENT database..."
else
    echo "Error: No database container is running."
    exit 1
fi

echo ""

# Create backup
echo "Creating backup: $BACKUP_FILE"
docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    # Compress backup
    echo "Compressing backup..."
    gzip "$BACKUP_FILE"

    # Get file size
    SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)

    echo ""
    echo "✓ Backup completed successfully!"
    echo "  File: $BACKUP_FILE.gz"
    echo "  Size: $SIZE"
    echo ""

    # Remove old backups (keep last 7 days)
    echo "Cleaning up old backups (keeping last 7 days)..."
    find "$BACKUP_DIR" -name "postgres_backup_*.sql.gz" -mtime +7 -delete

    echo "✓ Cleanup complete"
else
    echo ""
    echo "✗ Backup failed!"
    exit 1
fi

echo ""
echo "=========================================="
