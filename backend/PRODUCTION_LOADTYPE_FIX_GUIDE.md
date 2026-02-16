# Production LoadType Column Fix Guide

## Problem
Your production database is missing the `loadType` column in the `loads` table, causing cargo creation to fail with the error:
```
column "loadType" of relation "loads" does not exist
```

## Root Cause
The database migration that should have created this column either:
1. Wasn't run on production
2. Failed partially during execution
3. The column was accidentally dropped

## Solution

### Option 1: Quick Fix (Recommended)

1. **Upload the fix files to your production server:**
   - `fix-missing-loadtype-column.sql`
   - `fix-production-loadtype.ps1` (for Windows) or `fix-production-loadtype.sh` (for Linux)

2. **Run the appropriate script:**

   **For Windows/PowerShell:**
   ```powershell
   cd /path/to/your/backend
   .\fix-production-loadtype.ps1
   ```

   **For Linux/Bash:**
   ```bash
   cd /path/to/your/backend
   chmod +x fix-production-loadtype.sh
   ./fix-production-loadtype.sh
   ```

3. **Restart your application server** after the fix is applied.

### Option 2: Manual Database Fix

If you prefer to run the SQL manually:

1. **Connect to your production database:**
   ```bash
   psql -h your-db-host -p 5432 -U your-db-user -d your-db-name
   ```

2. **Run the fix SQL:**
   ```sql
   -- Create the enum type if it doesn't exist
   DO $$ BEGIN
       CREATE TYPE loads_loadtype_enum AS ENUM ('FTL', 'LTL', 'REEFER', 'FLATBED', 'TANKER', 'INTERMODAL', 'OTHER');
   EXCEPTION
       WHEN duplicate_object THEN null;
   END $$;

   -- Add the loadType column if it doesn't exist
   DO $$ BEGIN
       ALTER TABLE loads ADD COLUMN "loadType" loads_loadtype_enum NOT NULL DEFAULT 'FTL';
   EXCEPTION
       WHEN duplicate_column THEN 
           RAISE NOTICE 'Column loadType already exists in loads table.';
   END $$;

   -- Create index on loadType if it doesn't exist
   DO $$ BEGIN
       CREATE INDEX "IDX_a53c7fe240b4a67cce9053625e" ON "loads" ("loadType");
   EXCEPTION
       WHEN duplicate_table THEN 
           RAISE NOTICE 'Index on loadType already exists.';
   END $$;
   ```

3. **Verify the fix:**
   ```sql
   SELECT column_name, data_type, is_nullable, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'loads' AND column_name = 'loadType';
   ```

### Option 3: Re-run Migrations

If you want to ensure all migrations are properly applied:

1. **Check migration status:**
   ```bash
   cd /path/to/your/backend
   npm run migration:show
   ```

2. **Run pending migrations:**
   ```bash
   npm run migration:run
   ```

## Verification

After applying the fix, verify that:

1. **The column exists:**
   ```sql
   \d loads
   ```
   You should see `loadType` in the column list.

2. **Cargo creation works:**
   - Try creating a new cargo through your frontend
   - Check that no more "column does not exist" errors occur

3. **Existing data is preserved:**
   ```sql
   SELECT COUNT(*) FROM loads;
   ```

## Prevention

To prevent this issue in the future:

1. **Always run migrations on production** when deploying new versions
2. **Use a deployment script** that includes migration steps
3. **Monitor migration logs** for any failures
4. **Test database schema** in staging before production deployment

## Rollback (if needed)

If something goes wrong, you can remove the column:
```sql
ALTER TABLE loads DROP COLUMN IF EXISTS "loadType";
DROP TYPE IF EXISTS loads_loadtype_enum;
```

## Support

If you encounter any issues:
1. Check the application logs for detailed error messages
2. Verify database connectivity
3. Ensure you have proper database permissions
4. Contact your database administrator if needed

---

**Note:** This fix is safe to run multiple times - it includes checks to prevent duplicate operations.