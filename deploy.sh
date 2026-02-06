#!/bin/bash

# SmartCargo Deployment Script
# Usage: ./deploy.sh [backend|frontend|all]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/root/urutix/urutix"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
GIT_BRANCH="main"

# PM2 process names
PM2_BACKEND="smartcargo-backend"
PM2_FRONTEND="smartcargo-frontend"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}       SmartCargo Deployment Script             ${NC}"
echo -e "${BLUE}================================================${NC}"

# Function to print status
print_status() {
    echo -e "${YELLOW}>>> $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to deploy backend
deploy_backend() {
    print_status "Deploying Backend..."
    
    cd "$BACKEND_DIR"
    
    print_status "Installing dependencies..."
    npm ci --production=false
    
    print_status "Building backend..."
    npm run build
    
    print_status "Restarting PM2 process..."
    pm2 restart "$PM2_BACKEND" || pm2 start dist/main.js --name "$PM2_BACKEND"
    
    print_success "Backend deployed successfully!"
}

# Function to deploy frontend
deploy_frontend() {
    print_status "Deploying Frontend..."
    
    cd "$FRONTEND_DIR"
    
    print_status "Installing dependencies..."
    npm ci --production=false
    
    print_status "Building frontend..."
    npm run build
    
    print_status "Restarting PM2 process..."
    pm2 restart "$PM2_FRONTEND" || pm2 start npm --name "$PM2_FRONTEND" -- run preview
    
    print_success "Frontend deployed successfully!"
}

# Function to pull latest code
pull_latest() {
    print_status "Pulling latest code from $GIT_BRANCH..."
    
    cd "$PROJECT_DIR"
    
    # Stash any local changes
    git stash
    
    # Fetch and pull latest
    git fetch origin
    git checkout "$GIT_BRANCH"
    git pull origin "$GIT_BRANCH"
    
    print_success "Code updated!"
}

# Function to show PM2 status
show_status() {
    echo ""
    print_status "Current PM2 Status:"
    pm2 list
    echo ""
}

# Function to show logs
show_logs() {
    echo ""
    print_status "Showing logs (Ctrl+C to exit)..."
    if [ "$1" == "backend" ]; then
        pm2 logs "$PM2_BACKEND" --lines 50
    elif [ "$1" == "frontend" ]; then
        pm2 logs "$PM2_FRONTEND" --lines 50
    else
        pm2 logs --lines 50
    fi
}

# Main deployment logic
case "$1" in
    backend)
        pull_latest
        deploy_backend
        show_status
        ;;
    frontend)
        pull_latest
        deploy_frontend
        show_status
        ;;
    all)
        pull_latest
        deploy_backend
        deploy_frontend
        show_status
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$2"
        ;;
    restart)
        print_status "Restarting all SmartCargo services..."
        pm2 restart "$PM2_BACKEND" "$PM2_FRONTEND"
        show_status
        ;;
    stop)
        print_status "Stopping all SmartCargo services..."
        pm2 stop "$PM2_BACKEND" "$PM2_FRONTEND"
        show_status
        ;;
    *)
        echo ""
        echo "Usage: $0 {backend|frontend|all|status|logs|restart|stop}"
        echo ""
        echo "Commands:"
        echo "  backend   - Deploy backend only"
        echo "  frontend  - Deploy frontend only"
        echo "  all       - Deploy both backend and frontend"
        echo "  status    - Show PM2 status"
        echo "  logs      - Show PM2 logs (use 'logs backend' or 'logs frontend')"
        echo "  restart   - Restart all SmartCargo services"
        echo "  stop      - Stop all SmartCargo services"
        echo ""
        exit 1
        ;;
esac

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}       Deployment Complete!                     ${NC}"
echo -e "${GREEN}================================================${NC}"
