# Quick Production Fix - Missing loadType Column

## The Problem
Your production database is missing the `loadType`, `equipmentType`, and other new columns because migrations haven't been run on the production server yet.

## The Solution

### Step 1: SSH into Your Production Server
```bash
ssh root@your-server-ip
```

### Step 2: Navigate to Backend Directory
```bash
cd /root/project/urutix/backend
```

### Step 3: Backup Database (IMPORTANT!)
```bash
# Create backup directory if it doesn't exist
mkdir -p /root/backups

# Backup the database
pg_dump -U postgres -d urutix -F c -b -v -f "/root/backups/urutix_backup_$(date +%Y%m%d_%H%M%S).dump"

# Verify backup was created
ls -lh /root/backups/
```

### Step 4: Pull Latest Code
```bash
cd /root/project/urutix

# Pull the latest code with fixed migrations
git pull origin main
```

### Step 5: Build and Run Migrations
```bash
cd backend

# Install dependencies (if needed)
npm install

# Build the TypeScript code
npm run build

# Run the migrations
npm run migration:run
```

### Step 6: Restart Application
```bash
# Restart PM2 processes
pm2 restart all

# Check status
pm2 status

# Monitor logs
pm2 logs --lines 50
```

## Verification

After running migrations, test by:
1. Creating a new load from the frontend
2. The error about missing `loadType` should be gone

## If Something Goes Wrong

### Rollback from Backup
```bash
# Stop application
pm2 stop all

# Drop database
psql -U postgres -c "DROP DATABASE urutix;"

# Recreate database
psql -U postgres -c "CREATE DATABASE urutix;"

# Restore from backup
pg_restore -U postgres -d urutix /root/backups/urutix_backup_YYYYMMDD_HHMMSS.dump

# Restart application
pm2 restart all
```

## Why This Happened

- Local database (urutix1 on port 5433) = Test database ✅ Has migrations
- Production database (on server) = Live database ❌ Needs migrations

Running migrations locally only updates your local test database, not production.

## Important Notes

1. **Always backup before running migrations in production**
2. The migrations are safe - they only ADD columns, don't delete data
3. Your local test database is separate from production
4. You need to run migrations on BOTH databases separately

## Quick Commands Reference

```bash
# Check migration status
npm run migration:show

# Run migrations
npm run migration:run

# Revert last migration (if needed)
npm run migration:revert

# View application logs
pm2 logs

# Restart application
pm2 restart all
```
