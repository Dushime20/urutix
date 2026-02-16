# Server Fix Commands - Copy & Paste

## Current Situation
You're in: `/root/urutix/urutix/backend`
But the files are already in your repo!

## Step 1: Pull Latest Changes
```bash
cd /root/urutix/urutix
git pull origin dev
```

## Step 2: Verify Files Exist
```bash
ls -la backend/fix-*.sh
ls -la backend/fix-*.sql
ls -la backend/scripts/check-migrations.js
```

## Step 3: Make Scripts Executable
```bash
chmod +x backend/fix-production-loadtype.sh
chmod +x backend/scripts/*.sh
```

## Step 4: Run the Fix
```bash
cd backend
bash fix-production-loadtype.sh
```

## Step 5: Restart Application
```bash
# Go back to root directory where ecosystem.config.js is
cd /root/urutix/urutix
pm2 restart ecosystem.config.js
```

## Step 6: Verify Fix
```bash
# Check logs
pm2 logs urutix-backend --lines 20

# Test health endpoint
curl http://localhost:3000/health

# Test loads endpoint
curl http://localhost:3000/api/loads
```

---

## If Files Still Missing

If after `git pull` the files are still not there, run these commands:

```bash
cd /root/urutix/urutix

# Check current branch
git branch

# Make sure you're on dev branch
git checkout dev

# Pull latest
git pull origin dev

# Verify files
ls -la backend/fix-production-loadtype.sh
```

---

## Alternative: Manual SQL Fix

If the script still doesn't work, run the SQL directly:

```bash
# Connect to database
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

# Then run this SQL:
```

```sql
-- Create enum type if not exists
DO $$ BEGIN
    CREATE TYPE loads_loadtype_enum AS ENUM ('FTL', 'LTL', 'REEFER', 'FLATBED', 'TANKER', 'INTERMODAL', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add loadType column if not exists
DO $$ BEGIN
    ALTER TABLE loads ADD COLUMN "loadType" loads_loadtype_enum NOT NULL DEFAULT 'FTL';
EXCEPTION
    WHEN duplicate_column THEN 
        RAISE NOTICE 'Column loadType already exists in loads table.';
END $$;

-- Create index
DO $$ BEGIN
    CREATE INDEX "IDX_a53c7fe240b4a67cce9053625e" ON "loads" ("loadType");
EXCEPTION
    WHEN duplicate_table THEN 
        RAISE NOTICE 'Index on loadType already exists.';
END $$;

-- Verify
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'loads' AND column_name = 'loadType';
```

```bash
# Exit psql
\q

# Restart application
cd /root/urutix/urutix
pm2 restart ecosystem.config.js
```

---

## Quick One-Liner Fix

If you just want to fix it quickly without the script:

```bash
cd /root/urutix/urutix/backend && \
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
DO $$ BEGIN
    CREATE TYPE loads_loadtype_enum AS ENUM ('FTL', 'LTL', 'REEFER', 'FLATBED', 'TANKER', 'INTERMODAL', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE loads ADD COLUMN "loadType" loads_loadtype_enum NOT NULL DEFAULT 'FTL';
EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'Column exists';
END $$;

DO $$ BEGIN
    CREATE INDEX "IDX_a53c7fe240b4a67cce9053625e" ON "loads" ("loadType");
EXCEPTION WHEN duplicate_table THEN RAISE NOTICE 'Index exists';
END $$;
EOF
cd /root/urutix/urutix && pm2 restart ecosystem.config.js
```

---

## Troubleshooting

### Error: "File not found"
**Solution:** You're in the wrong directory. Use full paths:
```bash
bash /root/urutix/urutix/backend/fix-production-loadtype.sh
```

### Error: "Permission denied"
**Solution:** Make script executable:
```bash
chmod +x /root/urutix/urutix/backend/fix-production-loadtype.sh
```

### Error: "ecosystem.config.js not found"
**Solution:** The file is in the root directory:
```bash
cd /root/urutix/urutix
pm2 restart ecosystem.config.js
```

### Error: "Database connection failed"
**Solution:** Check environment variables:
```bash
echo $DB_HOST
echo $DB_NAME
echo $DB_USER
# If empty, load from .env:
cd /root/urutix/urutix/backend
source .env
export $(cat .env | xargs)
```

---

## After Fix is Applied

1. **Test cargo creation** through your frontend
2. **Check logs** for any errors: `pm2 logs urutix-backend`
3. **Monitor** for 5-10 minutes to ensure stability
4. **Notify team** that issue is resolved

---

**Need Help?** 
- Check logs: `pm2 logs urutix-backend --lines 50`
- Check database: `psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\d loads"`
- Check app status: `pm2 status`
