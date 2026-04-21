#!/bin/bash

# Restore Script for UrutiX Smart Logistics
# Restores database and uploaded files from backup

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if backup directory exists
if [ ! -d "./backups" ]; then
    log_error "Backup directory not found"
    exit 1
fi

# List available backups
echo "Available database backups:"
ls -lh ./backups/*.sql.gz 2>/dev/null || echo "No database backups found"
echo ""

# Ask for backup file
read -p "Enter the database backup file name (or full path): " backup_file

if [ ! -f "$backup_file" ]; then
    # Try in backups directory
    backup_file="./backups/$backup_file"
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
fi

# Confirm restoration
log_warn "WARNING: This will replace the current database with the backup!"
read -p "Are you sure you want to continue? (yes/NO): " confirm

if [ "$confirm" != "yes" ]; then
    log_info "Restore cancelled"
    exit 0
fi

# Create a backup of current database before restoring
log_info "Creating safety backup of current database..."
mkdir -p ./backups/safety
docker-compose -f docker-compose.production.yml exec -T postgres \
    pg_dump -U postgres urutix | gzip > "./backups/safety/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"

# Stop backend to prevent connections
log_info "Stopping backend service..."
docker-compose -f docker-compose.production.yml stop backend

# Restore database
log_info "Restoring database from $backup_file..."

# Drop and recreate database
docker-compose -f docker-compose.production.yml exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS urutix;"
docker-compose -f docker-compose.production.yml exec -T postgres psql -U postgres -c "CREATE DATABASE urutix;"

# Restore from backup
if [[ $backup_file == *.gz ]]; then
    gunzip -c "$backup_file" | docker-compose -f docker-compose.production.yml exec -T postgres psql -U postgres urutix
else
    cat "$backup_file" | docker-compose -f docker-compose.production.yml exec -T postgres psql -U postgres urutix
fi

log_info "Database restored successfully"

# Restore uploads if available
uploads_backup="${backup_file%.sql.gz}.tar.gz"
uploads_backup="${uploads_backup/db_backup/uploads_backup}"

if [ -f "$uploads_backup" ]; then
    log_info "Restoring uploaded files..."
    tar -xzf "$uploads_backup" -C ./backend/
    log_info "Uploads restored successfully"
else
    log_warn "No uploads backup found for this timestamp"
fi

# Start backend
log_info "Starting backend service..."
docker-compose -f docker-compose.production.yml start backend

# Wait for backend to be ready
log_info "Waiting for backend to be ready..."
sleep 5

# Verify restoration
if curl -f http://localhost:3005/api/health &> /dev/null; then
    log_info "Restore completed successfully! ✓"
else
    log_error "Backend health check failed after restore"
    exit 1
fi
