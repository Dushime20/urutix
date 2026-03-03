# Fuel Features - Complete API Reference

## Authentication
All endpoints require JWT bearer token in Authorization header:
```
Authorization: Bearer {jwt_token}
```

## Base URL
```
http://localhost:3000/fuel
```

---

## FUEL WALLET ENDPOINTS

### 1. Get Wallet
**Endpoint**: `GET /wallets/:id`

**Description**: Retrieve a specific fuel wallet

**Parameters**:
- `id` (path, required): Wallet UUID

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "driverId": "uuid",
    "truckId": "uuid",
    "balance": 1500.50,
    "totalCredits": 2000.00,
    "totalDebits": 500.00,
    "status": "ACTIVE",
    "lastTransactionAt": "2026-02-27T10:30:00Z",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-02-27T10:30:00Z"
  }
}
```

---

### 2. Get Driver Wallet
**Endpoint**: `GET /wallets/driver/:driverId`

**Description**: Get or create fuel wallet for a driver

**Parameters**:
- `driverId` (path, required): Driver UUID

**Response**: Same as Get Wallet

---

### 3. Add Credit to Wallet
**Endpoint**: `POST /wallets/:id/credit`

**Description**: Add fuel credit to a wallet

**Parameters**:
- `id` (path, required): Wallet UUID

**Request Body**:
```json
{
  "amount": 500.00,
  "description": "Monthly fuel allowance",
  "referenceId": "ALLOW-2026-01"
}
```

**Response**: Same as Get Wallet (updated balance)

---

### 4. Get Wallet Transactions
**Endpoint**: `GET /wallets/:id/transactions`

**Description**: Get transaction history for a wallet

**Parameters**:
- `id` (path, required): Wallet UUID
- `limit` (query, optional): Number of records (default: 50)
- `offset` (query, optional): Pagination offset (default: 0)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "walletId": "uuid",
      "type": "CREDIT",
      "amount": 500.00,
      "fuelLogId": null,
      "description": "Monthly fuel allowance",
      "referenceId": "ALLOW-2026-01",
      "createdAt": "2026-02-27T10:30:00Z"
    },
    {
      "id": "uuid",
      "tenantId": "uuid",
      "walletId": "uuid",
      "type": "DEBIT",
      "amount": 150.00,
      "fuelLogId": "uuid",
      "description": "Fuel purchase debit",
      "createdAt": "2026-02-27T11:00:00Z"
    }
  ],
  "total": 2
}
```

---

### 5. Get Wallet Statistics
**Endpoint**: `GET /wallets/stats/overview`

**Description**: Get aggregated wallet statistics for tenant

**Response**:
```json
{
  "success": true,
  "data": {
    "totalBalance": 15000.50,
    "totalCredits": 20000.00,
    "totalDebits": 5000.00,
    "activeWallets": 25,
    "totalWallets": 30,
    "averageBalance": 500.02
  }
}
```

---

## FUEL BUDGET ENDPOINTS

### 1. Create Fuel Budget
**Endpoint**: `POST /budgets`

**Description**: Create a fuel budget for a trip

**Request Body**:
```json
{
  "tripId": "uuid",
  "truckId": "uuid",
  "budgetedAmount": 500.00,
  "alertThreshold": 10
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "tripId": "uuid",
    "truckId": "uuid",
    "budgetedAmount": 500.00,
    "actualAmount": 0.00,
    "variance": 500.00,
    "status": "PLANNED",
    "variancePercentage": 100.00,
    "alertThreshold": 10,
    "alertTriggered": false,
    "createdAt": "2026-02-27T10:30:00Z",
    "updatedAt": "2026-02-27T10:30:00Z"
  },
  "message": "Fuel budget created successfully"
}
```

---

### 2. Get Fuel Budget
**Endpoint**: `GET /budgets/:id`

**Description**: Retrieve a specific fuel budget

**Parameters**:
- `id` (path, required): Budget UUID

**Response**: Same as Create Fuel Budget

---

### 3. Record Fuel Expense
**Endpoint**: `POST /budgets/:id/record-expense`

**Description**: Record a fuel expense against a budget

**Parameters**:
- `id` (path, required): Budget UUID

**Request Body**:
```json
{
  "fuelCost": 150.00
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "budgetedAmount": 500.00,
    "actualAmount": 150.00,
    "variance": 350.00,
    "variancePercentage": 70.00,
    "status": "IN_PROGRESS",
    "alertTriggered": false
  },
  "message": "Fuel expense recorded successfully"
}
```

---

### 4. Get Budget Analysis
**Endpoint**: `GET /budgets/analysis/:tripId`

**Description**: Get detailed analysis of a trip fuel budget

**Parameters**:
- `tripId` (path, required): Trip UUID

**Response**:
```json
{
  "success": true,
  "data": {
    "budgetId": "uuid",
    "tripId": "uuid",
    "budgetedAmount": 500.00,
    "actualAmount": 150.00,
    "variance": 350.00,
    "variancePercentage": 70.00,
    "status": "IN_PROGRESS",
    "alertTriggered": false,
    "fuelLogsCount": 3,
    "isOverBudget": false,
    "remainingBudget": 350.00
  }
}
```

---

### 5. Get Over-Budget Trips
**Endpoint**: `GET /budgets/status/over-budget`

**Description**: Get all trips that are over their fuel budget

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tripId": "uuid",
      "budgetedAmount": 500.00,
      "actualAmount": 550.00,
      "variance": -50.00,
      "status": "OVER_BUDGET",
      "alertTriggered": true
    }
  ],
  "count": 1
}
```

---

## DRIVER FUEL ADVANCE ENDPOINTS

### 1. Request Fuel Advance
**Endpoint**: `POST /advances/request`

**Description**: Request a fuel advance as a driver

**Request Body**:
```json
{
  "advanceAmount": 1000.00,
  "tripId": "uuid",
  "notes": "Fuel advance for long haul trip"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "driverId": "uuid",
    "tripId": "uuid",
    "advanceAmount": 1000.00,
    "advanceDate": "2026-02-27T10:30:00Z",
    "status": "PENDING",
    "approvedBy": null,
    "approvedAt": null,
    "reconciliationDate": null,
    "reconciliationAmount": null,
    "notes": "Fuel advance for long haul trip",
    "createdAt": "2026-02-27T10:30:00Z"
  },
  "message": "Fuel advance requested successfully"
}
```

---

### 2. Get Fuel Advance
**Endpoint**: `GET /advances/:id`

**Description**: Retrieve a specific fuel advance

**Parameters**:
- `id` (path, required): Advance UUID

**Response**: Same as Request Fuel Advance

---

### 3. Get Driver Advances
**Endpoint**: `GET /advances/driver/:driverId`

**Description**: Get all fuel advances for a driver

**Parameters**:
- `driverId` (path, required): Driver UUID
- `status` (query, optional): Filter by status (PENDING, APPROVED, REJECTED, RECONCILED)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "driverId": "uuid",
      "advanceAmount": 1000.00,
      "status": "APPROVED",
      "approvedAt": "2026-02-27T11:00:00Z"
    }
  ],
  "count": 1
}
```

---

### 4. Approve Fuel Advance
**Endpoint**: `PUT /advances/:id/approve`

**Description**: Approve a pending fuel advance

**Parameters**:
- `id` (path, required): Advance UUID

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "APPROVED",
    "approvedBy": "uuid",
    "approvedAt": "2026-02-27T11:00:00Z"
  },
  "message": "Fuel advance approved successfully"
}
```

---

### 5. Reject Fuel Advance
**Endpoint**: `PUT /advances/:id/reject`

**Description**: Reject a pending fuel advance

**Parameters**:
- `id` (path, required): Advance UUID

**Request Body**:
```json
{
  "rejectionReason": "Insufficient funds in company account"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "REJECTED",
    "rejectionReason": "Insufficient funds in company account"
  },
  "message": "Fuel advance rejected successfully"
}
```

---

### 6. Reconcile Fuel Advance
**Endpoint**: `PUT /advances/:id/reconcile`

**Description**: Reconcile a fuel advance with actual fuel purchases

**Parameters**:
- `id` (path, required): Advance UUID

**Request Body**:
```json
{
  "reconciliationAmount": 950.00,
  "reconciliationNotes": "Actual fuel spent: $950, remaining $50 to be returned"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "RECONCILED",
    "reconciliationDate": "2026-02-27T15:00:00Z",
    "reconciliationAmount": 950.00,
    "reconciliationNotes": "Actual fuel spent: $950, remaining $50 to be returned"
  },
  "message": "Fuel advance reconciled successfully"
}
```

---

### 7. Get Pending Advances
**Endpoint**: `GET /advances/pending/all`

**Description**: Get all pending fuel advances for approval (admin only)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "driverId": "uuid",
      "advanceAmount": 1000.00,
      "advanceDate": "2026-02-27T10:30:00Z",
      "status": "PENDING"
    }
  ],
  "count": 1
}
```

---

### 8. Get Advance Statistics
**Endpoint**: `GET /advances/stats/overview`

**Description**: Get aggregated fuel advance statistics

**Response**:
```json
{
  "success": true,
  "data": {
    "totalAdvances": 50,
    "pendingCount": 5,
    "approvedCount": 20,
    "reconciledCount": 20,
    "rejectedCount": 5,
    "totalAdvanced": 50000.00,
    "totalReconciled": 48500.00,
    "pendingAmount": 5000.00,
    "approvedAmount": 20000.00
  }
}
```

---

### 9. Get Driver Advance Balance
**Endpoint**: `GET /advances/driver/:driverId/balance`

**Description**: Get outstanding fuel advance balance for a driver

**Parameters**:
- `driverId` (path, required): Driver UUID

**Response**:
```json
{
  "success": true,
  "data": {
    "balance": 1500.00
  }
}
```

---

## ERROR RESPONSES

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Advance amount must be greater than 0",
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Fuel wallet with ID {id} not found",
  "error": "Not Found"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

---

## STATUS CODES

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## ENUMS

### Wallet Status
- `ACTIVE` - Wallet is active
- `SUSPENDED` - Wallet is suspended
- `CLOSED` - Wallet is closed

### Transaction Type
- `CREDIT` - Credit to wallet
- `DEBIT` - Debit from wallet

### Budget Status
- `PLANNED` - Budget created, not started
- `IN_PROGRESS` - Trip in progress
- `COMPLETED` - Trip completed
- `OVER_BUDGET` - Actual exceeds budget
- `CANCELLED` - Budget cancelled

### Advance Status
- `PENDING` - Awaiting approval
- `APPROVED` - Approved by admin
- `REJECTED` - Rejected by admin
- `RECONCILED` - Reconciled with actual
- `CANCELLED` - Cancelled

---

## RATE LIMITING

No rate limiting currently implemented. Consider adding:
- 100 requests per minute per user
- 1000 requests per minute per tenant

---

## PAGINATION

For endpoints returning lists, use:
- `limit`: Number of records (default: 50, max: 500)
- `offset`: Pagination offset (default: 0)

Example:
```
GET /wallets/:id/transactions?limit=25&offset=50
```

---

## FILTERING

### By Status
```
GET /advances/driver/:driverId?status=PENDING
```

### By Date Range
```
GET /fuel/logs?startDate=2026-01-01&endDate=2026-02-27
```

---

## SORTING

Default sorting:
- Wallets: By creation date (newest first)
- Budgets: By creation date (newest first)
- Advances: By advance date (newest first)
- Transactions: By creation date (newest first)

---

## EXAMPLES

### Complete Wallet Workflow
```bash
# 1. Get driver wallet
curl -X GET http://localhost:3000/fuel/wallets/driver/{driverId} \
  -H "Authorization: Bearer {token}"

# 2. Add credit
curl -X POST http://localhost:3000/fuel/wallets/{walletId}/credit \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"amount": 500, "description": "Monthly allowance"}'

# 3. View transactions
curl -X GET http://localhost:3000/fuel/wallets/{walletId}/transactions \
  -H "Authorization: Bearer {token}"
```

### Complete Budget Workflow
```bash
# 1. Create budget
curl -X POST http://localhost:3000/fuel/budgets \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"tripId": "{tripId}", "truckId": "{truckId}", "budgetedAmount": 500}'

# 2. Record expense
curl -X POST http://localhost:3000/fuel/budgets/{budgetId}/record-expense \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"fuelCost": 150}'

# 3. Get analysis
curl -X GET http://localhost:3000/fuel/budgets/analysis/{tripId} \
  -H "Authorization: Bearer {token}"
```

### Complete Advance Workflow
```bash
# 1. Request advance
curl -X POST http://localhost:3000/fuel/advances/request \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"advanceAmount": 1000, "tripId": "{tripId}"}'

# 2. Approve (admin)
curl -X PUT http://localhost:3000/fuel/advances/{advanceId}/approve \
  -H "Authorization: Bearer {adminToken}"

# 3. Reconcile
curl -X PUT http://localhost:3000/fuel/advances/{advanceId}/reconcile \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"reconciliationAmount": 950}'
```

---

## SUPPORT

For API issues:
1. Check request format matches examples
2. Verify JWT token is valid
3. Check tenant context is set
4. Review error message for details
5. Check database connection
