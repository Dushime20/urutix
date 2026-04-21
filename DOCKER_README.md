# 🐳 Docker Deployment - Quick Reference

## 📋 Quick Commands

### Development
```bash
make dev              # Start development environment
make dev-logs         # View logs
make dev-down         # Stop development
```

### Production
```bash
make prod-build       # Build and start production
make prod-logs        # View logs
make prod-down        # Stop production
```

### Database
```bash
make migrate          # Run migrations
make db-backup        # Backup database
make db-restore       # Restore database
```

## 🚀 Quick Start

### 1. Development Setup (5 minutes)
```bash
# Start everything
make dev

# Access:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:3005/api
# - API Docs: http://localhost:3005/api/docs
```

### 2. Production Deployment (10 minutes)
```bash
# 1. Configure environment
cp .env.production.example .env.production
nano .env.production

# 2. Deploy
make prod-build

# 3. Run migrations
make migrate

# 4. Verify
curl http://localhost:3005/api/health
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `docker-compose.dev.yml` | Development environment |
| `docker-compose.production.yml` | Production environment |
| `.env.production` | Production configuration |
| `Makefile` | Convenience commands |
| `DOCKER_DEPLOYMENT_GUIDE.md` | Full documentation |

## 🔧 Configuration

### Required Environment Variables

```env
# Database
DB_PASSWORD=your_secure_password

# Redis
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# URLs
VITE_API_BASE_URL=https://api.yourdomain.com/api
ALLOWED_ORIGINS=https://yourdomain.com
```

Generate secrets:
```bash
openssl rand -base64 32
```

## 🏗️ Architecture

```
┌─────────────┐      ┌─────────────┐
│  Frontend   │      │   Backend   │
│ React+Vite  │◄────►│   NestJS    │
│  (Port 80)  │      │ (Port 3005) │
└─────────────┘      └──────┬──────┘
                            │
                   ┌────────┴────────┐
                   │                 │
            ┌──────▼──────┐   ┌─────▼─────┐
            │ PostgreSQL  │   │   Redis   │
            │ (Port 5432) │   │(Port 6379)│
            └─────────────┘   └───────────┘
```

## 🛠️ Common Tasks

### View Logs
```bash
# All services
make logs

# Specific service
docker-compose -f docker-compose.production.yml logs -f backend
```

### Restart Services
```bash
make restart
```

### Database Operations
```bash
# Backup
make db-backup

# Restore
make db-restore

# Shell access
make db-shell
```

### Container Shell Access
```bash
# Backend
docker-compose -f docker-compose.production.yml exec backend sh

# Frontend
docker-compose -f docker-compose.production.yml exec frontend sh
```

## 🔍 Troubleshooting

### Port Already in Use
```bash
# Find and stop conflicting process
lsof -i :5432  # macOS/Linux
netstat -ano | findstr :5432  # Windows
```

### Database Connection Failed
```bash
# Check database status
docker-compose -f docker-compose.production.yml ps postgres

# View database logs
docker-compose -f docker-compose.production.yml logs postgres
```

### Reset Everything
```bash
# Stop and remove all containers
make clean

# Clean Docker system
make prune
```

## 📊 Monitoring

### Health Checks
```bash
# Backend
curl http://localhost:3005/api/health

# Frontend
curl http://localhost:80/health

# Database
docker-compose -f docker-compose.production.yml exec postgres \
  pg_isready -U postgres -d urutix
```

### Resource Usage
```bash
make stats
```

## 🔒 Security Checklist

- [ ] Strong passwords set (32+ characters)
- [ ] JWT secrets generated
- [ ] CORS origins configured
- [ ] SSL certificates installed (production)
- [ ] Firewall rules configured
- [ ] Database not publicly accessible
- [ ] Regular backups scheduled

## 📚 Documentation

- **Full Guide**: [DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md)
- **Deployment Checklist**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **API Docs**: http://localhost:3005/api/docs

## 🆘 Need Help?

1. Check [DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md)
2. View logs: `make logs`
3. Check container status: `make ps`
4. Run health check: `./scripts/health-check.sh`

## 📝 Scripts

| Script | Purpose |
|--------|---------|
| `scripts/deploy.sh` | Automated deployment |
| `scripts/backup.sh` | Backup database and files |
| `scripts/restore.sh` | Restore from backup |
| `scripts/health-check.sh` | Check service health |

## 🎯 Best Practices

1. **Always backup before deployment**
   ```bash
   make db-backup
   ```

2. **Test in development first**
   ```bash
   make dev
   ```

3. **Monitor logs after deployment**
   ```bash
   make prod-logs
   ```

4. **Regular backups**
   ```bash
   # Add to crontab
   0 2 * * * cd /path/to/project && make db-backup
   ```

5. **Keep secrets secure**
   - Never commit `.env` files
   - Use strong passwords
   - Rotate secrets regularly

---

**Quick Links:**
- [Full Documentation](./DOCKER_DEPLOYMENT_GUIDE.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Makefile Commands](./Makefile)
