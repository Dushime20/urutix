#!/bin/bash

# UrutiX Smart Logistics - Deployment Script for 38.242.224.199
# This script deploys UrutiX without conflicting with existing services

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}UrutiX Smart Logistics Deployment${NC}"
echo -e "${GREEN}Server: 38.242.224.199${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use: sudo bash deploy-to-38.242.224.199.sh)${NC}"
    exit 1
fi

# Check current directory
if [ ! -f "docker-compose.production.yml" ]; then
    echo -e "${RED}Error: docker-compose.production.yml not found${NC}"
    echo -e "${YELLOW}Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Running from correct directory${NC}"
echo ""

# Check for port conflicts
echo -e "${YELLOW}Checking for port conflicts...${NC}"
if netstat -tulpn | grep -q ":5173 "; then
    echo -e "${RED}✗ Port 5173 is already in use${NC}"
    echo -e "${YELLOW}Please change FRONTEND_PORT in .env.production${NC}"
    exit 1
fi

if netstat -tulpn | grep -q ":3005 "; then
    echo -e "${RED}✗ Port 3005 is already in use${NC}"
    echo -e "${YELLOW}Please change BACKEND_PORT in .env.production${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Ports 5173 and 3005 are available${NC}"
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}Creating .env.production from template...${NC}"
    cp .env.production.example .env.production
    
    echo -e "${YELLOW}Generating secure secrets...${NC}"
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    DB_PASSWORD=$(openssl rand -base64 32)
    REDIS_PASSWORD=$(openssl rand -base64 32)
    
    # Update .env.production with generated secrets
    sed -i "s|your_jwt_secret_key_here_min_32_chars|$JWT_SECRET|g" .env.production
    sed -i "s|your_jwt_refresh_secret_key_here_min_32_chars|$JWT_REFRESH_SECRET|g" .env.production
    sed -i "s|your_secure_database_password_here|$DB_PASSWORD|g" .env.production
    sed -i "s|your_secure_redis_password_here|$REDIS_PASSWORD|g" .env.production
    
    echo -e "${GREEN}✓ .env.production created with secure secrets${NC}"
    echo ""
else
    echo -e "${GREEN}✓ .env.production already exists${NC}"
    echo ""
fi

# Configure firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
ufw allow 5173/tcp comment 'UrutiX Frontend' 2>/dev/null || true
ufw allow 3005/tcp comment 'UrutiX Backend' 2>/dev/null || true
echo -e "${GREEN}✓ Firewall configured${NC}"
echo ""

# Build Docker images
echo -e "${YELLOW}Building Docker images (this may take 5-10 minutes)...${NC}"
docker-compose -f docker-compose.production.yml build --no-cache

echo -e "${GREEN}✓ Docker images built successfully${NC}"
echo ""

# Start services
echo -e "${YELLOW}Starting services...${NC}"
docker-compose -f docker-compose.production.yml up -d

echo -e "${GREEN}✓ Services started${NC}"
echo ""

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready (30 seconds)...${NC}"
sleep 30

# Check service health
echo -e "${YELLOW}Checking service health...${NC}"

# Check database
if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U postgres -d urutix &>/dev/null; then
    echo -e "${GREEN}✓ Database is ready${NC}"
else
    echo -e "${RED}✗ Database is not ready${NC}"
fi

# Check Redis
if docker-compose -f docker-compose.production.yml exec -T redis redis-cli ping &>/dev/null; then
    echo -e "${GREEN}✓ Redis is ready${NC}"
else
    echo -e "${RED}✗ Redis is not ready${NC}"
fi

# Check backend
if curl -f http://localhost:3005/api/health &>/dev/null; then
    echo -e "${GREEN}✓ Backend is ready${NC}"
else
    echo -e "${YELLOW}⚠ Backend is starting (may take a few more seconds)${NC}"
fi

# Check frontend
if curl -f http://localhost:5173/health &>/dev/null; then
    echo -e "${GREEN}✓ Frontend is ready${NC}"
else
    echo -e "${YELLOW}⚠ Frontend is starting (may take a few more seconds)${NC}"
fi

echo ""

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
if docker-compose -f docker-compose.production.yml exec -T backend npm run migration:run; then
    echo -e "${GREEN}✓ Migrations completed successfully${NC}"
else
    echo -e "${RED}✗ Migrations failed${NC}"
    echo -e "${YELLOW}Check logs with: docker-compose -f docker-compose.production.yml logs backend${NC}"
fi

echo ""

# Show deployment summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}Access URLs:${NC}"
echo -e "  Frontend:    ${YELLOW}http://38.242.224.199:5173${NC}"
echo -e "  Backend API: ${YELLOW}http://38.242.224.199:3005/api${NC}"
echo -e "  API Docs:    ${YELLOW}http://38.242.224.199:3005/api/docs${NC}"
echo ""
echo -e "${GREEN}Container Status:${NC}"
docker-compose -f docker-compose.production.yml ps
echo ""
echo -e "${GREEN}Useful Commands:${NC}"
echo -e "  View logs:    ${YELLOW}docker-compose -f docker-compose.production.yml logs -f${NC}"
echo -e "  Check status: ${YELLOW}docker-compose -f docker-compose.production.yml ps${NC}"
echo -e "  Restart:      ${YELLOW}docker-compose -f docker-compose.production.yml restart${NC}"
echo -e "  Stop:         ${YELLOW}docker-compose -f docker-compose.production.yml down${NC}"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo -e "  1. Test frontend: ${YELLOW}http://38.242.224.199:5173${NC}"
echo -e "  2. Test backend:  ${YELLOW}http://38.242.224.199:3005/api/health${NC}"
echo -e "  3. View API docs: ${YELLOW}http://38.242.224.199:3005/api/docs${NC}"
echo -e "  4. Monitor logs:  ${YELLOW}docker-compose -f docker-compose.production.yml logs -f${NC}"
echo ""
