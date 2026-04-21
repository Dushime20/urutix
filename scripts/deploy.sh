#!/bin/bash

# UrutiX Smart Logistics - Production Deployment Script
# This script automates the deployment process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check .env.production file
    if [ ! -f .env.production ]; then
        log_error ".env.production file not found. Please create it from .env.production.example"
        exit 1
    fi
    
    log_info "Prerequisites check passed ✓"
}

backup_database() {
    log_info "Creating database backup..."
    
    mkdir -p ./backups
    
    if docker-compose -f docker-compose.production.yml ps postgres | grep -q "Up"; then
        docker-compose -f docker-compose.production.yml exec -T postgres \
            pg_dump -U postgres urutix > "./backups/backup_$(date +%Y%m%d_%H%M%S).sql"
        log_info "Database backup created ✓"
    else
        log_warn "Database is not running. Skipping backup."
    fi
}

build_images() {
    log_info "Building Docker images..."
    docker-compose -f docker-compose.production.yml build --no-cache
    log_info "Docker images built successfully ✓"
}

start_services() {
    log_info "Starting services..."
    docker-compose -f docker-compose.production.yml up -d
    log_info "Services started ✓"
}

wait_for_services() {
    log_info "Waiting for services to be healthy..."
    
    # Wait for database
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f docker-compose.production.yml exec -T postgres \
            pg_isready -U postgres -d urutix &> /dev/null; then
            log_info "Database is ready ✓"
            break
        fi
        
        attempt=$((attempt + 1))
        if [ $attempt -eq $max_attempts ]; then
            log_error "Database failed to start"
            exit 1
        fi
        
        sleep 2
    done
    
    # Wait for backend
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:3005/api/health &> /dev/null; then
            log_info "Backend is ready ✓"
            break
        fi
        
        attempt=$((attempt + 1))
        if [ $attempt -eq $max_attempts ]; then
            log_error "Backend failed to start"
            exit 1
        fi
        
        sleep 2
    done
}

run_migrations() {
    log_info "Running database migrations..."
    docker-compose -f docker-compose.production.yml exec -T backend npm run migration:run
    log_info "Migrations completed ✓"
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check if all containers are running
    if ! docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
        log_error "Some containers are not running"
        docker-compose -f docker-compose.production.yml ps
        exit 1
    fi
    
    # Check backend health
    if ! curl -f http://localhost:3005/api/health &> /dev/null; then
        log_error "Backend health check failed"
        exit 1
    fi
    
    # Check frontend
    if ! curl -f http://localhost:80/health &> /dev/null; then
        log_error "Frontend health check failed"
        exit 1
    fi
    
    log_info "Deployment verification passed ✓"
}

show_status() {
    log_info "Deployment Status:"
    echo ""
    docker-compose -f docker-compose.production.yml ps
    echo ""
    log_info "Access URLs:"
    echo "  Frontend: http://localhost:80"
    echo "  Backend API: http://localhost:3005/api"
    echo "  API Documentation: http://localhost:3005/api/docs"
    echo ""
    log_info "View logs with: docker-compose -f docker-compose.production.yml logs -f"
}

# Main deployment flow
main() {
    log_info "Starting UrutiX Smart Logistics deployment..."
    echo ""
    
    check_prerequisites
    
    # Ask for confirmation
    read -p "This will deploy the application to production. Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warn "Deployment cancelled"
        exit 0
    fi
    
    backup_database
    build_images
    start_services
    wait_for_services
    run_migrations
    verify_deployment
    show_status
    
    log_info "Deployment completed successfully! 🚀"
}

# Run main function
main
