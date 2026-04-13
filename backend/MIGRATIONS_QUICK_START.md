# Migrations Quick Start Guide

## 🚀 For New Team Members

### First Time Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd backend

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Run all migrations
npm run migrations:run
```

## 📋 Daily Workflow

### Before Starting Work

```bash
# 1. Pull latest changes
git pull origin main

# 2. Check for new migrations
npm run migrations:status

# 3. Run pending migrations
npm run migrations:run
```

### Creating a New Migration

```bash
# 1. Create migration
npm run migrations:create "add user preferences table"

# 2. Edit the generated file
# migrations/037_add_user_preferences_table.sql

# 3. Add your SQL
# 4. Edit rollback file
# 5. Test locally
npm run migrations:run

# 6. Test rollback
npm run migrations:rollback

# 7. Re-run migration
npm run migrations:run

# 8. Commit
git add migrations/037_*
git add migrations/MIGRATIONS_TRACKER.md
git commit -m "feat: add user preferences table"
git push
```

## 🎯 Common Commands

```bash
# Run all pending migrations
npm run migrations:run

# Check migration status
npm run migrations:status

# Create new migration
npm run migrations:create "description"

# Rollback last migration
npm run migrations:rollback

# Force re-run all migrations (use with caution!)
npm run migrations:force
```

## 🐛 Quick Troubleshooting

### Migration Failed

```bash
# 1. Check error
npm run migrations:run

# 2. Fix SQL file
# Edit migrations/XXX_your_migration.sql

# 3. Rollback
npm run migrations:rollback

# 4. Re-run
npm run migrations:run
```

### Database Out of Sync

```bash
# 1. Check status
npm run migrations:status

# 2. Run pending
npm run migrations:run
```

### Migration Conflict

```bash
# 1. Renumber your migration
mv migrations/037_yours.sql migrations/038_yours.sql
mv migrations/037_yours_rollback.sql migrations/038_yours_rollback.sql

# 2. Update file contents (change 037 to 038)

# 3. Update MIGRATIONS_TRACKER.md

# 4. Commit
git add migrations/038_*
git commit -m "fix: renumber migration"
```

## 📚 Full Documentation

For complete documentation, see:
- [MIGRATIONS_README.md](./MIGRATIONS_README.md) - Complete guide
- [migrations/MIGRATIONS_TRACKER.md](./migrations/MIGRATIONS_TRACKER.md) - Migration tracker

## 🆘 Need Help?

1. Check [MIGRATIONS_README.md](./MIGRATIONS_README.md)
2. Check migration logs
3. Ask team lead
4. Contact database administrator

---

**Remember:** Always test migrations locally before pushing!
