#!/bin/bash

# Health Check Script for UrutiX Smart Logistics
# Checks the health of all services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3005}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:80}"
DB_CONTAINER="${DB_CONTAINER:-urutix_postgres}"
REDIS_CONTAINER="${REDIS_CONTAINER:-urutix_redis}"

# Functions
check_service() {
    local service_name=$1
    local url=$2
    
    if curl -f -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
        echo -e "${GREEN}✓${NC} $service_name is healthy"
        return 0
    else
        echo -e "${RED}✗${NC} $service_name is unhealthy"
        return 1
    fi
}

check_container() {
    local container_name=$1
    
    if docker ps | grep -q "$container_name"; then
        echo -e "${GREEN}✓${NC} $container_name is running"
        return 0
    else
        echo -e "${RED}✗${NC} $container_name is not running"
        return 1
    fi
}

check_database() {
    if docker exec "$DB_CONTAINER" pg_isready -U postgres -d urutix &> /dev/null; then
        echo -e "${GREEN}✓${NC} Database is ready"
        return 0
    else
        echo -e "${RED}✗${NC} Database is not ready"
        return 1
    fi
}

check_redis() {
    if docker exec "$REDIS_CONTAINER" redis-cli ping | grep -q "PONG"; then
        echo -e "${GREEN}✓${NC} Redis is ready"
        return 0
    else
        echo -e "${RED}✗${NC} Redis is not ready"
        return 1
    fi
}

# Main health check
echo "UrutiX Smart Logistics - Health Check"
echo "======================================"
echo ""

all_healthy=true

# Check containers
echo "Container Status:"
check_container "$DB_CONTAINER" || all_healthy=false
check_container "$REDIS_CONTAINER" || all_healthy=false
check_container "urutix_backend" || all_healthy=false
check_container "urutix_frontend" || all_healthy=false
echo ""

# Check services
echo "Service Health:"
check_database || all_healthy=false
check_redis || all_healthy=false
check_service "Backend API" "$BACKEND_URL/api/health" || all_healthy=false
check_service "Frontend" "$FRONTEND_URL/health" || all_healthy=false
echo ""

# Summary
if [ "$all_healthy" = true ]; then
    echo -e "${GREEN}All services are healthy ✓${NC}"
    exit 0
else
    echo -e "${RED}Some services are unhealthy ✗${NC}"
    exit 1
fi
