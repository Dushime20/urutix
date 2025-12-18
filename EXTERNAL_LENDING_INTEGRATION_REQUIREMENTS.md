# External Lending System Integration Requirements

## Overview

This document outlines what's necessary for integrating an external lending system so that:
1. Cargo owners can see loan officers from the external system
2. Cargo owners can select a loan officer when creating a loan request
3. Loan requests appear in the loan officer's portal in the external system
4. Loan officers can accept or reject loan requests
5. Status updates sync back to UrutiX

---

## ✅ What's Already Implemented

### 1. **Loan Application Creation**
- ✅ `UrutiLendingIntegrationService.createLoanApplication()` sends loan requests to external system
- ✅ Endpoint: `POST /api/integration/applications`
- ✅ Includes borrower info, trip details, and loan amount

### 2. **Webhook Handling**
- ✅ Webhook endpoint: `POST /api/platform/v1/loan_status_update`
- ✅ Handles events:
  - `application.approved` - Updates loan status to APPROVED
  - `application.rejected` - Updates loan status to REJECTED
  - `loan.status.updated` - Syncs status changes
  - `repayment.posted` - Tracks repayments

### 3. **Configuration**
- ✅ Admin endpoint to configure integration: `POST /api/admin/uruti-lending/configure`
- ✅ Stores encrypted API keys and webhook secrets
- ✅ Detects external lending system by `metadata.integrationType` or callback URL

---

## ❌ What's Missing (Required for Full Integration)

### 1. **Fetch Loan Officers from External System**

**Required API Endpoint in External System:**
```
GET /api/integration/loan-officers
Headers:
  X-API-Key: {apiKey}
Response:
{
  "loanOfficers": [
    {
      "id": "officer-uuid",
      "name": "John Doe",
      "email": "john@lending.com",
      "phone": "+1234567890",
      "status": "active",
      "lenderId": "lender-uuid", // Optional: if officers belong to lenders
      "specialization": "Trip Financing", // Optional
      "maxLoanAmount": 100000, // Optional
      "minLoanAmount": 1000 // Optional
    }
  ]
}
```

**Implementation Needed in UrutiX:**

Add to `UrutiLendingIntegrationService`:
```typescript
async getLoanOfficers(lenderId: string): Promise<LoanOfficer[]> {
  const config = await this.getLenderConfig(lenderId);
  const axiosInstance = this.createAxiosInstance(config);
  
  const response = await axiosInstance.get('/integration/loan-officers');
  return response.data.loanOfficers || [];
}
```

Add controller endpoint:
```typescript
@Get('lending/external/loan-officers/:lenderId')
async getLoanOfficers(@Param('lenderId') lenderId: string) {
  return await this.urutiLendingIntegration.getLoanOfficers(lenderId);
}
```

### 2. **Include Loan Officer ID in Loan Application**

**Update `CreateApplicationRequest` interface:**
```typescript
export interface CreateApplicationRequest {
  // ... existing fields ...
  loanOfficerId?: string; // Add this field
  assignedOfficerId?: string; // Alternative name
}
```

**Update `createLoanApplication` method:**
```typescript
// In uruti-lending-integration.service.ts
const applicationRequest: CreateApplicationRequest = {
  // ... existing fields ...
  loanOfficerId: loanRequest.metadata?.loanOfficerId, // Add this
};
```

**Update `LoanRequest` entity metadata:**
- Store `loanOfficerId` in `loanRequest.metadata.loanOfficerId` when creating loan request

### 3. **Frontend Integration**

**Update loan request form to:**
1. Fetch loan officers when lender is selected
2. Display loan officers in a dropdown/select
3. Include selected loan officer ID in loan request

**Example frontend code:**
```typescript
// When lender is selected
const fetchLoanOfficers = async (lenderId: string) => {
  if (lenderUsesExternalSystem(lender)) {
    const officers = await api.get(`/lending/external/loan-officers/${lenderId}`);
    setLoanOfficers(officers.data);
  }
};

// When creating loan request
const createLoanRequest = async (data) => {
  await api.post('/lending/loan-requests', {
    ...data,
    metadata: {
      ...data.metadata,
      loanOfficerId: selectedOfficerId, // Include selected officer
    }
  });
};
```

### 4. **Loan Officer Assignment in External System**

**External System Should:**
- Accept `loanOfficerId` in the loan application request
- Assign the loan to the specified loan officer
- Show the loan request in that officer's portal
- Allow the officer to approve/reject

**Expected External System API:**
```typescript
POST /api/integration/applications
{
  // ... existing fields ...
  loanOfficerId: "officer-uuid", // New field
}
```

---

## 🔧 Configuration Steps

### Step 1: Configure External Lending System Integration

```bash
POST /api/admin/uruti-lending/configure
{
  "lenderId": "lender-uuid-in-urutix",
  "baseUrl": "https://api.external-lending.com",
  "apiKey": "your-api-key",
  "webhookSecret": "your-webhook-secret",
  "loanProductCode": "PL-001"
}
```

### Step 2: Verify Webhook URL

The webhook URL should be:
```
https://your-urutix-domain.com/api/platform/v1/loan_status_update
```

Configure this in your external lending system.

### Step 3: Test Integration

1. **Fetch loan officers:**
   ```bash
   GET /api/lending/external/loan-officers/{lenderId}
   ```

2. **Create loan request with officer:**
   ```bash
   POST /api/lending/loan-requests
   {
     "tenant_id": "...",
     "cargo_id": "...",
     "trip_id": "...",
     "requested_amount": 50000,
     "lender_id": "lender-uuid",
     "metadata": {
       "loanOfficerId": "officer-uuid"
     }
   }
   ```

3. **Verify webhook receives updates:**
   - Check logs when loan officer approves/rejects
   - Verify loan status updates in UrutiX

---

## 📋 Complete Integration Flow

### 1. **Cargo Owner Initiates Loan Request**

```
User Flow:
1. Cargo owner navigates to loan request page
2. Selects a lender (that uses external system)
3. System fetches loan officers from external system
4. Cargo owner selects a loan officer
5. Cargo owner fills loan details and submits
```

**Backend Flow:**
```
1. POST /api/lending/loan-requests
2. LendingService.createLoanRequest()
3. Detects external lending system integration
4. UrutiLendingIntegrationService.createLoanApplication()
   - Includes loanOfficerId from metadata
5. External system receives application
6. External system assigns to loan officer
```

### 2. **Loan Officer Reviews in External System**

```
External System:
1. Loan appears in loan officer's portal
2. Loan officer reviews application
3. Loan officer approves or rejects
```

### 3. **Status Syncs Back to UrutiX**

```
Webhook Flow:
1. External system sends webhook:
   POST /api/platform/v1/loan_status_update
   {
     "event": "application.approved",
     "data": {
       "externalReferenceId": "loan-request-id",
       "loanNumber": "LOAN-001",
       "approvedAmount": 50000
     }
   }

2. UrutiLendingWebhookController.handleWebhook()
3. UrutiLendingIntegrationService.processWebhookEvent()
4. Updates LoanRequest status in UrutiX
```

---

## 🔍 Code Changes Required

### Backend Changes

1. **Add `getLoanOfficers` method to `UrutiLendingIntegrationService`**
2. **Update `CreateApplicationRequest` interface** to include `loanOfficerId`
3. **Update `createLoanApplication`** to include loan officer ID
4. **Add controller endpoint** for fetching loan officers
5. **Update `LoanRequest` DTO** to accept loan officer in metadata

### Frontend Changes

1. **Add API call** to fetch loan officers
2. **Update loan request form** to show loan officers dropdown
3. **Include loan officer ID** in loan request metadata
4. **Add UI indicators** for external system loans

---

## 🧪 Testing Checklist

- [ ] Can fetch loan officers from external system
- [ ] Loan officers appear in dropdown when lender is selected
- [ ] Loan request includes loan officer ID
- [ ] Loan appears in loan officer's portal in external system
- [ ] Loan officer can approve loan request
- [ ] Webhook receives approval event
- [ ] Loan status updates to APPROVED in UrutiX
- [ ] Loan officer can reject loan request
- [ ] Webhook receives rejection event
- [ ] Loan status updates to REJECTED in UrutiX
- [ ] Rejection reason is stored

---

## 🚨 Important Notes

1. **Loan Officer vs Lender:**
   - A lender may have multiple loan officers
   - Loan officers are assigned to specific loan requests
   - The `lender_id` in UrutiX should map to a lender/company in external system
   - The `loanOfficerId` should map to a specific officer within that lender

2. **Error Handling:**
   - If loan officer fetch fails, show error message
   - If external system is unavailable, fall back to local lenders
   - Log all integration errors for debugging

3. **Security:**
   - API keys are encrypted in database
   - Webhook signatures are verified
   - All external API calls use HTTPS

4. **Idempotency:**
   - Loan requests use idempotency keys
   - Duplicate requests are prevented
   - External system should handle duplicate applications

---

## 📞 Support

If you need help implementing these features:
1. Check existing integration code in `UrutiLendingIntegrationService`
2. Review webhook handling in `UrutiLendingWebhookController`
3. Test with external system's sandbox/test environment first
4. Monitor logs for integration errors

