# Cargo Owner Testing Guide

**Date**: February 17, 2026  
**Status**: ✅ COMPLETE  
**Branch**: superdashboard

---

## Overview

This guide provides comprehensive instructions for testing all Cargo Owner Priority 1 fixes including security, performance, and functionality improvements.

---

## Quick Start

### Run All Tests (Recommended)
```powershell
cd backend
./run-cargo-owner-tests.ps1
```

This will run:
1. Unit tests (24 tests)
2. Integration tests (7 tests)
3. Performance tests (7 tests)

**Expected Duration**: 2-3 minutes  
**Expected Result**: All 38 tests pass

---

## Test Suites

### 1. Unit Tests (24 tests)

#### CargoOwnerGuard Tests (11 tests)
**File**: `backend/src/guards/__tests__/cargo-owner.guard.spec.ts`

**Run Command**:
```bash
npm test -- src/guards/__tests__/cargo-owner.guard.spec.ts
```

**What It Tests**:
- Authorization logic for load access
- Tenant isolation enforcement
- Admin and super admin bypass
- Error handling for missing loads
- User authentication validation

**Expected Output**:
```
PASS  src/guards/__tests__/cargo-owner.guard.spec.ts
  CargoOwnerGuard
    canActivate
      ✓ should allow access when user is the cargo owner
      ✓ should allow access when user is admin in same tenant
      ✓ should allow access when user is super admin
      ✓ should deny access when user is not the cargo owner
      ✓ should deny access when tenant does not match
      ✓ should throw NotFoundException when load does not exist
      ✓ should return true when no loadId is provided
      ✓ should extract loadId from body when not in params
      ✓ should throw ForbiddenException when user is not authenticated
      ✓ should handle userId field correctly
      ✓ should handle sub field for userId

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
```

---

#### TenantVerificationMiddleware Tests (13 tests)
**File**: `backend/src/middleware/__tests__/tenant-verification.middleware.spec.ts`

**Run Command**:
```bash
npm test -- src/middleware/__tests__/tenant-verification.middleware.spec.ts
```

**What It Tests**:
- Tenant verification logic
- Public route handling
- Super admin bypass
- Caching mechanism
- Error handling

**Expected Output**:
```
PASS  src/middleware/__tests__/tenant-verification.middleware.spec.ts
  TenantVerificationMiddleware
    use
      ✓ should call next() for public routes
      ✓ should call next() when no user is present
      ✓ should call next() when no tenantId is present
      ✓ should allow super_admin to access any tenant
      ✓ should verify user belongs to tenant and call next()
      ✓ should throw ForbiddenException when user does not belong to tenant
      ✓ should handle userId from sub field
      ✓ should throw ForbiddenException on database error
      ✓ should skip verification for /health route
      ✓ should skip verification for /auth/register route
      ✓ should skip verification for /auth/refresh route
      ✓ should use cache for repeated requests
      ✓ should verify cache configuration

Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
```

---

### 2. Integration Tests (7 tests)

**File**: `backend/test-cargo-owner-security.js`

**Run Command**:
```bash
node test-cargo-owner-security.js
```

**Prerequisites**:
- Backend must be running (`npm run start:dev`)
- Test users must exist (run `node seed-tenant-users.js`)
- Database must be accessible

**What It Tests**:
- End-to-end security flows
- Real API endpoint behavior
- Cross-tenant access prevention
- Authorization enforcement
- Input validation

**Expected Output**:
```
===========================================
Cargo Owner Security Integration Tests
===========================================

--- Setup: Logging in users ---
✓ Tenant 1 user logged in
✓ Tenant 2 user logged in
✓ Admin user logged in

--- Setup: Creating test loads ---
✓ Tenant 1 load created: load-123
✓ Tenant 2 load created: load-456

=== Test 1: Tenant Isolation ===
✅ PASSED: Tenant isolation working - access denied

=== Test 2: Authorization Guard ===
✅ PASSED: Authorization guard working - update denied

=== Test 3: Admin Access ===
✅ PASSED: Admin can access loads in their tenant

=== Test 4: Owner Can Update Own Load ===
✅ PASSED: Owner can update their own load

=== Test 5: Owner Can Delete Own Load ===
✅ PASSED: Owner can delete their own load

=== Test 6: Unauthenticated Access Denied ===
✅ PASSED: Unauthenticated access denied

=== Test 7: Input Validation ===
✅ PASSED: Input validation working - invalid data rejected

===========================================
Test Summary
===========================================
Passed: 7/7
Failed: 0/7

✅ ALL TESTS PASSED
```

---

### 3. Performance Tests (7 tests)

**File**: `backend/test-cargo-owner-performance.js`

**Run Command**:
```bash
node test-cargo-owner-performance.js
```

**Prerequisites**:
- Backend must be running
- At least 50 test loads should exist
- Database should be optimized

**What It Tests**:
- N+1 query elimination
- Response time performance
- Pagination limit enforcement
- Eager loading verification
- Concurrent request handling

**Expected Output**:
```
===========================================
Cargo Owner Performance Tests
===========================================

These tests verify:
1. N+1 query elimination via eager loading
2. Pagination limit enforcement
3. Response time performance
4. Concurrent request handling

--- Setup: Logging in ---
✓ User logged in

--- Setup: Checking existing loads ---
✓ Found 50 existing loads

=== Test 1: Query Performance with 10 Loads ===
✓ Retrieved 10 loads
✓ Response time: 45ms
✅ PASSED: Response time < 200ms

=== Test 2: Query Performance with 50 Loads ===
✓ Retrieved 50 loads
✓ Response time: 120ms
✅ PASSED: Response time < 500ms

=== Test 3: Query Performance with 100 Loads (Max Limit) ===
✓ Retrieved 100 loads
✓ Response time: 250ms
✅ PASSED: Response time < 1000ms

=== Test 4: Pagination Limit Enforcement ===
✓ Requested: 200 loads
✓ Received: 100 loads
✓ Meta limit: 100
✅ PASSED: Pagination limit enforced (max 100)

=== Test 5: Search Performance ===
✓ Search results: 25 loads
✓ Response time: 85ms
✅ PASSED: Search response time < 500ms

=== Test 6: Verify CargoOwner Data Loaded (Eager Loading) ===
✓ Checking load: load-123
✓ Has cargoOwner: true
✓ CargoOwner ID: user-123
✓ CargoOwner email: cargo1@test.com
✅ PASSED: CargoOwner data loaded via eager loading

=== Test 7: Concurrent Request Performance ===
✓ Completed 5 concurrent requests
✓ Total time: 350ms
✓ Average time per request: 70ms
✅ PASSED: Concurrent requests completed < 2000ms

===========================================
Performance Test Summary
===========================================
Passed: 7/7
Failed: 0/7

--- Performance Metrics ---
Expected improvements from eager loading:
• 97% reduction in database queries
• 75-85% faster response times
• Consistent performance with large datasets
• Maximum 100 items per page enforced

✅ ALL PERFORMANCE TESTS PASSED

N+1 query problem has been eliminated!
```

---

## Manual Testing

### Test 1: Create a Load
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cargo1@test.com","password":"Test123!@#"}'

# Save the token from response
TOKEN="<your-token>"

# Create load
curl -X POST http://localhost:3000/api/loads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Load",
    "description": "Manual test load",
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

**Expected**: Load created successfully with 201 status

---

### Test 2: Get Loads (Verify Eager Loading)
```bash
curl -X GET "http://localhost:3000/api/loads?limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: 
- Response includes loads array
- Each load has `cargoOwner` object populated
- Response time < 200ms

---

### Test 3: Try Cross-Tenant Access (Should Fail)
```bash
# Login as tenant 2 user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cargo2@test.com","password":"Test123!@#"}'

TOKEN2="<tenant2-token>"

# Try to access tenant 1 load
curl -X GET "http://localhost:3000/api/loads/<tenant1-load-id>" \
  -H "Authorization: Bearer $TOKEN2"
```

**Expected**: 403 Forbidden error

---

### Test 4: Test Pagination Limit
```bash
# Try to request 200 loads (should be capped at 100)
curl -X GET "http://localhost:3000/api/loads?limit=200" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: 
- Response contains max 100 loads
- `meta.limit` is 100

---

### Test 5: Test Input Validation
```bash
# Try to create load with invalid data
curl -X POST http://localhost:3000/api/loads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "A very long title that exceeds the maximum length allowed by the validation rules and should be rejected",
    "weight": -100,
    "loadValue": -5000,
    "loadType": "FTL",
    "equipmentType": "DRY_VAN",
    "cargoType": "GENERAL",
    "visibility": "PUBLIC",
    "unitsRequired": 1,
    "locations": [],
    "pickupDate": "2026-02-20T10:00:00Z",
    "deliveryDate": "2026-02-22T10:00:00Z",
    "paymentTerms": "NET_30"
  }'
```

**Expected**: 400 Bad Request with validation errors

---

## Troubleshooting

### Problem: Unit Tests Fail

**Solution 1: Check Dependencies**
```bash
cd backend
npm install
```

**Solution 2: Check TypeORM Configuration**
```bash
# Verify database connection
npm run typeorm -- query "SELECT 1"
```

**Solution 3: Clear Jest Cache**
```bash
npm test -- --clearCache
```

---

### Problem: Integration Tests Fail with "Login Failed"

**Solution 1: Create Test Users**
```bash
cd backend
node seed-tenant-users.js
```

**Solution 2: Check Backend is Running**
```bash
# Check if backend is running
curl http://localhost:3000/health

# If not running, start it
npm run start:dev
```

**Solution 3: Check Database**
```bash
# Verify users exist
node check-all-users.js
```

---

### Problem: Performance Tests Show Slow Response Times

**Solution 1: Check Database Indexes**
```sql
-- Verify indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'loads';
```

**Solution 2: Run Migration**
```bash
# Ensure migration with indexes is applied
psql -U postgres -d urutix -f migrations/014_add_load_constraints.sql
```

**Solution 3: Analyze Database**
```sql
-- Update statistics
ANALYZE loads;
```

---

### Problem: "Load not found" Errors

**Solution: Create Test Data**
```bash
cd backend

# Create test loads
node -e "
const axios = require('axios');
async function createLoads() {
  const token = '<your-token>';
  for (let i = 0; i < 50; i++) {
    await axios.post('http://localhost:3000/api/loads', {
      title: \`Test Load \${i+1}\`,
      description: 'Test load',
      weight: 5000,
      loadType: 'FTL',
      equipmentType: 'DRY_VAN',
      cargoType: 'GENERAL',
      urgencyLevel: 'NORMAL',
      visibility: 'PUBLIC',
      unitsRequired: 1,
      locations: [],
      pickupDate: new Date(Date.now() + 86400000).toISOString(),
      deliveryDate: new Date(Date.now() + 172800000).toISOString(),
      loadValue: 10000,
      paymentTerms: 'NET_30'
    }, {
      headers: { Authorization: \`Bearer \${token}\` }
    });
  }
}
createLoads();
"
```

---

## Test Data Setup

### Create Test Users
```bash
cd backend
node seed-tenant-users.js
```

This creates:
- `cargo1@test.com` / `Test123!@#` (Tenant 1 cargo owner)
- `cargo2@test.com` / `Test123!@#` (Tenant 2 cargo owner)
- `admin@test.com` / `Admin123!@#` (Admin user)

### Create Test Loads
```bash
# Login and get token first
TOKEN="<your-token>"

# Run performance test setup (creates 50 loads)
node test-cargo-owner-performance.js
```

---

## CI/CD Integration

### Add to GitHub Actions

Create `.github/workflows/cargo-owner-tests.yml`:

```yaml
name: Cargo Owner Tests

on:
  push:
    branches: [ main, superdashboard ]
  pull_request:
    branches: [ main, superdashboard ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: urutix_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run migrations
        run: |
          cd backend
          npm run migration:run
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/urutix_test
      
      - name: Run unit tests
        run: |
          cd backend
          npm test -- src/guards/__tests__/cargo-owner.guard.spec.ts
          npm test -- src/middleware/__tests__/tenant-verification.middleware.spec.ts
      
      - name: Start backend
        run: |
          cd backend
          npm run start:dev &
          sleep 15
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/urutix_test
      
      - name: Seed test data
        run: |
          cd backend
          node seed-tenant-users.js
      
      - name: Run integration tests
        run: |
          cd backend
          node test-cargo-owner-security.js
      
      - name: Run performance tests
        run: |
          cd backend
          node test-cargo-owner-performance.js
```

---

## Success Criteria

### All Tests Must Pass
- ✅ 24 unit tests pass
- ✅ 7 integration tests pass
- ✅ 7 performance tests pass

### Performance Targets Met
- ✅ 10 loads: < 200ms response time
- ✅ 50 loads: < 500ms response time
- ✅ 100 loads: < 1000ms response time
- ✅ Pagination limit enforced at 100
- ✅ CargoOwner data loaded via eager loading

### Security Verified
- ✅ Cross-tenant access blocked
- ✅ Unauthorized updates blocked
- ✅ Input validation working
- ✅ Authentication required

---

## Next Steps

1. ✅ Run all tests locally
2. ⏳ Fix any failing tests
3. ⏳ Add tests to CI/CD pipeline
4. ⏳ Deploy to staging
5. ⏳ Run tests in staging
6. ⏳ Deploy to production

---

## Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review test output for specific errors
3. Check backend logs: `pm2 logs backend`
4. Verify database state
5. Ensure all migrations are applied

---

**Document Version**: 1.0  
**Last Updated**: February 17, 2026  
**Status**: ✅ COMPLETE
