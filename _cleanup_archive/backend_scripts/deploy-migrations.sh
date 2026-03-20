#!/bin/bash

# Quick Production Migration Script
# This script safely runs migrations on production

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================="
echo "UrutiX Production Migration Script"
echo -e "==========================================${NC}\n"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (sudo su -)${NC}"
    exit 1
fi

# Confirm production
echo -e "${YELLOW}⚠️  WARNING: This will run migrations on PRODUCTION database${NC}"
echo -e "${YELLOW}⚠️  Make sure you have a backup before proceeding!${NC}\n"
read -p "Do you have a recent backup? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${RED}Please create a backup first!${NC}"
    echo "Run: pg_dump -U postgres -d urutix -F c -f /root/backups/urutix_backup_\$(date +%Y%m%d_%H%M%S).dump"
    exit 1
fi

echo ""
read -p "Continue with migration? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${YELLOW}Migration cancelled${NC}"
    exit 0
fi

echo -e "\n${BLUE}Starting migration process...${NC}\n"

# Step 1: Stop application
echo -e "${YELLOW}[1/6] Stopping application...${NC}"
pm2 stop all || true
echo -e "${GREEN}✓ Application stopped${NC}\n"

# Step 2: Pull latest code
echo -e "${YELLOW}[2/6] Pulling latest code...${NC}"
cd /root/urutix/urutix
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}\n"

# Step 3: Install dependencies
echo -e "${YELLOW}[3/6] Installing dependencies...${NC}"
cd backend
npm install --production
echo -e "${GREEN}✓ Dependencies installed${NC}\n"

# Step 4: Build application
echo -e "${YELLOW}[4/6] Building application...${NC}"
npm run build
echo -e "${GREEN}✓ Application built${NC}\n"

# Step 5: Run migrations
echo -e "${YELLOW}[5/6] Running database migrations...${NC}"
echo "This may take a few minutes..."
npm run migration:run

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migrations completed successfully${NC}\n"
else
    echo -e "${RED}✗ Migration failed!${NC}"
    echo -e "${YELLOW}Attempting to restart application with old code...${NC}"
    pm2 restart all
    exit 1
fi

# Step 6: Restart application
echo -e "${YELLOW}[6/6] Restarting application...${NC}"
pm2 restart all
sleep 5
pm2 status
echo -e "${GREEN}✓ Application restarted${NC}\n"

# Verify health
echo -e "${BLUE}Verifying application health...${NC}"
sleep 3
HEALTH_CHECK=$(curl -s http://localhost:3000/api/health || echo "failed")

if [[ $HEALTH_CHECK == *"ok"* ]]; then
    echo -e "${GREEN}✓ Application is healthy!${NC}\n"
else
    echo -e "${YELLOW}⚠️  Health check returned: $HEALTH_CHECK${NC}"
    echo -e "${YELLOW}Check logs with: pm2 logs${NC}\n"
fi

# Show migration status
echo -e "${BLUE}Current migration status:${NC}"
npm run migration:show

echo -e "\n${GREEN}=========================================="
echo "Migration completed successfully!"
echo -e "==========================================${NC}\n"

echo -e "${BLUE}Next steps:${NC}"
echo "1. Monitor logs: pm2 logs"
echo "2. Test load creation from frontend"
echo "3. Check for any errors in logs"
echo ""
echo -e "${GREEN}The 'equipmentType' error should now be fixed!${NC}"
