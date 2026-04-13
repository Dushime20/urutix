# Database Migration Collaboration Workflow

## 🎯 Common Scenario

**Developer A** adds a new feature that requires:
- New table: `user_preferences`
- New column in existing table: `users.last_login_at`

**Developer B** (collaborator) needs to get these changes.

## 📋 Complete Workflow

### Developer A (Adding New Feature)

#### Step 1: Create Migration for New Changes

```bash
# Create migration for new table and column
npm run migrations:create "add user preferences and last login"
```

This creates:
- `migrations/037_add_user_preferences_and_last_login.sql`
- `migrations/037_add_user_preferences_and_last_login_rollback.sql`

#### Step 2: Write Migration SQL

Edit `migrations/037_add_user_preferences_and_last_login.sql`:

```sql
-- Migration: Add user preferences and last login
-- Created: 2026-04-13
-- Description: Add user_preferences table and last_login_at column to users

-- ============================================
-- UP Migration
-- ============================================

-- Add new table
CREATE TABLE IF NOT EXISTS "user_preferences" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "theme" VARCHAR(50) DEFAULT 'light',
  "language" VARCHAR(10) DEFAULT 'en',
  "notifications_enabled" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FK_user_preferences_user" FOREIGN KEY ("user_id") 
    REFERENCES "users"("id") ON DELETE CASCADE
);

-- Add index
CREATE INDEX "IDX_user_preferences_user_id" ON "user_preferences"("user_id");

-- Add new column to existing table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP;

-- Add index for the new column
CREATE INDEX "IDX_users_last_login_at" ON "users"("last_login_at");

-- ============================================
-- Notes
-- ============================================
-- Dependencies: users table must exist
-- Breaking changes: None
-- Data migration: last_login_at will be NULL for existing users
```

#### Step 3: Write Rollback SQL

Edit `migrations/037_add_user_preferences_and_last_login_rollback.sql`:

```sql
-- Rollback Migration: Add user preferences and last login
-- Created: 2026-04-13

-- ============================================
-- DOWN Migration (Rollback)
-- ============================================

-- Drop indexes
DROP INDEX IF EXISTS "IDX_users_last_login_at";
DROP INDEX IF EXISTS "IDX_user_preferences_user_id";

-- Remove column from users table
ALTER TABLE "users" DROP COLUMN IF EXISTS "last_login_at";

-- Drop user_preferences table
DROP TABLE IF EXISTS "user_preferences";

-- ============================================
-- Notes
-- ============================================
-- Data loss: All user preferences will be lost
-- Data loss: Last login timestamps will be lost
```

#### Step 4: Test Migration Locally

```bash
# Run migration
npm run migrations:run

# Output:
# ✅ 037_add_user_preferences_and_last_login.sql executed successfully (89ms)

# Verify tables
psql -d urutix -c "\d user_preferences"
psql -d urutix -c "\d users" | grep last_login_at

# Test rollback
npm run migrations:rollback

# Output:
# ✅ Rolled back: 037_add_user_preferences_and_last_login.sql

# Re-run migration
npm run migrations:run
```

#### Step 5: Commit and Push

```bash
# Add migration files
git add migrations/037_add_user_preferences_and_last_login.sql
git add migrations/037_add_user_preferences_and_last_login_rollback.sql
git add migrations/MIGRATIONS_TRACKER.md

# Commit
git commit -m "feat: add user preferences table and last login tracking

- Added user_preferences table for storing user settings
- Added last_login_at column to users table
- Added indexes for performance
- Includes rollback migration"

# Push
git push origin main
```

---

### Developer B (Collaborator - Getting Changes)

#### Step 1: Pull Latest Changes

```bash
# Pull from repository
git pull origin main
```

**Output:**
```
remote: Counting objects: 5, done.
remote: Compressing objects: 100% (3/3), done.
remote: Total 5 (delta 2), reused 5 (delta 2)
Unpacking objects: 100% (5/5), done.
From github.com:your-repo/project
   abc1234..def5678  main -> origin/main
 * [new file]   migrations/037_add_user_preferences_and_last_login.sql
 * [new file]   migrations/037_add_user_preferences_and_last_login_rollback.sql
 * [modified]    migrations/MIGRATIONS_TRACKER.md
```

#### Step 2: Check Migration Status

```bash
# Check what migrations are pending
npm run migrations:status
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
037. ⏳ 037_add_user_preferences_and_last_login.sql (pending)
```

#### Step 3: Run Pending Migrations

```bash
# Run all pending migrations
npm run migrations:run
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
⚠️  Skipping 036_create_credit_marketplace_settings.sql (already executed)
ℹ️  Executing 037_add_user_preferences_and_last_login.sql...
✅ 037_add_user_preferences_and_last_login.sql executed successfully (89ms)

================================================================================
MIGRATION SUMMARY
================================================================================

Total migrations: 37
Executed: 1
Skipped: 36
Failed: 0
Total time: 156ms

✅ All migrations completed successfully! 🎉
```

#### Step 4: Verify Changes

```bash
# Check if new table exists
psql -d urutix -c "\d user_preferences"

# Check if new column exists
psql -d urutix -c "\d users" | grep last_login_at

# Or check all tables
psql -d urutix -c "\dt"
```

**Output:**
```
                    Table "public.user_preferences"
       Column        |            Type             | Nullable | Default
---------------------+-----------------------------+----------+---------
 id                  | uuid                        | not null | uuid_generate_v4()
 user_id             | uuid                        | not null |
 theme               | character varying(50)       |          | 'light'
 language            | character varying(10)       |          | 'en'
 notifications_enabled| boolean                    |          | true
 created_at          | timestamp                   |          | CURRENT_TIMESTAMP
 updated_at          | timestamp                   |          | CURRENT_TIMESTAMP

Indexes:
    "user_preferences_pkey" PRIMARY KEY, btree (id)
    "IDX_user_preferences_user_id" btree (user_id)
Foreign-key constraints:
    "FK_user_preferences_user" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

#### Step 5: Continue Development

```bash
# Now you can use the new table and column in your code
# The database is up to date!
```

---

## 🔄 Visual Workflow

```
Developer A (Feature Creator)
│
├─ 1. Create migration
│   └─ npm run migrations:create "description"
│
├─ 2. Write SQL (UP migration)
│   └─ Add tables, columns, indexes
│
├─ 3. Write SQL (DOWN migration)
│   └─ Rollback changes
│
├─ 4. Test locally
│   ├─ npm run migrations:run
│   ├─ Verify changes
│   ├─ npm run migrations:rollback
│   └─ npm run migrations:run
│
└─ 5. Commit & Push
    ├─ git add migrations/*
    ├─ git commit -m "feat: ..."
    └─ git push

                    ↓ (Push to GitHub)

Developer B (Collaborator)
│
├─ 1. Pull changes
│   └─ git pull origin main
│
├─ 2. Check status
│   └─ npm run migrations:status
│
├─ 3. Run migrations
│   └─ npm run migrations:run
│
├─ 4. Verify changes
│   └─ Check database
│
└─ 5. Continue work
    └─ Use new tables/columns
```

## 📝 Quick Command Reference

### For Developer A (Adding Changes)

```bash
# 1. Create migration
npm run migrations:create "add user preferences"

# 2. Edit migration files
# migrations/037_*.sql

# 3. Test
npm run migrations:run
npm run migrations:rollback
npm run migrations:run

# 4. Commit
git add migrations/037_*
git add migrations/MIGRATIONS_TRACKER.md
git commit -m "feat: add user preferences"
git push
```

### For Developer B (Getting Changes)

```bash
# 1. Pull
git pull origin main

# 2. Check
npm run migrations:status

# 3. Run
npm run migrations:run

# 4. Verify
psql -d urutix -c "\dt"
```

## 🎯 One-Line Commands

### Developer A
```bash
npm run migrations:create "description" && # edit files && npm run migrations:run && git add migrations/* && git commit -m "feat: ..." && git push
```

### Developer B
```bash
git pull && npm run migrations:status && npm run migrations:run
```

## 🚨 Common Issues & Solutions

### Issue 1: Migration Conflict

**Problem:** Both developers created migration 037

**Developer B Solution:**
```bash
# Renumber your migration
mv migrations/037_yours.sql migrations/038_yours.sql
mv migrations/037_yours_rollback.sql migrations/038_yours_rollback.sql

# Update file contents (change 037 to 038 in comments)

# Update MIGRATIONS_TRACKER.md

# Commit
git add migrations/038_*
git commit -m "fix: renumber migration to avoid conflict"
git push
```

### Issue 2: Migration Failed

**Developer B Solution:**
```bash
# Check error
npm run migrations:run

# If SQL error, contact Developer A
# If connection error, check .env

# Rollback if needed
npm run migrations:rollback

# Fix and re-run
npm run migrations:run
```

### Issue 3: Forgot to Run Migrations

**Symptom:** Application errors about missing tables/columns

**Solution:**
```bash
# Check status
npm run migrations:status

# Run pending
npm run migrations:run
```

## 📊 Real Example

### Developer A adds notification preferences

```bash
# 1. Create
npm run migrations:create "add notification preferences"

# 2. Write SQL
# migrations/037_add_notification_preferences.sql
```

```sql
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_notifications" BOOLEAN DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sms_notifications" BOOLEAN DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "push_notifications" BOOLEAN DEFAULT true;

CREATE INDEX "IDX_users_notifications" ON "users"("email_notifications", "push_notifications");
```

```bash
# 3. Test
npm run migrations:run

# 4. Push
git add migrations/037_*
git commit -m "feat: add notification preferences to users"
git push
```

### Developer B gets the changes

```bash
# 1. Pull
git pull origin main

# 2. Run
npm run migrations:run

# Output:
# ✅ 037_add_notification_preferences.sql executed successfully (45ms)

# 3. Verify
psql -d urutix -c "\d users" | grep notifications

# Output:
# email_notifications  | boolean | | true
# sms_notifications    | boolean | | false
# push_notifications   | boolean | | true

# 4. Use in code
# Now can access user.email_notifications, etc.
```

## ✅ Best Practices

### Developer A (Feature Creator)

1. ✅ **Test before pushing**
   ```bash
   npm run migrations:run
   npm run migrations:rollback
   npm run migrations:run
   ```

2. ✅ **Write clear descriptions**
   ```bash
   npm run migrations:create "add user preferences table and last login tracking"
   # NOT: "update db"
   ```

3. ✅ **Include rollback**
   - Always create rollback file
   - Test rollback works

4. ✅ **Update tracker**
   - MIGRATIONS_TRACKER.md is updated automatically
   - Commit it with migration

5. ✅ **Communicate**
   - Notify team in Slack/Discord
   - Mention breaking changes
   - Document in commit message

### Developer B (Collaborator)

1. ✅ **Always check status first**
   ```bash
   npm run migrations:status
   ```

2. ✅ **Run migrations before coding**
   ```bash
   git pull && npm run migrations:run
   ```

3. ✅ **Verify changes**
   ```bash
   psql -d urutix -c "\dt"
   ```

4. ✅ **Report issues**
   - If migration fails, contact Developer A
   - Don't modify migration files

## 🎓 Summary

**Developer A (Adding Feature):**
1. `npm run migrations:create "description"`
2. Edit SQL files
3. `npm run migrations:run` (test)
4. `git add migrations/* && git commit && git push`

**Developer B (Getting Changes):**
1. `git pull`
2. `npm run migrations:status` (check)
3. `npm run migrations:run` (apply)
4. Continue coding

**That's it!** Simple, clear, no conflicts. 🎉

---

**Remember:** Always run `npm run migrations:run` after pulling changes!
