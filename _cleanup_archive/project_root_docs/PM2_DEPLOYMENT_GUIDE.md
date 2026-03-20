# PM2 Deployment Guide for UrutiX

This guide will help you deploy UrutiX backend and frontend using PM2 so they stay online even when you close the server.

## Prerequisites

- Node.js installed
- npm installed
- PostgreSQL database running
- Nginx installed and configured

## Step-by-Step Deployment

### Step 1: Navigate to Project Directory

```bash
cd /root/project/urutix
```

### Step 2: Install PM2 Globally

```bash
npm install -g pm2
```

### Step 3: Build Backend

```bash
cd backend
npm install
npm run build
cd ..
```

### Step 4: Build Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

### Step 5: Create Logs Directory

```bash
mkdir -p logs
```

### Step 6: Start Applications with PM2

```bash
pm2 start ecosystem.config.js --env production
```

### Step 7: Save PM2 Configuration

```bash
pm2 save
```

This ensures PM2 remembers your applications.

### Step 8: Setup PM2 to Start on Boot

Run this command and follow the instructions:

```bash
pm2 startup
```

It will output a command like:
```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

**Copy and run that command** to enable PM2 on system boot.

### Step 9: Verify Everything is Running

```bash
pm2 status
```

You should see both `urutix-backend` and `urutix-frontend` running.

### Step 10: Check Logs

```bash
# View all logs
pm2 logs

# View backend logs only
pm2 logs urutix-backend

# View frontend logs only
pm2 logs urutix-frontend
```

### Step 11: Verify Nginx Configuration

Make sure your nginx configs are correct:

**Backend nginx** (`/etc/nginx/sites-available/backend`):
```nginx
server {
    listen 8080;
    server_name 161.97.148.53;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Frontend nginx** (`/etc/nginx/sites-available/frontend`):
```nginx
server {
    listen 80;
    server_name 161.97.148.53;

    location / {
        proxy_pass http://localhost:5713;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 12: Enable and Test Nginx Sites

```bash
# Enable sites
sudo ln -sf /etc/nginx/sites-available/backend /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/frontend /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Quick Deployment Script

You can also use the automated deployment script:

```bash
cd /root/project/urutix
./deploy-pm2.sh
```

## Useful PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs
pm2 logs urutix-backend
pm2 logs urutix-frontend

# Restart applications
pm2 restart all
pm2 restart urutix-backend
pm2 restart urutix-frontend

# Stop applications
pm2 stop all
pm2 stop urutix-backend

# Delete applications
pm2 delete urutix-backend
pm2 delete urutix-frontend

# Monitor applications (real-time)
pm2 monit

# View detailed info
pm2 info urutix-backend
pm2 info urutix-frontend

# Save current process list
pm2 save

# Reload applications (zero-downtime)
pm2 reload all
```

## Troubleshooting

### Applications Not Starting

1. Check logs:
   ```bash
   pm2 logs
   ```

2. Check if ports are in use:
   ```bash
   sudo netstat -tulpn | grep -E ':(3000|5713)'
   ```

3. Verify environment variables:
   ```bash
   cd backend
   cat .env
   ```

### PM2 Not Starting on Boot

1. Re-run startup command:
   ```bash
   pm2 startup
   ```

2. Save PM2 configuration:
   ```bash
   pm2 save
   ```

### Nginx Not Working

1. Check nginx status:
   ```bash
   sudo systemctl status nginx
   ```

2. Check nginx error logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. Test nginx configuration:
   ```bash
   sudo nginx -t
   ```

## Accessing Your Application

- **Frontend**: http://161.97.148.53 (port 80)
- **Backend API**: http://161.97.148.53:8080 (port 8080)

## Updating Application

When you need to update:

```bash
cd /root/project/urutix

# Pull latest code (if using git)
git pull

# Rebuild backend
cd backend
npm install
npm run build
cd ..

# Rebuild frontend
cd frontend
npm install
npm run build
cd ..

# Restart PM2 applications
pm2 restart all
```

## Monitoring

PM2 provides built-in monitoring:

```bash
# Real-time monitoring
pm2 monit

# Process list with details
pm2 list

# Process information
pm2 show urutix-backend
```

Your applications will now stay online even when you close the SSH session or restart the server!


