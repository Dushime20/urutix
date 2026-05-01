# Database Migration Guide

## Professional Production-Grade Migration System

This project uses a robust, automated migration system designed for enterprise production environments.

## Architecture

### Files Structure
```
backend/
├── data-source.js              # Production data source (compiled JS)
├── src/data-source.ts          # Development data source (TypeScript)
├── scripts/migrate.sh          # Professional migration runner
├── docker-entrypoint.sh        # Production entrypoint with auto-migration
└── migrations/                 # SQL migration files
```

## Quick Start

### Development
```bash
npm run migration:run
```

### Production (Docker)
```bash
docker-compose -f docker-compose.production.yml exec backend npm run migration:run:prod
```

## Migration Commands

| Command | Description | Environment |
|---------|-------------|-------------|
| `npm run migration:run` | Run migrations | Development |
| `npm run migration:run:prod` | Run migrations | Production |
| `npm run migration:revert` | Revert last migration | Development |
| `npm run migration:revert:prod` | Revert last migration | Production |
| `npm run migration:show` | Show migration status | Development |
| `npm run migration:show:prod` | Show migration status | Production |
| `npm run migration:check` | Check if migrations needed | Any |

## Automatic Migrations (Production)

The system supports automatic migrations on container startup.

### Enable Auto-Migration

In your `.env.production` file:
```env
AUTO_MIGRATE=true
FAIL_ON_MIGRATION_ERROR=true
```

### Behavior

- **AUTO_MIGRATE=true**: Runs migrations automatically when container starts
- **AUTO_MIGRATE=false**: Manual migration required (recommended for production)
- **FAIL_ON_MIGRATION_ERROR=true**: Container fails to start if migration fails
- **FAIL_ON_MIGRATION_ERROR=false**: Container starts even if migration fails (not recommended)

## Production Deployment Workflow

### Option 1: Manual Migration (Recommended)

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild containers
docker-compose -f docker-compose.production.yml build

# 3. Stop old containers
docker-compose -f docker-compose.production.yml down

# 4. Start new containers (without auto-migrate)
docker-compose -f docker-compose.production.yml up -d

# 5. Check migration status
docker-compose -f docker-compose.production.yml exec backend npm run migration:show:prod

# 6. Run migrations manually
docker-compose -f docker-compose.production.yml exec backend npm run migration:run:prod

# 7. Verify application health
docker-compose -f docker-compose.production.yml logs -f backend
```

### Option 2: Automatic Migration

```bash
# 1. Set AUTO_MIGRATE=true in .env.production

# 2. Deploy
docker-compose -f docker-compose.production.yml up -d --build

# Migrations run automatically on startup
```

## Migration Script Features

The `scripts/migrate.sh` script provides:

✅ **Environment Detection**: Automatically detects dev/prod environment  
✅ **Connection Validation**: Verifies database connectivity before running  
✅ **Error Handling**: Comprehensive error messages and exit codes  
✅ **Colored Output**: Easy-to-read console output  
✅ **Safety Checks**: Production confirmation for destructive operations  
✅ **Status Reporting**: Shows pending/completed migrations  

## Docker Entrypoint Features

The `docker-entrypoint.sh` provides:

✅ **Database Wait**: Waits for database to be ready before starting  
✅ **Auto-Migration**: Optional automatic migration on startup  
✅ **Health Checks**: Validates database connection  
✅ **Graceful Shutdown**: Proper signal handling  
✅ **Failure Modes**: Configurable behavior on migration failure  

## Troubleshooting

### Error: "Cannot find module '/app/src/data-source.ts'"

**Cause:** Using development command in production environment.

**Solution:**
```bash
# ❌ Wrong
docker-compose -f docker-compose.production.yml exec backend npm run migration:run

# ✅ Correct
docker-compose -f docker-compose.production.yml exec backend npm run migration:run:prod
```

### Migration Fails on Startup

**Check logs:**
```bash
docker-compose -f docker-compose.production.yml logs backend
```

**Run manually:**
```bash
# Set AUTO_MIGRATE=false in .env.production
docker-compose -f docker-compose.production.yml restart backend
docker-compose -f docker-compose.production.yml exec backend npm run migration:run:prod
```

### Database Connection Timeout

**Increase wait time** in `docker-entrypoint.sh`:
```bash
max_attempts=60  # Increase from 30
```

### Check Migration Status

```bash
docker-compose -f docker-compose.production.yml exec backend npm run migration:show:prod
```

## Best Practices

### ✅ DO

- Always backup database before running migrations in production
- Test migrations in staging environment first
- Use manual migrations for critical production deployments
- Review migration SQL before running
- Monitor application logs during migration
- Keep migrations idempotent (safe to run multiple times)

### ❌ DON'T

- Never use `synchronize: true` in production
- Don't run untested migrations in production
- Don't enable AUTO_MIGRATE without testing
- Don't skip database backups
- Don't mix development and production commands

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Database Migrations
  run: |
    docker-compose -f docker-compose.production.yml exec -T backend \
      npm run migration:run:prod
```

### GitLab CI Example

```yaml
migrate:
  script:
    - docker-compose -f docker-compose.production.yml exec -T backend
      npm run migration:run:prod
```

## Rollback Strategy

### Revert Last Migration

```bash
docker-compose -f docker-compose.production.yml exec backend npm run migration:revert:prod
```

### Restore from Backup

```bash
# Stop application
docker-compose -f docker-compose.production.yml down

# Restore database
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d urutix < backup.sql

# Restart application
docker-compose -f docker-compose.production.yml up -d
```

## Monitoring

### Check Migration Logs

```bash
docker-compose -f docker-compose.production.yml logs backend | grep MIGRATION
```

### Health Check

```bash
curl http://localhost:3005/api/health
```

## Support

For issues or questions:
1. Check logs: `docker-compose logs backend`
2. Verify environment variables
3. Check database connectivity
4. Review migration status

