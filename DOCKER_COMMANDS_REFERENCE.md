# Docker Commands Reference - Development & Production

Complete command reference for managing UrutiX Smart Logistics in both development and production environments.

---

## Table of Contents
- [Development Commands](#development-commands)
- [Production Commands](#production-commands)
- [Database Commands](#database-commandsc)
- [Migration Commands](#migration-commands)
- [Troubleshooting Commands](#troubleshooting-commands)
- [Maintenance Commands](#maintenance-commands)

---

## Development Commands

### Starting Development Environment

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d --build

# Start with rebuild (after code changes)


# Start and view logs
docker-compose -f docker-compose.dev.yml up

# Start specific service
docker-compose -f docker-compose.dev.yml up -d backend
docker-compose -f docker-compose.dev.yml up -d frontend
```

### Stopping Development Environment

```bash
# Stop all services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (fresh start)
docker-compose -f docker-compose.dev.yml down -v

# Stop specific service
docker-compose -f docker-compose.dev.yml stop backend
docker-compose -f docker-compose.dev.yml stop frontend
```

### Viewing Development Logs

```bash
# View all logs
docker-compose -f docker-compose.dev.yml logs -f

# View specific service logs
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f frontend
docker-compose -f docker-compose.dev.yml logs -f postgres
docker-compose -f docker-compose.dev.yml logs -f redis

# View last 100 lines
docker-compose -f docker-compose.dev.yml logs --tail=100 backend

# View logs without following
docker-compose -f docker-compose.dev.yml logs backend
```

### Development Service Status

```bash
# Check all services status
docker-compose -f docker-compose.dev.yml ps

# Check specific service
docker-compose -f docker-compose.dev.yml ps backend
```

### Restarting Development Services

```bash
# Restart all services
docker-compose -f docker-compose.dev.yml restart

# Restart specific service
docker-compose -f docker-compose.dev.yml restart backend
docker-compose -f docker-compose.dev.yml restart frontend
docker-compose -f docker-compose.dev.yml restart postgres
```

### Executing Commands in Development Containers

# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Check status
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f

```bash
# Backend commands
docker-compose -f docker-compose.dev.yml exec backend npm run db:migrate
docker-compose -f docker-compose.dev.yml exec backend npm run seed:admin
docker-compose -f docker-compose.dev.yml exec backend npm run build
docker-compose -f docker-compose.dev.yml exec backend bash

# Frontend commands
docker-compose -f docker-compose.dev.yml exec frontend npm run build
docker-compose -f docker-compose.dev.yml exec frontend bash

# Database commands
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d urutix
docker-compose -f docker-compose.dev.yml exec postgres bash
```

---

## Production Commands

### Starting Production Environment

```bash
# On server (38.242.224.199)
cd urutix-smart-logistics

# Start all services
docker-compose -f docker-compose.production.yml up -d

# Start with rebuild (after deployment)
docker-compose -f docker-compose.production.yml up -d --build



# Start specific service
docker-compose -f docker-compose.production.yml up -d backend
docker-compose -f docker-compose.production.yml up -d frontend
```

### Stopping Production Environment

```bash
# Stop all services
docker-compose -f docker-compose.production.yml down

# Stop without removing containers (for quick restart)
docker-compose -f docker-compose.production.yml stop

# Stop specific service
docker-compose -f docker-compose.production.yml stop backend
docker-compose -f docker-compose.production.yml stop frontend
```

### Viewing Production Logs

```bash
# View all logs
docker-compose -f docker-compose.production.yml logs -f

# View specific service logs
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f frontend
docker-compose -f docker-compose.production.yml logs -f postgres
docker-compose -f docker-compose.production.yml logs -f redis

# View last 100 lines
docker-compose -f docker-compose.production.yml logs --tail=100 backend

# View logs from last hour
docker-compose -f docker-compose.production.yml logs --since 1h backend

# Save logs to file
docker-compose -f docker-compose.production.yml logs backend > backend-logs.txt
```

### Production Service Status

```bash
# Check all services status
docker-compose -f docker-compose.production.yml ps

# Check resource usage
docker stats

# Check specific container
docker stats urutix_backend
```

### Restarting Production Services

```bash
# Restart all services
docker-compose -f docker-compose.production.yml restart

# Restart specific service (zero-downtime for stateless services)
docker-compose -f docker-compose.production.yml restart backend
docker-compose -f docker-compose.production.yml restart frontend

# Graceful restart with rebuild
docker-compose -f docker-compose.production.yml up -d --build --no-deps backend
```

### Executing Commands in Production Containers

```bash
# Backend commands
docker-compose -f docker-compose.production.yml exec backend npm run db:migrate
docker-compose -f docker-compose.production.yml exec backend npm run seed:admin
docker-compose -f docker-compose.production.yml exec backend node --version
docker-compose -f docker-compose.production.yml exec backend bash

# Frontend commands
docker-compose -f docker-compose.production.yml exec frontend bash

# Database commands
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix
docker-compose -f docker-compose.production.yml exec postgres bash
```

---

## Database Commands

### Development Database

```bash
# Connect to database
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d urutix

# Run SQL query
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d urutix -c "SELECT COUNT(*) FROM users;"

# List all tables
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d urutix -c "\dt"

# Check table structure
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d urutix -c "\d users"

# Check database size
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d urutix -c "SELECT pg_size_pretty(pg_database_size('urutix'));"

# Backup database
docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U postgres urutix > backup-dev-$(date +%Y%m%d).sql

# Restore database
cat backup-dev-20260502.sql | docker-compose -f docker-compose.dev.yml exec -T postgres psql -U postgres -d urutix
```

### Production Database

```bash
# Connect to database
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix

# Run SQL query
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix -c "SELECT COUNT(*) FROM users;"

# List all tables
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix -c "\dt"

# Check database size
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix -c "SELECT pg_size_pretty(pg_database_size('urutix'));"

# Backup database (IMPORTANT!)
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U postgres urutix > backup-prod-$(date +%Y%m%d-%H%M%S).sql

# Backup with compression
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U postgres urutix | gzip > backup-prod-$(date +%Y%m%d-%H%M%S).sql.gz

# Restore database
cat backup-prod-20260502.sql | docker-compose -f docker-compose.production.yml exec -T postgres psql -U postgres -d urutix

# Restore from compressed backup
gunzip -c backup-prod-20260502.sql.gz | docker-compose -f docker-compose.production.yml exec -T postgres psql -U postgres -d urutix
```

### Database Extensions

```bash
# Check installed extensions (Development)
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d urutix -c "SELECT extname, extversion FROM pg_extension;"

# Check installed extensions (Production)
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix -c "SELECT extname, extversion FROM pg_extension;"

# Install PostGIS (if not already installed)
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Install UUID extension
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

---

## Migration Commands

### Development Migrations

```bash
# Check migration status
docker-compose -f docker-compose.dev.yml exec backend npm run db:migrate:status

# Run pending migrations
docker-compose -f docker-compose.dev.yml exec backend npm run db:migrate

# Create new migration
docker-compose -f docker-compose.dev.yml exec backend npm run migrations:create add_new_feature

# Force run all migrations (use with caution)
docker-compose -f docker-compose.dev.yml exec backend npm run migrations:force

# Mark existing migrations as done (one-time setup)
docker-compose -f docker-compose.dev.yml exec backend node mark-migrations-done.js
```

### Production Migrations

```bash
# ALWAYS backup database before running migrations!
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U postgres urutix > backup-before-migration-$(date +%Y%m%d-%H%M%S).sql

# Check migration status
docker-compose -f docker-compose.production.yml exec backend npm run db:migrate:status

# Run pending migrations
docker-compose -f docker-compose.production.yml exec backend npm run db:migrate

# Verify migrations completed successfully
docker-compose -f docker-compose.production.yml exec backend npm run db:migrate:status

# Check backend logs after migration
docker-compose -f docker-compose.production.yml logs backend --tail=100
```

### Seed Data Commands

```bash
# Development - Seed admin user
docker-compose -f docker-compose.dev.yml exec backend npm run seed:admin

# Production - Seed admin user
docker-compose -f docker-compose.production.yml exec backend npm run seed:admin

# Other seed commands (if available)
docker-compose -f docker-compose.dev.yml exec backend npm run seed:all
docker-compose -f docker-compose.dev.yml exec backend npm run seed:companies
```

---

## Troubleshooting Commands

### Check Container Health

```bash
# Development
docker-compose -f docker-compose.dev.yml ps
docker inspect urutix_backend_dev | grep -A 10 Health
docker inspect urutix_db_dev | grep -A 10 Health

# Production
docker-compose -f docker-compose.production.yml ps
docker inspect urutix_backend | grep -A 10 Health
docker inspect urutix_postgres | grep -A 10 Health
```

### Check Container Resources

```bash
# Real-time resource usage
docker stats

# Specific container
docker stats urutix_backend

# Check disk usage
docker system df

# Check volume usage
docker volume ls
docker volume inspect urutix_postgres_data_dev
```

### Network Troubleshooting

```bash
# List networks
docker network ls

# Inspect network
docker network inspect urutix_urutix_network_dev
docker network inspect urutix_urutix_network

# Test connectivity from backend to database (Development)
docker-compose -f docker-compose.dev.yml exec backend ping postgres

# Test connectivity from backend to database (Production)
docker-compose -f docker-compose.production.yml exec backend ping postgres

# Check open ports
docker-compose -f docker-compose.dev.yml exec backend netstat -tuln
```

### View Container Details

```bash
# Inspect container
docker inspect urutix_backend_dev

# View container processes
docker top urutix_backend_dev

# View container filesystem
docker-compose -f docker-compose.dev.yml exec backend ls -la /app
docker-compose -f docker-compose.dev.yml exec backend du -sh /app/*
```

### Debug Container Issues

```bash
# Enter container shell
docker-compose -f docker-compose.dev.yml exec backend bash
docker-compose -f docker-compose.dev.yml exec frontend sh

# Check environment variables
docker-compose -f docker-compose.dev.yml exec backend env

# Check Node.js version
docker-compose -f docker-compose.dev.yml exec backend node --version

# Check npm packages
docker-compose -f docker-compose.dev.yml exec backend npm list --depth=0

# Test database connection
docker-compose -f docker-compose.dev.yml exec backend node -e "const { Client } = require('pg'); const client = new Client({host: 'postgres', port: 5432, user: 'postgres', password: '1234', database: 'urutix'}); client.connect().then(() => console.log('Connected!')).catch(err => console.error(err));"
```

---

## Maintenance Commands

### Cleanup Commands

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes (CAUTION: This deletes data!)
docker volume prune

# Remove everything unused (CAUTION!)
docker system prune -a

# Remove specific volume (CAUTION: This deletes data!)
docker volume rm urutix_postgres_data_dev
```

### Update Commands

```bash
# Pull latest images
docker-compose -f docker-compose.production.yml pull

# Rebuild specific service
docker-compose -f docker-compose.production.yml build backend
docker-compose -f docker-compose.production.yml build frontend

# Rebuild without cache
docker-compose -f docker-compose.production.yml build --no-cache backend

# Update and restart
docker-compose -f docker-compose.production.yml up -d --build
```

### Backup Commands

```bash
# Backup database (Development)
docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U postgres urutix > backup-dev-$(date +%Y%m%d).sql

# Backup database (Production)
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U postgres urutix > backup-prod-$(date +%Y%m%d-%H%M%S).sql

# Backup volumes (Production)
docker run --rm -v urutix_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-data-$(date +%Y%m%d).tar.gz /data

# Backup uploads directory
docker run --rm -v urutix_backend_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-$(date +%Y%m%d).tar.gz /data
```

### Monitoring Commands

```bash
# Watch logs in real-time
docker-compose -f docker-compose.production.yml logs -f backend | grep ERROR

# Monitor resource usage
watch -n 1 docker stats

# Check container uptime
docker ps --format "table {{.Names}}\t{{.Status}}"

# Check last restart time
docker inspect urutix_backend | grep StartedAt
```

---

## Quick Reference

### Development Quick Start
```bash
cd ~/urutix-smart-logistics
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml logs -f
```

### Production Quick Start
```bash
cd ~/urutix-smart-logistics
git pull origin main

docker-compose -f docker-compose.production.yml exec backend npm run db:migrate
docker-compose -f docker-compose.production.yml logs -f backend
```

### Emergency Stop (Production)
```bash
docker-compose -f docker-compose.production.yml stop
```

### Emergency Restart (Production)
```bash
docker-compose -f docker-compose.production.yml restart backend
docker-compose -f docker-compose.production.yml logs -f backend
```

### Database Emergency Backup (Production)
```bash
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U postgres urutix | gzip > emergency-backup-$(date +%Y%m%d-%H%M%S).sql.gz
```

---

## Environment-Specific Ports

### Development
- Frontend: http://localhost:5173
- Backend: http://localhost:3005
- Database: localhost:5433
- Redis: localhost:6379

### Production (Server: 38.242.224.199)
- Frontend: http://38.242.224.199:5173
- Backend: http://38.242.224.199:3005
- Database: 38.242.224.199:5436 (external)
- Redis: 38.242.224.199:6379

---

## Common Workflows

### Deploy New Code to Production
```bash
# 1. Backup database
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U postgres urutix > backup-$(date +%Y%m%d-%H%M%S).sql

# 2. Pull latest code
git pull origin main

# 3. Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build

# 4. Run migrations
docker-compose -f docker-compose.production.yml exec backend npm run db:migrate:status
docker-compose -f docker-compose.production.yml exec backend npm run db:migrate

# 5. Check logs
docker-compose -f docker-compose.production.yml logs -f backend
```

### Fresh Development Setup
```bash
# 1. Stop and remove everything
docker-compose -f docker-compose.dev.yml down -v

# 2. Start fresh
docker-compose -f docker-compose.dev.yml up -d

# 3. Wait for database to be ready
docker-compose -f docker-compose.dev.yml logs -f postgres

# 4. Run migrations (if needed)
docker-compose -f docker-compose.dev.yml exec backend npm run db:migrate

# 5. Seed admin user
docker-compose -f docker-compose.dev.yml exec backend npm run seed:admin
```

### Investigate Production Issue
```bash
# 1. Check service status
docker-compose -f docker-compose.production.yml ps

# 2. Check recent logs
docker-compose -f docker-compose.production.yml logs --tail=200 backend

# 3. Check resource usage
docker stats

# 4. Check database connections
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix -c "SELECT count(*) FROM pg_stat_activity;"

# 5. Enter container for debugging
docker-compose -f docker-compose.production.yml exec backend bash
```

---

## Notes

- Always backup database before running migrations in production
- Use `-f` flag to follow logs in real-time
- Use `--tail=N` to limit log output
- Use `-d` flag to run containers in detached mode
- Production commands should be run on the server (38.242.224.199)
- Development commands should be run on your local machine

---

## Support

For issues:
1. Check logs: `docker-compose -f docker-compose.production.yml logs -f`
2. Check status: `docker-compose -f docker-compose.production.yml ps`
3. Check this reference guide for relevant commands
