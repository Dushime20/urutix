# Fuel Features - Quick Start Guide

## What Was Implemented

Three complete fuel management systems:

1. **Fuel Wallet** - Credit/debit system for drivers
2. **Fuel Budget** - Trip-based fuel budgeting with alerts
3. **Driver Fuel Advances** - Request/approval workflow for fuel advances

---

## STEP 1: Run Database Migration

```bash
cd backend
node run-fuel-features-migration.js
```

Expected output:
```
🚀 Starting fuel features migration...
📝 Executing migration SQL...
✓ Table fuel_wallets verified
✓ Table fuel_wallet_transactions verified
✓ Table fuel_budgets verified
✓ Table driver_fuel_advances verified
✨ Migration completed successfully!
```

---

## STEP 2: Restart Backend

```bash
npm start
```

The backend will automatically register the new entities and services.

---

## STEP 3: Test the APIs

### Test Fuel Wallet

**1. Get or create driver wallet**
```bash
curl -X GET http://localhost:3000/fuel/wallets/driver/{driverId} \
  -H "Authorization: Bearer {token}"
```

**2. Add credit to wallet**
```bash
curl -X POST http://localhost:3000/fuel/wallets/{walletId}/credit \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "description": "Monthly fuel allowance",
    "referenceId": "ALLOW-2026-01"
  }'
```

**3. View wallet transactions**
```bash
curl -X GET http://localhost:3000/fuel/wallets/{walletId}/transactions \
  -H "Authorization: Bearer {token}"
```

**4. Get wallet statistics**
```bash
curl -X GET http://localhost:3000/fuel/wallets/stats/overview \
  -H "Authorization: Bearer {token}"
```

### Test Fuel Budget

**1. Create budget for trip**
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

**2. Record fuel expense**
```bash
curl -X POST http://localhost:3000/fuel/budgets/{budgetId}/record-expense \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "fuelCost": 150
  }'
```

**3. Get budget analysis**
```bash
curl -X GET http://localhost:3000/fuel/budgets/analysis/{tripId} \
  -H "Authorization: Bearer {token}"
```

**4. Get over-budget trips**
```bash
curl -X GET http://localhost:3000/fuel/budgets/status/over-budget \
  -H "Authorization: Bearer {token}"
```

### Test Driver Fuel Advances

**1. Request fuel advance**
```bash
curl -X POST http://localhost:3000/fuel/advances/request \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "advanceAmount": 1000,
    "tripId": "{tripId}",
    "notes": "Fuel advance for long haul trip"
  }'
```

**2. Get pending advances (admin)**
```bash
curl -X GET http://localhost:3000/fuel/advances/pending/all \
  -H "Authorization: Bearer {adminToken}"
```

**3. Approve advance (admin)**
```bash
curl -X PUT http://localhost:3000/fuel/advances/{advanceId}/approve \
  -H "Authorization: Bearer {adminToken}"
```

**4. Reconcile advance**
```bash
curl -X PUT http://localhost:3000/fuel/advances/{advanceId}/reconcile \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "reconciliationAmount": 950,
    "reconciliationNotes": "Actual fuel spent: $950"
  }'
```

**5. Get driver advance balance**
```bash
curl -X GET http://localhost:3000/fuel/advances/driver/{driverId}/balance \
  -H "Authorization: Bearer {token}"
```

---

## STEP 4: Integration with Existing Fuel System

The new features integrate seamlessly with existing fuel logs:

### When a fuel log is created:
1. Wallet can be debited automatically
2. Budget expense can be recorded
3. Advance can be reconciled

### Example workflow:
```
1. Driver requests fuel advance ($1000)
2. Admin approves advance
3. Driver logs fuel purchase ($950)
4. System debits wallet
5. Budget records expense
6. Advance is reconciled
```

---

## STEP 5: Frontend Integration (Next Phase)

Create UI components for:

1. **Wallet Dashboard**
   - Display balance
   - Show transaction history
   - Request credit

2. **Budget Tracking**
   - Show budgeted vs actual
   - Display variance
   - Alert on threshold

3. **Advance Management**
   - Request advance form
   - Approval queue (admin)
   - Reconciliation form

---

## KEY FEATURES

### Fuel Wallet
- ✅ Automatic wallet creation
- ✅ Credit/debit tracking
- ✅ Transaction history
- ✅ Wallet suspension
- ✅ Statistics and analytics

### Fuel Budget
- ✅ Trip-based budgeting
- ✅ Automatic variance calculation
- ✅ Alert threshold (default 10%)
- ✅ Over-budget detection
- ✅ Budget analysis

### Driver Fuel Advances
- ✅ Request/approval workflow
- ✅ Reconciliation tracking
- ✅ Rejection with reason
- ✅ Outstanding balance calculation
- ✅ Statistics and reporting

---

## DATABASE SCHEMA

### fuel_wallets
```sql
- id (UUID)
- tenant_id (UUID)
- driver_id (UUID, nullable)
- truck_id (UUID, nullable)
- balance (DECIMAL)
- total_credits (DECIMAL)
- total_debits (DECIMAL)
- status (ACTIVE|SUSPENDED|CLOSED)
- last_transaction_at (TIMESTAMP)
```

### fuel_wallet_transactions
```sql
- id (UUID)
- wallet_id (UUID)
- type (CREDIT|DEBIT)
- amount (DECIMAL)
- fuel_log_id (UUID, nullable)
- description (VARCHAR)
- created_at (TIMESTAMP)
```

### fuel_budgets
```sql
- id (UUID)
- trip_id (UUID)
- truck_id (UUID)
- budgeted_amount (DECIMAL)
- actual_amount (DECIMAL)
- variance (DECIMAL)
- status (PLANNED|IN_PROGRESS|COMPLETED|OVER_BUDGET)
- variance_percentage (DECIMAL)
- alert_threshold (DECIMAL)
- alert_triggered (BOOLEAN)
```

### driver_fuel_advances
```sql
- id (UUID)
- driver_id (UUID)
- trip_id (UUID, nullable)
- advance_amount (DECIMAL)
- status (PENDING|APPROVED|REJECTED|RECONCILED)
- approved_by (UUID, nullable)
- reconciliation_amount (DECIMAL, nullable)
- rejection_reason (TEXT, nullable)
```

---

## TROUBLESHOOTING

### Migration fails
- Check database connection
- Verify PostgreSQL is running
- Check DB credentials in .env

### Endpoints return 404
- Verify backend restarted
- Check JWT token is valid
- Verify tenant context is set

### Wallet balance incorrect
- Check transaction history
- Verify debit operations
- Check for concurrent updates

---

## NEXT STEPS

1. ✅ Backend implementation complete
2. ⏳ Frontend dashboard (Phase 4)
3. ⏳ Automatic reconciliation service (Phase 4)
4. ⏳ Advanced analytics and reporting (Phase 5)

---

## SUPPORT

For issues or questions:
1. Check the implementation guide: `FUEL_FEATURES_IMPLEMENTATION_COMPLETE.md`
2. Review API documentation in fuel.controller.ts
3. Check database schema in migrations/015_fuel_wallet_budget_advance.sql
