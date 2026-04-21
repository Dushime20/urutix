# 📋 UrutiX Docker Commands Cheat Sheet

> **Quick reference for daily operations**
> 
> **Server:** 38.242.224.199  
> **Project:** /root/urutix-smart-logistics

---

## 🔌 Connect to Server

```bash
ssh root@38.242.224.199
cd /root/urutix-smart-logistics
```

---

## 📊 Check Status

```bash
# All containers
docker-compose -f docker-compose.production.yml ps

# Specific service
docker-compose -f docker-compose.production.yml ps backend
```

---

## 📝 View Logs

```bash
# All logs (real-time)
docker-compose -f docker-compose.production.yml logs -f

# Backend only
docker-compose -f docker-compose.production.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.production.yml logs --tail=100 backend

# Stop: Ctrl+C
```

---

## 🔄 Restart Services

```bash
# All services
docker-compose -f docker-compose.production.yml restart

# Specific service
docker-compose -f docker-compose.production.yml restart backend
```

---

## 🛑 Stop/Start

```bash
# Stop all
docker-compose -f docker-compose.production.yml down

# Start all
docker-compose -f docker-compose.production.yml up -d
```

---

## 🔄 Update from GitHub

```bash
# Pull and deploy
git pull origin main
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d
docker-compose -f docker-compose.production.yml exec backend npm run migration:run
```

---

## 💾 Database Backup

```bash
# Create backup
docker-compose -f docker-compose.production.yml exec -T postgres \
  pg_dump -U postgres urutix > backup_$(date +%Y%m%d).sql

# Compressed backup
docker-compose -f docker-compose.production.yml exec -T postgres \
  pg_dump -U postgres urutix | gzip > backup_$(date +%Y%m%d).sql.gz
```

---

## 🗄️ Database Shell

```bash
# Open PostgreSQL
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d urutix

# Common commands:
# \dt              - List tables
# \d users         - Describe users table
# SELECT * FROM users LIMIT 10;
# \q               - Quit
```

---

## 🔧 Run Migrations

```bash
# Run migrations
docker-compose -f docker-compose.production.yml exec backend npm run migration:run

# Check status
docker-compose -f docker-compose.production.yml exec backend npm run migration:show
```

---

## 🏥 Health Checks

```bash
# Backend
curl http://localhost:3005/api/health

# Frontend
curl http://localhost:5173/health

# Database
docker-compose -f docker-compose.production.yml exec postgres \
  pg_isready -U postgres -d urutix
```

---

## 🌐 Access URLs

| Service | URL |
|---------|-----|
| Frontend | http://38.242.224.199:5173 |
| Backend | http://38.242.224.199:3005/api |
| API Docs | http://38.242.224.199:3005/api/docs |

---

## 🚨 Troubleshooting

```bash
# Check logs for errors
docker-compose -f docker-compose.production.yml logs backend | grep -i error

# Restart problematic service
docker-compose -f docker-compose.production.yml restart backend

# Rebuild specific service
docker-compose -f docker-compose.production.yml up -d --build backend
```

---

## 💡 Pro Tips

1. **Always navigate to project first:**
   ```bash
   cd /root/urutix-smart-logistics
   ```

2. **Check status before operations:**
   ```bash
   docker-compose -f docker-compose.production.yml ps
   ```

3. **Backup before updates:**
   ```bash
   docker-compose -f docker-compose.production.yml exec -T postgres \
     pg_dump -U postgres urutix > backup_before_update.sql
   ```

4. **View logs when troubleshooting:**
   ```bash
   docker-compose -f docker-compose.production.yml logs -f
   ```

---

**📚 Full Documentation:**
- [MANUAL_DEPLOYMENT_COMMANDS.md](./MANUAL_DEPLOYMENT_COMMANDS.md) - Complete command reference
- [DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md) - Full deployment guide
- [PRODUCTION_SERVER_SETUP.md](./PRODUCTION_SERVER_SETUP.md) - Server-specific setup

---

**Print this page and keep it handy!** 📌
