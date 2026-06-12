#!/bin/bash
# ============================================================
# urutix.com host Nginx setup
# This script deploys the configuration file natively to the
# Ubuntu host Nginx, which is holding ports 80/443.
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_SOURCE="$SCRIPT_DIR/urutix.com.conf"
AVAILABLE_DIR="/etc/nginx/sites-available"
ENABLED_DIR="/etc/nginx/sites-enabled"
SITE_NAME="urutix.com"

echo -e "${GREEN}=== urutix.com Host Nginx Setup ===${NC}"

# Ensure running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run this script as root (sudo ./nginx/setup-host-nginx.sh)${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/4] Removing any old conflicting configurations...${NC}"
rm -f "$ENABLED_DIR/urutix"
rm -f "$ENABLED_DIR/$SITE_NAME.conf"

echo -e "${YELLOW}[2/4] Deploying new configuration to $AVAILABLE_DIR...${NC}"
cp "$CONFIG_SOURCE" "$AVAILABLE_DIR/$SITE_NAME.conf"

echo -e "${YELLOW}[3/4] Enabling the site...${NC}"
ln -sf "$AVAILABLE_DIR/$SITE_NAME.conf" "$ENABLED_DIR/"

echo -e "${YELLOW}[4/4] Testing Nginx configuration and reloading...${NC}"
if nginx -t; then
    # Force kill any ghost processes if PID is missing, then restart
    if ! systemctl reload nginx 2>/dev/null; then
        echo -e "${YELLOW}Standard reload failed, performing a hard restart...${NC}"
        pkill -9 nginx
        systemctl start nginx || nginx
    fi
    echo -e "${GREEN}Configuration successfully applied!${NC}"
    echo -e "${GREEN}🚀 https://urutix.com is now LIVE!${NC}"
else
    echo -e "${RED}ERROR: Nginx configuration test failed. Please check the output above.${NC}"
    exit 1
fi
