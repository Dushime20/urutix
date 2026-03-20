# UrutiX Production Deployment - Complete Guide

## Problem Identified
Your nginx was only proxying to the frontend (port 5713) and missing the backend API configuration. This caused the 404 error.

## Solution Steps

### 1. Update Nginx Configuration

On your server, backup and update the nginx config:

```bash
# Backup current config
sudo cp /etc/nginx/sites-available/urutix.com /etc/nginx/sites-available/urutix.com.backup

# Edit the config
sudo nano /etc/nginx/sites-available/urutix.com
```

Replace with the content from `nginx-config-fixed.conf` (created in your local project).

Or copy it directly on the server - see the file content above.

### 2. Update Frontend Environment for Production

```bash
cd /root/project/urutix/frontend
cat > .env.production << 'ENVEOF'
# Production Environment Variables
VITE_API_BASE_URL=/api
VITE_APP_NAME=UrutiX Fleet Management
VITE_APP_ENV=production
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=false
ENVEOF
```

**Note:** We use `/api` (relative path) because nginx will proxy it to the backend.

### 3. Update Backend CORS Configuration

```bash
cd /root/project/urutix/backend
nano .env
```

Add or update:
```env
ALLOWED_ORIGINS=https://urutix.com,https://www.urutix.com,http://urutix.com,http://www.urutix.com
```

### 4. Rebuild Frontend

```bash
cd /root/project/urutix/frontend
npm run build
```

### 5. Restart Services

```bash
# Test nginx config
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx

# Restart backend and frontend with PM2
cd /root/project/urutix
pm2 restart all

# Check status
pm2 status
pm2 logs --lines 50
```

### 6. Verify Deployment

Open your browser and test:
- https://urutix.com (should show the frontend)
- https://urutix.com/api/health (should show backend health check)

## Architecture Overview

```
User Browser
    ↓
https://urutix.com
    ↓
Nginx (Port 443)
    ├─→ /api/* → Backend (localhost:3000)
    ├─→ /socket.io → Backend WebSocket (localhost:3000)
    ├─→ /uploads → Backend Static Files (localhost:3000)
    └─→ /* → Frontend Static Files (/root/project/urutix/frontend/dist)
```

## Key Changes Made

1. **Nginx Configuration**
   - Added `/api` location block to proxy backend API
   - Added `/socket.io` for WebSocket support
   - Added `/uploads` for file uploads
   - Frontend now serves static files directly from `dist/` directory
   - Removed duplicate server blocks

2. **Frontend Environment**
   - Changed API URL from `http://161.97.148.53:8080/api` to `/api`
   - This allows nginx to handle routing

3. **Backend CORS**
   - Added `https://urutix.com` and `https://www.urutix.com` to allowed origins

## Troubleshooting

If you still see issues:

```bash
# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check PM2 logs
pm2 logs

# Check if backend is running
curl http://localhost:3000/api/health

# Check if frontend files exist
ls -la /root/project/urutix/frontend/dist/
```

## Important Notes

- **No longer using PM2 for frontend preview server** - Nginx serves static files directly
- **Backend runs on port 3000** via PM2
- **All traffic goes through port 443 (HTTPS)** via Nginx
- **CORS is handled by both Nginx and Backend** for maximum compatibility

