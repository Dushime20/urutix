#!/bin/bash
# ============================================================
# urutix.com nginx setup script
# Injects urutix.com config into the shared nginx container
# that owns ports 80/443 on this server.
#
# Safe: only ADDS a new config file, never modifies existing ones.
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
CONF_FILE="$SCRIPT_DIR/urutix.com.conf"

echo -e "${GREEN}=== urutix.com nginx setup ===${NC}"

# ---------------------------------------------------------------
# Step 1: Find the nginx container that owns port 80
# ---------------------------------------------------------------
echo -e "${YELLOW}[1/6] Finding nginx container on port 80/443...${NC}"

NGINX_CONTAINER=""
for cid in $(docker ps -q); do
  PORTS=$(docker inspect "$cid" --format '{{json .NetworkSettings.Ports}}')
  if echo "$PORTS" | grep -q '"80/tcp"'; then
    NGINX_CONTAINER=$(docker inspect "$cid" --format '{{.Name}}' | sed 's|/||')
    break
  fi
done

# Fallback: find by process name
if [ -z "$NGINX_CONTAINER" ]; then
  NGINX_PID=$(pgrep -f "nginx: master process" | head -1)
  if [ -n "$NGINX_PID" ]; then
    NGINX_CONTAINER=$(docker inspect $(docker ps -q) --format '{{.Name}} {{.State.Pid}}' | grep "$NGINX_PID" | awk '{print $1}' | sed 's|/||')
  fi
fi

if [ -z "$NGINX_CONTAINER" ]; then
  echo -e "${RED}ERROR: Could not find nginx container owning port 80.${NC}"
  exit 1
fi

echo "Found nginx container: $NGINX_CONTAINER"

# ---------------------------------------------------------------
# Step 2: Detect Docker bridge gateway IP
# ---------------------------------------------------------------
echo -e "${YELLOW}[2/6] Detecting Docker bridge gateway IP...${NC}"

GATEWAY=$(docker network inspect bridge --format '{{range .IPAM.Config}}{{.Gateway}}{{end}}' 2>/dev/null)
if [ -z "$GATEWAY" ]; then
  GATEWAY="172.17.0.1"
fi
echo "Docker gateway IP: $GATEWAY"

# Update the conf file with the correct gateway IP
sed -i "s|172\.17\.0\.1|$GATEWAY|g" "$CONF_FILE"

# ---------------------------------------------------------------
# Step 3: Copy SSL certs into the container
# ---------------------------------------------------------------
echo -e "${YELLOW}[3/6] Copying SSL certificates into container...${NC}"

CERT_PATH="/etc/letsencrypt/live/urutix.com"

if [ ! -f "$CERT_PATH/fullchain.pem" ]; then
  echo -e "${RED}ERROR: SSL cert not found at $CERT_PATH/fullchain.pem${NC}"
  echo "Run certbot first: sudo certbot --nginx -d urutix.com -d www.urutix.com"
  exit 1
fi

# Create ssl directory inside container
docker exec "$NGINX_CONTAINER" mkdir -p /etc/nginx/ssl/urutix.com

docker cp "$CERT_PATH/fullchain.pem" "$NGINX_CONTAINER:/etc/nginx/ssl/urutix.com/fullchain.pem"
docker cp "$CERT_PATH/privkey.pem"   "$NGINX_CONTAINER:/etc/nginx/ssl/urutix.com/privkey.pem"
docker cp "$CERT_PATH/chain.pem"     "$NGINX_CONTAINER:/etc/nginx/ssl/urutix.com/chain.pem" 2>/dev/null || true

echo "SSL certs copied."

# ---------------------------------------------------------------
# Step 4: Update conf to use container-local cert paths
# ---------------------------------------------------------------
echo -e "${YELLOW}[4/6] Updating cert paths in config...${NC}"

# Create a temp copy with container-internal cert paths
TMP_CONF=$(mktemp)
sed 's|/etc/letsencrypt/live/urutix.com|/etc/nginx/ssl/urutix.com|g' "$CONF_FILE" > "$TMP_CONF"

# ---------------------------------------------------------------
# Step 5: Inject config into the nginx container
# ---------------------------------------------------------------
echo -e "${YELLOW}[5/6] Injecting urutix.com.conf into $NGINX_CONTAINER...${NC}"

docker cp "$TMP_CONF" "$NGINX_CONTAINER:/etc/nginx/conf.d/urutix.com.conf"
rm -f "$TMP_CONF"

echo "Config injected."

# ---------------------------------------------------------------
# Step 6: Test and reload nginx
# ---------------------------------------------------------------
echo -e "${YELLOW}[6/6] Testing and reloading nginx...${NC}"

docker exec "$NGINX_CONTAINER" nginx -t
docker exec "$NGINX_CONTAINER" nginx -s reload

echo ""
echo -e "${GREEN}✅ Done! urutix.com is now configured.${NC}"
echo ""
echo "Verifying..."
sleep 2

HTTP=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 5 http://urutix.com/health 2>/dev/null || echo "000")
HTTPS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://urutix.com/health 2>/dev/null || echo "000")

echo "  http://urutix.com/health  → $HTTP"
echo "  https://urutix.com/health → $HTTPS"

if [ "$HTTPS" = "200" ]; then
  echo ""
  echo -e "${GREEN}🚀 https://urutix.com is LIVE!${NC}"
else
  echo ""
  echo -e "${YELLOW}HTTPS returned $HTTPS — check logs:${NC}"
  echo "  docker exec $NGINX_CONTAINER cat /var/log/nginx/error.log | tail -20"
fi
