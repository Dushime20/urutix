#!/bin/bash

# Production Deployment Script for UrutiX SmartCargo Backend
# Usage: ./deploy.sh [environment]

set -e  # Exit on error

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "UrutiX SmartCargo Deployment Script"
echo "Environment: $ENVIRONMENT"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_success "Docker and Docker Compose are installed"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_warning ".env.production file not found"
    if [ -f ".env.production.example" ]; then
        print_info "Creating .env.production from example..."
        cp .env.production.example .env.production
        print_warning "Please update .env.production with your production values before continuing"
        exit 1
    else
        print_error ".env.production.example not found. Cannot proceed."
        exit 1
    fi
fi

print_success ".env.production file found"

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Create necessary directories
print_info "Creating necessary directories..."
mkdir -p uploads logs data/postgres nginx/logs nginx/ssl
print_success "Directories created"

# Build Docker images
print_info "Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache
print_success "Docker images built"

# Stop existing containers
print_info "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down
print_success "Existing containers stopped"

# Start services
print_info "Starting services..."
docker-compose -f docker-compose.prod.yml up -d
print_success "Services started"

# Wait for services to be healthy
print_info "Waiting for services to be healthy..."
sleep 10

# Check service health
print_info "Checking service health..."

# Check PostgreSQL
if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U ${DB_USERNAME:-postgres} > /dev/null 2>&1; then
    print_success "PostgreSQL is healthy"
else
    print_error "PostgreSQL is not healthy"
    exit 1
fi

# Check Backend
if curl -f http://localhost:${HTTP_PORT:-80}/api/health > /dev/null 2>&1; then
    print_success "Backend is healthy"
else
    print_warning "Backend health check failed. It may still be starting up."
fi

# Check Nginx
if docker-compose -f docker-compose.prod.yml exec -T nginx wget --quiet --tries=1 --spider http://localhost/api/health > /dev/null 2>&1; then
    print_success "Nginx is healthy"
else
    print_warning "Nginx health check failed. It may still be starting up."
fi

# Run database migrations (if needed)
print_info "Checking for database migrations..."
if docker-compose -f docker-compose.prod.yml exec -T backend npm run migration:run:linux > /dev/null 2>&1; then
    print_success "Database migrations completed"
else
    print_warning "Database migrations may have failed or are not needed"
fi

# Display service status
echo ""
print_info "Service Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
print_success "Deployment completed successfully!"
print_info "API: http://localhost:${HTTP_PORT:-80}/api"
print_info "Health: http://localhost:${HTTP_PORT:-80}/api/health"
print_info "Docs: http://localhost:${HTTP_PORT:-80}/api/docs"

echo ""
print_info "To view logs: docker-compose -f docker-compose.prod.yml logs -f"
print_info "To stop services: docker-compose -f docker-compose.prod.yml down"

