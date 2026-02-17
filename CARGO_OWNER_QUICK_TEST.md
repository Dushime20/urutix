# Cargo Owner - Quick Test Reference

**Quick commands to test all Priority 1 fixes**

---

## Run All Tests (Recommended)

```powershell
cd backend
./run-cargo-owner-tests.ps1
```

**Expected**: All 38 tests pass in 2-3 minutes

---

## Run Individual Test Suites

### Unit Tests (24 tests)
```bash
# CargoOwnerGuard (11 tests)
npm test -- src/guards/__tests__/cargo-owner.guard.spec.ts

# TenantVerificationMiddleware (13 tests)
npm test -- src/middleware/__tests__/tenant-verification.middleware.spec.ts
```

### Integration Tests (7 tests)
```bash
# Ensure backend is running first
npm run start:dev

# Run security tests
node test-cargo-owner-security.js
```

### Performance Tests (7 tests)
```bash
# Ensure backend is running first
npm run start:dev

# Run performance tests
node test-cargo-owner-performance.js
```

---

## Quick Manual Tests

### Test 1: Create Load
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cargo1@test.com","password":"Test123!@#"}' \
  | jq -r '.access_token // .token')

# Create load
curl -X POST http://localhost:3000/api/loads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Quick Test Load",
    "weight": 5000,
    "loadType": "FTL",
    "equipmentType": "DRY_VAN",
    "cargoType": "GENERAL",
    "urgencyLevel": "NORMAL",
    "visibility": "PUBLIC",
    "unitsRequired": 1,
    "locations": [],
    "pickupDate": "2026-02-20T10:00:00Z",
    "deliveryDate": "2026-02-22T10:00:00Z",
    "loadValue": 10000,
    "paymentTerms": "NET_30"
  }'
```

### Test 2: Get Loads (Verify Eager Loading)
```bash
curl -X GET "http://localhost:3000/api/loads?limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Check**: Each load should have `cargoOwner` object populated

### Test 3: Test Pagination Limit
```bash
curl -X GET "http://localhost:3000/api/loads?limit=200" \
  -H "Authorization: Bearer $TOKEN" | jq '.meta.limit'
```

**Expected**: Should return 100 (not 200)

---

## Prerequisites

### Backend Running
```bash
cd backend
npm run start:dev
```

### Test Users Exist
```bash
cd backend
node seed-tenant-users.js
```

Creates:
- `cargo1@test.com` / `Test123!@#`
- `cargo2@test.com` / `Test123!@#`
- `admin@test.com` / `Admin123!@#`

---

## Expected Results

### All Tests Pass
- ✅ 24 unit tests pass
- ✅ 7 integration tests pass
- ✅ 7 performance tests pass

### Performance Targets Met
- ✅ 10 loads: < 200ms
- ✅ 50 loads: < 500ms
- ✅ 100 loads: < 1000ms
- ✅ Pagination limit: 100 max

### Security Verified
- ✅ Cross-tenant access blocked
- ✅ Unauthorized updates blocked
- ✅ Input validation working

---

## Troubleshooting

### Tests Fail?
```bash
# Check backend is running
curl http://localhost:3000/health

# Check test users exist
node check-all-users.js

# Recreate test users
node seed-tenant-users.js
```

### Slow Performance?
```bash
# Check indexes exist
psql -U postgres -d urutix -c "SELECT indexname FROM pg_indexes WHERE tablename = 'loads';"

# Run migration if needed
psql -U postgres -d urutix -f migrations/014_add_load_constraints.sql
```

---

## Documentation

- **Full Testing Guide**: `CARGO_OWNER_TESTING_GUIDE.md`
- **Complete Summary**: `CARGO_OWNER_COMPLETE_SUMMARY.md`
- **Phase 3 Details**: `CARGO_OWNER_PHASE3_COMPLETE.md`

---

**Status**: ✅ READY TO TEST  
**Last Updated**: February 17, 2026
