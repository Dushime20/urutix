# Complete Schema Export Guide

## 🎯 Purpose

This guide explains how to export your current database schema and create a complete migration file that includes ALL tables, columns, indexes, and constraints.

## 🚀 Quick Start

### Export Current Schema

```bash
cd backend
npm run migrations:export
```

This will:
1. Connect to your database
2. Export all tables, columns, enums, indexes, and constraints
3. Create `migrations/000_complete_schema.sql`
4. Create `migrations/000_complete_schema_summary.md`

## 📋 What Gets Exported

### 1. Extensions
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 2. Enums
All custom enum types:
```sql
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'USER', 'DRIVER');
CREATE TYPE "load_status" AS ENUM ('PENDING', 'ASSIGNED', 'IN_TRANSIT');
```

### 3. Tables
All tables with complete column definitions:
```sql
CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "email" VARCHAR(255) NOT NULL,
  "password_hash" VARCHAR(255),
  "role" user_role NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);
```

### 4. Primary Keys
```sql
ALTER TABLE "users" ADD CONSTRAINT "PK_users" PRIMARY KEY (id);
```

### 5. Indexes
```sql
CREATE INDEX "IDX_users_email" ON "users" ("email");
CREATE UNIQUE INDEX "IDX_users_email_unique" ON "users" ("email");
```

### 6. Foreign Keys
```sql
ALTER TABLE "trucks" ADD CONSTRAINT "FK_trucks_owner" 
  FOREIGN KEY ("owner_id") 
  REFERENCES "users" ("id") 
  ON DELETE CASCADE;
```

### 7. Unique Constraints
```sql
ALTER TABLE "tenants" ADD CONSTRAINT "UQ_tenants_email" UNIQUE (email);
```

## 🔄 Usage Scenarios

### Scenario 1: New Team Member Setup

**Problem:** New developer needs to set up database with all tables.

**Solution:**
```bash
# 1. Export schema from your database
npm run migrations:export

# 2. Commit the schema file
git add migrations/000_complete_schema.sql
git add migrations/000_complete_schema_summary.md
git commit -m "feat: add complete schema export"
git push

# 3. New team member pulls and runs
git pull
npm run migrations:run
```

### Scenario 2: Fresh Database Setup

**Problem:** Need to create all tables on a new database.

**Solution:**
```bash
# Option 1: Use migration runner
npm run migrations:run

# Option 2: Direct SQL
psql -d urutix -f migrations/000_complete_schema.sql
```

### Scenario 3: Database Backup/Restore

**Problem:** Need to recreate database structure after restore.

**Solution:**
```bash
# 1. Backup data
pg_dump -d urutix --data-only > data_backup.sql

# 2. Drop and recreate database
dropdb urutix
createdb urutix

# 3. Apply schema
psql -d urutix -f migrations/000_complete_schema.sql

# 4. Restore data
psql -d urutix -f data_backup.sql
```

### Scenario 4: Schema Documentation

**Problem:** Need to document current database structure.

**Solution:**
```bash
# Export schema
npm run migrations:export

# Review summary
cat migrations/000_complete_schema_summary.md

# Share with team
```

## 📝 Step-by-Step Guide

### Step 1: Export Schema

```bash
cd backend
npm run migrations:export
```

**Output:**
```
================================================================================
DATABASE SCHEMA EXPORTER
================================================================================

ℹ️  Connecting to database...
✅ Connected
ℹ️  Exporting enums...
✅ Exported 15 enums
ℹ️  Exporting tables...
✅ Exported 87 tables
ℹ️  Exporting primary keys...
ℹ️  Exporting indexes...
✅ Exported 156 indexes
ℹ️  Exporting foreign keys...
✅ Exported 98 foreign keys
ℹ️  Exporting unique constraints...
✅ Exported 23 unique constraints
✅ Schema exported to: migrations/000_complete_schema.sql
✅ Summary created: migrations/000_complete_schema_summary.md

================================================================================
EXPORT COMPLETE
================================================================================

📁 Schema file: migrations/000_complete_schema.sql
📄 Summary file: migrations/000_complete_schema_summary.md

Next steps:
1. Review the generated schema file
2. Test on a development database
3. Commit to git
4. Share with team
```

### Step 2: Review Generated Files

```bash
# View schema file
cat migrations/000_complete_schema.sql

# View summary
cat migrations/000_complete_schema_summary.md
```

### Step 3: Test on Development Database

```bash
# Create test database
createdb urutix_test

# Apply schema
psql -d urutix_test -f migrations/000_complete_schema.sql

# Verify tables
psql -d urutix_test -c "\dt"

# Drop test database
dropdb urutix_test
```

### Step 4: Commit to Git

```bash
git add migrations/000_complete_schema.sql
git add migrations/000_complete_schema_summary.md
git commit -m "feat: add complete database schema export"
git push
```

### Step 5: Share with Team

```bash
# Team members can now run
git pull
npm run migrations:run
```

## 🔍 Verifying the Export

### Check Tables

```sql
-- Count tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### Check Indexes

```sql
-- Count indexes
SELECT COUNT(*) FROM pg_indexes 
WHERE schemaname = 'public';

-- List indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Check Foreign Keys

```sql
-- Count foreign keys
SELECT COUNT(*) FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
  AND table_schema = 'public';

-- List foreign keys
SELECT table_name, constraint_name 
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
  AND table_schema = 'public'
ORDER BY table_name;
```

## 🛠️ Customization

### Exclude Specific Tables

Edit `export-current-schema.js`:

```javascript
const tables = await client.query(`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT IN (
      'schema_migrations', 
      'typeorm_metadata',
      'temp_table',  -- Add tables to exclude
      'test_table'
    )
  ORDER BY table_name
`);
```

### Include Additional Schemas

```javascript
const dbConfig = {
  // ... existing config
  schemas: ['public', 'audit', 'reporting'],  // Add schemas
};
```

### Export to Different Format

```javascript
// Export as JSON
const schemaJson = {
  tables: tables.rows,
  indexes: indexes.rows,
  foreignKeys: foreignKeys.rows,
};

fs.writeFileSync('schema.json', JSON.stringify(schemaJson, null, 2));
```

## 🐛 Troubleshooting

### Issue: Connection Error

**Problem:** Can't connect to database

**Solution:**
```bash
# Check .env file
cat .env | grep DB_

# Test connection
psql -h localhost -U postgres -d urutix

# Verify credentials
```

### Issue: Permission Denied

**Problem:** User doesn't have permission to read schema

**Solution:**
```sql
-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO your_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO your_user;
```

### Issue: Large Schema File

**Problem:** Generated file is too large

**Solution:**
```bash
# Split into multiple files
# Edit export-current-schema.js to create separate files for:
# - Enums
# - Tables
# - Indexes
# - Foreign keys
```

### Issue: Missing Tables

**Problem:** Some tables not exported

**Solution:**
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check table ownership
SELECT tablename, tableowner 
FROM pg_tables 
WHERE schemaname = 'public';
```

## 📚 Best Practices

### DO ✅

1. **Export regularly**
   ```bash
   # Weekly or after major changes
   npm run migrations:export
   ```

2. **Version control**
   ```bash
   # Always commit schema exports
   git add migrations/000_complete_schema.sql
   git commit -m "chore: update schema export"
   ```

3. **Test before sharing**
   ```bash
   # Test on development database
   createdb test_db
   psql -d test_db -f migrations/000_complete_schema.sql
   dropdb test_db
   ```

4. **Document changes**
   ```bash
   # Add notes to summary file
   echo "## Changes\n- Added user_preferences table" >> migrations/000_complete_schema_summary.md
   ```

### DON'T ❌

1. **Don't export production directly**
   - Export from development or staging
   - Review before committing

2. **Don't include sensitive data**
   - Schema only, no data
   - No passwords or secrets

3. **Don't modify manually**
   - Always regenerate from database
   - Don't edit SQL file directly

4. **Don't skip testing**
   - Always test on fresh database
   - Verify all tables created

## 🔄 Updating the Schema

### When to Re-export

- After adding new tables
- After modifying columns
- After adding indexes
- Before major releases
- Weekly for active projects

### How to Update

```bash
# 1. Make database changes
# (via migrations or manual SQL)

# 2. Export new schema
npm run migrations:export

# 3. Review changes
git diff migrations/000_complete_schema.sql

# 4. Commit
git add migrations/000_complete_schema.sql
git commit -m "chore: update schema export - added X table"
git push
```

## 📊 Schema Statistics

After export, you can see:

```
-- Enums: 15
-- Tables: 87
-- Indexes: 156
-- Foreign Keys: 98
-- Unique Constraints: 23
```

This gives you a complete picture of your database structure.

## 🆘 Support

For issues:
1. Check this guide
2. Review generated summary file
3. Check database logs
4. Contact database administrator

---

**Remember:** Always test schema exports on a development database before using in production!
