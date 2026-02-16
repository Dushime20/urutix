# Production Migration Guide

## ⚠️ CRITICAL: Read This Before Running Migrations

This guide will help you safely run the database migrations on your production server to fix the missing `equipmentType` column error and add all new features.

---

## Pre-Migration Checklist

### 1. **Backup Your Production Database** (MANDATORY)

```bash
# SSH into your production server
ssh root@your-server-ip

# Navigate to your project directory
cd /root/urutix/urutix/backend

# Create a backup of your production database
pg_dump -U postgres -d urutix -F c -b -v -f "/root/backups/urutix_backup_$(date +%Y%m%d_%H%M%S).dump"

# Verify the backup was created
ls -lh /root/backups/
```

**Alternative: Using the backup script**
```bash
cd /root/urutix/urutix/backend
bash scripts/backup-and-migrate.sh --backup-only
```

### 2. **Check Current Migration Status**

```bash
cd /root/urutix/urutix/backend
npm run migration:show
```

This will show you which migrations have already been run.

---

## Migration Steps

### Option 1: Automated Safe Migration (RECOMMENDED)

This uses the built-in safe deployment script:

```bash
cd /root/urutix/urutix/backend

# Run the safe deployment script (includes backup + migration)
npm run deploy:safe
```

This script will:
1. ✅ Create a database backup
2. ✅ Run pending migrations
3. ✅ Verify the migrations succeeded
4. ✅ Restart the application

---

### Option 2: Manual Step-by-Step Migration

If you prefer more control:

#### Step 1: Stop the Application
```bash
# Stop PM2 processes
pm2 stop all

# Verify they're stopped
pm2 status
```

#### Step 2: Pull Latest Code
```bash
cd /root/urutix/urutix

# Pull the latest changes (with the migration fixes)
git pull origin main

# Navigate to backend
cd backend

# Install dependencies (if needed)
npm install
```

#### Step 3: Build the Application
```bash
# Build the TypeScript code
npm run build
```

#### Step 4: Run Migrations
```bash
# Run the migrations
npm run migration:run

# Or use the Linux-specific command
npm run migration:run:linux
```

#### Step 5: Verify Migrations
```bash
# Check that all migrations ran successfully
npm run migration:show

# You should see all migrations marked as "executed"
```

#### Step 6: Restart the Application
```bash
# Restart PM2 processes
pm2 restart all

# Check status
pm2 status

# Monitor logs for any errors
pm2 logs --lines 50
```

---

## Verification Steps

After running migrations, verify everything is working:

### 1. Check Application Health
```bash
# Check if the backend is responding
curl http://localhost:3000/api/health

# Should return: {"status":"ok"}
```

### 2. Check Database Schema
```bash
# Connect to PostgreSQL
psql -U postgres -d urutix

# Check if equipmentType column exists
\d loads

# You should see equipmentType in the column list
# Type \q to exit psql
```

### 3. Test Load Creation
Try creating a load from the frontend. The error about missing `equipmentType` should be gone.

---

## Rollback Plan (If Something Goes Wrong)

If migrations fail or cause issues:

### Option 1: Revert Last Migration
```bash
cd /root/urutix/urutix/backend
npm run migration:revert
```

### Option 2: Restore from Backup
```bash
# Stop the application
pm2 stop all

# Drop the current database (CAREFUL!)
psql -U postgres -c "DROP DATABASE urutix;"

# Recreate the database
psql -U postgres -c "CREATE DATABASE urutix;"

# Restore from backup
pg_restore -U postgres -d urutix /root/backups/urutix_backup_YYYYMMDD_HHMMSS.dump

# Restart the application
pm2 restart all
```

---

## Common Issues and Solutions

### Issue 1: "Migration already exists"
**Solution:** The migration has already been run. Check with `npm run migration:show`

### Issue 2: "Syntax error in migration"
**Solution:** Make sure you pulled the latest code with the fixed migrations

### Issue 3: "Cannot connect to database"
**Solution:** 
```bash
# Check if PostgreSQL is running
systemctl status postgresql

# Start it if needed
systemctl start postgresql
```

### Issue 4: "Permission denied"
**Solution:**
```bash
# Make sure you're running as root or have sudo access
sudo su -
```

---

## Post-Migration Monitoring

After successful migration:

```bash
# Monitor application logs
pm2 logs --lines 100

# Check for any errors
pm2 logs --err

# Monitor database connections
psql -U postgres -d urutix -c "SELECT count(*) FROM pg_stat_activity WHERE datname='urutix';"
```

---

## Quick Reference Commands

```bash
# Backup database
pg_dump -U postgres -d urutix -F c -f backup.dump

# Show migration status
npm run migration:show

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Restart application
pm2 restart all

# View logs
pm2 logs

# Check application status
pm2 status
```

---

## Support

If you encounter any issues:

1. Check the PM2 logs: `pm2 logs`
2. Check PostgreSQL logs: `tail -f /var/log/postgresql/postgresql-*.log`
3. Verify database connection in `.env` file
4. Ensure all environment variables are set correctly

---

## Summary of What These Migrations Do

The migrations will:
- ✅ Add `equipmentType` column to `loads` table
- ✅ Add `cargoType` column to `loads` table
- ✅ Add broker-related columns (`brokerId`, `brokerCommissionRate`, `brokerCommissionAmount`)
- ✅ Create broker commission tables
- ✅ Create load documents tables
- ✅ Create insurance verification tables
- ✅ Add BROKER role to users enum
- ✅ Update safety tables (if they exist)
- ✅ Add various indexes for performance

All of these changes are **additive** - they don't delete or modify existing data, only add new columns and tables.

---

**Remember:** Always backup before running migrations in production! 🔒
