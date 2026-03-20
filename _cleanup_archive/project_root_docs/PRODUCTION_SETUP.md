# UrutiX Production Setup Guide

## Current Issue: 500 Internal Server Error

The 500 error is likely caused by one of these issues:

1. **Backend not running** or crashed
2. **CORS not allowing HTTPS domains**
3. **Frontend not rebuilt with production environment variables**

## Quick Fix (Run on Your Server)

### Option 1: Use the Automated Fix Script

```bash
cd /root/project/urutix
./fix-production.sh
```

### Option 2: Manual Steps

#### Step 1: Update Backend CORS

```bash
cd /root/project/urutix/backend
nano .env
```

Add or update this line:

```env
ALLOWED_ORIGINS=https://urutix.com,https://www.urutix.com,https://api.urutix.com,http://161.97.148.53
```

#### Step 2: Ensure Frontend .env.production Exists

```bash
cd /root/project/urutix/frontend
cat > .env.production << 'EOF'
# Production Environment Variables
VITE_API_BASE_URL=https://urutix.com/api
VITE_APP_NAME=UrutiX Fleet Management
VITE_APP_ENV=production
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=false
EOF
```

#### Step 3: Rebuild Frontend

```bash
cd /root/project/urutix/frontend
npm run build
```

This will create optimized static files in the `dist/` directory that Nginx will serve.

#### Step 4: Restart Backend (Only Backend Needs PM2)

```bash
cd /root/project/urutix
pm2 restart urutix-backend

# You can stop the frontend PM2 process since Nginx serves static files directly
pm2 delete urutix-frontend
```

#### Step 5: Reload Nginx

```bash
sudo systemctl reload nginx
```

#### Step 6: Verify Everything is Working

```bash
# Check backend is running
pm2 status
pm2 logs urutix-backend --lines 20

# Check backend is responding
curl http://localhost:3000/api

# Check Nginx logs
sudo tail -20 /var/log/nginx/error.log
```

## Architecture Explanation

### Current Setup:

- **Frontend**: Static files in `/root/project/urutix/frontend/dist/` served directly by Nginx
- **Backend**: Node.js app running on `http://localhost:3000` via PM2, proxied by Nginx

### URL Mapping:

| URL | Served By | Proxied To |
|-----|-----------|------------|
| `https://urutix.com/` | Nginx (static files) | N/A |
| `https://urutix.com/api/*` | Nginx → Backend | `http://localhost:3000/api/*` |
| `https://api.urutix.com/*` | Nginx → Backend | `http://localhost:3000/*` |

### PM2 Configuration:

**Only the backend needs PM2**, since Nginx serves the frontend static files directly.

Updated `ecosystem.config.js` should only have the backend:

```javascript
module.exports = {
  apps: [
    {
      name: 'urutix-backend',
      script: './dist/main.js',
      cwd: '/root/project/urutix/backend',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/root/project/urutix/logs/backend-error.log',
      out_file: '/root/project/urutix/logs/backend-out.log',
      log_file: '/root/project/urutix/logs/backend-combined.log',
      time: true,
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=2048',
    },
  ],
};
```

## Troubleshooting

### Check Backend Logs

```bash
pm2 logs urutix-backend --lines 50
```

### Check Nginx Error Logs

```bash
sudo tail -50 /var/log/nginx/error.log
```

### Test Backend Directly

```bash
curl -v http://localhost:3000/api
```

### Check CORS Headers

```bash
curl -H "Origin: https://urutix.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     --verbose \
     http://localhost:3000/api/tenants/search
```

### Check if Backend is Running

```bash
sudo lsof -i :3000
```

### Rebuild Frontend When Environment Changes

Whenever you change `.env.production`, you must rebuild:

```bash
cd /root/project/urutix/frontend
npm run build
```

## Common Issues and Solutions

### 1. CORS Errors

**Symptom**: `Access-Control-Allow-Origin` errors in browser console

**Solution**: Update `ALLOWED_ORIGINS` in backend `.env` and restart backend:

```bash
cd /root/project/urutix/backend
nano .env  # Add all your domains
cd ..
pm2 restart urutix-backend
```

### 2. 500 Internal Server Error

**Symptom**: Nginx returns 500 error

**Solutions**:
- Check if backend is running: `pm2 status`
- Check backend logs: `pm2 logs urutix-backend`
- Check Nginx logs: `sudo tail -50 /var/log/nginx/error.log`
- Test backend directly: `curl http://localhost:3000/api`

### 3. Frontend Shows Old Version

**Symptom**: Changes not appearing on the website

**Solution**: Rebuild frontend:

```bash
cd /root/project/urutix/frontend
npm run build
# Clear browser cache or do hard refresh (Ctrl+Shift+R)
```

### 4. API Requests Failing

**Symptom**: Frontend can't connect to backend

**Solutions**:
- Verify `VITE_API_BASE_URL` in `.env.production`
- Rebuild frontend after changing env vars
- Check CORS settings
- Check Nginx `/api` proxy configuration

## Deployment Workflow

When you make changes, follow this workflow:

### Backend Changes:

```bash
cd /root/project/urutix/backend
# Make your changes
npm run build
pm2 restart urutix-backend
pm2 logs urutix-backend
```

### Frontend Changes:

```bash
cd /root/project/urutix/frontend
# Make your changes
npm run build
# That's it! Nginx serves the new files automatically
```

### Environment Variable Changes:

```bash
# Backend: Edit .env and restart
cd /root/project/urutix/backend
nano .env
cd ..
pm2 restart urutix-backend

# Frontend: Edit .env.production and rebuild
cd /root/project/urutix/frontend
nano .env.production
npm run build
```



