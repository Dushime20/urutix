# 🚀 UrutiX Production Server Setup (38.242.224.199)

## 📊 Current Server Status

Your server already has these applications running:

| Application | Ports Used | Container Names |
|-------------|------------|-----------------|
| IntelliProcure Nginx | 80, 443 | intelliprocure-nginx |
| UrutiBiz Nginx | 8081, 8443 | urutibiz-nginx |
| UrutiBiz Frontend | 8080 | urutibiz-frontend |
| UrutiBiz Backend | 3000 | urutibiz-api |
| UrutiBiz Adminer | 8082 | urutibiz-adminer |
| IntelliProcure Frontend | 3010 | intelliprocure-frontend |
| IntelliProcure Backend | 4001 | intelliprocure-backend |
| IntelliProcure Postgres | 5435 | intelliprocure-postgres |

---

## 🎯 UrutiX Port Configuration (No Conflicts)

To avoid conflicts, UrutiX will use these ports:

| Service | Port | Access |
|---------|------|--------|
| Frontend | **5173** | http://38.242.224.199:5173 |
| Backend API | **3005** | http://38.242.224.199:3005/api |
| PostgreSQL | **5433** | Internal only (not exposed) |
| Redis | **6380** | Internal only (not exposed) |

---

## 🚀 Complete Deployment Commands

### Step 1: Connect to Server

```bash
# From your local machine
ssh root@38.242.224.199
```

### Step 2: Clone Repository

```bash
# Navigate to home directory
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

**Paste this configuration:**

```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=UrutiX_DB_Secure_Pass_2024_$(openssl rand -hex 8)
DB_NAME=urutix

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=UrutiX_Redis_Pass_2024_$(openssl rand -hex 8)
REDIS_DB=0
REDIS_TLS=false

# JWT Secrets (Generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_here_replace_with_generated
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here_replace_with_generated

# Backend Configuration
BACKEND_PORT=3005
NODE_ENV=production
PORT=3005

# Frontend Configuration
FRONTEND_PORT=5173
VITE_API_BASE_URL=http://38.242.224.199:3005/api
VITE_WEBSOCKET_URL=ws://38.242.224.199:3005

# CORS Configuration
ALLOWED_ORIGINS=http://38.242.224.199:5173,http://38.242.224.199,http://localhost:5173,http://127.0.0.1:5173

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=urutix4@gmail.com
SMTP_PASS=tmio mopw fmba bwuu
SMTP_SECURE=true

# Mobile Money API
MOBILE_MONEY_API_URL=https://api.payment.ishema.rw
MOBILE_MONEY_API_KEY=wT48JRMwtUMPCRDQLBIJ
MOBILE_MONEY_CALLBACK_URL=http://38.242.224.199:3005/api/payments/webhooks/mobile-money
MOBILE_MONEY_CURRENCY=RWF
MOBILE_MONEY_ACCOUNT_PHONE=250788309463

# Frontend URL
FRONTEND_URL=http://38.242.224.199:5173
```

**Generate secure secrets:**

```bash
# Generate JWT_SECRET
echo "JWT_SECRET=$(openssl rand -base64 32)"

# Generate JWT_REFRESH_SECRET
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"

# Generate DB_PASSWORD
echo "DB_PASSWORD=$(openssl rand -base64 32)"

# Generate REDIS_PASSWORD
echo "REDIS_PASSWORD=$(openssl rand -base64 32)"
```

Copy the generated values and replace in `.env.production`, then save:
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

### Step 4: Configure Firewall

```bash
# Allow UrutiX ports
ufw allow 5173/tcp comment 'UrutiX Frontend'
ufw allow 3005/tcp comment 'UrutiX Backend'

# Check firewall status
ufw status

# Expected output should include:
# 5173/tcp    ALLOW       Anywhere    # UrutiX Frontend
# 3005/tcp    ALLOW       Anywhere    # UrutiX Backend
```

### Step 5: Build and Deploy

```bash
# Make sure you're in the project root
cd /root/urutix-smart-logistics

# Build Docker images (5-10 minutes)
docker-compose -f docker-compose.production.yml build --no-cache

# Start all services
docker-compose -f docker-compose.production.yml up -d

# Wait for services to start
sleep 30

# Check all containers are running
docker-compose -f docker-compose.production.yml ps

# Expected output:
# NAME              STATUS
# urutix_postgres   Up (healthy)
# urutix_redis      Up (healthy)
# urutix_backend    Up (healthy)
# urutix_frontend   Up (healthy)
```

### Step 6: Run Database Migrations

```bash
# Run migrations
docker-compose -f docker-compose.production.yml exec backend npm run migration:run

# Expected output:
# Migration ... has been executed successfully.
# Migration completed successfully
```

### Step 7: Seed Initial Data (Optional - First Time Only)

```bash
# Seed database with initial data
docker-compose -f docker-compose.production.yml exec backend npm run seed:all

# This creates admin users and default settings
```

### Step 8: Verify Deployment

```bash
# Check backend health
curl http://localhost:3005/api/health

# Expected: {"status":"ok",...}

# Check frontend health
curl http://localhost:5173/health

# Expected: healthy

# Check all services
docker ps | grep urutix

# Should show 4 containers running
```

### Step 9: Test from Browser

Open your browser and visit:

1. **Frontend Application:**
   ```
   http://38.242.224.199:5173
   ```

2. **Backend API Documentation:**
   ```
   http://38.242.224.199:3005/api/docs
   ```

3. **Backend Health Check:**
   ```
   http://38.242.224.199:3005/api/health
   ```

---

## 📊 Verify No Port Conflicts

```bash
# Check all Docker containers
docker ps

# Check port usage
netstat -tulpn | grep -E ':(5173|3005|5433|6380)'

# Should show:
# tcp6  0  0 :::5173   :::*  LISTEN  -  (docker-proxy)
# tcp6  0  0 :::3005   :::*  LISTEN  -  (docker-proxy)
```

---

## 🔄 Update Deployment (Pull New Changes)

```bash
# Connect to server
ssh root@38.242.224.199

# Navigate to project
cd /root/urutix-smart-logistics

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# Run new migrations
docker-compose -f docker-compose.production.yml exec backend npm run migration:run

# Verify
docker-compose -f docker-compose.production.yml ps
```

---

## 📝 Useful Commands

### View Logs

```bash
# All logs
docker-compose -f docker-compose.production.yml logs -f

# Backend logs only
docker-compose -f docker-compose.production.yml logs -f backend

# Frontend logs only
docker-compose -f docker-compose.production.yml logs -f frontend

# Last 100 lines
docker-compose -f docker-compose.production.yml logs --tail=100 backend
```

### Check Status

```bash
# Container status
docker-compose -f docker-compose.production.yml ps

# Resource usage
docker stats --no-stream

# Disk usage
df -h
```

### Restart Services

```bash
# Restart all
docker-compose -f docker-compose.production.yml restart

# Restart specific service
docker-compose -f docker-compose.production.yml restart backend
```

### Database Operations

```bash
# Backup database
docker-compose -f docker-compose.production.yml exec -T postgres \
  pg_dump -U postgres urutix > backup_$(date +%Y%m%d_%H%M%S).sql

# Access database shell
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d urutix

# Run migrations
docker-compose -f docker-compose.production.yml exec backend npm run migration:run
```

---

## 🚨 Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
netstat -tulpn | grep :5173
netstat -tulpn | grep :3005

# If conflict, change ports in .env.production:
# FRONTEND_PORT=5174
# BACKEND_PORT=3006
```

### Container Not Starting

```bash
# Check logs
docker-compose -f docker-compose.production.yml logs backend

# Check container status
docker-compose -f docker-compose.production.yml ps

# Restart container
docker-compose -f docker-compose.production.yml restart backend
```

### Database Connection Failed

```bash
# Check database is running
docker-compose -f docker-compose.production.yml ps postgres

# Check database logs
docker-compose -f docker-compose.production.yml logs postgres

# Test connection
docker-compose -f docker-compose.production.yml exec postgres \
  pg_isready -U postgres -d urutix
```

---

## 🔒 Security Notes

1. **Firewall is configured** - Only necessary ports are open
2. **Database and Redis** - Not exposed to internet (internal only)
3. **Strong passwords** - Generated with openssl
4. **CORS configured** - Only allows specific origins

---

## 📊 Access URLs

After successful deployment:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://38.242.224.199:5173 | Main application |
| Backend API | http://38.242.224.199:3005/api | REST API |
| API Docs | http://38.242.224.199:3005/api/docs | Swagger documentation |
| Health Check | http://38.242.224.199:3005/api/health | Backend health |

---

## 🎯 Next Steps

1. ✅ Deploy application (follow steps above)
2. ✅ Test all endpoints
3. ✅ Set up automated backups
4. ✅ Configure monitoring
5. 🔜 Get domain name and configure DNS
6. 🔜 Set up SSL/TLS with Let's Encrypt
7. 🔜 Configure Nginx reverse proxy

---

## 📞 Quick Reference

```bash
# Connect to server
ssh root@38.242.224.199

# Navigate to project
cd /root/urutix-smart-logistics

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Restart
docker-compose -f docker-compose.production.yml restart

# Stop
docker-compose -f docker-compose.production.yml down

# Start
docker-compose -f docker-compose.production.yml up -d
```

---

**Server IP**: 38.242.224.199  
**Frontend Port**: 5173  
**Backend Port**: 3005  
**No Port Conflicts**: ✅ Verified
