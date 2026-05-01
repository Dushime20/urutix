# Database Initialization Guide

## Professional Production Setup

This guide explains how to initialize a fresh database for the UrutiX application.

## Understanding the Setup

The application uses:
- **TypeORM** for database management
- **Webpack bundling** for production builds
- **Entity-based schema** (not SQL migrations for initial setup)

## Method 1: Automatic Initialization (Recommended)

### Step 1: Enable Schema Synchronization

Add to your `.env` file:
```env
DB_SYNCHRONIZE=true
```

### Step 2: Start the Application

```bash
# Rebuild with synchronization enabled
docker-compose -f docker-compose.production.yml build backend

# Start services
docker-compose -f docker-compose.production.yml up -d

# Wait for schema creation (30 seconds)
sleep 30

# Check logs to confirm tables were created
docker-compose -f docker-compose.production.yml logs backend | grep -i "schema"
```

### Step 3: Verify Tables

```bash
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d urutix -c "\dt"
```

You should see 90+ tables.

### Step 4: Disable Synchronization (IMPORTANT!)

Edit `.env`:
```env
DB_SYNCHRONIZE=false
```

Restart:
```bash
docker-compose -f docker-compose.production.yml restart backend
```

### Step 5: Seed Admin User

```bash
docker-compose -f docker-compose.production.yml exec backend npm run seed:admin
```

---

## Method 2: Manual SQL Approach

If you prefer SQL migrations:

### Step 1: Export Schema from Development

On your local machine:
```bash
cd backend
npm run build
node -e "
const { databaseConfig } = require('./dist/config/database.config');
const { DataSource } = require('typeorm');
const ds = new DataSource({...databaseConfig, synchronize: false});
ds.initialize().then(async () => {
  const sql = await ds.driver.createSchemaBuilder().log();
  console.log(sql.upQueries.map(q => q.query).join(';\n'));
  await ds.destroy();
});
"
```

### Step 2: Save and Run SQL

Save the output to a file and run it on the server.

---

## Method 3: Copy from Existing Database

If you have a working database:

```bash
# Export from working database
pg_dump -U postgres -d urutix --schema-only > schema.sql

# Import to new database
psql -U postgres -d urutix < schema.sql
```

---

## Verification Checklist

After initialization, verify:

- [ ] All tables exist (90+ tables)
- [ ] Foreign keys are created
- [ ] Indexes are created
- [ ] Admin user exists
- [ ] Application starts without errors
- [ ] API health check passes

```bash
# Check table count
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d urutix -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"

# Check admin user
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d urutix -c "SELECT email, role FROM users WHERE role='super_admin';"

# Test API
curl http://localhost:3005/api/health
```

---

## Troubleshooting

### Tables Not Created

**Symptom:** Database is empty after starting app

**Solution:**
1. Check `DB_SYNCHRONIZE=true` is set
2. Check backend logs for errors
3. Verify database connection

### Too Many/Few Tables

**Expected:** 90-100 tables depending on version

**Check:**
```bash
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d urutix -c "\dt" | wc -l
```

### Synchronize Won't Disable

**Symptom:** Schema keeps changing on restart

**Solution:**
1. Ensure `DB_SYNCHRONIZE=false` in .env
2. Rebuild: `docker-compose build backend`
3. Restart: `docker-compose up -d backend`

---

## Production Best Practices

### ✅ DO

- Use `DB_SYNCHRONIZE=true` ONLY for initial setup
- Always disable synchronize after initialization
- Backup database before any schema changes
- Test in staging before production
- Use migrations for schema updates after initial setup

### ❌ DON'T

- Never leave `synchronize=true` in production
- Don't manually edit database schema
- Don't skip the verification step
- Don't initialize on a database with existing data

---

## Quick Reference

```bash
# Complete fresh setup
echo "DB_SYNCHRONIZE=true" >> .env
docker-compose -f docker-compose.production.yml up -d --build
sleep 30
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d urutix -c "\dt"
sed -i 's/DB_SYNCHRONIZE=true/DB_SYNCHRONIZE=false/' .env
docker-compose -f docker-compose.production.yml restart backend
docker-compose -f docker-compose.production.yml exec backend npm run seed:admin
```

---

## Support

For issues:
1. Check logs: `docker-compose logs backend`
2. Verify environment: `docker-compose exec backend env | grep DB`
3. Test connection: `docker-compose exec backend node -e "require('pg').Client..."`
