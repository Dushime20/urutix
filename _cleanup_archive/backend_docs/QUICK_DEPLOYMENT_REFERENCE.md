# Quick Deployment Reference Card

## 🚨 Emergency: Fix Production Now

```bash
# Fix missing loadType column
cd backend
bash fix-production-loadtype.sh
pm2 restart ecosystem.config.js
```

---

## 🚀 Standard Deployment

```bash
# One command does everything
npm run deploy:safe
```

---

## 📋 Common Commands

### Check Before Deploy
```bash
npm run deploy:check          # Pre-deployment validation
npm run migration:show        # Show migration status
npm run migration:check       # Validate database schema
```

### Deploy
```bash
npm run deploy:safe           # Full safe deployment (recommended)
npm run deploy:migrate        # Just run migrations with backup
npm run deploy:prod           # Quick production deploy
```

### Rollback
```bash
npm run migration:revert      # Revert last migration
bash backups/rollback-*.sh    # Restore from backup
```

### Monitor
```bash
pm2 logs urutix-backend       # View logs
pm2 status                    # Check status
pm2 monit                     # Live monitoring
curl localhost:3000/health    # Health check
```

---

## 🔧 Manual Steps (if needed)

```bash
# 1. Check environment
bash scripts/pre-deploy-check.sh

# 2. Backup and migrate
bash scripts/backup-and-migrate.sh

# 3. Restart app
pm2 restart ecosystem.config.js

# 4. Verify
curl localhost:3000/health
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `scripts/safe-deploy.sh` | Complete deployment automation |
| `scripts/pre-deploy-check.sh` | Pre-deployment validation |
| `scripts/backup-and-migrate.sh` | Safe migration with backup |
| `scripts/check-migrations.js` | Schema validation |
| `ecosystem.config.js` | PM2 configuration |
| `backups/` | Database backups and rollback scripts |

---

## ⚠️ Troubleshooting

### App won't start
```bash
pm2 logs urutix-backend --lines 50
npm run migration:check
```

### Migration fails
```bash
npm run migration:show
psql -h $DB_HOST -U $DB_USER -d $DB_NAME
```

### Schema mismatch
```bash
npm run migration:check
npm run migration:run
```

---

## 🎯 Best Practices

✅ Always run `npm run deploy:safe` for production
✅ Test in staging first
✅ Monitor logs after deployment
✅ Keep backups (automatic in `backups/`)
✅ Never modify database manually

❌ Don't skip pre-deployment checks
❌ Don't deploy without backup
❌ Don't ignore schema validation errors
❌ Don't restart without running migrations

---

## 📞 Quick Help

**Deployment failed?**
1. Check logs: `pm2 logs`
2. Check schema: `npm run migration:check`
3. Rollback: `bash backups/rollback-*.sh`

**Need to rollback?**
```bash
# Find latest rollback script
ls -t backups/rollback-*.sh | head -1

# Execute it
bash backups/rollback-TIMESTAMP.sh
```

**Schema issues?**
```bash
# Validate
npm run migration:check

# Fix
npm run migration:run
```

---

## 🔐 Environment Variables

Required in `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartcargo
DB_USER=postgres
DB_PASSWORD=your_password
NODE_ENV=production
PORT=3000
```

---

## 📊 Success Checklist

After deployment, verify:
- [ ] `pm2 status` shows "online"
- [ ] `curl localhost:3000/health` returns 200
- [ ] `pm2 logs` shows no errors
- [ ] Can create cargo successfully
- [ ] Database backup exists in `backups/`

---

## 🆘 Emergency Contacts

- **DevOps Team:** [contact info]
- **Database Admin:** [contact info]
- **On-Call Engineer:** [contact info]

---

**Last Updated:** 2026-02-05
**Version:** 1.0.0
