#!/bin/bash
# ============================================================
# Setup nginx to proxy urutix.com → Docker containers
# Handles both systemd nginx and Dockerized nginx
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

echo -e "${GREEN}=== urutix.com nginx proxy setup ===${NC}"

# ---------------------------------------------------------------
# Step 1: Remove any conflicting config we added previously
# ---------------------------------------------------------------
echo -e "${YELLOW}[1/5] Cleaning up conflicting configs...${NC}"
rm -f /etc/nginx/sites-enabled/urutix.com
rm -f /etc/nginx/sites-available/urutix.com
echo "Done."

# ---------------------------------------------------------------
# Step 2: Find the existing urutix config (created by certbot)
# ---------------------------------------------------------------
echo -e "${YELLOW}[2/5] Locating existing urutix nginx config...${NC}"

EXISTING_CONF=""
for f in /etc/nginx/sites-enabled/urutix /etc/nginx/sites-available/urutix; do
  if [ -f "$f" ]; then
    EXISTING_CONF="$f"
    break
  fi
done

if [ -z "$EXISTING_CONF" ]; then
  echo -e "${RED}ERROR: Could not find existing urutix nginx config.${NC}"
  echo "Expected at /etc/nginx/sites-enabled/urutix or /etc/nginx/sites-available/urutix"
  exit 1
fi

echo "Found: $EXISTING_CONF"

# ---------------------------------------------------------------
# Step 3: Overwrite the existing config with full proxy rules
# ---------------------------------------------------------------
echo -e "${YELLOW}[3/5] Writing full proxy config to $EXISTING_CONF...${NC}"

cat > "$EXISTING_CONF" << 'EOF'
# urutix.com nginx config
# Managed by: nginx/setup-host-nginx.sh
# SSL certificates managed by Certbot

server {
    listen 80;
    server_name urutix.com www.urutix.com;

    # Let's Encrypt renewal
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://urutix.com$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name www.urutix.com;

    ssl_certificate /etc/letsencrypt/live/urutix.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/urutix.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    return 301 https://urutix.com$request_uri;
}

server {
    listen 443 ssl http2;
    server_name urutix.com;

    ssl_certificate /etc/letsencrypt/live/urutix.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/urutix.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    client_max_body_size 50M;

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # File uploads
    location /api/upload {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        client_max_body_size 50M;
    }

    # WebSocket (Socket.IO)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Uploaded static files
    location /uploads/ {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Frontend SPA
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
EOF

echo "Config written."

# ---------------------------------------------------------------
# Step 4: Test nginx config
# ---------------------------------------------------------------
echo -e "${YELLOW}[4/5] Testing nginx config...${NC}"
nginx -t

# ---------------------------------------------------------------
# Step 5: Reload nginx (handles both systemd and Docker nginx)
# ---------------------------------------------------------------
echo -e "${YELLOW}[5/5] Reloading nginx...${NC}"

if systemctl is-active --quiet nginx; then
    # systemd managed
    systemctl reload nginx
    echo "Reloaded via systemd."
else
    # Find the nginx Docker container and send reload signal
    NGINX_CONTAINER=$(docker ps --filter "ancestor=nginx" --format "{{.Names}}" | head -1)
    if [ -n "$NGINX_CONTAINER" ]; then
        docker exec "$NGINX_CONTAINER" nginx -s reload
        echo "Reloaded Docker container: $NGINX_CONTAINER"
    else
        # Send signal directly to master nginx process
        NGINX_PID=$(pgrep -f "nginx: master process" | head -1)
        if [ -n "$NGINX_PID" ]; then
            kill -HUP "$NGINX_PID"
            echo "Reloaded via HUP signal to PID $NGINX_PID"
        else
            echo -e "${RED}Could not find nginx process to reload.${NC}"
            exit 1
        fi
    fi
fi

echo ""
echo -e "${GREEN}✅ nginx configured for urutix.com${NC}"
echo ""
echo "Now start Docker containers:"
echo "  docker compose -f docker-compose.production.yml up -d"
echo ""
echo "Then verify:"
echo "  curl -I https://urutix.com"
