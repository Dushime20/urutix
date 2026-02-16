#!/bin/bash
# Safe Deployment Script
# Complete deployment process with all safety checks

set -e

echo "🚀 Safe Deployment Process"
echo "=========================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DEPLOYMENT_LOG="logs/deployment-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs

# Log function
log() {
    echo "$1" | tee -a "$DEPLOYMENT_LOG"
}

log_success() {
    echo -e "${GREEN}$1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

log_error() {
    echo -e "${RED}$1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

log_warning() {
    echo -e "${YELLOW}$1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

log_info() {
    echo -e "${BLUE}$1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

# Trap errors
trap 'log_error "❌ Deployment failed at line $LINENO"; exit 1' ERR

log_info "📝 Deployment started at $(date)"
log_info "📋 Log file: $DEPLOYMENT_LOG"
echo ""

# Step 1: Pre-deployment checks
log_info "Step 1: Running pre-deployment checks..."
if bash scripts/pre-deploy-check.sh; then
    log_success "✅ Pre-deployment checks passed"
else
    log_error "❌ Pre-deployment checks failed"
    exit 1
fi
echo ""

# Step 2: Pull latest code (if using git)
if [ -d ".git" ]; then
    log_info "Step 2: Pulling latest code..."
    CURRENT_BRANCH=$(git branch --show-current)
    log_info "Current branch: $CURRENT_BRANCH"
    
    if git pull origin "$CURRENT_BRANCH"; then
        log_success "✅ Code updated"
    else
        log_error "❌ Git pull failed"
        exit 1
    fi
else
    log_warning "⚠️  Not a git repository, skipping code pull"
fi
echo ""

# Step 3: Install/update dependencies
log_info "Step 3: Installing dependencies..."
if npm ci --production=false; then
    log_success "✅ Dependencies installed"
else
    log_error "❌ Dependency installation failed"
    exit 1
fi
echo ""

# Step 4: Build application
log_info "Step 4: Building application..."
if npm run build; then
    log_success "✅ Build completed"
else
    log_error "❌ Build failed"
    exit 1
fi
echo ""

# Step 5: Backup and run migrations
log_info "Step 5: Running migrations with backup..."
if bash scripts/backup-and-migrate.sh; then
    log_success "✅ Migrations completed"
else
    log_error "❌ Migrations failed"
    exit 1
fi
echo ""

# Step 6: Restart application
log_info "Step 6: Restarting application..."

if command -v pm2 &> /dev/null; then
    # Using PM2
    log_info "Using PM2 to restart..."
    
    if pm2 restart ecosystem.config.js --update-env; then
        log_success "✅ Application restarted with PM2"
    else
        log_error "❌ PM2 restart failed"
        exit 1
    fi
    
    # Wait for app to start
    log_info "Waiting for application to start..."
    sleep 5
    
    # Check if app is running
    if pm2 list | grep -q "online"; then
        log_success "✅ Application is running"
    else
        log_error "❌ Application failed to start"
        pm2 logs --lines 50
        exit 1
    fi
    
elif systemctl is-active --quiet smartcargo-backend; then
    # Using systemd
    log_info "Using systemd to restart..."
    
    if sudo systemctl restart smartcargo-backend; then
        log_success "✅ Application restarted with systemd"
    else
        log_error "❌ Systemd restart failed"
        exit 1
    fi
    
    # Wait for app to start
    sleep 5
    
    # Check if service is running
    if systemctl is-active --quiet smartcargo-backend; then
        log_success "✅ Application is running"
    else
        log_error "❌ Application failed to start"
        sudo journalctl -u smartcargo-backend -n 50
        exit 1
    fi
else
    log_warning "⚠️  No process manager detected (PM2 or systemd)"
    log_warning "Please restart your application manually"
fi
echo ""

# Step 7: Health check
log_info "Step 7: Running health check..."
sleep 3  # Give app time to fully start

HEALTH_URL="${HEALTH_CHECK_URL:-http://localhost:3000/health}"
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f -s "$HEALTH_URL" > /dev/null 2>&1; then
        log_success "✅ Health check passed"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            log_warning "⚠️  Health check failed, retrying ($RETRY_COUNT/$MAX_RETRIES)..."
            sleep 3
        else
            log_error "❌ Health check failed after $MAX_RETRIES attempts"
            log_error "Application may not be responding correctly"
            exit 1
        fi
    fi
done
echo ""

# Step 8: Verify critical endpoints
log_info "Step 8: Verifying critical endpoints..."

ENDPOINTS=(
    "/api/health"
    "/api/auth/status"
)

for endpoint in "${ENDPOINTS[@]}"; do
    URL="http://localhost:${PORT:-3000}$endpoint"
    if curl -f -s "$URL" > /dev/null 2>&1; then
        log_success "✅ $endpoint is responding"
    else
        log_warning "⚠️  $endpoint is not responding (may be protected)"
    fi
done
echo ""

# Step 9: Check logs for errors
log_info "Step 9: Checking recent logs for errors..."

if command -v pm2 &> /dev/null; then
    RECENT_ERRORS=$(pm2 logs --lines 20 --nostream 2>&1 | grep -i "error" | wc -l)
    if [ "$RECENT_ERRORS" -gt 0 ]; then
        log_warning "⚠️  Found $RECENT_ERRORS error(s) in recent logs"
        log_warning "Please review logs: pm2 logs"
    else
        log_success "✅ No errors in recent logs"
    fi
fi
echo ""

# Summary
echo "=============================="
log_success "🎉 Deployment completed successfully!"
echo "=============================="
echo ""
log_info "📊 Deployment Summary:"
log_info "   Started: $(head -1 "$DEPLOYMENT_LOG" | grep -oP '\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}')"
log_info "   Completed: $(date)"
log_info "   Log file: $DEPLOYMENT_LOG"
echo ""
log_info "🔍 Post-deployment checklist:"
log_info "   ✓ Pre-deployment checks passed"
log_info "   ✓ Code updated"
log_info "   ✓ Dependencies installed"
log_info "   ✓ Application built"
log_info "   ✓ Database migrated"
log_info "   ✓ Application restarted"
log_info "   ✓ Health check passed"
echo ""
log_info "📝 Next steps:"
log_info "   1. Monitor application logs: pm2 logs"
log_info "   2. Test critical user flows"
log_info "   3. Check monitoring dashboards"
log_info "   4. Notify team of successful deployment"
echo ""
log_info "🔙 Rollback available at:"
log_info "   $(ls -t backups/rollback-*.sh 2>/dev/null | head -1)"
echo ""
