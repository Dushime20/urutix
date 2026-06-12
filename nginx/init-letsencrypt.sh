#!/bin/bash
# ============================================================
# One-time Let's Encrypt SSL certificate bootstrapper
# Run this ONCE on the server before starting the full stack
#
# Usage:
#   chmod +x nginx/init-letsencrypt.sh
#   ./nginx/init-letsencrypt.sh
# ============================================================

DOMAIN="urutix.com"
WWW_DOMAIN="www.urutix.com"
EMAIL="admin@urutix.com"          # ← change to your real email
STAGING=0                          # Set to 1 for testing (avoids rate limits)

# Paths
CERTBOT_CONF="./certbot/conf"
CERTBOT_WWW="./certbot/www"

echo "### Creating required directories..."
mkdir -p "$CERTBOT_CONF/live/$DOMAIN"
mkdir -p "$CERTBOT_WWW"

# -----------------------------------------------------------
# Step 1: Start nginx with HTTP only so certbot can do the
#         ACME challenge before we have a real cert
# -----------------------------------------------------------
echo "### Starting nginx for ACME challenge..."
docker compose -f docker-compose.production.yml up -d nginx

echo "### Waiting for nginx to be ready..."
sleep 5

# -----------------------------------------------------------
# Step 2: Obtain the certificate
# -----------------------------------------------------------
STAGING_ARG=""
if [ "$STAGING" = "1" ]; then
  STAGING_ARG="--staging"
  echo "### Using Let's Encrypt STAGING environment (test mode)"
fi

echo "### Requesting SSL certificate for $DOMAIN and $WWW_DOMAIN..."
docker compose -f docker-compose.production.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  $STAGING_ARG \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  -d "$WWW_DOMAIN"

# -----------------------------------------------------------
# Step 3: Reload nginx to pick up the new certificate
# -----------------------------------------------------------
echo "### Reloading nginx with SSL certificate..."
docker compose -f docker-compose.production.yml exec nginx nginx -s reload

echo ""
echo "✅ Done! SSL certificate issued for $DOMAIN"
echo "   Now start the full stack with:"
echo "   docker compose -f docker-compose.production.yml up -d"
