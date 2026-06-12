#!/bin/bash
# ============================================================
# Let's Encrypt SSL Bootstrap Script
# Solves the chicken-and-egg: nginx needs certs to start,
# certbot needs nginx to answer ACME challenges.
#
# Strategy:
#   1. Create a temporary self-signed cert so nginx starts
#   2. Start nginx (it can now load the self-signed cert)
#   3. Run certbot to get the real cert via HTTP challenge
#   4. Reload nginx with the real cert
#
# Usage (run ONCE on the server):
#   chmod +x nginx/init-letsencrypt.sh
#   ./nginx/init-letsencrypt.sh
# ============================================================

set -e

DOMAIN="urutix.com"
WWW_DOMAIN="www.urutix.com"
EMAIL="admin@urutix.com"   # ← change to your real email
STAGING=0                  # Set to 1 to test (avoids rate limits)
COMPOSE_FILE="docker-compose.production.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== urutix.com SSL Bootstrap ===${NC}"

# ---------------------------------------------------------------
# Step 1: Create self-signed cert so nginx can start initially
# ---------------------------------------------------------------
echo -e "${YELLOW}[1/5] Creating temporary self-signed certificate...${NC}"

CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

docker run --rm \
  -v "$(docker volume inspect urutix-smart-logistics_certbot_conf --format '{{.Mountpoint}}'):/etc/letsencrypt" \
  --entrypoint "/bin/sh" certbot/certbot:latest -c "
    mkdir -p /etc/letsencrypt/live/$DOMAIN
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
      -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
      -subj '/CN=localhost'
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/letsencrypt/live/$DOMAIN/chain.pem
    echo 'Self-signed cert created.'
  "

# ---------------------------------------------------------------
# Step 2: Start nginx with the self-signed cert
# ---------------------------------------------------------------
echo -e "${YELLOW}[2/5] Starting nginx with temporary certificate...${NC}"
docker compose -f $COMPOSE_FILE up -d nginx

echo "Waiting for nginx to be ready..."
sleep 5

# Verify nginx is actually up
if ! docker ps | grep -q urutix_nginx; then
  echo -e "${RED}ERROR: nginx container failed to start. Check logs:${NC}"
  docker logs urutix_nginx
  exit 1
fi

echo -e "${GREEN}nginx is up.${NC}"

# ---------------------------------------------------------------
# Step 3: Get the real certificate from Let's Encrypt
# ---------------------------------------------------------------
echo -e "${YELLOW}[3/5] Requesting Let's Encrypt certificate...${NC}"

STAGING_ARG=""
if [ "$STAGING" = "1" ]; then
  STAGING_ARG="--staging"
  echo -e "${YELLOW}Using STAGING environment (test mode — not a real cert)${NC}"
fi

docker compose -f $COMPOSE_FILE run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  $STAGING_ARG \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  -d "$DOMAIN" \
  -d "$WWW_DOMAIN"

# ---------------------------------------------------------------
# Step 4: Reload nginx with the real certificate
# ---------------------------------------------------------------
echo -e "${YELLOW}[4/5] Reloading nginx with real certificate...${NC}"
docker compose -f $COMPOSE_FILE exec nginx nginx -s reload
sleep 2

# ---------------------------------------------------------------
# Step 5: Verify
# ---------------------------------------------------------------
echo -e "${YELLOW}[5/5] Verifying...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN/health)
HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/health 2>/dev/null || echo "000")

echo ""
echo -e "HTTP  http://$DOMAIN/health  → ${HTTP_STATUS}"
echo -e "HTTPS https://$DOMAIN/health → ${HTTPS_STATUS}"
echo ""

if [ "$HTTPS_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ SSL setup complete! https://$DOMAIN is live.${NC}"
else
  echo -e "${YELLOW}⚠ HTTPS check returned $HTTPS_STATUS — cert may be staging or DNS not yet propagated.${NC}"
  echo -e "Check with: curl -I https://$DOMAIN"
fi

echo ""
echo -e "${GREEN}Certbot will auto-renew the certificate every 12 hours.${NC}"
