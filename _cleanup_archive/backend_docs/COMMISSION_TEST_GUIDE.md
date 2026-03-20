# Commission Calculation & Payment Tracking Test Guide

This guide provides step-by-step instructions for testing broker commission calculation and payment tracking.

## Quick Test Commands

### 1. Complete Commission Flow Test

```powershell
.\test-broker-commission-flow.ps1
```

This script will:
- ✅ Create a broker
- ✅ Create/use a load
- ✅ Assign broker to load
- ✅ Verify commission calculation
- ✅ Test status updates (PENDING → APPROVED → PAID)
- ✅ Verify payment tracking
- ✅ Check broker's total commission earned

### 2. Commission Calculation Accuracy Test

```powershell
.\test-commission-calculation.ps1
```

This script tests multiple commission calculation scenarios to verify accuracy.

---

## Manual Testing Steps

### Step 1: Login and Get Token

```bash
curl -X POST "http://localhost:3002/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Save the token
export TOKEN="your-jwt-token"
```

### Step 2: Create a Broker

```bash
curl -X POST "http://localhost:3002/api/brokers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Broker",
    "email": "broker@test.com",
    "defaultCommissionRate": 5.0
  }'

# Save the broker ID
export BROKER_ID="broker-uuid"
```

### Step 3: Create a Load (or use existing)

```bash
# Create a test load
curl -X POST "http://localhost:3002/api/loads" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Load for Commission",
    "weight": 1000,
    "loadValue": 10000,
    "currencyCode": "USD",
    "cargoType": "GENERAL",
    "urgencyLevel": "NORMAL",
    "loadType": "FTL",
    "equipmentType": "DRY_VAN",
    "locations": [
      {
        "type": "PICKUP",
        "locationData": {
          "name": "Pickup",
          "address": "123 Main St",
          "city": "New York",
          "state": "NY",
          "country": "USA"
        }
      },
      {
        "type": "DELIVERY",
        "locationData": {
          "name": "Delivery",
          "address": "456 Oak Ave",
          "city": "Los Angeles",
          "state": "CA",
          "country": "USA"
        }
      }
    ],
    "pickupDate": "2025-01-15T10:00:00Z",
    "deliveryDate": "2025-01-17T10:00:00Z"
  }'

# Save the load ID
export LOAD_ID="load-uuid"
```

### Step 4: Assign Broker to Load

```bash
curl -X POST "http://localhost:3002/api/brokers/loads/$LOAD_ID/assign" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brokerId": "'$BROKER_ID'",
    "commissionRate": 5.5
  }'
```

**Expected Response**:
```json
{
  "id": "load-uuid",
  "brokerId": "broker-uuid",
  "brokerCommissionRate": 5.5,
  "brokerCommissionAmount": 550,
  "loadValue": 10000
}
```

**Verification**:
- Commission Amount = (Load Value × Commission Rate) / 100
- Example: (10000 × 5.5) / 100 = 550 ✅

### Step 5: Verify Commission Record Created

```bash
curl -X GET "http://localhost:3002/api/brokers/$BROKER_ID/commissions?loadId=$LOAD_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response**:
```json
{
  "commissions": [
    {
      "id": "commission-uuid",
      "loadId": "load-uuid",
      "loadAmount": 10000,
      "commissionRate": 5.5,
      "commissionAmount": 550,
      "status": "PENDING",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "totalEarned": 0,
  "totalPending": 550
}
```

### Step 6: Update Commission Status to APPROVED

```bash
# Get commission ID from previous step
export COMMISSION_ID="commission-uuid"

curl -X PUT "http://localhost:3002/api/brokers/commissions/$COMMISSION_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED"
  }'
```

**Expected Response**:
```json
{
  "id": "commission-uuid",
  "status": "APPROVED",
  "commissionAmount": 550,
  ...
}
```

### Step 7: Update Commission Status to PAID

```bash
curl -X PUT "http://localhost:3002/api/brokers/commissions/$COMMISSION_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PAID",
    "paymentReference": "PAY-12345"
  }'
```

**Expected Response**:
```json
{
  "id": "commission-uuid",
  "status": "PAID",
  "commissionAmount": 550,
  "paidAt": "2025-01-01T12:00:00Z",
  "paymentReference": "PAY-12345",
  ...
}
```

### Step 8: Verify Broker's Total Commission Earned Updated

```bash
curl -X GET "http://localhost:3002/api/brokers/$BROKER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response**:
```json
{
  "id": "broker-uuid",
  "totalCommissionEarned": 550,
  "defaultCommissionRate": 5.0,
  ...
}
```

**Verification**:
- `totalCommissionEarned` should equal the paid commission amount (550) ✅

### Step 9: Verify Commission Statistics

```bash
curl -X GET "http://localhost:3002/api/brokers/$BROKER_ID/statistics" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response**:
```json
{
  "totalCommissions": 550,
  "totalEarned": 550,
  "totalPending": 0,
  "totalApproved": 0,
  "totalLoads": 1,
  "averageCommissionRate": 5.5
}
```

**Verification**:
- `totalEarned` = 550 ✅
- `totalPending` = 0 (since we paid it) ✅
- `totalLoads` = 1 ✅

### Step 10: Test Commission Filtering

```bash
# Get all PAID commissions
curl -X GET "http://localhost:3002/api/brokers/$BROKER_ID/commissions?status=PAID" \
  -H "Authorization: Bearer $TOKEN"

# Get all PENDING commissions
curl -X GET "http://localhost:3002/api/brokers/$BROKER_ID/commissions?status=PENDING" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Commission Calculation Test Cases

### Test Case 1: Default Commission Rate
- **Load Value**: $10,000
- **Broker Default Rate**: 5%
- **Expected Commission**: $500
- **Formula**: (10000 × 5) / 100 = 500

### Test Case 2: Override Commission Rate
- **Load Value**: $25,000
- **Broker Default Rate**: 5%
- **Override Rate**: 7.5%
- **Expected Commission**: $1,875
- **Formula**: (25000 × 7.5) / 100 = 1875

### Test Case 3: High Value Load
- **Load Value**: $100,000
- **Commission Rate**: 10%
- **Expected Commission**: $10,000
- **Formula**: (100000 × 10) / 100 = 10000

### Test Case 4: Low Value Load
- **Load Value**: $1,500
- **Commission Rate**: 2.5%
- **Expected Commission**: $37.50
- **Formula**: (1500 × 2.5) / 100 = 37.5

---

## Payment Tracking Verification

### Verify Payment Reference is Stored

After updating commission status to PAID with a payment reference:

```bash
curl -X GET "http://localhost:3002/api/brokers/$BROKER_ID/commissions/$COMMISSION_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Check**:
- ✅ `status` = "PAID"
- ✅ `paidAt` is set (timestamp)
- ✅ `paymentReference` matches what you provided

### Verify Broker Total Updated

```bash
curl -X GET "http://localhost:3002/api/brokers/$BROKER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Check**:
- ✅ `totalCommissionEarned` includes the paid commission amount

### Verify Statistics Updated

```bash
curl -X GET "http://localhost:3002/api/brokers/$BROKER_ID/statistics" \
  -H "Authorization: Bearer $TOKEN"
```

**Check**:
- ✅ `totalEarned` includes paid commissions
- ✅ `totalPending` excludes paid commissions
- ✅ Numbers are accurate

---

## Status Workflow Test

Test the complete status workflow:

1. **PENDING** (default when commission is created)
   ```bash
   # Commission is created with PENDING status automatically
   ```

2. **APPROVED** (admin approves the commission)
   ```bash
   curl -X PUT ".../commissions/$COMMISSION_ID/status" \
     -d '{"status": "APPROVED"}'
   ```

3. **PAID** (commission is paid)
   ```bash
   curl -X PUT ".../commissions/$COMMISSION_ID/status" \
     -d '{"status": "PAID", "paymentReference": "PAY-123"}'
   ```

4. **CANCELLED** (if needed)
   ```bash
   curl -X PUT ".../commissions/$COMMISSION_ID/status" \
     -d '{"status": "CANCELLED"}'
   ```

---

## Expected Behaviors

### ✅ Commission Calculation
- Commission is calculated automatically when broker is assigned
- Formula: `(loadValue × commissionRate) / 100`
- Calculation is accurate to 2 decimal places
- Commission record is created with PENDING status

### ✅ Status Updates
- Status can be updated through the workflow
- When status changes to PAID:
  - `paidAt` timestamp is set
  - `paymentReference` is stored (if provided)
  - Broker's `totalCommissionEarned` is updated

### ✅ Payment Tracking
- Payment reference is stored and retrievable
- Paid commissions are excluded from pending totals
- Broker statistics reflect accurate totals

### ✅ Load Updates
- When load value changes, commission is recalculated
- When broker is removed, pending commissions are cancelled

---

## Troubleshooting

### Commission not created after assignment
- **Cause**: Commission creation might be asynchronous
- **Solution**: Wait 1-2 seconds and check again, or check service logs

### Total commission earned not updating
- **Cause**: Status might not be set to PAID
- **Solution**: Ensure you're updating status to PAID, not just APPROVED

### Commission calculation incorrect
- **Cause**: Rounding issues or formula error
- **Solution**: Verify formula: `(loadValue × rate) / 100`
- Check that values are numbers, not strings

### Cannot update commission status
- **Cause**: Missing permissions (need TENANT_ADMIN, ADMIN, or SUPER_ADMIN)
- **Solution**: Use appropriate user role

---

## Quick Verification Checklist

After running the test flow, verify:

- [ ] Broker created successfully
- [ ] Load created/retrieved successfully
- [ ] Broker assigned to load
- [ ] Commission amount calculated correctly
- [ ] Commission record created with PENDING status
- [ ] Status updated to APPROVED successfully
- [ ] Status updated to PAID successfully
- [ ] Payment reference stored correctly
- [ ] `paidAt` timestamp set
- [ ] Broker's `totalCommissionEarned` updated
- [ ] Statistics show correct totals
- [ ] Commission filtering works (by status)
- [ ] All calculations are accurate

---

## Running the Tests

### Option 1: Full Flow Test
```powershell
.\test-broker-commission-flow.ps1
```

### Option 2: Calculation Accuracy Test
```powershell
.\test-commission-calculation.ps1
```

### Option 3: Manual Testing
Follow the steps in this guide using cURL or Postman.

---

## Success Criteria

✅ **All tests pass if:**
1. Commission calculations are accurate (within 0.01 tolerance)
2. Commission records are created automatically
3. Status updates work correctly
4. Payment tracking stores references and timestamps
5. Broker totals update when commissions are paid
6. Statistics are accurate
7. Filtering works correctly

