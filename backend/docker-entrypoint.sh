#!/bin/bash

###############################################################################
# Docker Entrypoint Script
# 
# Professional production entrypoint that handles:
# - Database connection waiting
# - Automatic migrations (optional)
# - Health checks
# - Graceful shutdown
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[ENTRYPOINT]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[ENTRYPOINT]${NC} $1"
}

log_error() {
    echo -e "${RED}[ENTRYPOINT]${NC} $1"
}

# Wait for database to be ready
wait_for_db() {
    log_info "Waiting for database at $DB_HOST:$DB_PORT..."
    
    max_attempts=30
    attempt=0
    
    until node -e "
        const { Client } = require('pg');
        const client = new Client({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });
        client.connect()
            .then(() => {
                console.log('Database connected');
                client.end();
                process.exit(0);
            })
            .catch((err) => {
                console.error('Connection failed:', err.message);
                process.exit(1);
            });
    "; do
        attempt=$((attempt + 1))
        
        if [ $attempt -ge $max_attempts ]; then
            log_error "Database connection timeout after $max_attempts attempts"
            exit 1
        fi
        
        log_info "Database not ready, waiting... (attempt $attempt/$max_attempts)"
        sleep 2
    done
    
    log_success "Database is ready"
}

# Run migrations if AUTO_MIGRATE is enabled
run_migrations() {
    if [ "$AUTO_MIGRATE" = "true" ]; then
        log_info "AUTO_MIGRATE enabled, running migrations..."
        
        if NODE_ENV=production bash scripts/migrate.sh run; then
            log_success "Migrations completed"
        else
            log_error "Migrations failed"
            
            if [ "$FAIL_ON_MIGRATION_ERROR" = "true" ]; then
                log_error "FAIL_ON_MIGRATION_ERROR is true, exiting..."
                exit 1
            else
                log_error "Continuing despite migration failure..."
            fi
        fi
    else
        log_info "AUTO_MIGRATE disabled, skipping migrations"
        log_info "Run migrations manually: docker-compose exec backend npm run migration:run:prod"
    fi
}

# Main execution
main() {
    log_info "=== Starting UrutiX Backend ==="
    log_info "Environment: ${NODE_ENV:-production}"
    log_info "Database: $DB_NAME@$DB_HOST:$DB_PORT"
    
    # Wait for database
    wait_for_db
    
    # Run migrations if enabled
    run_migrations
    
    # Start the application
    log_success "Starting application..."
    exec "$@"
}

# Run main
main "$@"
