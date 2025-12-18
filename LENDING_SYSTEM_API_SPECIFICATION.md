# External Lending System API Specification

## Overview

This document specifies the APIs and integration requirements for connecting your lending system with UrutiX Cargo Management Platform. This integration enables cargo owners to request loans, select loan officers, and have loan requests processed in your lending system.

---

## 🔐 Authentication

All API requests to your lending system must use API Key authentication:

**Header:**
```
X-API-Key: {api_key_provided_during_integration_setup}
```

**Content-Type:**
```
Content-Type: application/json
```

---

## 📋 Required API Endpoints

### 1. Get Loan Officers

**Purpose:** Fetch available loan officers that cargo owners can select when creating loan requests.

**Endpoint:**
```
GET /api/integration/loan-officers
```

**Headers:**
```
X-API-Key: {api_key}
Content-Type: application/json
```

**Response Format:**
```json
{
  "loanOfficers": [
    {
      "id": "officer-uuid-123",
      "name": "John Doe",
      "email": "john.doe@lending.com",
      "phone": "+1234567890",
      "status": "active",
      "lenderId": "lender-uuid-456",
      "specialization": "Trip Financing",
      "maxLoanAmount": 100000,
      "minLoanAmount": 1000,
      "available": true
    },
    {
      "id": "officer-uuid-789",
      "name": "Jane Smith",
      "email": "jane.smith@lending.com",
      "phone": "+1234567891",
      "status": "active",
      "lenderId": "lender-uuid-456",
      "specialization": "Trip Financing",
      "maxLoanAmount": 50000,
      "minLoanAmount": 500,
      "available": true
    }
  ]
}
```

**Response Fields:**
- `id` (required): Unique identifier for the loan officer
- `name` (required): Full name of the loan officer
- `email` (required): Email address
- `phone` (optional): Phone number
- `status` (required): Status - "active", "inactive", "busy"
- `lenderId` (optional): ID of the lender/company this officer belongs to
- `specialization` (optional): Type of loans they handle
- `maxLoanAmount` (optional): Maximum loan amount they can approve
- `minLoanAmount` (optional): Minimum loan amount they handle
- `available` (optional): Whether they're currently available

**Error Responses:**
```json
// 401 Unauthorized
{
  "error": "Invalid API key",
  "message": "The provided API key is invalid or expired"
}

// 500 Internal Server Error
{
  "error": "Internal server error",
  "message": "Failed to fetch loan officers"
}
```

---

### 2. Create Loan Application

**Purpose:** Receive loan application requests from UrutiX when a cargo owner requests financing.

**Endpoint:**
```
POST /api/integration/applications
```

**Headers:**
```
X-API-Key: {api_key}
Content-Type: application/json
```

**Request Body:**
```json
{
  "externalReferenceId": "loan-request-uuid-from-urutix",
  "loanProductCode": "PL-001",
  "companyId": "tenant-uuid-from-urutix",
  "requestedAmount": 50000,
  "applicationType": "Trip Financing",
  "loanOfficerId": "officer-uuid-123",
  "customer": {
    "externalCustomerId": "user-uuid-from-urutix",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890"
  },
  "tripId": "trip-uuid-from-urutix",
  "tripRevenue": 75000,
  "advanceAmount": 50000,
  "tripStartDate": "2024-02-01",
  "tripEndDate": "2024-02-15",
  "expectedRevenueDate": "2024-02-20"
}
```

**Request Fields:**
- `externalReferenceId` (required): Unique ID from UrutiX (used for idempotency)
- `loanProductCode` (required): Product code for the loan type
- `companyId` (required): Tenant/company ID from UrutiX
- `requestedAmount` (required): Loan amount requested
- `applicationType` (required): Type of application (e.g., "Trip Financing")
- `loanOfficerId` (required): ID of the loan officer selected by cargo owner
- `customer` (required): Customer information object
  - `externalCustomerId` (required): User ID from UrutiX
  - `firstName` (required): Customer's first name
  - `lastName` (required): Customer's last name
  - `email` (required): Customer's email
  - `phone` (optional): Customer's phone number
- `tripId` (required): Trip/load ID from UrutiX
- `tripRevenue` (required): Expected revenue from the trip
- `advanceAmount` (required): Advance amount requested
- `tripStartDate` (required): Trip start date (YYYY-MM-DD)
- `tripEndDate` (required): Trip end date (YYYY-MM-DD)
- `expectedRevenueDate` (required): Expected date when revenue will be received (YYYY-MM-DD)

**Response Format (Success):**
```json
{
  "applicationId": "application-uuid-in-your-system",
  "loanNumber": "LOAN-2024-000001",
  "status": "Submitted",
  "externalReferenceId": "loan-request-uuid-from-urutix",
  "approvedAmount": null,
  "message": "Application created successfully and assigned to loan officer"
}
```

**Response Fields:**
- `applicationId` (required): Unique application ID in your system
- `loanNumber` (required): Human-readable loan number (if available)
- `status` (required): Current status - "Submitted", "Under Review", "Approved", "Rejected"
- `externalReferenceId` (required): Echo back the external reference ID
- `approvedAmount` (optional): Approved amount (if immediately approved)
- `message` (optional): Status message

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Validation error",
  "message": "loanOfficerId is required",
  "details": {
    "field": "loanOfficerId",
    "reason": "Loan officer must be specified"
  }
}

// 404 Not Found
{
  "error": "Loan officer not found",
  "message": "The specified loan officer does not exist or is not available"
}

// 409 Conflict
{
  "error": "Duplicate application",
  "message": "An application with this externalReferenceId already exists"
}

// 500 Internal Server Error
{
  "error": "Internal server error",
  "message": "Failed to create application"
}
```

**Important Notes:**
- The application should be **automatically assigned to the specified loan officer**
- The loan officer should see this application in their portal/dashboard
- The application should be in "Submitted" or "Under Review" status initially

---

### 3. Get Application Status

**Purpose:** Allow UrutiX to check the current status of a loan application.

**Endpoint:**
```
GET /api/integration/applications/{externalReferenceId}
```

**Headers:**
```
X-API-Key: {api_key}
Content-Type: application/json
```

**Response Format:**
```json
{
  "applicationId": "application-uuid-in-your-system",
  "loanNumber": "LOAN-2024-000001",
  "status": "Approved",
  "externalReferenceId": "loan-request-uuid-from-urutix",
  "approvedAmount": 50000,
  "message": "Application approved by loan officer"
}
```

---

### 4. Get Loan Status

**Purpose:** Get current status of an active loan.

**Endpoint:**
```
GET /api/integration/loans/{loanNumber}/status
```

**Headers:**
```
X-API-Key: {api_key}
Content-Type: application/json
```

**Response Format:**
```json
{
  "loanNumber": "LOAN-2024-000001",
  "status": "Active",
  "loanAmount": 50000,
  "disbursedAmount": 50000,
  "outstandingBalance": 35000,
  "totalAmountPaid": 15000,
  "nextRepaymentDate": "2024-03-01",
  "nextRepaymentAmount": 5000
}
```

---

### 5. Post Repayment

**Purpose:** Receive repayment notifications from UrutiX when cargo owners make payments.

**Endpoint:**
```
POST /api/integration/repayments
```

**Headers:**
```
X-API-Key: {api_key}
Content-Type: application/json
```

**Request Body:**
```json
{
  "externalReferenceId": "loan-request-uuid-from-urutix",
  "loanReference": "LOAN-2024-000001",
  "amount": 5000,
  "paymentDate": "2024-02-15T10:30:00Z",
  "tripId": "trip-uuid-from-urutix",
  "revenueTransactionId": "payment-txn-id",
  "totalTripRevenue": 75000,
  "repaymentPercentage": 10
}
```

**Response Format:**
```json
{
  "success": true,
  "repaymentId": "repayment-uuid",
  "outstandingBalance": 30000,
  "message": "Repayment recorded successfully"
}
```

---

## 🔔 Webhook Requirements

Your lending system must send webhooks to UrutiX when loan status changes occur.

### Webhook URL

```
POST https://{urutix-domain}/api/platform/v1/loan_status_update
```

**Note:** The exact URL will be provided during integration setup.

### Webhook Authentication

**Headers:**
```
X-Webhook-Signature: {hmac_sha256_signature}
X-Lender-Id: {lender_uuid} (optional but recommended)
Content-Type: application/json
```

**Signature Calculation:**
```
HMAC-SHA256(payload_string, webhook_secret)
```

The signature should be calculated from the raw JSON string of the payload.

### Webhook Events

#### 1. Application Approved

**Event:** `application.approved`

**Payload:**
```json
{
  "event": "application.approved",
  "timestamp": "2024-02-01T10:30:00Z",
  "data": {
    "externalReferenceId": "loan-request-uuid-from-urutix",
    "applicationId": "application-uuid-in-your-system",
    "loanNumber": "LOAN-2024-000001",
    "status": "Approved",
    "approvedAmount": 50000,
    "approvedAt": "2024-02-01T10:30:00Z",
    "approvedBy": "officer-uuid-123",
    "loanOfficerName": "John Doe",
    "interestRate": 5.5,
    "dueDate": "2024-05-01"
  }
}
```

**When to Send:**
- When a loan officer approves an application
- When an application is automatically approved

#### 2. Application Rejected

**Event:** `application.rejected`

**Payload:**
```json
{
  "event": "application.rejected",
  "timestamp": "2024-02-01T10:30:00Z",
  "data": {
    "externalReferenceId": "loan-request-uuid-from-urutix",
    "applicationId": "application-uuid-in-your-system",
    "loanNumber": null,
    "status": "Rejected",
    "reason": "Insufficient credit history",
    "rejectedAt": "2024-02-01T10:30:00Z",
    "rejectedBy": "officer-uuid-123",
    "loanOfficerName": "John Doe"
  }
}
```

**When to Send:**
- When a loan officer rejects an application
- When an application is automatically rejected

#### 3. Loan Status Updated

**Event:** `loan.status.updated`

**Payload:**
```json
{
  "event": "loan.status.updated",
  "timestamp": "2024-02-01T10:30:00Z",
  "data": {
    "externalReferenceId": "loan-request-uuid-from-urutix",
    "loanNumber": "LOAN-2024-000001",
    "status": "Disbursed",
    "applicationStatus": "Approved",
    "loanStatus": "Active",
    "disbursedAmount": 50000,
    "disbursedAt": "2024-02-01T10:30:00Z"
  }
}
```

**When to Send:**
- When loan status changes (Disbursed, Active, Closed, etc.)
- When application status changes

#### 4. Repayment Posted

**Event:** `repayment.posted`

**Payload:**
```json
{
  "event": "repayment.posted",
  "timestamp": "2024-02-15T10:30:00Z",
  "data": {
    "externalReferenceId": "loan-request-uuid-from-urutix",
    "loanNumber": "LOAN-2024-000001",
    "amount": 5000,
    "paymentDate": "2024-02-15T10:30:00Z",
    "transactionId": "payment-txn-id",
    "outstandingBalance": 30000,
    "status": "Active"
  }
}
```

**When to Send:**
- When a repayment is recorded in your system
- When a repayment is confirmed

### Webhook Response Expected

UrutiX will respond with:

**Success (200 OK):**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

**Error (400/401/500):**
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

### Webhook Retry Policy

- UrutiX expects webhooks to be retried on failure
- Recommended: Retry up to 3 times with exponential backoff
- Retry intervals: 1 minute, 5 minutes, 15 minutes
- If all retries fail, log the error for manual review

---

## 📊 Status Mapping

### Application Statuses

| Your System Status | UrutiX Status | Description |
|-------------------|---------------|-------------|
| Draft, Submitted, Under Review | `pending` | Application is being reviewed |
| Approved, Sanctioned | `approved` | Application approved |
| Rejected | `rejected` | Application rejected |
| Disbursed, Active | `disbursed` | Loan has been disbursed |
| Closed, Settled | `repaid` | Loan fully repaid |
| Written Off | `defaulted` | Loan defaulted |

---

## 🔄 Integration Flow

### Complete Flow Diagram

```
1. Cargo Owner in UrutiX
   ↓
2. Fetches loan officers: GET /api/integration/loan-officers
   ↓
3. Selects loan officer and creates loan request
   ↓
4. UrutiX sends: POST /api/integration/applications
   (includes loanOfficerId)
   ↓
5. Your system assigns to loan officer
   ↓
6. Loan officer sees application in portal
   ↓
7. Loan officer approves/rejects
   ↓
8. Your system sends webhook: application.approved/rejected
   ↓
9. UrutiX updates loan status
   ↓
10. Loan officer disburses loan (if approved)
    ↓
11. Your system sends webhook: loan.status.updated
    ↓
12. UrutiX updates to "disbursed"
    ↓
13. Cargo owner makes repayment
    ↓
14. UrutiX sends: POST /api/integration/repayments
    ↓
15. Your system records repayment
    ↓
16. Your system sends webhook: repayment.posted
    ↓
17. UrutiX updates loan status
```

---

## ✅ Implementation Checklist

### Phase 1: Core APIs
- [ ] Implement `GET /api/integration/loan-officers`
- [ ] Implement `POST /api/integration/applications`
- [ ] Accept `loanOfficerId` in application request
- [ ] Assign application to specified loan officer
- [ ] Show application in loan officer's portal

### Phase 2: Webhooks
- [ ] Implement webhook signature generation (HMAC-SHA256)
- [ ] Implement `application.approved` webhook
- [ ] Implement `application.rejected` webhook
- [ ] Implement `loan.status.updated` webhook
- [ ] Implement `repayment.posted` webhook
- [ ] Add retry logic for failed webhooks

### Phase 3: Status Management
- [ ] Implement `GET /api/integration/applications/{externalReferenceId}`
- [ ] Implement `GET /api/integration/loans/{loanNumber}/status`
- [ ] Implement `POST /api/integration/repayments`
- [ ] Map statuses correctly between systems

### Phase 4: Testing
- [ ] Test loan officer fetching
- [ ] Test application creation with loan officer assignment
- [ ] Test webhook delivery and signature verification
- [ ] Test status updates
- [ ] Test repayment processing
- [ ] Test error handling

---

## 🧪 Testing Requirements

### Test Environment

Provide:
- Test API key
- Test webhook URL (we'll provide)
- Test loan officers (at least 2)
- Test loan product code

### Test Scenarios

1. **Fetch Loan Officers**
   - Should return list of active loan officers
   - Should handle empty list gracefully

2. **Create Application**
   - Should accept valid application with loanOfficerId
   - Should reject application with invalid loanOfficerId
   - Should reject duplicate externalReferenceId
   - Should assign to correct loan officer

3. **Webhook Delivery**
   - Should send webhook when application approved
   - Should send webhook when application rejected
   - Should include correct signature
   - Should handle webhook failures with retry

4. **Status Updates**
   - Should update status correctly
   - Should handle status transitions properly

---

## 🔒 Security Requirements

1. **API Key Security**
   - API keys must be unique per integration
   - API keys should be rotated periodically
   - Invalid API keys should return 401 immediately

2. **Webhook Security**
   - All webhooks must be signed with HMAC-SHA256
   - Webhook secret must be kept secure
   - Signature verification must be strict (no timing attacks)

3. **Data Validation**
   - Validate all input data
   - Sanitize user inputs
   - Reject malformed requests

4. **Rate Limiting**
   - Implement rate limiting on all endpoints
   - Recommended: 100 requests per minute per API key

---

## 📞 Support & Contact

### Integration Setup

During integration setup, we'll provide:
- API key for your system
- Webhook secret for signature verification
- Webhook URL endpoint
- Test environment details

### Questions?

If you have questions about:
- API specifications: Contact UrutiX technical team
- Integration setup: Contact UrutiX integration team
- Testing: Contact UrutiX QA team

---

## 📝 Notes

1. **Idempotency:** The `externalReferenceId` is used for idempotency. If the same ID is sent twice, your system should return the existing application, not create a duplicate.

2. **Loan Officer Assignment:** When `loanOfficerId` is provided, the application MUST be assigned to that specific loan officer. The loan officer should see it in their portal immediately.

3. **Status Synchronization:** Always send webhooks when status changes occur. UrutiX relies on webhooks for real-time status updates.

4. **Error Handling:** Return clear, descriptive error messages. This helps with debugging and user experience.

5. **Date Formats:** All dates should be in ISO 8601 format (YYYY-MM-DD for dates, YYYY-MM-DDTHH:mm:ssZ for timestamps).

6. **Amounts:** All monetary amounts should be in the smallest currency unit (e.g., cents for USD) or as decimal numbers with 2 decimal places.

---

## 🚀 Getting Started

1. Review this specification document
2. Confirm you can implement all required endpoints
3. Set up test environment
4. Contact UrutiX team for API credentials
5. Implement endpoints in order of priority
6. Test integration thoroughly
7. Deploy to production

---

**Document Version:** 1.0  
**Last Updated:** 2024-02-01  
**Contact:** integration@urutix.com

