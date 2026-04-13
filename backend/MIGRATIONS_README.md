# Database Migrations Guide

Complete guide for managing database migrations in the project.

## 🎯 Overview

This project uses a custom SQL-based migration system that:
- ✅ Tracks migration execution automatically
- ✅ Prevents duplicate migrations
- ✅ Provides rollback capabilities
- ✅ Ensures team collaboration without conflicts
- ✅ Maintains migration history in git

## 📁 File Structure

```
backend/
├── migrations/                          # Migration files directory
│   ├── 001_add_lending_tables.sql      # Migration files
│   ├── 001_add_lending_tables_rollback.sql  # Rollback files
│   ├── 002_enhance_lending_schema.sql
│   └── MIGRATIONS_TRACKER.md           # Migration tracker (commit to git)
├── run-all-migrations.js               # Main migration runner
├── create-migration.js                 # Migration creator helper
└── MIGRATIONS_README.md                # This file
```

## 🚀 Quick Start

### 1. Run All Pending Migrations

```bash
cd backend
node run-all-migrations.js
```

This will:
- Connect to your database
- Create migration tracking table if needed
- Run all pending migrations in order
- Skip already executed migrations
- Show detailed summary

### 2. Check Migration Status

```bash
node run-all-migrations.js --status
```

Shows:
- Total migrations
- Executed migrations
- Pending migrations
- Detailed status for each migration

### 3. Create a New Migration

```bash
node create-migration.js "add user preferences table"
```

This will:
- Generate migration file with next number
- Create rollback file
- Update MIGRATIONS_TRACKER.md
- Provide template with comments

## 📝 Creating Migrations

### Method 1: Using the Helper Script (Recommended)

```bash
node create-migration.js "your migration description"
```

Example:
```bash
node create-migration.js "add email verification to users"
```

This creates:
- `037_add_email_verification_to_users.sql`
- `037_add_email_verification_to_users_rollback.sql`
- Updates `MIGRATIONS_TRACKER.md`

### Method 2: Manual Creation

1. **Determine next number:**
   ```bash
   ls migrations/*.sql | tail -1
   # If last is 036, use 037
   ```

2. **Create migration file:**
   ```bash
   touch migrations/037_your_migration_name.sql
   ```

3. **Add SQL content:**
   ```sql
   -- Migration: Your migration description
   -- Created: 2026-04-13
   
   CREATE TABLE example (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

4. **Create rollback file:**
   ```bash
   touch migrations/037_your_migration_name_rollback.sql
   ```

5. **Add rollback SQL:**
   ```sql
   -- Rollback: Your migration description
   
   DROP TABLE IF EXISTS example;
   ```

6. **Update MIGRATIONS_TRACKER.md**

## 🔄 Running Migrations

### Run All Pending Migrations

```bash
node run-all-migrations.js
```

**Output:**
```
================================================================================
DATABASE MIGRATION RUNNER
================================================================================

ℹ️  Connecting to database...
✅ Connected to database
✅ Migration tracking table ready
ℹ️  Found 37 migration files

--------------------------------------------------------------------------------
EXECUTING MIGRATIONS
--------------------------------------------------------------------------------

⚠️  Skipping 001_add_lending_tables.sql (already executed)
⚠️  Skipping 002_enhance_lending_schema.sql (already executed)
...
ℹ️  Executing 037_add_email_verification_to_users.sql...
✅ 037_add_email_verification_to_users.sql executed successfully (245ms)

================================================================================
MIGRATION SUMMARY
================================================================================

Total migrations: 37
Executed: 1
Skipped: 36
Failed: 0
Total time: 312ms

✅ All migrations completed successfully! 🎉
```

### Force Re-run All Migrations

```bash
node run-all-migrations.js --force
```

⚠️ **Warning:** This will re-execute ALL migrations, even if already run. Use with caution!

### Check Status Without Running

```bash
node run-all-migrations.js --status
```

**Output:**
```
================================================================================
MIGRATION STATUS
================================================================================

Total migrations: 37
Executed: 36
Pending: 1

Detailed Status:
--------------------------------------------------------------------------------
001. ✅ 001_add_lending_tables.sql (4/10/2026, 10:30:00 AM)
002. ✅ 002_enhance_lending_schema.sql (4/10/2026, 10:30:01 AM)
...
036. ✅ 036_create_credit_marketplace_settings.sql (4/12/2026, 3:45:12 PM)
037. ⏳ 037_add_email_verification_to_users.sql (pending)
```

### Rollback Last Migration

```bash
node run-all-migrations.js --rollback
```

This will:
- Find the last successfully executed migration
- Look for corresponding rollback file
- Execute rollback SQL
- Remove migration from tracking table

## 🤝 Team Collaboration

### Before Starting Work

1. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

2. **Check for new migrations:**
   ```bash
   node run-all-migrations.js --status
   ```

3. **Run pending migrations:**
   ```bash
   node run-all-migrations.js
   ```

### When Creating a Migration

1. **Create migration:**
   ```bash
   node create-migration.js "your description"
   ```

2. **Edit migration file:**
   - Add your SQL
   - Test locally
   - Add comments

3. **Edit rollback file:**
   - Add rollback SQL
   - Test rollback

4. **Test migration:**
   ```bash
   node run-all-migrations.js
   ```

5. **Test rollback:**
   ```bash
   node run-all-migrations.js --rollback
   ```

6. **Re-run migration:**
   ```bash
   node run-all-migrations.js
   ```

7. **Commit files:**
   ```bash
   git add migrations/037_*.sql
   git add migrations/MIGRATIONS_TRACKER.md
   git commit -m "feat: add email verification to users table"
   git push
   ```

### Resolving Migration Conflicts

If two developers create migrations with the same number:

**Developer A creates:** `037_add_feature_a.sql`  
**Developer B creates:** `037_add_feature_b.sql`

**Resolution:**

1. **Developer B (who pulls later):**
   ```bash
   # Rename your migration
   mv migrations/037_add_feature_b.sql migrations/038_add_feature_b.sql
   mv migrations/037_add_feature_b_rollback.sql migrations/038_add_feature_b_rollback.sql
   
   # Update file contents (change 037 to 038 in comments)
   
   # Update MIGRATIONS_TRACKER.md
   
   # Commit
   git add migrations/038_*
   git add migrations/MIGRATIONS_TRACKER.md
   git commit -m "fix: renumber migration to avoid conflict"
   git push
   ```

## 🗄️ Migration Tracking

### Database Table

Migrations are tracked in the `schema_migrations` table:

```sql
CREATE TABLE schema_migrations (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  execution_time_ms INTEGER,
  status VARCHAR(50) DEFAULT 'success',
  error_message TEXT,
  checksum VARCHAR(64)
);
```

### Query Migration Status

```sql
-- View all executed migrations
SELECT * FROM schema_migrations ORDER BY executed_at DESC;

-- Check if specific migration was executed
SELECT * FROM schema_migrations WHERE migration_name = '037_add_email_verification_to_users.sql';

-- View failed migrations
SELECT * FROM schema_migrations WHERE status = 'failed';

-- View recent migrations
SELECT migration_name, executed_at, execution_time_ms 
FROM schema_migrations 
ORDER BY executed_at DESC 
LIMIT 10;
```

## 📋 Best Practices

### DO ✅

1. **Always test locally first**
   ```bash
   node run-all-migrations.js
   ```

2. **Create rollback files**
   - Every migration should have a rollback
   - Test rollback before committing

3. **Use descriptive names**
   - Good: `037_add_email_verification_to_users.sql`
   - Bad: `037_update.sql`

4. **Add comments**
   ```sql
   -- Migration: Add email verification
   -- Purpose: Enable email verification for user accounts
   -- Dependencies: users table must exist
   ```

5. **Update tracker file**
   - Always update `MIGRATIONS_TRACKER.md`
   - Commit it with your migration

6. **Run migrations before starting work**
   ```bash
   node run-all-migrations.js --status
   node run-all-migrations.js
   ```

7. **Communicate breaking changes**
   - Notify team in Slack/Discord
   - Document in migration comments
   - Update README if needed

### DON'T ❌

1. **Don't modify executed migrations**
   - Once deployed, migrations are immutable
   - Create a new migration to fix issues

2. **Don't skip numbers**
   - Use sequential numbering
   - Use helper script to avoid conflicts

3. **Don't use `synchronize: true`**
   - Always use migrations in production
   - TypeORM sync can cause data loss

4. **Don't commit without testing**
   ```bash
   # Always test first
   node run-all-migrations.js
   node run-all-migrations.js --rollback
   node run-all-migrations.js
   ```

5. **Don't forget rollback files**
   - Every migration needs a rollback
   - Even if it's just a comment

6. **Don't use database-specific features without checking**
   - Ensure SQL works on PostgreSQL
   - Test on same database version as production

## 🐛 Troubleshooting

### Migration Failed

**Problem:** Migration execution failed

**Solution:**
```bash
# 1. Check error message
node run-all-migrations.js

# 2. Check database logs
# Look at error_message in schema_migrations table

# 3. Fix migration file
# Edit the SQL file

# 4. Rollback if needed
node run-all-migrations.js --rollback

# 5. Re-run
node run-all-migrations.js
```

### Database Out of Sync

**Problem:** Local database doesn't match production

**Solution:**
```bash
# 1. Check status
node run-all-migrations.js --status

# 2. Run pending migrations
node run-all-migrations.js

# 3. If issues persist, check schema_migrations table
psql -d urutix -c "SELECT * FROM schema_migrations ORDER BY executed_at DESC LIMIT 10;"
```

### Migration Conflict

**Problem:** Two migrations with same number

**Solution:**
```bash
# 1. Identify conflict
ls migrations/*.sql | grep "^037"

# 2. Renumber your migration
mv migrations/037_your_migration.sql migrations/038_your_migration.sql
mv migrations/037_your_migration_rollback.sql migrations/038_your_migration_rollback.sql

# 3. Update file contents (change number in comments)

# 4. Update MIGRATIONS_TRACKER.md

# 5. Commit
git add migrations/038_*
git commit -m "fix: renumber migration"
```

### Can't Connect to Database

**Problem:** Connection error

**Solution:**
```bash
# 1. Check .env file
cat .env | grep DB_

# 2. Verify database is running
psql -h localhost -U postgres -d urutix

# 3. Check credentials
# Ensure DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME are correct
```

## 🔧 Advanced Usage

### Custom Migration Order

Migrations run in alphabetical order by filename. To control order:

```bash
# Migrations run in this order:
001_first.sql
002_second.sql
010_tenth.sql
011_eleventh.sql
```

### Conditional Migrations

Add checks in your SQL:

```sql
-- Only create table if it doesn't exist
CREATE TABLE IF NOT EXISTS example (
  id UUID PRIMARY KEY
);

-- Only add column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;
```

### Data Migrations

For data migrations, use transactions:

```sql
-- Start transaction
BEGIN;

-- Update data
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';

-- Verify
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'ADMIN';
  IF admin_count = 0 THEN
    RAISE EXCEPTION 'No admin users found after migration';
  END IF;
END $$;

-- Commit
COMMIT;
```

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeORM Migrations](https://typeorm.io/migrations)
- [Database Migration Best Practices](https://www.prisma.io/dataguide/types/relational/migration-strategies)

## 🆘 Support

For migration issues:
1. Check this README
2. Check `MIGRATIONS_TRACKER.md`
3. Review migration logs
4. Contact database administrator
5. Check team documentation

---

**Last Updated:** April 13, 2026  
**Maintained By:** Development Team
