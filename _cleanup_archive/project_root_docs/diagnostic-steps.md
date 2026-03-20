# Diagnostic Steps for 500 Error on urutix.com

Run these commands on your server to diagnose the issue:

## 1. Check PM2 Process Status
```bash
pm2 status
pm2 logs urutix-backend --lines 50
pm2 logs urutix-frontend --lines 20
```

## 2. Check if Backend is Running on Port 3000
```bash
sudo netstat -tulpn | grep 3000
# OR
sudo lsof -i :3000
```

## 3. Check Backend Environment Variables
```bash
cd /root/project/urutix/backend
cat .env | grep -E "PORT|ALLOWED_ORIGINS|NODE_ENV"
```

## 4. Check Nginx Error Logs
```bash
sudo tail -50 /var/log/nginx/error.log
```

## 5. Check Nginx Access Logs
```bash
sudo tail -50 /var/log/nginx/access.log
```

## 6. Test Backend Directly
```bash
curl http://localhost:3000/api/health
# OR
curl http://localhost:3000/api
```

## 7. Check Nginx Configuration
```bash
sudo nginx -t
```

## 8. Rebuild Frontend with Production Env
```bash
cd /root/project/urutix/frontend
# Make sure .env.production exists with correct values
cat .env.production
# Rebuild
npm run build
# Restart PM2 (only if using PM2 for frontend)
cd /root/project/urutix
pm2 restart urutix-frontend
```

## 9. Update Backend CORS for HTTPS
```bash
cd /root/project/urutix/backend
# Add or update ALLOWED_ORIGINS
nano .env
# Add this line:
# ALLOWED_ORIGINS=https://urutix.com,https://www.urutix.com,https://api.urutix.com,http://161.97.148.53
```

## 10. Restart Everything
```bash
cd /root/project/urutix
pm2 restart all
sudo systemctl reload nginx
```
