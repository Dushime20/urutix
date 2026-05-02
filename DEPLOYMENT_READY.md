# 🚀 UrutiX Smart Logistics - Ready for Production Deployment

## ✅ Development Environment - COMPLETE

### What's Working
- ✅ **108 tables** created from 115+ entity files
- ✅ **PostGIS extension** installed for GPS/geometry data
- ✅ **UUID extension** installed
- ✅ **34 migrations** tracked and marked as executed
- ✅ **System admin user** created and verified
- ✅ **Frontend** accessible at http://localhost:5173
- ✅ **Backend API** running at http://localhost:3005
- ✅ **Professional migration system** in place
- ✅ **No DB_SYNCHRONIZE** in production config

### System Admin Credentials
```
Email:    admin@urutix.com
Password: Admin@123456
Role:     ADMIN
Status:   ACTIVE (Verified)
```

---

## 📋 Pre-Deployment Checklist

### 1. Code Repository
- [x] All changes committed
- [ ] Push to GitHub: `git push origin main`
- [ ] Verify on GitHub that all files are present

### 2. Server Preparation (38.242.224.199)
```bash
# SSH to server
ssh root@38.242.224.199

# Navigate to project
cd ~/urutix-smart-logistics

# Pull latest code
git pull origin main

# Verify files
ls -la
```

### 3. Environment Configuration
```bash
# On server, create/update .env file
cat > .env << 'EOF'
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=urutix2024
DB_NAME=urutix
DB_SSL=false

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# CORS Configuration
ALLOWED_ORIGINS=http://38.242.224.199:5173,http://38.242.224.199:5174

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=urutix4@gmail.com
SMTP_PASS=tmio mopw fmba bwuu
SMTP_SECURE=true

# Mobile Money Configuration
MOBILE_MONEY_API_URL=https://api.payment.ishema.rw
MOBILE_MONEY_API_KEY=wT48JRMwtUMPCRDQLBIJ
MOBILE_MONEY_CALLBACK_URL=https://urutix.com/api/payments/webhooks/mobile-money
MOBILE_MONEY_CURRENCY=RWF
MOBILE_MONEY_ACCOUNT_PHONE=250788309463

# Frontend URL
FRONTEND_URL=http://38.242.224.199:5173

# Node Environment
NODE_ENV=production
EOF
```

---

## 🚀 Production Deployment Steps

### Step 1: Backup Existing Data (if any)
```bash
# On server
cd ~/urutix-smart-logistics

# Backup database if it exists
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U postgres urutix > backup-before-deployment-$(date +%Y%m%d-%H%M%S).sql 2>/dev/null || echo "No existing database to backup"
```

### Step 2: Stop Existing Services
```bash
# Stop all services
docker-compose -f docker-compose.production.yml down

# Optional: Remove volumes for fresh start (CAUTION: Deletes all data!)
# docker-compose -f docker-compose.production.yml down -v
```

### Step 3: Build and Start Services
```bash
# Build and start all services
docker-compose -f docker-compose.production.yml up -d --build

# This will:
# - Build backend Docker image
# - Build frontend Docker image
# - Start PostgreSQL with PostGIS
# - Start Redis
# - Start backend service
# - Start frontend service
```

### Step 4: Wait for Services to be Ready
```bash
# Check service status
docker-compose -f docker-compose.production.yml ps

# Watch logs (Ctrl+C to exit)
docker-compose -f docker-compose.production.yml logs -f

# Wait for "Application started successfully" message in backend logs
```

### Step 5: Verify Database Extensions
```bash
# Check PostGIS and UUID extensions are installed
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix -c "SELECT extname, extversion FROM pg_extension WHERE extname IN ('postgis', 'uuid-ossp');"

# Expected output:
#   extname  | extversion 
# -----------+------------
#  postgis   | 3.4.3
#  uuid-ossp | 1.1
```

### Step 6: Run Database Migrations
```bash
# Check migration status
docker-compose -f docker-compose.production.yml exec backend npm run db:migrate:status

# Run migrations
docker-compose -f docker-compose.production.yml exec backend npm run db:migrate

# Verify all migrations completed
docker-compose -f docker-compose.production.yml exec backend npm run db:migrate:status
```

### Step 7: Seed System Admin User
```bash
# Create admin user
docker-compose -f docker-compose.production.yml exec backend npm run seed:admin

# You should see:
# 🎉 SYSTEM ADMIN CREATED SUCCESSFULLY
# Email:    admin@urutix.com
# Password: Admin@123456
```

### Step 8: Verify Deployment
```bash
# Check all services are running
docker-compose -f docker-compose.production.yml ps

# Test backend API
curl http://38.242.224.199:3005/api/health

# Test frontend
curl http://38.242.224.199:5173

# Check backend logs for errors
docker-compose -f docker-compose.production.yml logs backend --tail=100

# Check database tables
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"

# Expected: 108 tables
```

---

## 🔍 Post-Deployment Verification

### 1. Access Frontend
- Open browser: http://38.242.224.199:5173
- Should see login page
- Try logging in with admin credentials

### 2. Check Backend API
```bash
# Health check
curl http://38.242.224.199:3005/api/health

# Should return: {"status":"ok"}
```

### 3. Verify Database
```bash
# Count users
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix -c "SELECT COUNT(*) FROM users;"

# Should show at least 1 (admin user)

# Count tables
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# Should show 108 tables
```

### 4. Check Logs for Errors
```bash
# Backend logs
docker-compose -f docker-compose.production.yml logs backend --tail=200 | grep -i error

# Frontend logs
docker-compose -f docker-compose.production.yml logs frontend --tail=100

# Database logs
docker-compose -f docker-compose.production.yml logs postgres --tail=100
```

---

## 🛠️ Troubleshooting

### Issue: Services not starting
```bash
# Check logs
docker-compose -f docker-compose.production.yml logs -f

# Check specific service
docker-compose -f docker-compose.production.yml logs backend
docker-compose -f docker-compose.production.yml logs postgres

# Restart services
docker-compose -f docker-compose.production.yml restart
```

### Issue: Database connection failed
```bash
# Check database is running
docker-compose -f docker-compose.production.yml ps postgres

# Check database logs
docker-compose -f docker-compose.production.yml logs postgres

# Test connection from backend
docker-compose -f docker-compose.production.yml exec backend ping postgres
```

### Issue: Migrations failed
```bash
# Check migration status
docker-compose -f docker-compose.production.yml exec backend npm run db:migrate:status

# Check backend logs
docker-compose -f docker-compose.production.yml logs backend --tail=100

# If tables already exist, mark migrations as done
docker-compose -f docker-compose.production.yml exec backend node mark-migrations-done.js
```

### Issue: Frontend not accessible
```bash
# Check frontend logs
docker-compose -f docker-compose.production.yml logs frontend

# Restart frontend
docker-compose -f docker-compose.production.yml restart frontend

# Check if port is open
curl http://38.242.224.199:5173
```

### Issue: PostGIS extension missing
```bash
# Install PostGIS extension manually
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Verify installation
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'postgis';"
```

---

## 📊 Monitoring Commands

### Real-time Monitoring
```bash
# Watch all logs
docker-compose -f docker-compose.production.yml logs -f

# Watch backend logs only
docker-compose -f docker-compose.production.yml logs -f backend

# Monitor resource usage
docker stats

# Check service health
watch -n 5 'docker-compose -f docker-compose.production.yml ps'
```

### Daily Health Checks
```bash
# Check all services are running
docker-compose -f docker-compose.production.yml ps

# Check disk usage
df -h
docker system df

# Check database size
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix -c "SELECT pg_size_pretty(pg_database_size('urutix'));"

# Check active connections
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 🔄 Updating Production

### Deploy New Code
```bash
# 1. Backup database
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U postgres urutix > backup-$(date +%Y%m%d-%H%M%S).sql

# 2. Pull latest code
git pull origin main

# 3. Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build

# 4. Run new migrations
docker-compose -f docker-compose.production.yml exec backend npm run db:migrate

# 5. Verify
docker-compose -f docker-compose.production.yml logs -f backend
```

---

## 📚 Documentation References

- **DOCKER_COMMANDS_REFERENCE.md** - Complete command reference
- **DEVELOPMENT_SETUP_COMPLETE.md** - Development setup details
- **MIGRATION_GUIDE.md** - Migration system guide
- **DOCKER_DEPLOYMENT_GUIDE.md** - Deployment guide

---

## 🎯 Success Criteria

After deployment, verify:
- [ ] All 4 services running (postgres, redis, backend, frontend)
- [ ] 108 tables created in database
- [ ] PostGIS and UUID extensions installed
- [ ] Admin user can login
- [ ] Frontend accessible at http://38.242.224.199:5173
- [ ] Backend API responding at http://38.242.224.199:3005
- [ ] No errors in logs
- [ ] Database migrations completed

---

## 🔐 Security Notes

1. **Change admin password** immediately after first login
2. **Update JWT secrets** in .env with strong random values
3. **Enable firewall** on server (allow only necessary ports)
4. **Regular backups** - Set up automated daily backups
5. **Monitor logs** for suspicious activity
6. **Keep Docker images updated** regularly

---

## 📞 Support

If you encounter issues:
1. Check logs: `docker-compose -f docker-compose.production.yml logs -f`
2. Check service status: `docker-compose -f docker-compose.production.yml ps`
3. Review troubleshooting section above
4. Check DOCKER_COMMANDS_REFERENCE.md for specific commands

---

## ✅ Ready to Deploy!

Everything is prepared and tested. Follow the deployment steps above to deploy to production.

**Estimated deployment time**: 10-15 minutes

**Good luck! 🚀**
