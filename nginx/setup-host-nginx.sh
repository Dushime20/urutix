#!/bin/bash
# ============================================================
# urutix.com nginx setup
# Injects urutix.com config into sparkmonitoring-frontend-1
# which is the shared nginx container owning ports 80/443.
#
# Usage:
#   chmod +x nginx/setup-host-nginx.sh
#   sudo ./nginx/setup-host-nginx.sh
# ============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NGINX_CONTAINER="sparkmonitoring-frontend-1"
CERT_PATH="/etc/letsencrypt/live/urutix.com"

echo -e "${GREEN}=== urutix.com nginx setup ===${NC}"

# ---------------------------------------------------------------
# Step 1: Verify the nginx container is running
# ---------------------------------------------------------------
echo -e "${YELLOW}[1/5] Checking $NGINX_CONTAINER is running...${NC}"

if ! docker ps --format '{{.Names}}' | grep -q "^${NGINX_CONTAINER}$"; then
  echo -e "${RED}ERROR: Container $NGINX_CONTAINER is not running.${NC}"
  docker ps --format 'table {{.Names}}\t{{.Status}}'
  exit 1
fi
echo "Container is running ✓"

# ---------------------------------------------------------------
# Step 2: Copy SSL certs into the container (as root)
# ---------------------------------------------------------------
echo -e "${YELLOW}[2/5] Copying SSL certificates into container...${NC}"

if [ ! -f "$CERT_PATH/fullchain.pem" ]; then
  echo -e "${RED}ERROR: SSL cert not found at $CERT_PATH${NC}"
  exit 1
fi

docker exec --user root "$NGINX_CONTAINER" mkdir -p /etc/nginx/ssl/urutix.com

# Resolve symlinks before copying — Let's Encrypt uses symlinks to archive
docker cp "$(readlink -f $CERT_PATH/fullchain.pem)" "$NGINX_CONTAINER:/etc/nginx/ssl/urutix.com/fullchain.pem"
docker cp "$(readlink -f $CERT_PATH/privkey.pem)"   "$NGINX_CONTAINER:/etc/nginx/ssl/urutix.com/privkey.pem"

echo "SSL certs copied ✓"

# ---------------------------------------------------------------
# Step 3: Build the config with container-internal cert paths
# ---------------------------------------------------------------
echo -e "${YELLOW}[3/5] Injecting urutix.com.conf...${NC}"

# Detect Docker bridge gateway IP
GATEWAY=$(docker network inspect bridge --format '{{range .IPAM.Config}}{{.Gateway}}{{end}}' 2>/dev/null || echo "172.17.0.1")

# Write config directly into container
docker exec --user root "$NGINX_CONTAINER" sh -c "cat > /etc/nginx/conf.d/urutix.com.conf << 'NGINXCONF'
server {
    listen 80;
    server_name urutix.com www.urutix.com;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://urutix.com\$request_uri; }
}

server {
    listen 443 ssl;
    http2 on;
    server_name www.urutix.com;
    ssl_certificate /etc/nginx/ssl/urutix.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/urutix.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    return 301 https://urutix.com\$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name urutix.com;

    ssl_certificate /etc/nginx/ssl/urutix.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/urutix.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    add_header Strict-Transport-Security \"max-age=63072000; includeSubDomains; preload\" always;
    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;

    client_max_body_size 50M;

    location /api/ {
        proxy_pass http://urutix_backend:3005;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Connection \"\";
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /api/upload {
        proxy_pass http://urutix_backend:3005;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 300s;
        proxy_read_timeout 300s;
        client_max_body_size 50M;
    }

    location /socket.io/ {
        proxy_pass http://urutix_backend:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 7d;
    }

    location /uploads/ {
        proxy_pass http://urutix_backend:3005;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        expires 30d;
        add_header Cache-Control \"public, immutable\";
    }

    location /health {
        access_log off;
        return 200 \"healthy\n\";
        add_header Content-Type text/plain;
    }

    location / {
        proxy_pass http://urutix_frontend:5173;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        add_header Cache-Control \"no-cache, no-store, must-revalidate\";
    }
}
NGINXCONF"

echo "Config injected ✓"

# ---------------------------------------------------------------
# Step 4: Test nginx config
# ---------------------------------------------------------------
echo -e "${YELLOW}[4/5] Testing nginx config...${NC}"
docker exec "$NGINX_CONTAINER" nginx -t

# ---------------------------------------------------------------
# Step 5: Reload nginx
# ---------------------------------------------------------------
echo -e "${YELLOW}[5/5] Reloading nginx...${NC}"
docker exec "$NGINX_CONTAINER" nginx -s reload

sleep 2

# ---------------------------------------------------------------
# Verify
# ---------------------------------------------------------------
echo ""
HTTPS=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 5 https://urutix.com/health || echo "000")
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://urutix.com/health || echo "000")

echo "  http://urutix.com/health  → $HTTP"
echo "  https://urutix.com/health → $HTTPS"

if [ "$HTTPS" = "200" ]; then
  echo ""
  echo -e "${GREEN}🚀 https://urutix.com is LIVE!${NC}"
else
  echo ""
  echo -e "${YELLOW}Check nginx error log:${NC}"
  echo "  docker exec $NGINX_CONTAINER cat /var/log/nginx/error.log | tail -20"
fi
