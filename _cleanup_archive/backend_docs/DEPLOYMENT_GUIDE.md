# Complete Deployment Guide

## Overview
This guide ensures safe, consistent deployments with automatic database migrations and rollback capabilities.

---

## Quick Start

### For Production Deployment

```bash
# 1. Navigate to backend directory
cd /path/to/backend

# 2. Run the safe deployment script
npm run deploy:safe

# Or manually:
bash scripts/safe-deploy.sh
```

That's it! The script handles everything automatically.

---

## What Gets Automated

The deployment process now includes:

1. ✅ **Pre-deployment checks** - Validates environment before deploying
2. ✅ **Database backup** - Automatic backup before migrations
3. ✅ **Schema validation** - Ensures all required columns exist
4. ✅ **Migration execution** - Runs pending migrations safely
5. ✅ **Rollback capability** - Can revert if something goes wrong
6. ✅ **Health checks** - Verifies app is running correctly
7. ✅ **Log monitoring** - Checks for errors after deployment

---

## Available Scripts

### Migration Scripts

```bash
# Check if migrations are needed
npm run migration:check

# Show migration status
npm run migration:show

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Deployment Scripts

```bash
# Run pre-deployment checks only
npm run deploy:check

# Run migrations with backup
npm run deploy:migrate

# Full safe deployment (recommended)
npm run deploy:safe

# Quick production deployment
npm run deploy:prod
```

### Direct Script Access

```bash
# Pre-deployment checks
bash scripts/pre-deploy-check.sh

# Backup and migrate
bash scripts/backup-and-migrate.sh

# Full safe deployment
bash scripts/safe-deploy.sh
```

---

## Step-by-Step Manual Deployment

If you prefer to run each step manually:

### 1. Pre-Deployment Checks

```bash
cd backend
bash scripts/pre-deploy-check.sh
```

This checks:
- Environment variables are set
- Database connection works
- Dependencies are installed
- Build exists
- Disk space is sufficient

### 2. Backup Database

```bash
# Automatic backup with migration
bash scripts/backup-and-migrate.sh

# Or manual backup
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > backup.sql
```

### 3. Run Migrations

```bash
npm run migration:run
```

### 4. Verify Schema

```bash
npm run migration:check
```

### 5. Restart Application

```bash
# With PM2
pm2 restart ecosystem.config.js

# Or with systemd
sudo systemctl restart smartcargo-backend
```

### 6. Health Check

```bash
curl http://localhost:3000/health
```

---

## Fixing Current Production Issue

### Immediate Fix for Missing loadType Column

```bash
# 1. Upload fix files to production server
scp backend/fix-missing-loadtype-column.sql user@server:/path/to/backend/
scp backend/fix-production-loadtype.sh user@server:/path/to/backend/

# 2. SSH to production server
ssh user@server

# 3. Navigate to backend directory
cd /path/to/backend

# 4. Run the fix
bash fix-production-loadtype.sh

# 5. Restart application
pm2 restart ecosystem.config.js

# 6. Verify
curl http://localhost:3000/api/loads
```

---

## Environment Setup

### Required Environment Variables

Create or update `.env` file:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartcargo
DB_USER=postgres
DB_PASSWORD=your_password

# Application
NODE_ENV=production
PORT=3000
JWT_SECRET=your_jwt_secret

# Optional
HEALTH_CHECK_URL=http://localhost:3000/health
SKIP_BACKUP=false
AUTO_CONFIRM=false
AUTO_ROLLBACK=false
```

### Load Environment Variables

```bash
# In your deployment script
source .env
export $(cat .env | xargs)

# Or use dotenv
npm install -g dotenv-cli
dotenv -e .env npm run deploy:safe
```

---

## PM2 Configuration

The `ecosystem.config.js` now includes:

- **Pre-start migration check** - Validates schema before starting
- **Automatic restart** - Restarts on crashes
- **Memory limits** - Prevents memory leaks
- **Log rotation** - Manages log files

### PM2 Commands

```bash
# Start with ecosystem config
pm2 start ecosystem.config.js

# Restart with new code
pm2 restart ecosystem.config.js --update-env

# View logs
pm2 logs urutix-backend

# Monitor
pm2 monit

# Save configuration
pm2 save

# Setup startup script
pm2 startup
```

---

## Rollback Procedures

### Automatic Rollback

If migration fails, the script offers automatic rollback:

```bash
bash scripts/backup-and-migrate.sh
# If migration fails, it will prompt for rollback
```

### Manual Rollback

```bash
# Find latest rollback script
ls -t backups/rollback-*.sh | head -1

# Execute rollback
bash backups/rollback-20260205-143022.sh

# Or restore from backup manually
PGPASSWORD=$DB_PASSWORD pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
  --clean --if-exists backups/pre-migration-20260205-143022.sql
```

### Rollback Last Migration

```bash
npm run migration:revert
```

---

## Monitoring and Alerts

### Check Application Status

```bash
# PM2 status
pm2 status

# Application logs
pm2 logs urutix-backend --lines 100

# Error logs only
pm2 logs urutix-backend --err

# Database connections
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT count(*) FROM pg_stat_activity;"
```

### Health Endpoints

```bash
# Application health
curl http://localhost:3000/health

# Database health
curl http://localhost:3000/api/health/db

# API status
curl http://localhost:3000/api/auth/status
```

---

## Troubleshooting

### Migration Fails

**Problem:** Migration script fails with error

**Solution:**
```bash
# 1. Check error message
npm run migration:show

# 2. Check database connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT version();"

# 3. Check migration table
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 5;"

# 4. If stuck, manually fix and create new migration
npm run migration:generate -- src/migrations/FixIssue
```

### Schema Validation Fails

**Problem:** `migration:check` reports missing columns

**Solution:**
```bash
# 1. Identify missing columns
npm run migration:check

# 2. Check if migrations are pending
npm run migration:show

# 3. Run pending migrations
npm run migration:run

# 4. If no pending migrations, create fix migration
npm run migration:generate -- src/migrations/AddMissingColumns
```

### Application Won't Start

**Problem:** App crashes on startup

**Solution:**
```bash
# 1. Check logs
pm2 logs urutix-backend --lines 50

# 2. Check database connection
npm run migration:check

# 3. Try starting manually
cd backend
node dist/main.js

# 4. Check environment variables
printenv | grep DB_
```

### Backup Fails

**Problem:** Cannot create database backup

**Solution:**
```bash
# 1. Check disk space
df -h

# 2. Check database permissions
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT current_user;"

# 3. Test pg_dump manually
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME --version

# 4. Create backups directory
mkdir -p backups
chmod 755 backups
```

---

## Best Practices

### 1. Always Use Scripts

❌ **Don't:**
```bash
git pull
npm install
npm run build
pm2 restart all
```

✅ **Do:**
```bash
npm run deploy:safe
```

### 2. Test in Staging First

```bash
# Deploy to staging
ssh staging-server
cd /path/to/backend
npm run deploy:safe

# Test thoroughly
# Then deploy to production
```

### 3. Monitor After Deployment

```bash
# Watch logs for 5 minutes
pm2 logs urutix-backend

# Check error rate
pm2 logs urutix-backend --err | grep -i error | wc -l

# Test critical endpoints
curl http://localhost:3000/api/loads
curl http://localhost:3000/api/auth/status
```

### 4. Keep Backups

```bash
# Backups are automatically kept in backups/
# Last 10 backups are retained

# To keep more backups, edit scripts/backup-and-migrate.sh
# Change: KEEP_BACKUPS=10
```

### 5. Document Changes

```bash
# Create deployment log
echo "$(date): Deployed version X.Y.Z" >> deployment-history.log
git log --oneline -5 >> deployment-history.log
```

---

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Deploy to Server
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          SERVER_HOST: ${{ secrets.SERVER_HOST }}
          SERVER_USER: ${{ secrets.SERVER_USER }}
        run: |
          # Setup SSH
          mkdir -p ~/.ssh
          echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          
          # Deploy
          ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST << 'EOF'
            cd /path/to/backend
            git pull origin main
            npm run deploy:safe
          EOF
```

---

## Security Considerations

### 1. Protect Backups

```bash
# Encrypt backups
gpg --encrypt backups/backup.sql

# Secure backup directory
chmod 700 backups/
```

### 2. Secure Environment Variables

```bash
# Never commit .env files
echo ".env" >> .gitignore

# Use secrets management
# - AWS Secrets Manager
# - HashiCorp Vault
# - Environment variables in PM2
```

### 3. Database Credentials

```bash
# Use read-only user for checks
# Use migration user only for migrations
# Use app user for application
```

---

## Support

If you encounter issues:

1. Check logs: `pm2 logs urutix-backend`
2. Review deployment log: `cat logs/deployment-*.log`
3. Check database: `npm run migration:show`
4. Verify schema: `npm run migration:check`
5. Contact DevOps team with error details

---

## Summary

✅ **Automated deployment** with safety checks
✅ **Automatic backups** before migrations
✅ **Schema validation** prevents runtime errors
✅ **Rollback capability** for quick recovery
✅ **Health monitoring** ensures app is running
✅ **Comprehensive logging** for debugging

**Next Steps:**
1. Fix current production issue with provided scripts
2. Test deployment process in staging
3. Set up CI/CD pipeline
4. Train team on new procedures
5. Monitor for 2 weeks and adjust as needed
