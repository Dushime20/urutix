#!/bin/bash

echo "=========================================="
echo "UrutiX Production Fix Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Navigate to project root
cd /root/project/urutix || exit 1

# 1. Update Backend CORS
print_info "Updating backend CORS configuration..."
cd backend

# Check if ALLOWED_ORIGINS exists in .env
if grep -q "ALLOWED_ORIGINS" .env; then
    print_info "Updating existing ALLOWED_ORIGINS..."
    sed -i 's|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://urutix.com,https://www.urutix.com,https://api.urutix.com,http://161.97.148.53,http://161.97.148.53:80|' .env
else
    print_info "Adding ALLOWED_ORIGINS to .env..."
    echo "" >> .env
    echo "# Allowed CORS origins for production" >> .env
    echo "ALLOWED_ORIGINS=https://urutix.com,https://www.urutix.com,https://api.urutix.com,http://161.97.148.53,http://161.97.148.53:80" >> .env
fi

print_status "Backend CORS updated"

# 2. Verify Frontend .env.production
print_info "Checking frontend .env.production..."
cd ../frontend

if [ ! -f .env.production ]; then
    print_info "Creating .env.production..."
    cat > .env.production << 'ENVEOF'
# Production Environment Variables
VITE_API_BASE_URL=https://urutix.com/api
VITE_APP_NAME=UrutiX Fleet Management
VITE_APP_ENV=production
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=false
ENVEOF
    print_status ".env.production created"
else
    print_status ".env.production already exists"
fi

# 3. Rebuild Frontend
print_info "Rebuilding frontend with production environment..."
npm run build

if [ $? -eq 0 ]; then
    print_status "Frontend built successfully"
else
    print_error "Frontend build failed!"
    exit 1
fi

# 4. Restart PM2 processes
print_info "Restarting PM2 processes..."
cd ..
pm2 restart all

print_status "PM2 processes restarted"

# 5. Wait a moment for services to start
sleep 3

# 6. Check PM2 status
print_info "Checking PM2 status..."
pm2 status

# 7. Test backend
print_info "Testing backend..."
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api)

if [ "$BACKEND_RESPONSE" = "404" ] || [ "$BACKEND_RESPONSE" = "200" ]; then
    print_status "Backend is responding (HTTP $BACKEND_RESPONSE)"
else
    print_error "Backend is not responding properly (HTTP $BACKEND_RESPONSE)"
    print_info "Check backend logs with: pm2 logs urutix-backend"
fi

# 8. Reload Nginx
print_info "Reloading Nginx..."
sudo systemctl reload nginx

if [ $? -eq 0 ]; then
    print_status "Nginx reloaded successfully"
else
    print_error "Nginx reload failed!"
fi

# 9. Test Nginx configuration
print_info "Testing Nginx configuration..."
sudo nginx -t

echo ""
echo "=========================================="
echo "Fix script completed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Check PM2 logs: pm2 logs"
echo "2. Check Nginx logs: sudo tail -50 /var/log/nginx/error.log"
echo "3. Test your site: https://urutix.com"
echo ""
echo "If you still get errors, check the logs above."



