# 🚀 Quick Deployment Commands - Copy & Paste

## ⚠️ CRITICAL: All Commands Run from ROOT Directory

**NEVER** `cd` into `backend/` or `frontend/` folders!

All commands are executed from the project root directory: `urutix-smart-logistics/`

---

## 📍 Directory Structure

```
urutix-smart-logistics/          ← YOU ARE HERE (ROOT)
├── backend/                     ← Docker Compose handles this
│   ├── Dockerfile
│   └── src/
├── frontend/                    ← Docker Compose handles this
│   ├── Dockerfile
│   └── src/
├── docker-compose.production.yml ← You use this file
├── .env.production              ← You create this file
├── Makefile                     ← You use this file
└── scripts/                     ← You run these scripts
```

---

## 🎯 Complete Deployment (Copy All Commands)

### Fresh Deployment from GitHub

```bash
# 1. Clone and enter project (ROOT directory)
cd /home/$USER
git clone https://github.com/your-username/urutix-smart-logistics.git
cd urutix-smart-logistics

# ⚠️ STOP HERE - You are now in ROOT directory
# All commands below run from HERE

# 2. Configure environment
cp .env.production.example .env.production
nano .env.production
# Edit values, save (Ctrl+X, Y, Enter)

# 3. Generate secrets (copy output to .env.production)
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
echo "DB_PASSWORD=$(openssl rand -base64 32)"
echo "REDIS_PASSWORD=$(openssl rand -base64 32)"

# 4. Build images (5-10 minutes)
docker-compose -f docker-compose.production.yml build --no-cache

# 5. Start all services
docker-compose -f docker-compose.production.yml up -d

# 6. Wait for services (30 seconds)
sleep 30

# 7. Run migrations
docker-compose -f docker-compose.production.yml exec backend npm run migration:run

# 8. Seed initial data (optional, first time only)
docker-compose -f docker-compose.production.yml exec backend npm run seed:all

# 9. Verify deployment
docker-compose -f docker-compose.production.yml ps
curl http://localhost:3005/api/health
curl http://localhost:80/health

# 10. Check logs
docker-compose -f docker-compose.production.yml logs -f
```

---

## 🔄 Update Deployment (Pull New Changes)

```bash
# Navigate to ROOT directory
cd /home/$USER/urutix-smart-logistics

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

## 🛠️ Using Makefile (Shorter Commands)

All Makefile commands also run from ROOT directory:

```bash
# Navigate to ROOT directory
cd /home/$USER/urutix-smart-logistics

# Build and start production
make prod-build

# Run migrations
make migrate

# View logs
make prod-logs

# Check status
make ps

# Create backup
make db-backup

# Restart services
make restart

# Stop services
make prod-down
```

---

## 📊 Common Commands (All from ROOT)

### Check Status

```bash
# From ROOT directory
cd /home/$USER/urutix-smart-logistics

# Check all containers
docker-compose -f docker-compose.production.yml ps

# Check specific service
docker-compose -f docker-compose.production.yml ps backend
```

### View Logs

```bash
# From ROOT directory
cd /home/$USER/urutix-smart-logistics

# All logs
docker-compose -f docker-compose.production.yml logs -f

# Backend logs only
docker-compose -f docker-compose.production.yml logs -f backend

# Frontend logs only
docker-compose -f docker-compose.production.yml logs -f frontend

# Last 100 lines
docker-compose -f docker-compose.production.yml logs --tail=100 backend
```

### Database Operations

```bash
# From ROOT directory
cd /home/$USER/urutix-smart-logistics

# Run migrations
docker-compose -f docker-compose.production.yml exec backend npm run migration:run

# Check migration status
docker-compose -f docker-compose.production.yml exec backend npm run migration:show

# Access database shell
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix

# Backup database
docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U postgres urutix > backup.sql
```

### Service Management

```bash
# From ROOT directory
cd /home/$USER/urutix-smart-logistics

# Start all services
docker-compose -f docker-compose.production.yml up -d

# Stop all services
docker-compose -f docker-compose.production.yml down

# Restart all services
docker-compose -f docker-compose.production.yml restart

# Restart specific service
docker-compose -f docker-compose.production.yml restart backend

# Rebuild specific service
docker-compose -f docker-compose.production.yml up -d --build backend
```

### Health Checks

```bash
# From ROOT directory
cd /home/$USER/urutix-smart-logistics

# Backend health
curl http://localhost:3005/api/health

# Frontend health
curl http://localhost:80/health

# Database health
docker-compose -f docker-compose.production.yml exec postgres pg_isready -U postgres -d urutix

# Redis health
docker-compose -f docker-compose.production.yml exec redis redis-cli ping

# Run health check script
./scripts/health-check.sh
```

---

## 🔍 Troubleshooting (All from ROOT)

### Container Not Starting

```bash
# From ROOT directory
cd /home/$USER/urutix-smart-logistics

# Check status
docker-compose -f docker-compose.production.yml ps

# Check logs
docker-compose -f docker-compose.production.yml logs backend

# Restart service
docker-compose -f docker-compose.production.yml restart backend
```

### Database Connection Issues

```bash
# From ROOT directory
cd /home/$USER/urutix-smart-logistics

# Check database is running
docker-compose -f docker-compose.production.yml ps postgres

# Check database logs
docker-compose -f docker-compose.production.yml logs postgres

# Test connection
docker-compose -f docker-compose.production.yml exec postgres pg_isready -U postgres
```

### Reset Everything

```bash
# From ROOT directory
cd /home/$USER/urutix-smart-logistics

# Stop and remove everything
docker-compose -f docker-compose.production.yml down -v

# Rebuild from scratch
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# Run migrations
docker-compose -f docker-compose.production.yml exec backend npm run migration:run
```

---

## 📝 Important Notes

### ✅ DO:
- Run all commands from ROOT directory (`urutix-smart-logistics/`)
- Use `docker-compose -f docker-compose.production.yml` for all operations
- Use `make` commands for convenience (they also run from ROOT)
- Use `./scripts/` for automation scripts

### ❌ DON'T:
- Don't `cd backend/` or `cd frontend/`
- Don't run `docker build` manually in backend/frontend folders
- Don't edit files inside containers
- Don't run `npm install` or `npm run` directly on host

### 🎯 Why?

Docker Compose handles everything:
- It knows where `backend/Dockerfile` is (from `docker-compose.production.yml`)
- It knows where `frontend/Dockerfile` is (from `docker-compose.production.yml`)
- It builds images with correct context
- It manages all services together
- It handles networking between containers

---

## 🚀 One-Line Deployment

For experienced users, complete deployment in one command:

```bash
cd /home/$USER && \
git clone https://github.com/your-username/urutix-smart-logistics.git && \
cd urutix-smart-logistics && \
cp .env.production.example .env.production && \
echo "⚠️  Edit .env.production now, then run:" && \
echo "docker-compose -f docker-compose.production.yml build --no-cache && docker-compose -f docker-compose.production.yml up -d && sleep 30 && docker-compose -f docker-compose.production.yml exec backend npm run migration:run"
```

---

## 📚 Related Documentation

- [Complete Deployment Guide](./DOCKER_DEPLOYMENT_GUIDE.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [Docker Setup Summary](./DOCKER_SETUP_SUMMARY.md)

---

**Remember: Always work from the ROOT directory!** 🎯
