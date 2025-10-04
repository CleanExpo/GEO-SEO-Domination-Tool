#!/bin/bash
# Database restore script

set -e

BACKUP_DIR="./backups"

echo "=========================================="
echo "GEO-SEO Database Restore"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running."
    exit 1
fi

# Check for backup files
if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR/*.sql.gz 2>/dev/null)" ]; then
    echo "Error: No backup files found in $BACKUP_DIR"
    exit 1
fi

# List available backups
echo "Available backups:"
echo ""
ls -lh "$BACKUP_DIR"/*.sql.gz
echo ""

# Ask user to select backup
read -p "Enter the backup filename (or 'latest' for most recent): " BACKUP_CHOICE

if [ "$BACKUP_CHOICE" = "latest" ]; then
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/*.sql.gz | head -1)
else
    BACKUP_FILE="$BACKUP_DIR/$BACKUP_CHOICE"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo ""
echo "Selected backup: $BACKUP_FILE"
echo ""

# Check which environment is running
if docker ps | grep -q "geo-seo-postgres-prod"; then
    CONTAINER="geo-seo-postgres-prod"
    DB_USER="geoseo"
    DB_NAME="geo_seo_db"
    echo "WARNING: You are about to restore to PRODUCTION database!"
    read -p "Are you sure? (type 'yes' to continue): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo "Restore cancelled."
        exit 0
    fi
elif docker ps | grep -q "geo-seo-postgres-dev"; then
    CONTAINER="geo-seo-postgres-dev"
    DB_USER="geoseo"
    DB_NAME="geo_seo_db"
    echo "Restoring to DEVELOPMENT database..."
else
    echo "Error: No database container is running."
    exit 1
fi

echo ""
echo "Decompressing backup..."
TEMP_FILE="/tmp/restore_temp.sql"
gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"

echo "Restoring database..."
cat "$TEMP_FILE" | docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Database restored successfully!"
    rm "$TEMP_FILE"
else
    echo ""
    echo "✗ Restore failed!"
    rm "$TEMP_FILE"
    exit 1
fi

echo ""
echo "=========================================="
