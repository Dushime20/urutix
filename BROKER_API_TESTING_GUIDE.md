# Broker Critical Features API Testing Guide

## Overview

This guide provides comprehensive testing instructions for all the new broker critical features endpoints.

## Prerequisites

1. Backend server running on `http://localhost:3002`
2. Valid broker user account
3. JWT authentication token
4. Test data (loads, transporters)

---

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Get Token

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "broker1@test.com",
  "password": "test123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "broker-uuid",
    "role": "BROKER",
    "tenantId": "tenant-uuid"
  }
}
```

---

## 1. Contract Management

### Create Contract

**Endpoint:** `POST /api/brokers/contracts`

**Request Body:**
```json
{
  "loadId": "load-uuid",
  "transporterId": "transporter-uuid",
  "tripId": "trip-uuid", // optional
  "contractType": "LOAD_AGREEMENT", // optional
  "agreedRate": 50000,
  "currencyCode": "KES", // optional, default: KES
  "commissionRate": 5,
  "paymentTerms": "Net 30", // optional
  "paymentDueDate": "2025-02-15", // optional
  "pickupDate": "2025-01-20", // optional
  "deliveryDate": "2025-01-22", // optional
  "deliveryTerms": "FOB", // optional
  "specialInstructions": "Handle with care", // optional
  "expiresAt": "2025-01-25" // optional
}
```

**Response:**
```json
{
  "id": "contract-uuid",
  "status": "DRAFT",
  "agreedRate": 50000,
  "commissionRate": 5,
  "commissionAmount": 2500,
  "contractContent": "...",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

### Get Contracts

**Endpoint:** `GET /api/brokers/contracts`

**Query Parameters:**
- `status` (optional): Filter by status (DRAFT, PENDING_SIGNATURE, SIGNED, etc.)
- `loadId` (optional): Filter by load ID
- `transporterId` (optional): Filter by transporter ID

**Example:**
```bash
GET /api/brokers/contracts?status=DRAFT&loadId=load-uuid
```

### Get Single Contract

**Endpoint:** `GET /api/brokers/contracts/:contractId`

### Sign Contract

**Endpoint:** `PUT /api/brokers/contracts/:contractId/sign`

**Request Body:**
```json
{
  "signatureMethod": "DIGITAL", // DIGITAL, E_SIGNATURE, or MANUAL
  "signatureData": "base64-signature-data", // optional
  "metadata": {
    "ipAddress": "192.168.1.1" // optional
  }
}
```

---

## 2. Insurance Verification

### Verify Insurance/Compliance

**Endpoint:** `POST /api/brokers/insurance/verify`

**Request Body:**
```json
{
  "transporterId": "transporter-uuid",
  "loadId": "load-uuid", // optional
  "verificationType": "INSURANCE", // INSURANCE, LICENSE, DOT_NUMBER, MC_NUMBER, CARGO_INSURANCE, BOND
  "policyNumber": "POL-12345", // optional
  "licenseNumber": "LIC-12345", // optional
  "dotNumber": "DOT-12345", // optional
  "mcNumber": "MC-12345", // optional
  "insuranceCompany": "Test Insurance Co", // optional
  "coverageAmount": 1000000, // optional
  "effectiveDate": "2024-12-01", // optional
  "expiryDate": "2025-12-01", // optional
  "verificationNotes": "Verified via API" // optional
}
```

**Response:**
```json
{
  "id": "verification-uuid",
  "status": "VERIFIED", // PENDING, VERIFIED, EXPIRED, INVALID, REQUIRES_UPDATE
  "verificationType": "INSURANCE",
  "expiryDate": "2025-12-01",
  "verifiedAt": "2025-01-15T10:00:00Z"
}
```

### Get Verifications

**Endpoint:** `GET /api/brokers/insurance/verify/:transporterId`

**Query Parameters:**
- `loadId` (optional): Filter by load ID

**Example:**
```bash
GET /api/brokers/insurance/verify/transporter-uuid?loadId=load-uuid
```

### Check Compliance

**Endpoint:** `GET /api/brokers/insurance/compliance/:transporterId`

**Query Parameters:**
- `types` (required): Comma-separated list of verification types

**Example:**
```bash
GET /api/brokers/insurance/compliance/transporter-uuid?types=INSURANCE,LICENSE,DOT_NUMBER
```

**Response:**
```json
{
  "isCompliant": true,
  "missingTypes": [],
  "expiredTypes": [],
  "warnings": []
}
```

---

## 3. Dispute Resolution

### Create Dispute

**Endpoint:** `POST /api/brokers/disputes`

**Request Body:**
```json
{
  "loadId": "load-uuid",
  "tripId": "trip-uuid", // optional
  "disputedWithId": "transporter-uuid",
  "category": "DELAY", // DAMAGE, DELAY, PAYMENT, QUALITY, ROUTE, COMMUNICATION, OTHER
  "severity": "MEDIUM", // LOW, MEDIUM, HIGH, CRITICAL
  "description": "Delivery was delayed by 2 days",
  "claimedAmount": 10000, // optional
  "evidence": [ // optional
    {
      "type": "DOCUMENT", // PHOTO, DOCUMENT, VIDEO, AUDIO, OTHER
      "url": "https://example.com/evidence.pdf",
      "description": "Delivery delay documentation"
    }
  ]
}
```

**Response:**
```json
{
  "id": "dispute-uuid",
  "status": "OPEN",
  "category": "DELAY",
  "severity": "MEDIUM",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

### Get Disputes

**Endpoint:** `GET /api/brokers/disputes`

**Query Parameters:**
- `status` (optional): Filter by status
- `category` (optional): Filter by category
- `loadId` (optional): Filter by load ID

### Get Single Dispute

**Endpoint:** `GET /api/brokers/disputes/:disputeId`

### Start Mediation

**Endpoint:** `PUT /api/brokers/disputes/:disputeId/mediate`

**Request Body:**
```json
{
  "notes": "Broker starting mediation process" // optional
}
```

### Resolve Dispute

**Endpoint:** `PUT /api/brokers/disputes/:disputeId/resolve`

**Request Body:**
```json
{
  "resolution": "Dispute resolved through mediation. Transporter agrees to pay 50% of claimed amount.",
  "resolvedAmount": 5000, // optional
  "resolutionTerms": { // optional
    "paymentDueDate": "2025-02-01",
    "paymentMethod": "Bank Transfer"
  }
}
```

---

## 4. Escrow Management

### Create Escrow Account

**Endpoint:** `POST /api/brokers/escrow`

**Request Body:**
```json
{
  "loadId": "load-uuid",
  "tripId": "trip-uuid", // optional
  "payerId": "cargo-owner-uuid",
  "payeeId": "transporter-uuid",
  "totalAmount": 50000,
  "currencyCode": "KES", // optional, default: KES
  "commissionAmount": 2500,
  "paymentMethod": "Bank Transfer", // optional
  "releaseSchedule": [ // optional
    {
      "milestone": "Delivery Confirmed",
      "amount": 50000,
      "percentage": 100, // alternative to amount
      "trigger": "DELIVERY_CONFIRMED" // DELIVERY_CONFIRMED, MILESTONE_REACHED, MANUAL, DISPUTE_RESOLVED, TIME_BASED
    }
  ],
  "autoReleaseConfig": { // optional
    "enabled": true,
    "trigger": "DELIVERY_CONFIRMED",
    "delayHours": 24,
    "requireConfirmation": false
  }
}
```

**Response:**
```json
{
  "id": "escrow-uuid",
  "status": "PENDING",
  "totalAmount": 50000,
  "fundedAmount": 0,
  "releasedAmount": 0,
  "commissionAmount": 2500
}
```

### Get Escrow Accounts

**Endpoint:** `GET /api/brokers/escrow`

**Query Parameters:**
- `status` (optional): Filter by status
- `loadId` (optional): Filter by load ID

### Get Single Escrow

**Endpoint:** `GET /api/brokers/escrow/:escrowId`

### Fund Escrow

**Endpoint:** `PUT /api/brokers/escrow/:escrowId/fund`

**Request Body:**
```json
{
  "amount": 50000,
  "paymentMethod": "Bank Transfer",
  "paymentReference": "TXN-12345",
  "transactionId": "TXN-12345" // optional
}
```

### Release Funds

**Endpoint:** `PUT /api/brokers/escrow/:escrowId/release`

**Request Body:**
```json
{
  "amount": 50000,
  "trigger": "DELIVERY_CONFIRMED",
  "paymentReference": "PAY-12345", // optional
  "notes": "Payment released after delivery confirmation" // optional
}
```

---

## 5. Document Management

### Upload Document

**Endpoint:** `POST /api/brokers/documents`

**Request Body:**
```json
{
  "loadId": "load-uuid",
  "tripId": "trip-uuid", // optional
  "documentType": "PROOF_OF_DELIVERY", // BILL_OF_LADING, PROOF_OF_DELIVERY, PROOF_OF_PICKUP, INVOICE, COMMISSION_INVOICE, etc.
  "fileName": "pod-12345.pdf",
  "fileUrl": "https://storage.example.com/pod-12345.pdf",
  "fileType": "application/pdf", // optional
  "fileSize": 102400, // optional, in bytes
  "mimeType": "application/pdf", // optional
  "description": "Proof of delivery document", // optional
  "expiresAt": "2025-12-31" // optional
}
```

### Generate Bill of Lading

**Endpoint:** `POST /api/brokers/documents/bol/:loadId`

**Request Body:**
```json
{
  // Optional additional data
}
```

### Generate Proof of Delivery

**Endpoint:** `POST /api/brokers/documents/pod/:loadId?tripId=trip-uuid`

**Request Body:**
```json
{
  "condition": "Good",
  "receivedBy": "John Doe",
  "signature": "base64-signature",
  "notes": "Delivery completed successfully"
}
```

### Get Load Documents

**Endpoint:** `GET /api/brokers/documents/load/:loadId`

**Query Parameters:**
- `type` (optional): Filter by document type

**Example:**
```bash
GET /api/brokers/documents/load/load-uuid?type=PROOF_OF_DELIVERY
```

### Verify Document

**Endpoint:** `PUT /api/brokers/documents/:documentId/verify`

**Request Body:**
```json
{
  "notes": "Document verified and approved" // optional
}
```

---

## Testing Workflow

### Complete Broker Workflow Test

1. **Login as Broker**
   ```bash
   POST /api/auth/login
   ```

2. **Get Available Load**
   ```bash
   GET /api/loads-v2?status=PUBLISHED
   ```

3. **Assign Broker to Load** (if not already assigned)
   ```bash
   POST /api/brokers/loads/{loadId}/assign
   ```

4. **Verify Transporter Insurance**
   ```bash
   POST /api/brokers/insurance/verify
   ```

5. **Create Contract**
   ```bash
   POST /api/brokers/contracts
   ```

6. **Sign Contract** (as cargo owner and transporter)
   ```bash
   PUT /api/brokers/contracts/{contractId}/sign
   ```

7. **Create Escrow Account**
   ```bash
   POST /api/brokers/escrow
   ```

8. **Fund Escrow**
   ```bash
   PUT /api/brokers/escrow/{escrowId}/fund
   ```

9. **Generate BOL**
   ```bash
   POST /api/brokers/documents/bol/{loadId}
   ```

10. **Generate POD** (after delivery)
    ```bash
    POST /api/brokers/documents/pod/{loadId}?tripId={tripId}
    ```

11. **Release Escrow Funds**
    ```bash
    PUT /api/brokers/escrow/{escrowId}/release
    ```

---

## Error Responses

All endpoints return standard error responses:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Quick Test Script

Use the provided PowerShell script for automated testing:

```powershell
.\test-broker-critical-features.ps1
```

This script will test all endpoints automatically.

---

## Postman Collection

Import the following endpoints into Postman:

1. Create a new collection: "Broker Critical Features"
2. Add environment variables:
   - `baseUrl`: `http://localhost:3002/api`
   - `token`: (set after login)
   - `brokerId`: (set after login)
   - `tenantId`: (set after login)
   - `loadId`: (set after getting loads)
   - `transporterId`: (set after getting transporters)

3. Create requests for each endpoint above

---

## Notes

- All dates should be in ISO 8601 format (YYYY-MM-DD)
- All amounts are in the specified currency
- UUIDs should be valid UUID v4 format
- File URLs should be accessible URLs (not local paths)
- Some endpoints require specific user roles (BROKER, TENANT_ADMIN)

---

## Support

For issues or questions, check:
- Backend logs: `npm run start:dev`
- Database: Verify migrations ran successfully
- Authentication: Ensure JWT token is valid and not expired

