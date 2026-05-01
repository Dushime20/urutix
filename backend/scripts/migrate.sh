#!/bin/bash

###############################################################################
# Database Migration Script
# 
# Professional-grade migration runner with environment detection,
# error handling, and rollback capabilities.
#
# Usage:
#   ./scripts/migrate.sh [command]
#
# Commands:
#   run     - Run pending migrations (default)
#   revert  - Revert last migration
#   show    - Show migration status
#   check   - Check if migrations are needed
#
# Environment Variables:
#   NODE_ENV - Environment (development/production)
#   DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMMAND=${1:-run}
NODE_ENV=${NODE_ENV:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a Docker container
is_docker() {
    [ -f /.dockerenv ] || grep -q docker /proc/1/cgroup 2>/dev/null
}

# Detect environment and set appropriate data source
detect_environment() {
    log_info "Detecting environment..."
    
    if [ "$NODE_ENV" = "production" ] || [ -d "dist" ]; then
        if [ -f "dist/main.js" ]; then
            ENV_TYPE="production"
            DATA_SOURCE="data-source.js"
            TYPEORM_CMD="node ./node_modules/typeorm/cli.js"
        else
            log_error "Production build not found. Run 'npm run build' first."
            exit 1
        fi
    else
        ENV_TYPE="development"
        DATA_SOURCE="src/data-source.ts"
        TYPEORM_CMD="ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js"
    fi
    
    log_info "Environment: $ENV_TYPE"
    log_info "Data Source: $DATA_SOURCE"
}

# Validate database connection
validate_connection() {
    log_info "Validating database connection..."
    
    if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ]; then
        log_error "Database configuration missing. Check environment variables."
        exit 1
    fi
    
    log_info "Database: $DB_NAME@$DB_HOST:${DB_PORT:-5432}"
}

# Check if migrations are needed
check_migrations() {
    log_info "Checking migration status..."
    $TYPEORM_CMD migration:show -d "$DATA_SOURCE" 2>&1 | tee /tmp/migration_status.log
    
    if grep -q "No migrations are pending" /tmp/migration_status.log; then
        log_success "Database is up to date"
        return 1
    else
        log_warning "Pending migrations found"
        return 0
    fi
}

# Run migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Create backup point (if in production)
    if [ "$ENV_TYPE" = "production" ]; then
        log_warning "Running migrations in PRODUCTION environment"
        log_info "Ensure you have a database backup before proceeding"
    fi
    
    # Execute migrations
    if $TYPEORM_CMD migration:run -d "$DATA_SOURCE"; then
        log_success "Migrations completed successfully"
        return 0
    else
        log_error "Migration failed"
        return 1
    fi
}

# Revert last migration
revert_migration() {
    log_warning "Reverting last migration..."
    
    if [ "$ENV_TYPE" = "production" ]; then
        log_error "Migration revert in production requires manual confirmation"
        read -p "Are you sure you want to revert? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Revert cancelled"
            exit 0
        fi
    fi
    
    if $TYPEORM_CMD migration:revert -d "$DATA_SOURCE"; then
        log_success "Migration reverted successfully"
        return 0
    else
        log_error "Revert failed"
        return 1
    fi
}

# Show migration status
show_migrations() {
    log_info "Migration Status:"
    $TYPEORM_CMD migration:show -d "$DATA_SOURCE"
}

# Main execution
main() {
    log_info "=== Database Migration Tool ==="
    log_info "Command: $COMMAND"
    
    cd "$PROJECT_ROOT"
    
    detect_environment
    validate_connection
    
    case "$COMMAND" in
        run)
            if check_migrations; then
                run_migrations
            else
                log_success "No migrations to run"
            fi
            ;;
        revert)
            revert_migration
            ;;
        show)
            show_migrations
            ;;
        check)
            check_migrations
            ;;
        *)
            log_error "Unknown command: $COMMAND"
            log_info "Usage: $0 [run|revert|show|check]"
            exit 1
            ;;
    esac
    
    log_success "=== Migration Complete ==="
}

# Run main function
main
