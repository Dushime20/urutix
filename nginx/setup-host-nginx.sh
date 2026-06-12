#!/bin/bash
# ============================================================
# urutix.com nginx setup
# Configures the host Nginx (Ubuntu) to act as a reverse proxy
# for the UrutiX Docker containers.
# ============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

CERT_PATH="/etc/letsencrypt/live/urutix.com"

echo -e "${GREEN}=== urutix.com Host Nginx setup ===${NC}"

# ---------------------------------------------------------------
# Step 1: Verify Host Nginx is running
# ---------------------------------------------------------------
echo -e "${YELLOW}[1/4] Checking if Host Nginx is running...${NC}"

if ! systemctl is-active --quiet nginx; then
  echo -e "${RED}ERROR: Host Nginx service is not running. Please install and start nginx first.${NC}"
  exit 1
fi
echo "Host Nginx is running ✓"

# ---------------------------------------------------------------
# Step 2: Verify SSL certs
# ---------------------------------------------------------------
echo -e "${YELLOW}[2/4] Checking SSL certificates...${NC}"

if [ ! -f "$CERT_PATH/fullchain.pem" ]; then
  echo -e "${RED}ERROR: SSL cert not found at $CERT_PATH${NC}"
  echo -e "Please run: sudo certbot certonly --standalone -d urutix.com -d www.urutix.com"
  exit 1
fi
echo "SSL certs found ✓"

# ---------------------------------------------------------------
# Step 3: Inject Configuration
# ---------------------------------------------------------------
echo -e "${YELLOW}[3/4] Injecting urutix.com configuration...${NC}"

cat > /etc/nginx/sites-available/urutix.com.conf << 'NGINXCONF'
server {
    listen 80;
    server_name urutix.com www.urutix.com;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://urutix.com$request_uri; }
}

server {
    listen 443 ssl;
    http2 on;
    server_name www.urutix.com;
    ssl_certificate /etc/letsencrypt/live/urutix.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/urutix.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    return 301 https://urutix.com$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name urutix.com;

    ssl_certificate /etc/letsencrypt/live/urutix.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/urutix.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    client_max_body_size 50M;

    location /api/ {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /api/upload {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300s;
        proxy_read_timeout 300s;
        client_max_body_size 50M;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 7d;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
NGINXCONF

# Enable the site
ln -sf /etc/nginx/sites-available/urutix.com.conf /etc/nginx/sites-enabled/urutix.com.conf

echo "Config injected ✓"

# ---------------------------------------------------------------
# Step 4: Test and Reload nginx
# ---------------------------------------------------------------
echo -e "${YELLOW}[4/4] Testing and Reloading Host Nginx...${NC}"
nginx -t
systemctl reload nginx

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
  echo -e "${GREEN}🚀 https://urutix.com is LIVE on Host Nginx!${NC}"
else
  echo ""
  echo -e "${YELLOW}Check Host Nginx error log:${NC}"
  echo "  sudo tail -20 /var/log/nginx/error.log"
fi

