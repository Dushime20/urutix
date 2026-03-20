#!/bin/bash

# PM2 Deployment Script for UrutiX
# This script builds and deploys both backend and frontend using PM2

set -e  # Exit on error

echo "=========================================="
echo "UrutiX PM2 Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${NC}ℹ $1${NC}"
}

# Get the project root directory
PROJECT_ROOT="/root/project/urutix"
cd "$PROJECT_ROOT"

# Create logs directory
print_info "Creating logs directory..."
mkdir -p logs
print_success "Logs directory created"

# Step 1: Install PM2 globally if not installed
print_info "Checking PM2 installation..."
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found. Installing PM2..."
    npm install -g pm2
    print_success "PM2 installed"
else
    print_success "PM2 is already installed"
fi

# Step 2: Build Backend
print_info "Building backend..."
cd "$PROJECT_ROOT/backend"
npm install --production=false
npm run build
print_success "Backend built successfully"

# Step 3: Build Frontend
print_info "Building frontend..."
cd "$PROJECT_ROOT/frontend"
npm install
npm run build
print_success "Frontend built successfully"

# Step 4: Stop existing PM2 processes
print_info "Stopping existing PM2 processes..."
cd "$PROJECT_ROOT"
pm2 delete urutix-backend 2>/dev/null || true
pm2 delete urutix-frontend 2>/dev/null || true
print_success "Existing processes stopped"

# Step 5: Start applications with PM2
print_info "Starting applications with PM2..."
pm2 start ecosystem.config.js --env production
print_success "Applications started with PM2"

# Step 6: Save PM2 configuration
print_info "Saving PM2 configuration..."
pm2 save
print_success "PM2 configuration saved"

# Step 7: Setup PM2 startup script
print_info "Setting up PM2 startup script..."
STARTUP_CMD=$(pm2 startup | grep -o 'sudo.*')
if [ ! -z "$STARTUP_CMD" ]; then
    print_warning "Run this command to enable PM2 on boot:"
    echo "$STARTUP_CMD"
else
    print_success "PM2 startup already configured"
fi

# Step 8: Show status
print_info "PM2 Status:"
pm2 status

print_info "PM2 Logs (last 20 lines):"
pm2 logs --lines 20 --nostream

echo ""
print_success "Deployment completed successfully!"
echo ""
print_info "Useful commands:"
echo "  pm2 status              - Check application status"
echo "  pm2 logs                - View logs"
echo "  pm2 restart all         - Restart all applications"
echo "  pm2 stop all            - Stop all applications"
echo "  pm2 monit               - Monitor applications"


