#!/bin/bash
# ============================================================
# Setup host nginx to proxy urutix.com → Docker containers
# Run once on the server after git pull
#
# Usage:
#   chmod +x nginx/setup-host-nginx.sh
#   sudo ./nginx/setup-host-nginx.sh
# ============================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}[1/4] Copying nginx config to sites-available...${NC}"
cp "$(dirname "$0")/urutix.com.nginx" /etc/nginx/sites-available/urutix.com

echo -e "${GREEN}[2/4] Enabling site...${NC}"
# Remove if already exists to avoid duplicate symlink error
rm -f /etc/nginx/sites-enabled/urutix.com
ln -s /etc/nginx/sites-available/urutix.com /etc/nginx/sites-enabled/urutix.com

echo -e "${GREEN}[3/4] Testing nginx config...${NC}"
nginx -t

echo -e "${GREEN}[4/4] Reloading nginx...${NC}"
systemctl reload nginx

echo ""
echo -e "${GREEN}✅ Done! Host nginx configured for urutix.com${NC}"
echo -e "Now start Docker containers:"
echo -e "  docker compose -f docker-compose.production.yml up -d"
