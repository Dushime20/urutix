#!/bin/bash

# Backup Script for UrutiX Smart Logistics
# Creates backups of database and uploaded files

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

log_info "Starting backup process..."

# Backup database
log_info "Backing up database..."
docker-compose -f docker-compose.production.yml exec -T postgres \
    pg_dump -U postgres urutix | gzip > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"
log_info "Database backup created: db_backup_$TIMESTAMP.sql.gz"

# Backup uploaded files
log_info "Backing up uploaded files..."
if [ -d "./backend/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_backup_$TIMESTAMP.tar.gz" -C ./backend uploads/
    log_info "Uploads backup created: uploads_backup_$TIMESTAMP.tar.gz"
else
    log_warn "Uploads directory not found, skipping"
fi

# Backup environment files (without sensitive data)
log_info "Backing up configuration..."
if [ -f ".env.production" ]; then
    # Create a sanitized copy (remove sensitive values)
    grep -v "PASSWORD\|SECRET\|KEY" .env.production > "$BACKUP_DIR/env_backup_$TIMESTAMP.txt" || true
    log_info "Configuration backup created: env_backup_$TIMESTAMP.txt"
fi

# Clean up old backups
log_info "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.txt" -mtime +$RETENTION_DAYS -delete

# Show backup summary
log_info "Backup completed successfully!"
echo ""
echo "Backup files:"
ls -lh "$BACKUP_DIR" | grep "$TIMESTAMP"
echo ""
echo "Total backup size:"
du -sh "$BACKUP_DIR"
