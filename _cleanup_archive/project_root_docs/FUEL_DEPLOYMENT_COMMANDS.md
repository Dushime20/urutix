# Fuel Features - Deployment Commands

## Quick Deployment Guide

### Step 1: Run Database Migration

```bash
cd backend
node run-fuel-features-migration.js
```

**Expected Output**:
```
🚀 Starting fuel features migration...
📝 Executing migration SQL...
✓ Table fuel_wallets verified
✓ Table fuel_wallet_transactions verified
✓ Table fuel_budgets verified
✓ Table driver_fuel_advances verified
✨ Migration completed successfully!
```

### Step 2: Rebuild Backend

```bash
npm run build
```

**Expected Output**:
```
✓ Compiled successfully
```

### Step 3: Restart Backend

```bash
npm start
```

**Expected Output**:
```
[Nest] 12345  - 02/27/2026, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 02/27/2026, 10:30:01 AM     LOG [InstanceLoader] FuelModule dependencies initialized
...
[Nest] 12345  - 02/27/2026, 10:30:05 AM     LOG [NestApplication] Nest application successfully started
```

---

## Verification Commands

### Verify Database Tables

```bash
psql -U postgres -d urutix -c "\dt fuel_*"
```

**Expected Output**:
```
                    List of relations
 Schema |           Name            | Type  | Owner
--------+---------------------------+-------+----------
 public | fuel_budgets              | table | postgres
 public | driver_fuel_advances      | table | postgres
 public | fuel_wallet_transactions  | table | postgres
 public | fuel_wallets              | table | postgres
(4 rows)
```

### Verify Indexes

```bash
psql -U postgres -d urutix -c "\di idx_fuel_*"
```

**Expected Output**:
```
                           List of relations
 Schema |                    Name                    | Type  | Owner | Table
--------+--------------------------------------------+-------+-------+------------------
 public | idx_driver_fuel_advances_tenant_driver     | index | postgres | driver_fuel_advances
 public | idx_driver_fuel_advances_tenant_status     | index | postgres | driver_fuel_advances
 public | idx_driver_fuel_advances_tenant_trip       | index | postgres | driver_fuel_advances
 public | idx_fuel_budgets_tenant_status             | index | postgres | fuel_budgets
 public | idx_fuel_budgets_tenant_trip               | index | postgres | fuel_budgets
 public | idx_fuel_budgets_tenant_truck              | index | postgres | fuel_budgets
 public | idx_fuel_wallet_transactions_tenant_date   | index | postgres | fuel_wallet_transactions
 public | idx_fuel_wallet_transactions_tenant_type   | index | postgres | fuel_wallet_transactions
 public | idx_fuel_wallet_transactions_tenant_wallet | index | postgres | fuel_wallet_transactions
 public | idx_fuel_wallets_tenant_driver             | index | postgres | fuel_wallets
 public | idx_fuel_wallets_tenant_status             | index | postgres | fuel_wallets
 public | idx_fuel_wallets_tenant_truck              | index | postgres | fuel_wallets
(12 rows)
```

---

## Testing Commands

### Test Wallet Endpoints

**Get Driver Wallet**
```bash
curl -X GET http://localhost:3000/fuel/wallets/driver/{driverId} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

**Add Credit**
```bash
curl -X POST http://localhost:3000/fuel/wallets/{walletId}/credit \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "description": "Test credit",
    "referenceId": "TEST-001"
  }'
```

**Get Wallet Stats**
```bash
curl -X GET http://localhost:3000/fuel/wallets/stats/overview \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

### Test Budget Endpoints

**Create Budget**
```bash
curl -X POST http://localhost:3000/fuel/budgets \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": "{tripId}",
    "truckId": "{truckId}",
    "budgetedAmount": 500,
    "alertThreshold": 10
  }'
```

**Record Expense**
```bash
curl -X POST http://localhost:3000/fuel/budgets/{budgetId}/record-expense \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "fuelCost": 150
  }'
```

**Get Over-Budget Trips**
```bash
curl -X GET http://localhost:3000/fuel/budgets/status/over-budget \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

### Test Advance Endpoints

**Request Advance**
```bash
curl -X POST http://localhost:3000/fuel/advances/request \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "advanceAmount": 1000,
    "tripId": "{tripId}",
    "notes": "Test advance"
  }'
```

**Get Pending Advances**
```bash
curl -X GET http://localhost:3000/fuel/advances/pending/all \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json"
```

**Approve Advance**
```bash
curl -X PUT http://localhost:3000/fuel/advances/{advanceId}/approve \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json"
```

**Reconcile Advance**
```bash
curl -X PUT http://localhost:3000/fuel/advances/{advanceId}/reconcile \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "reconciliationAmount": 950,
    "reconciliationNotes": "Actual fuel spent"
  }'
```

---

## Troubleshooting Commands

### Check Backend Logs

```bash
# View last 50 lines
tail -50 backend.log

# Follow logs in real-time
tail -f backend.log

# Search for errors
grep -i error backend.log
```

### Check Database Connection

```bash
psql -U postgres -d urutix -c "SELECT 1"
```

**Expected Output**:
```
 ?column?
----------
        1
(1 row)
```

### Check Table Row Counts

```bash
psql -U postgres -d urutix -c "
SELECT 
  'fuel_wallets' as table_name, COUNT(*) as row_count FROM fuel_wallets
UNION ALL
SELECT 'fuel_wallet_transactions', COUNT(*) FROM fuel_wallet_transactions
UNION ALL
SELECT 'fuel_budgets', COUNT(*) FROM fuel_budgets
UNION ALL
SELECT 'driver_fuel_advances', COUNT(*) FROM driver_fuel_advances
"
```

### Check for Errors in Backend

```bash
# Check if backend is running
curl http://localhost:3000/health

# Check if fuel endpoints are available
curl http://localhost:3000/fuel/wallets/stats/overview \
  -H "Authorization: Bearer {token}"
```

---

## Rollback Commands

### If Migration Fails

```bash
# Drop tables (WARNING: This will delete all data)
psql -U postgres -d urutix -c "
DROP TABLE IF EXISTS driver_fuel_advances CASCADE;
DROP TABLE IF EXISTS fuel_budgets CASCADE;
DROP TABLE IF EXISTS fuel_wallet_transactions CASCADE;
DROP TABLE IF EXISTS fuel_wallets CASCADE;
"
```

### If Backend Won't Start

```bash
# Check for compilation errors
npm run build

# Check for missing dependencies
npm install

# Clear build cache
rm -rf dist/
npm run build
```

---

## Performance Monitoring

### Check Index Usage

```bash
psql -U postgres -d urutix -c "
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename LIKE 'fuel_%' OR tablename LIKE 'driver_fuel_%'
ORDER BY idx_scan DESC
"
```

### Check Table Sizes

```bash
psql -U postgres -d urutix -c "
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename LIKE 'fuel_%' OR tablename LIKE 'driver_fuel_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
"
```

### Check Query Performance

```bash
psql -U postgres -d urutix -c "
EXPLAIN ANALYZE
SELECT * FROM fuel_wallets WHERE tenant_id = '{tenantId}'
"
```

---

## Backup Commands

### Backup Fuel Tables

```bash
# Backup all fuel tables
pg_dump -U postgres -d urutix -t fuel_wallets -t fuel_wallet_transactions -t fuel_budgets -t driver_fuel_advances > fuel_backup.sql

# Restore from backup
psql -U postgres -d urutix < fuel_backup.sql
```

### Backup Entire Database

```bash
# Full backup
pg_dump -U postgres -d urutix > full_backup.sql

# Restore full backup
psql -U postgres -d urutix < full_backup.sql
```

---

## Monitoring Commands

### Monitor Real-Time Activity

```bash
# Watch active queries
watch -n 1 'psql -U postgres -d urutix -c "SELECT pid, usename, query FROM pg_stat_activity WHERE query NOT LIKE '\''%pg_stat_activity%'\''"'
```

### Check Connection Count

```bash
psql -U postgres -d urutix -c "
SELECT count(*) as connection_count FROM pg_stat_activity
"
```

### Check Slow Queries

```bash
psql -U postgres -d urutix -c "
SELECT 
  query,
  calls,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE query LIKE '%fuel%' OR query LIKE '%advance%'
ORDER BY mean_time DESC
LIMIT 10
"
```

---

## Deployment Checklist

- [ ] Run migration: `node backend/run-fuel-features-migration.js`
- [ ] Verify tables: `psql -U postgres -d urutix -c "\dt fuel_*"`
- [ ] Verify indexes: `psql -U postgres -d urutix -c "\di idx_fuel_*"`
- [ ] Rebuild backend: `npm run build`
- [ ] Restart backend: `npm start`
- [ ] Test wallet endpoints
- [ ] Test budget endpoints
- [ ] Test advance endpoints
- [ ] Check backend logs for errors
- [ ] Monitor database performance
- [ ] Verify no data loss

---

## Post-Deployment

### Monitor for Issues

```bash
# Watch logs
tail -f backend.log

# Monitor database
watch -n 5 'psql -U postgres -d urutix -c "SELECT COUNT(*) FROM fuel_wallets"'

# Check error rate
grep -c "ERROR" backend.log
```

### Performance Baseline

```bash
# Record baseline metrics
psql -U postgres -d urutix -c "
SELECT 
  'fuel_wallets' as table_name, COUNT(*) as row_count FROM fuel_wallets
UNION ALL
SELECT 'fuel_wallet_transactions', COUNT(*) FROM fuel_wallet_transactions
UNION ALL
SELECT 'fuel_budgets', COUNT(*) FROM fuel_budgets
UNION ALL
SELECT 'driver_fuel_advances', COUNT(*) FROM driver_fuel_advances
" > baseline_metrics.txt
```

---

## Support

For deployment issues:
1. Check the quick start guide
2. Review the API reference
3. Check the implementation guide
4. Review service files for business logic
5. Check database logs for errors

---

**Deployment Date**: February 27, 2026
**Status**: Ready for Production
**Estimated Time**: 5-10 minutes
