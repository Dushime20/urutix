# Integration Request for Lending System Team

## Overview

We need to integrate our UrutiX Cargo Management Platform with your lending system. This will allow cargo owners to:
1. See available loan officers from your system
2. Select a loan officer when requesting a loan
3. Have loan requests appear in the selected loan officer's portal
4. Receive status updates when loan officers approve/reject loans

## What We Need From You

### 1. API to Get Loan Officers

**Endpoint:** `GET /api/integration/loan-officers`

**What it should do:**
- Return a list of all active loan officers
- Include: ID, name, email, phone, status
- Optional: specialization, min/max loan amounts

**Example Response:**
```json
{
  "loanOfficers": [
    {
      "id": "officer-123",
      "name": "John Doe",
      "email": "john@lending.com",
      "phone": "+1234567890",
      "status": "active"
    }
  ]
}
```

### 2. API to Create Loan Application

**Endpoint:** `POST /api/integration/applications`

**What it should do:**
- Accept loan application requests from UrutiX
- **IMPORTANT:** Accept a `loanOfficerId` field in the request
- Automatically assign the application to the specified loan officer
- Make the application visible in that loan officer's portal

**Example Request:**
```json
{
  "externalReferenceId": "loan-request-id",
  "loanProductCode": "PL-001",
  "requestedAmount": 50000,
  "loanOfficerId": "officer-123",  // ← THIS IS CRITICAL
  "customer": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "tripId": "trip-123",
  "tripRevenue": 75000,
  "tripStartDate": "2024-02-01",
  "tripEndDate": "2024-02-15"
}
```

**What happens next:**
- The loan officer with ID "officer-123" should see this application in their portal
- They can then approve or reject it

### 3. Webhooks to Send Status Updates

**Endpoint:** `POST https://our-urutix-domain.com/api/platform/v1/loan_status_update`

**What you need to do:**
- Send webhooks to us when loan status changes
- Include HMAC-SHA256 signature in `X-Webhook-Signature` header
- Send these events:
  - `application.approved` - When loan officer approves
  - `application.rejected` - When loan officer rejects
  - `loan.status.updated` - When loan status changes
  - `repayment.posted` - When repayment is made

**Example Webhook:**
```json
{
  "event": "application.approved",
  "timestamp": "2024-02-01T10:30:00Z",
  "data": {
    "externalReferenceId": "loan-request-id",
    "loanNumber": "LOAN-001",
    "status": "Approved",
    "approvedAmount": 50000,
    "approvedBy": "officer-123"
  }
}
```

## Authentication

- All API calls will use API Key authentication
- Header: `X-API-Key: {api_key}`
- We'll provide the API key during setup

## Complete Technical Specification

For complete API specifications, request formats, error codes, and implementation details, please see:
**`LENDING_SYSTEM_API_SPECIFICATION.md`**

This document includes:
- Detailed request/response formats
- All required fields
- Error handling
- Webhook signature calculation
- Status mapping
- Testing requirements

## Critical Requirements

1. **Loan Officer Assignment:** When we send `loanOfficerId` in the application request, you MUST assign it to that specific loan officer. They must see it in their portal.

2. **Webhook Delivery:** You must send webhooks when status changes. We rely on these for real-time updates.

3. **Idempotency:** Use `externalReferenceId` to prevent duplicate applications.

4. **Security:** All webhooks must be signed with HMAC-SHA256.

## Timeline

Please let us know:
- Estimated timeline for implementation
- Any questions or clarifications needed
- Test environment availability
- API credentials for testing

## Questions?

If anything is unclear, please ask! We're happy to clarify requirements or provide additional details.

---

**Contact:** [Your contact information]  
**Technical Documentation:** See `LENDING_SYSTEM_API_SPECIFICATION.md`

