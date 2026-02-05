#!/bin/bash
# Pre-Deployment Check Script
# Run this before every deployment to ensure everything is ready

set -e  # Exit on any error

echo "🚀 Pre-Deployment Checks Starting..."
echo "=================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Function to print success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
error() {
    echo -e "${RED}❌ $1${NC}"
    ERRORS=$((ERRORS + 1))
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Check if we're in the right directory
echo "📁 Checking directory..."
if [ ! -f "package.json" ]; then
    error "Not in backend directory! Please cd to backend/"
    exit 1
fi
success "In correct directory"
echo ""

# 2. Check environment variables
echo "🔐 Checking environment variables..."
REQUIRED_VARS=("DB_HOST" "DB_PORT" "DB_NAME" "DB_USER" "DB_PASSWORD")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        error "Environment variable $var is not set"
    else
        success "$var is set"
    fi
done
echo ""

# 3. Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v)
REQUIRED_VERSION="v18"
if [[ $NODE_VERSION == $REQUIRED_VERSION* ]]; then
    success "Node.js version: $NODE_VERSION"
else
    warning "Node.js version $NODE_VERSION (recommended: $REQUIRED_VERSION+)"
fi
echo ""

# 4. Check if dependencies are installed
echo "📚 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    error "node_modules not found. Run: npm install"
else
    success "Dependencies installed"
fi
echo ""

# 5. Check if build exists
echo "🏗️  Checking build..."
if [ ! -d "dist" ]; then
    warning "Build directory not found. Will build now..."
    npm run build
    if [ $? -eq 0 ]; then
        success "Build completed"
    else
        error "Build failed"
    fi
else
    success "Build directory exists"
fi
echo ""

# 6. Test database connection
echo "🔌 Testing database connection..."
if node -e "
const { Client } = require('pg');
const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});
client.connect()
    .then(() => {
        console.log('Connected');
        return client.end();
    })
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Connection failed:', err.message);
        process.exit(1);
    });
" 2>&1 | grep -q "Connected"; then
    success "Database connection successful"
else
    error "Database connection failed"
fi
echo ""

# 7. Check pending migrations
echo "📋 Checking migrations..."
if npm run migration:show 2>&1 | grep -q "No migrations"; then
    success "No pending migrations"
elif npm run migration:show 2>&1 | grep -q "pending"; then
    warning "Pending migrations detected - will run during deployment"
else
    success "Migration check completed"
fi
echo ""

# 8. Backup database (optional but recommended)
echo "💾 Database backup..."
BACKUP_DIR="backups"
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql"

if [ "$SKIP_BACKUP" != "true" ]; then
    mkdir -p "$BACKUP_DIR"
    echo "Creating backup: $BACKUP_FILE"
    
    if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null; then
        success "Database backup created: $BACKUP_FILE"
        
        # Keep only last 5 backups
        ls -t "$BACKUP_DIR"/backup-*.sql | tail -n +6 | xargs -r rm
        success "Old backups cleaned up (keeping last 5)"
    else
        warning "Backup failed (continuing anyway)"
    fi
else
    warning "Backup skipped (SKIP_BACKUP=true)"
fi
echo ""

# 9. Run schema validation
echo "🔍 Validating database schema..."
if node scripts/check-migrations.js; then
    success "Schema validation passed"
else
    error "Schema validation failed"
fi
echo ""

# 10. Check disk space
echo "💿 Checking disk space..."
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    error "Disk usage is ${DISK_USAGE}% (critical)"
elif [ "$DISK_USAGE" -gt 80 ]; then
    warning "Disk usage is ${DISK_USAGE}% (high)"
else
    success "Disk usage is ${DISK_USAGE}% (healthy)"
fi
echo ""

# Summary
echo "=================================="
echo "📊 Pre-Deployment Check Summary"
echo "=================================="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to deploy.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run migrations: npm run migration:run"
    echo "  2. Restart application: pm2 restart ecosystem.config.js"
    echo "  3. Monitor logs: pm2 logs"
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s) found. Please fix before deploying.${NC}"
    exit 1
fi
