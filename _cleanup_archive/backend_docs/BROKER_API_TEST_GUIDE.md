# Broker API Endpoints Test Guide

This guide provides instructions and examples for testing all broker-related API endpoints.

## Prerequisites

1. **Backend server running**: `http://localhost:3002`
2. **Authentication token**: You need a JWT token from a logged-in user with appropriate role
3. **Test user**: A user with `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN` role for creating brokers

## Base URL

```
http://localhost:3002/api
```

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Quick Start

### Option 1: Use the PowerShell Test Script (Windows)

```powershell
cd urutix/backend
.\test-broker-endpoints.ps1
```

### Option 2: Use the Bash Test Script (Linux/Mac)

```bash
cd urutix/backend
chmod +x test-broker-endpoints.sh
./test-broker-endpoints.sh
```

### Option 3: Manual Testing with cURL

See examples below for each endpoint.

---

## API Endpoints

### 1. Create Broker

**Endpoint**: `POST /api/brokers`

**Required Role**: `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN`

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "defaultCommissionRate": 5.0
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:3002/api/brokers" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "defaultCommissionRate": 5.0
  }'
```

**Response**:
```json
{
  "broker": {
    "id": "uuid",
    "email": "john.doe@example.com",
    "role": "BROKER",
    "defaultCommissionRate": 5.0,
    "totalCommissionEarned": 0
  },
  "message": "Broker created successfully. Invitation email sent."
}
```

---

### 2. Get All Brokers

**Endpoint**: `GET /api/brokers`

**Required Role**: `TENANT_ADMIN`, `ADMIN`, `SUPER_ADMIN`, or `BROKER`

**cURL Example**:
```bash
curl -X GET "http://localhost:3002/api/brokers" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Response**:
```json
[
  {
    "id": "uuid",
    "email": "john.doe@example.com",
    "role": "BROKER",
    "defaultCommissionRate": 5.0,
    "totalCommissionEarned": 0,
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }
]
```

---

### 3. Get Broker by ID

**Endpoint**: `GET /api/brokers/:brokerId`

**Required Role**: `TENANT_ADMIN`, `ADMIN`, `SUPER_ADMIN`, or `BROKER` (can only view own profile)

**cURL Example**:
```bash
curl -X GET "http://localhost:3002/api/brokers/BROKER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### 4. Update Broker

**Endpoint**: `PUT /api/brokers/:brokerId`

**Required Role**: `TENANT_ADMIN`, `ADMIN`, `SUPER_ADMIN`, or `BROKER` (can only update own profile)

**Request Body**:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+9876543210",
  "defaultCommissionRate": 7.5
}
```

**cURL Example**:
```bash
curl -X PUT "http://localhost:3002/api/brokers/BROKER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "defaultCommissionRate": 7.5
  }'
```

---

### 5. Delete Broker

**Endpoint**: `DELETE /api/brokers/:brokerId`

**Required Role**: `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN`

**cURL Example**:
```bash
curl -X DELETE "http://localhost:3002/api/brokers/BROKER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Response**: `204 No Content`

---

### 6. Get Broker Loads

**Endpoint**: `GET /api/brokers/:brokerId/loads`

**Required Role**: `TENANT_ADMIN`, `ADMIN`, `SUPER_ADMIN`, or `BROKER` (can only view own loads)

**cURL Example**:
```bash
curl -X GET "http://localhost:3002/api/brokers/BROKER_ID/loads" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### 7. Get Broker Commissions

**Endpoint**: `GET /api/brokers/:brokerId/commissions`

**Query Parameters**:
- `status` (optional): Filter by status (`PENDING`, `APPROVED`, `PAID`, `CANCELLED`)
- `loadId` (optional): Filter by load ID
- `startDate` (optional): Filter by start date (ISO format)
- `endDate` (optional): Filter by end date (ISO format)
- `page` (optional): Page number for pagination
- `limit` (optional): Items per page

**Required Role**: `TENANT_ADMIN`, `ADMIN`, `SUPER_ADMIN`, or `BROKER` (can only view own commissions)

**cURL Example**:
```bash
# Get all commissions
curl -X GET "http://localhost:3002/api/brokers/BROKER_ID/commissions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Get pending commissions only
curl -X GET "http://localhost:3002/api/brokers/BROKER_ID/commissions?status=PENDING" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Get commissions with pagination
curl -X GET "http://localhost:3002/api/brokers/BROKER_ID/commissions?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Response**:
```json
{
  "commissions": [
    {
      "id": "uuid",
      "loadId": "uuid",
      "loadAmount": 10000,
      "commissionRate": 5.0,
      "commissionAmount": 500,
      "status": "PENDING",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "totalEarned": 0,
  "totalPending": 500
}
```

---

### 8. Get Broker Statistics

**Endpoint**: `GET /api/brokers/:brokerId/statistics`

**Required Role**: `TENANT_ADMIN`, `ADMIN`, `SUPER_ADMIN`, or `BROKER` (can only view own statistics)

**cURL Example**:
```bash
curl -X GET "http://localhost:3002/api/brokers/BROKER_ID/statistics" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Response**:
```json
{
  "totalCommissions": 500,
  "totalEarned": 0,
  "totalPending": 500,
  "totalApproved": 0,
  "totalLoads": 1,
  "averageCommissionRate": 5.0
}
```

---

### 9. Assign Broker to Load

**Endpoint**: `POST /api/brokers/loads/:loadId/assign`

**Required Role**: `TENANT_ADMIN`, `ADMIN`, `SUPER_ADMIN`, or `CARGO_OWNER`

**Request Body**:
```json
{
  "brokerId": "uuid",
  "commissionRate": 5.5
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:3002/api/brokers/loads/LOAD_ID/assign" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brokerId": "BROKER_ID",
    "commissionRate": 5.5
  }'
```

**Response**:
```json
{
  "id": "load-uuid",
  "brokerId": "broker-uuid",
  "brokerCommissionRate": 5.5,
  "brokerCommissionAmount": 550,
  "loadValue": 10000
}
```

---

### 10. Unassign Broker from Load

**Endpoint**: `DELETE /api/brokers/loads/:loadId/assign`

**Required Role**: `TENANT_ADMIN`, `ADMIN`, `SUPER_ADMIN`, or `CARGO_OWNER`

**cURL Example**:
```bash
curl -X DELETE "http://localhost:3002/api/brokers/loads/LOAD_ID/assign" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Response**: `204 No Content`

---

### 11. Update Commission Status

**Endpoint**: `PUT /api/brokers/commissions/:commissionId/status`

**Required Role**: `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN`

**Request Body**:
```json
{
  "status": "PAID",
  "paymentReference": "PAY-12345"
}
```

**cURL Example**:
```bash
curl -X PUT "http://localhost:3002/api/brokers/commissions/COMMISSION_ID/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PAID",
    "paymentReference": "PAY-12345"
  }'
```

**Valid Status Values**:
- `PENDING` - Commission is pending approval
- `APPROVED` - Commission has been approved
- `PAID` - Commission has been paid
- `CANCELLED` - Commission has been cancelled

---

## Complete Test Flow

### Step 1: Login and Get Token

```bash
# Login as Tenant Admin
curl -X POST "http://localhost:3002/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'

# Save the token from the response
export TOKEN="your-jwt-token-here"
```

### Step 2: Create a Broker

```bash
curl -X POST "http://localhost:3002/api/brokers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "broker@example.com",
    "phone": "+1234567890",
    "defaultCommissionRate": 5.0
  }'
```

### Step 3: Get Broker ID and Test Endpoints

```bash
# Get all brokers
curl -X GET "http://localhost:3002/api/brokers" \
  -H "Authorization: Bearer $TOKEN"

# Get broker statistics
curl -X GET "http://localhost:3002/api/brokers/BROKER_ID/statistics" \
  -H "Authorization: Bearer $TOKEN"

# Get broker commissions
curl -X GET "http://localhost:3002/api/brokers/BROKER_ID/commissions" \
  -H "Authorization: Bearer $TOKEN"
```

### Step 4: Assign Broker to a Load

```bash
# First, create or get a load ID
# Then assign broker to load
curl -X POST "http://localhost:3002/api/brokers/loads/LOAD_ID/assign" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brokerId": "BROKER_ID",
    "commissionRate": 5.5
  }'
```

### Step 5: Update Commission Status

```bash
# Get commission ID from previous step
# Update commission status to PAID
curl -X PUT "http://localhost:3002/api/brokers/commissions/COMMISSION_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PAID",
    "paymentReference": "PAY-12345"
  }'
```

---

## Testing with Swagger UI

1. **Start the backend server**:
   ```bash
   npm run start:dev
   ```

2. **Open Swagger UI**:
   ```
   http://localhost:3002/api/docs
   ```

3. **Authorize**:
   - Click the "Authorize" button
   - Enter your JWT token: `Bearer YOUR_TOKEN`
   - Click "Authorize"

4. **Test Endpoints**:
   - Find the `/brokers` endpoints
   - Click "Try it out"
   - Fill in the parameters
   - Click "Execute"

---

## Common Issues

### 401 Unauthorized
- **Cause**: Missing or invalid JWT token
- **Solution**: Login again and get a fresh token

### 403 Forbidden
- **Cause**: User doesn't have the required role
- **Solution**: Use a user with `TENANT_ADMIN`, `ADMIN`, or `SUPER_ADMIN` role

### 404 Not Found
- **Cause**: Broker ID doesn't exist or belongs to different tenant
- **Solution**: Verify the broker ID and ensure you're using the correct tenant

### 400 Bad Request
- **Cause**: Invalid request body or missing required fields
- **Solution**: Check the DTO requirements and ensure all required fields are provided

---

## Expected Test Results

After running the complete test flow, you should see:

1. ✅ Broker created successfully
2. ✅ Broker appears in the list
3. ✅ Broker statistics show zero commissions initially
4. ✅ After assigning broker to load, commission record is created
5. ✅ Commission status can be updated through the workflow
6. ✅ Broker's total commission earned updates when status changes to PAID

---

## Notes

- All commission amounts are calculated automatically when a broker is assigned to a load
- Commission records are created with `PENDING` status by default
- When a load's value changes, commissions are automatically recalculated
- Brokers can only view their own data (loads, commissions, statistics)
- Tenant Admins can manage all brokers in their tenant

