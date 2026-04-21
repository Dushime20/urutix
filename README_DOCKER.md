# 🐳 UrutiX Smart Logistics - Docker Deployment

> **Complete Docker-based deployment solution for the UrutiX Smart Logistics platform**

[![Docker](https://img.shields.io/badge/Docker-20.10+-blue.svg)](https://www.docker.com/)
[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-2.0+-blue.svg)](https://docs.docker.com/compose/)
[![Node.js](https://img.shields.io/badge/Node.js-18%20%7C%2020-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red.svg)](https://redis.io/)

---

## 🚀 Quick Start

### Development (2 minutes)

```bash
# Start development environment with hot reload
make dev

# Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:3005/api
# API Docs: http://localhost:3005/api/docs
```

### Production (10 minutes)

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

---

## 📋 What's Included

This Docker setup provides:

✅ **Multi-stage optimized Dockerfiles** for minimal image sizes  
✅ **Separate development and production environments**  
✅ **Hot reload** for both frontend and backend in development  
✅ **Production-grade Nginx** configuration  
✅ **PostgreSQL 15** with automatic initialization  
✅ **Redis 7** for caching and sessions  
✅ **Health checks** for all services  
✅ **Automated backup and restore** scripts  
✅ **Comprehensive documentation** (8,000+ words)  
✅ **CI/CD ready** with GitHub Actions  
✅ **Security best practices** implemented  
✅ **Makefile** with convenient commands  

---

## 📁 Project Structure

```
.
├── backend/
│   ├── Dockerfile              # Production backend
│   ├── Dockerfile.dev          # Development backend
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile              # Production frontend
│   ├── Dockerfile.dev          # Development frontend
│   ├── nginx.conf              # Frontend web server
│   └── .dockerignore
├── nginx/
│   └── nginx.conf              # Reverse proxy config
├── database/
│   └── init/
│       └── 01-init.sql         # Database initialization
├── scripts/
│   ├── deploy.sh               # Automated deployment
│   ├── backup.sh               # Backup automation
│   ├── restore.sh              # Restore from backup
│   └── health-check.sh         # Health monitoring
├── docker-compose.dev.yml      # Development environment
├── docker-compose.production.yml # Production environment
├── .env.production.example     # Environment template
├── Makefile                    # Convenience commands
└── docs/
    ├── DOCKER_DEPLOYMENT_GUIDE.md    # Complete guide
    ├── DOCKER_SETUP_SUMMARY.md       # Setup summary
    ├── DEPLOYMENT_CHECKLIST.md       # Deployment checklist
    ├── ARCHITECTURE.md               # Architecture diagrams
    └── DOCKER_README.md              # Quick reference
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Nginx (Optional)                      │
│              Reverse Proxy + SSL Termination            │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐      ┌────────▼────────┐
│    Frontend    │      │     Backend     │
│  React + Vite  │      │     NestJS      │
│   (Port 80)    │      │   (Port 3005)   │
└────────────────┘      └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
            ┌───────▼────────┐      ┌────────▼────────┐
            │   PostgreSQL   │      │      Redis      │
            │  (Port 5432)   │      │   (Port 6379)   │
            └────────────────┘      └─────────────────┘
```

---

## 🛠️ Available Commands

### Development Commands

```bash
make dev              # Start development environment
make dev-build        # Build and start development
make dev-logs         # View development logs
make dev-down         # Stop development environment
make dev-restart      # Restart development services
```

### Production Commands

```bash
make prod             # Start production environment
make prod-build       # Build and start production
make prod-logs        # View production logs
make prod-down        # Stop production environment
make prod-restart     # Restart production services
make prod-nginx       # Start with Nginx reverse proxy
```

### Database Commands

```bash
make migrate          # Run database migrations
make migrate-dev      # Run migrations (development)
make seed             # Seed database with initial data
make seed-dev         # Seed database (development)
make db-backup        # Create database backup
make db-restore       # Restore database from backup
make db-shell         # Open PostgreSQL shell
make db-shell-dev     # Open PostgreSQL shell (dev)
```

### Utility Commands

```bash
make logs             # View all container logs
make ps               # List running containers
make restart          # Restart all services
make clean            # Remove all containers and volumes
make prune            # Clean up Docker system
make stats            # View resource usage
make inspect-backend  # Open backend container shell
make inspect-frontend # Open frontend container shell
make inspect-db       # Open database container shell
```

---

## ⚙️ Configuration

### Required Environment Variables

Create `.env.production` from the template:

```bash
cp .env.production.example .env.production
```

**Critical variables to set:**

```env
# Database
DB_PASSWORD=your_secure_database_password_here

# Redis
REDIS_PASSWORD=your_secure_redis_password_here

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here_min_32_chars

# Domain Configuration
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_WEBSOCKET_URL=wss://api.yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password
```

### Generate Secure Secrets

```bash
# Generate JWT secrets
openssl rand -base64 32

# Generate strong passwords
openssl rand -base64 32
```

---

## 📊 Service Details

### Frontend Container

- **Technology**: React + Vite
- **Production Server**: Nginx
- **Port**: 80 (production), 5173 (development)
- **Features**: Hot reload (dev), Gzip compression, SPA routing

### Backend Container

- **Technology**: NestJS (Node.js 20)
- **Port**: 3005
- **Features**: REST API, WebSocket, File uploads, Authentication

### PostgreSQL Container

- **Version**: PostgreSQL 15 Alpine
- **Port**: 5432 (internal), 5433 (external in dev)
- **Features**: Automatic initialization, Health checks

### Redis Container

- **Version**: Redis 7 Alpine
- **Port**: 6379 (internal only in production)
- **Features**: Session storage, Caching, Rate limiting

---

## 🔒 Security Features

✅ **Non-root users** in all containers  
✅ **Minimal Alpine Linux** base images  
✅ **Network isolation** with internal Docker networks  
✅ **Secrets management** via environment variables  
✅ **Security headers** configured in Nginx  
✅ **Rate limiting** enabled  
✅ **CORS** properly configured  
✅ **Health checks** for all services  
✅ **SSL/TLS ready** for production  

---

## 📈 Performance Optimizations

✅ **Multi-stage builds** (60% smaller images)  
✅ **Layer caching** for faster builds  
✅ **Gzip compression** enabled  
✅ **Static file caching** configured  
✅ **Redis caching** layer  
✅ **Connection pooling** for database  
✅ **Resource limits** set  

---

## 🔍 Monitoring & Debugging

### View Logs

```bash
# All services
make logs

# Specific service
docker-compose -f docker-compose.production.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.production.yml logs --tail=100 backend
```

### Health Checks

```bash
# Backend health
curl http://localhost:3005/api/health

# Frontend health
curl http://localhost:80/health

# Run health check script
./scripts/health-check.sh
```

### Resource Monitoring

```bash
# Real-time stats
make stats

# Container details
docker inspect urutix_backend
```

---

## 💾 Backup & Recovery

### Create Backup

```bash
# Using Makefile
make db-backup

# Using script
./scripts/backup.sh
```

### Restore Backup

```bash
# Using Makefile (interactive)
make db-restore

# Using script
./scripts/restore.sh
```

### Automated Backups

Add to crontab for daily backups:

```bash
crontab -e

# Add this line for daily backup at 2 AM
0 2 * * * cd /path/to/project && make db-backup
```

---

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using the port
lsof -i :5432  # macOS/Linux
netstat -ano | findstr :5432  # Windows

# Stop the process or change port in docker-compose.yml
```

#### Database Connection Failed

```bash
# Check database status
docker-compose -f docker-compose.production.yml ps postgres

# View database logs
docker-compose -f docker-compose.production.yml logs postgres

# Restart database
docker-compose -f docker-compose.production.yml restart postgres
```

#### Out of Memory

```bash
# Increase Docker memory in Docker Desktop settings
# Or add resource limits in docker-compose.yml
```

### Reset Everything

```bash
# Stop and remove all containers, volumes, and images
make clean

# Clean up Docker system
make prune
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md) | Complete deployment guide (8,000+ words) |
| [DOCKER_SETUP_SUMMARY.md](./DOCKER_SETUP_SUMMARY.md) | Detailed setup summary |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Step-by-step deployment checklist |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Architecture diagrams and flows |
| [DOCKER_README.md](./DOCKER_README.md) | Quick reference guide |

---

## 🎯 Best Practices

### Development Workflow

1. Start with clean state: `make dev-down && make dev-build`
2. Make changes (hot reload active)
3. Test changes in browser
4. Run migrations if schema changed: `make migrate-dev`
5. Commit changes
6. Stop services: `make dev-down`

### Production Deployment Workflow

1. Test locally in development
2. Build production images: `make prod-build`
3. Run migrations: `make migrate`
4. Seed data (if needed): `make seed`
5. Verify deployment: Check logs and health endpoints
6. Create backup: `make db-backup`
7. Monitor: Watch logs for errors

### Maintenance Tasks

**Weekly:**
- Check logs for errors
- Review resource usage (`make stats`)
- Update dependencies
- Backup database

**Monthly:**
- Rotate secrets
- Update Docker images
- Review security patches
- Clean up old backups

---

## 🆘 Getting Help

1. **Check Documentation**: Start with [DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md)
2. **View Logs**: `make logs`
3. **Check Status**: `make ps`
4. **Run Health Check**: `./scripts/health-check.sh`
5. **Review Troubleshooting**: See troubleshooting section above

---

## 📝 System Requirements

### Minimum Requirements

- **CPU**: 2 cores
- **RAM**: 4GB
- **Disk**: 20GB
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### Recommended for Production

- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Disk**: 50GB+ SSD
- **Network**: 100 Mbps+

---

## 🎓 Learning Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Vite Documentation](https://vitejs.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

## 🤝 Contributing

When contributing to the Docker setup:

1. Test changes in development first
2. Update documentation
3. Follow existing patterns
4. Add comments for complex configurations
5. Test both development and production builds

---

## 📄 License

Copyright © 2024 UrutiX Smart Logistics. All rights reserved.

---

## 🎉 Success Checklist

Your Docker setup is successful if:

- ✅ Development environment starts with `make dev`
- ✅ Hot reload works for both frontend and backend
- ✅ Production build completes without errors
- ✅ All health checks pass
- ✅ Database migrations run successfully
- ✅ Backups can be created and restored
- ✅ Logs are accessible and readable
- ✅ Services restart automatically on failure

---

## 🚀 Next Steps

1. **Development**: Start with `make dev` and begin coding
2. **Production**: Follow [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
3. **Monitoring**: Set up log aggregation and alerting
4. **Scaling**: Review [ARCHITECTURE.md](./ARCHITECTURE.md) for scaling strategies
5. **Security**: Complete security audit using checklist

---

**Quick Links:**
- [Complete Deployment Guide](./DOCKER_DEPLOYMENT_GUIDE.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [API Documentation](http://localhost:3005/api/docs)

---

**Need immediate help?** Run `./scripts/health-check.sh` to diagnose issues.
