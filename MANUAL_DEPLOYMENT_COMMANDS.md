# 📋 Manual Deployment Commands - Quick Reference

> **All commands for deploying UrutiX Smart Logistics without scripts**
> 
> **Server IP:** 38.242.224.199  
> **Frontend Port:** 5173  
> **Backend Port:** 3005

---

## 🚀 First Time Deployment (Complete Setup)

### Step 1: Connect to Server

```bash
ssh root@38.242.224.199
```

### Step 2: Clone Repository

```bash
# Navigate to root directory
cd /root

# Clone repository (replace with your actual GitHub URL)
git clone https://github.com/your-username/urutix-smart-logistics.git

# Enter project directory
cd urutix-smart-logistics

# Verify you're in the right place
pwd
# Should show: /root/urutix-smart-logistics
```

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.production.example .env.production

# Edit environment file
nano .env.production
```

**Required Configuration:**

```env
# Database
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE
REDIS_PASSWORD=YOUR_REDIS_PASSWORD_HERE

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=YOUR_JWT_SECRET_HERE
JWT_REFRESH_SECRET=YOUR_JWT_REFRESH_SECRET_HERE

# URLs (already configured for your server)
VITE_API_BASE_URL=http://38.242.224.199:3005/api
VITE_WEBSOCKET_URL=ws://38.242.224.199:3005
ALLOWED_ORIGINS=http://38.242.224.199:5173,http://38.242.224.199
FRONTEND_URL=http://38.242.224.199:5173
```

**Generate secrets:**

```bash
# Generate and copy these values to .env.production
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
echo "DB_PASSWORD=$(openssl rand -base64 32)"
echo "REDIS_PASSWORD=$(openssl rand -base64 32)"
```

**Save file:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

### Step 4: Configure Firewall

```bash
# Allow frontend port
ufw allow 5173/tcp

# Allow backend port
ufw allow 3005/tcp

# Check firewall status
ufw status
```

### Step 5: Build Docker Images

```bash
# Build all images (takes 5-10 minutes)
docker-compose -f docker-compose.production.yml build --no-cache
```

### Step 6: Start All Services

```bash
# Start all containers in background
docker-compose -f docker-compose.production.yml up -d
```

### Step 7: Wait for Services

```bash
# Wait 30 seconds for services to start
sleep 30

# Check all containers are running
docker-compose -f docker-compose.production.yml ps

# Should show all services as "Up (healthy)"
```

### Step 8: Run Database Migrations

```bash
# Run migrations
docker-compose -f docker-compose.production.yml exec backend npm run migration:run
```

### Step 9: Seed Initial Data (Optional - First Time Only)

```bash
# Seed database with admin users and default settings
docker-compose -f docker-compose.production.yml exec backend npm run seed:all
```

### Step 10: Verify Deployment

```bash
# Check backend health
curl http://localhost:3005/api/health

# Check frontend health
curl http://localhost:5173/health

# Check all containers
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs --tail=50
```

### Step 11: Test in Browser

Open browser and visit:
- Frontend: http://38.242.224.199:5173
- Backend API: http://38.242.224.199:3005/api/docs
- Health Check: http://38.242.224.199:3005/api/health

---

## 🔄 Update Deployment (Pull New Changes from GitHub)

```bash
# 1. Connect to server
ssh root@38.242.224.199

# 2. Navigate to project
cd /root/urutix-smart-logistics

# 3. Pull latest code from GitHub
git pull origin main

# 4. Stop all services
docker-compose -f docker-compose.production.yml down

# 5. Rebuild images with new code
docker-compose -f docker-compose.production.yml build --no-cache

# 6. Start all services
docker-compose -f docker-compose.production.yml up -d

# 7. Wait for services
sleep 30

# 8. Run new migrations (if any)
docker-compose -f docker-compose.production.yml exec backend npm run migration:run

# 9. Verify
docker-compose -f docker-compose.production.yml ps
curl http://localhost:3005/api/health
```

---

## 📊 Daily Operations

### Check Status

```bash
# Connect to server
ssh root@38.242.224.199
cd /root/urutix-smart-logistics

# Check all containers
docker-compose -f docker-compose.production.yml ps

# Check specific service
docker-compose -f docker-compose.production.yml ps backend
docker-compose -f docker-compose.production.yml ps frontend
docker-compose -f docker-compose.production.yml ps postgres
docker-compose -f docker-compose.production.yml ps redis
```

### View Logs

```bash
# All logs (real-time)
docker-compose -f docker-compose.production.yml logs -f

# Backend logs only
docker-compose -f docker-compose.production.yml logs -f backend

# Frontend logs only
docker-compose -f docker-compose.production.yml logs -f frontend

# Last 100 lines
docker-compose -f docker-compose.production.yml logs --tail=100 backend

# Stop following logs: Press Ctrl+C
```

### Restart Services

```bash
# Restart all services
docker-compose -f docker-compose.production.yml restart

# Restart specific service
docker-compose -f docker-compose.production.yml restart backend
docker-compose -f docker-compose.production.yml restart frontend
```

### Stop/Start Services

```bash
# Stop all services
docker-compose -f docker-compose.production.yml down

# Start all services
docker-compose -f docker-compose.production.yml up -d

# Stop specific service
docker-compose -f docker-compose.production.yml stop backend

# Start specific service
docker-compose -f docker-compose.production.yml start backend
```

---

## 💾 Database Operations

### Backup Database

```bash
# Create backup
docker-compose -f docker-compose.production.yml exec -T postgres \
  pg_dump -U postgres urutix > backup_$(date +%Y%m%d_%H%M%S).sql

# Create compressed backup
docker-compose -f docker-compose.production.yml exec -T postgres \
  pg_dump -U postgres urutix | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# List backups
ls -lh backup_*.sql*
```

### Restore Database

```bash
# Restore from backup
cat backup_20240101_120000.sql | \
  docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U postgres urutix

# Restore from compressed backup
gunzip -c backup_20240101_120000.sql.gz | \
  docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U postgres urutix
```

### Access Database Shell

```bash
# Open PostgreSQL shell
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d urutix

# Common SQL commands:
# \dt              - List all tables
# \d table_name    - Describe table
# SELECT * FROM users LIMIT 10;
# \q               - Quit
```

### Run Migrations

```bash
# Run migrations
docker-compose -f docker-compose.production.yml exec backend npm run migration:run

# Check migration status
docker-compose -f docker-compose.production.yml exec backend npm run migration:show

# Revert last migration (careful!)
docker-compose -f docker-compose.production.yml exec backend npm run migration:revert
```

---

## 🔍 Troubleshooting

### Container Not Starting

```bash
# Check status
docker-compose -f docker-compose.production.yml ps

# Check logs for errors
docker-compose -f docker-compose.production.yml logs backend
docker-compose -f docker-compose.production.yml logs frontend

# Restart container
docker-compose -f docker-compose.production.yml restart backend

# Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build backend
```

### Database Connection Issues

```bash
# Check database is running
docker-compose -f docker-compose.production.yml ps postgres

# Check database logs
docker-compose -f docker-compose.production.yml logs postgres

# Test database connection
docker-compose -f docker-compose.production.yml exec postgres \
  pg_isready -U postgres -d urutix

# Check database from backend
docker-compose -f docker-compose.production.yml exec backend \
  node -e "console.log(process.env.DB_HOST, process.env.DB_PASSWORD)"
```

### Port Already in Use

```bash
# Check what's using the port
netstat -tulpn | grep :5173
netstat -tulpn | grep :3005

# If conflict, stop the conflicting service or change ports in .env.production
```

### Reset Everything (Nuclear Option)

```bash
# ⚠️ WARNING: This deletes all data!

# Stop and remove all containers and volumes
docker-compose -f docker-compose.production.yml down -v

# Remove all images
docker-compose -f docker-compose.production.yml down --rmi all

# Rebuild from scratch
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d
docker-compose -f docker-compose.production.yml exec backend npm run migration:run
```

---

## 🔒 Security Operations

### Change Passwords

```bash
# 1. Generate new passwords
openssl rand -base64 32

# 2. Update .env.production
nano .env.production
# Update DB_PASSWORD, REDIS_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET

# 3. Restart services
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
```

### View Environment Variables

```bash
# View backend environment (be careful with secrets!)
docker-compose -f docker-compose.production.yml exec backend env | grep -E 'DB_|REDIS_|JWT_'

# View frontend environment
docker-compose -f docker-compose.production.yml exec frontend env | grep VITE_
```

---

## 📈 Monitoring

### Resource Usage

```bash
# Check Docker resource usage
docker stats --no-stream

# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top
```

### Health Checks

```bash
# Backend health
curl http://localhost:3005/api/health

# Frontend health
curl http://localhost:5173/health

# Database health
docker-compose -f docker-compose.production.yml exec postgres \
  pg_isready -U postgres -d urutix

# Redis health
docker-compose -f docker-compose.production.yml exec redis redis-cli ping
```

### Check Logs for Errors

```bash
# Check backend errors
docker-compose -f docker-compose.production.yml logs backend | grep -i error

# Check frontend errors
docker-compose -f docker-compose.production.yml logs frontend | grep -i error

# Check all errors
docker-compose -f docker-compose.production.yml logs | grep -i error
```

---

## 🔄 Automated Backups (Cron)

### Set Up Daily Backups

```bash
# Edit crontab
crontab -e

# Add this line for daily backup at 2 AM:
0 2 * * * cd /root/urutix-smart-logistics && docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U postgres urutix | gzip > /root/backups/urutix_backup_$(date +\%Y\%m\%d).sql.gz

# Create backups directory
mkdir -p /root/backups

# Test backup manually
cd /root/urutix-smart-logistics && docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U postgres urutix | gzip > /root/backups/urutix_backup_$(date +%Y%m%d).sql.gz
```

### Clean Old Backups

```bash
# Delete backups older than 30 days
find /root/backups -name "urutix_backup_*.sql.gz" -mtime +30 -delete

# Add to crontab for automatic cleanup:
0 3 * * * find /root/backups -name "urutix_backup_*.sql.gz" -mtime +30 -delete
```

---

## 📝 Quick Reference Card

### Most Common Commands

```bash
# Connect
ssh root@38.242.224.199
cd /root/urutix-smart-logistics

# Status
docker-compose -f docker-compose.production.yml ps

# Logs
docker-compose -f docker-compose.production.yml logs -f backend

# Restart
docker-compose -f docker-compose.production.yml restart

# Update
git pull origin main
docker-compose -f docker-compose.production.yml up -d --build
docker-compose -f docker-compose.production.yml exec backend npm run migration:run

# Backup
docker-compose -f docker-compose.production.yml exec -T postgres \
  pg_dump -U postgres urutix > backup_$(date +%Y%m%d).sql
```

---

## 🎯 Access URLs

After deployment, access your application at:

| Service | URL |
|---------|-----|
| Frontend | http://38.242.224.199:5173 |
| Backend API | http://38.242.224.199:3005/api |
| API Documentation | http://38.242.224.199:3005/api/docs |
| Health Check | http://38.242.224.199:3005/api/health |

---

## 💡 Tips

1. **Always navigate to project directory first:**
   ```bash
   cd /root/urutix-smart-logistics
   ```

2. **Use `-f docker-compose.production.yml` for all commands**

3. **Wait 30 seconds after starting services before running migrations**

4. **Check logs if something doesn't work:**
   ```bash
   docker-compose -f docker-compose.production.yml logs
   ```

5. **Backup before major updates:**
   ```bash
   docker-compose -f docker-compose.production.yml exec -T postgres \
     pg_dump -U postgres urutix > backup_before_update.sql
   ```

---

**Save this file for quick reference!** 📌

All commands are tested and ready to use on your server (38.242.224.199).
