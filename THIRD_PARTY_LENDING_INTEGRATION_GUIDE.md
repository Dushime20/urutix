# Third-Party Lending System Integration Guide

This document outlines what information and specifications you need to provide to integrate your UrutiX lending system with a third-party lending platform.

## 📋 Overview

Your system currently has a complete lending module that:
- Creates loan requests when cargo owners need financing
- Routes loan requests to lenders
- Tracks loan status (pending, approved, rejected, disbursed, repaid, defaulted)
- Handles disbursements and repayments
- Manages lender policies and configurations

To integrate with a third-party lending system, we need to establish bidirectional synchronization.

---

## 🔄 Integration Architecture

### Current Flow:
1. **Cargo Owner** creates a loan request in UrutiX
2. **UrutiX** routes the request to the selected **Lender**
3. **Lender** (currently in UrutiX) approves/rejects the loan
4. **UrutiX** tracks disbursements and repayments

### Desired Flow (with Third-Party):
1. **Cargo Owner** creates a loan request in UrutiX
2. **UrutiX** sends the request to **Third-Party Lending System**
3. **Third-Party System** processes the loan (lender uses their system)
4. **Third-Party System** sends status updates back to UrutiX
5. **UrutiX** syncs status and tracks the loan lifecycle

---

## 📤 Data We Send to Third-Party System

### 1. Loan Request Creation

When a cargo owner creates a loan request, we send:

**Endpoint:** `POST {third_party_base_url}/api/v1/loan_requests`

**Payload:**
```json
{
  "platform_loan_id": "uuid-from-urutix",
  "tenant_id": "uuid",
  "cargo_id": "uuid",
  "trip_id": "uuid",
  "requested_amount": 50000.00,
  "requested_split": [
    {
      "type": "cargo_owner",
      "id": "uuid",
      "amount": 30000.00
    },
    {
      "type": "truck_owner",
      "id": "uuid",
      "amount": 20000.00
    }
  ],
  "due_date": "2024-12-31",
  "metadata": {
    "cargo_details": {
      "title": "Cargo Title",
      "description": "Cargo Description",
      "value": 100000.00,
      "weight": 5000,
      "origin": "City A",
      "destination": "City B"
    },
    "trip_details": {
      "distance": 500,
      "estimated_duration": "2 days",
      "truck_type": "flatbed"
    },
    "borrower_info": {
      "id": "uuid",
      "name": "Company Name",
      "email": "borrower@example.com",
      "credit_score": 750
    },
    "risk_assessment": {
      "score": 85,
      "level": "low",
      "factors": []
    }
  },
  "idempotency_key": "unique-key-for-duplicate-prevention"
}
```

---

## 📥 Data We Need from Third-Party System

### 1. Loan Status Updates (Webhook)

**Webhook URL:** `POST {your_urutix_backend}/api/platform/v1/loan_status_update`

**Expected Payload:**
```json
{
  "platform_loan_id": "uuid-from-urutix",
  "external_loan_ref": "loan-ref-from-third-party",
  "status": "approved" | "rejected" | "disbursed" | "repaid" | "defaulted",
  "approved_amount": 45000.00,
  "interest_amount": 2250.00,
  "interest_rate": 0.05,
  "due_date": "2024-12-31",
  "rejection_reason": "string (if rejected)",
  "disbursement_details": {
    "transaction_id": "string",
    "disbursed_at": "2024-01-15T10:00:00Z",
    "disbursed_amount": 45000.00,
    "beneficiaries": [
      {
        "type": "cargo_owner",
        "id": "uuid",
        "amount": 27000.00,
        "account_details": {}
      }
    ]
  },
  "repayment_details": {
    "transaction_id": "string",
    "repaid_at": "2024-12-31T10:00:00Z",
    "repaid_amount": 47250.00
  },
  "metadata": {}
}
```

### 2. Loan Query Endpoint (Optional - for status checks)

**Endpoint:** `GET {third_party_base_url}/api/v1/loan_requests/{external_loan_ref}`

**Response:**
```json
{
  "external_loan_ref": "string",
  "status": "approved",
  "approved_amount": 45000.00,
  "current_balance": 30000.00,
  "next_payment_due": "2024-11-15",
  "last_updated": "2024-01-15T10:00:00Z"
}
```

---

## 🔐 Authentication Requirements

### Option 1: API Key Authentication
- **Header:** `Authorization: Bearer {api_key}`
- **Header:** `Idempotency-Key: {unique_key}` (for loan requests)

### Option 2: OAuth 2.0
- **Grant Type:** Client Credentials
- **Token Endpoint:** `{third_party_base_url}/oauth/token`
- **Scopes:** `loan:read`, `loan:write`

### Option 3: HMAC Signature
- **Header:** `X-Signature: {hmac_signature}`
- **Algorithm:** SHA-256
- **Payload:** Request body + timestamp + secret

**Please specify which authentication method your third-party system uses.**

---

## 📊 Required Information from You

### 1. Third-Party System Details

Please provide:

- [ ] **Base URL** of the third-party lending API
  - Example: `https://api.lendingsystem.com`
  
- [ ] **API Version**
  - Example: `v1`, `v2`
  
- [ ] **Authentication Method**
  - API Key, OAuth 2.0, HMAC, or other?
  
- [ ] **API Credentials**
  - API Key / Client ID / Client Secret
  - How to obtain/rotate credentials
  
- [ ] **Rate Limits**
  - Requests per minute/hour
  - Rate limit headers to check

### 2. API Endpoints

Please provide the exact endpoints:

- [ ] **Create Loan Request**
  - Method: `POST`
  - Path: `/api/v1/loan_requests` (or your path)
  - Request format (JSON/XML)
  - Response format
  
- [ ] **Get Loan Status** (if available)
  - Method: `GET`
  - Path: `/api/v1/loan_requests/{id}`
  
- [ ] **Update Loan Status** (if they call us)
  - Method: `POST` or `PUT`
  - Path: (webhook URL we'll provide)

### 3. Webhook Configuration

We need to set up webhooks so the third-party system can notify us:

- [ ] **Webhook URL Format**
  - Do they support custom webhook URLs?
  - Or do we need to poll for updates?
  
- [ ] **Webhook Authentication**
  - How do we verify webhook requests are from them?
  - Secret key? Signature verification?
  
- [ ] **Webhook Events**
  - Which events do they send? (loan.approved, loan.rejected, loan.disbursed, etc.)
  - Event payload structure

### 4. Data Mapping

Please provide field mappings:

- [ ] **Loan Status Values**
  - How do their statuses map to ours?
  - Our statuses: `pending`, `approved`, `rejected`, `disbursed`, `repaid`, `failed`, `defaulted`
  
- [ ] **Currency Format**
  - Currency code (USD, NGN, etc.)
  - Decimal precision
  
- [ ] **Date/Time Format**
  - ISO 8601? Custom format?
  - Timezone handling

### 5. Error Handling

- [ ] **Error Response Format**
  - Structure of error responses
  - Error codes and meanings
  
- [ ] **Retry Logic**
  - Which errors should we retry?
  - Retry intervals?
  - Maximum retries?

### 6. Testing Environment

- [ ] **Sandbox/Test Environment**
  - Test API URL
  - Test credentials
  - Test data requirements

---

## 🔄 Synchronization Scenarios

### Scenario 1: Loan Request Created
1. Cargo owner creates loan request in UrutiX
2. UrutiX sends request to third-party system
3. Third-party system acknowledges receipt
4. UrutiX stores `external_loan_ref` for tracking

### Scenario 2: Loan Approved
1. Lender approves loan in third-party system
2. Third-party system sends webhook to UrutiX
3. UrutiX updates loan status to `approved`
4. UrutiX stores approved amount and interest

### Scenario 3: Loan Disbursed
1. Third-party system disburses funds
2. Third-party system sends webhook with disbursement details
3. UrutiX creates disbursement record
4. UrutiX updates loan status to `disbursed`

### Scenario 4: Loan Repaid
1. Borrower repays loan in third-party system
2. Third-party system sends webhook
3. UrutiX creates repayment record
4. UrutiX updates loan status to `repaid`

### Scenario 5: Loan Rejected
1. Lender rejects loan in third-party system
2. Third-party system sends webhook with reason
3. UrutiX updates loan status to `rejected`
4. UrutiX stores rejection reason

---

## 📝 Implementation Checklist

Once you provide the information above, we will:

- [ ] Create integration service for third-party API
- [ ] Implement webhook endpoint to receive status updates
- [ ] Add configuration for third-party lender credentials
- [ ] Map data formats between systems
- [ ] Implement error handling and retry logic
- [ ] Add logging and monitoring
- [ ] Create admin UI for managing third-party lenders
- [ ] Write integration tests
- [ ] Document API changes

---

## 🛠️ Technical Implementation Details

### Current Lender Entity Structure

```typescript
{
  id: string (UUID)
  name: string
  callback_url: string (URL to third-party system)
  contact_email: string
  api_key_hash: string (for inbound requests)
  outbound_api_key_encrypted: string (for outbound requests)
  webhook_secret_encrypted: string (for webhook verification)
  status: 'active' | 'paused' | 'suspended'
  metadata: JSON (flexible storage)
}
```

### Current Loan Request Entity Structure

```typescript
{
  id: string (UUID) - Our internal ID
  external_loan_ref: string - Third-party system's loan ID
  tenant_id: string
  cargo_id: string
  trip_id: string
  lender_id: string
  requested_amount: number
  approved_amount: number
  status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaid' | 'failed' | 'defaulted'
  interest_amount: number
  due_date: Date
  rejection_reason: string
  metadata: JSON
}
```

---

## 📞 Next Steps

1. **Fill out the checklist above** with information about your third-party lending system
2. **Provide API documentation** (if available)
3. **Share test credentials** for sandbox environment
4. **Schedule integration testing** once implementation is complete

---

## ❓ Questions to Answer

1. Does the third-party system support webhooks, or do we need to poll for updates?
2. Can multiple lenders use the same third-party system, or is it one-to-one?
3. How do we handle partial approvals (e.g., requested $50k, approved $45k)?
4. Do they support split disbursements (paying multiple beneficiaries)?
5. How do we handle loan modifications (amount changes, term extensions)?
6. What happens if the third-party system is down? (fallback mechanism?)
7. Do they provide a dashboard we can embed or link to?
8. How are repayments tracked? (automatic updates or manual reconciliation?)

---

## 📚 Example Integration Request

Here's a template you can fill out:

```yaml
Third-Party Lending System Integration Request
=============================================

System Name: [Name of the lending platform]
Base URL: [https://api.example.com]
API Version: [v1]

Authentication:
  Method: [API Key / OAuth / HMAC]
  Credentials Location: [Environment variables / Database]
  
Endpoints:
  Create Loan: POST /api/v1/loans
  Get Loan Status: GET /api/v1/loans/{id}
  Webhook URL: [We'll provide: https://your-domain.com/api/platform/v1/loan_status_update]

Webhook Configuration:
  Authentication: [Secret key / Signature]
  Events: [loan.approved, loan.rejected, loan.disbursed, loan.repaid]
  
Data Format:
  Currency: [USD]
  Date Format: [ISO 8601]
  Status Mapping:
    pending -> pending
    approved -> approved
    rejected -> declined
    disbursed -> active
    repaid -> completed
    defaulted -> defaulted

Testing:
  Sandbox URL: [https://sandbox.example.com]
  Test Credentials: [Provided separately]
```

---

**Once you provide this information, we can implement the integration!** 🚀

