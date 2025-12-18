# Urgent: Loan Officers Endpoint Required for Integration

## Current Issue

We cannot see loan officers from your system in our UrutiX platform. This is blocking cargo owners from selecting loan officers when requesting loans.

## Required: Loan Officers Endpoint

**You need to implement this endpoint immediately:**

### Endpoint Details

```
GET /api/integration/loan-officers
```

**Authentication:**
- Header: `X-API-Key: {api_key_we_provided}`

**Expected Response:**
```json
{
  "loanOfficers": [
    {
      "id": "officer-123",
      "name": "John Doe",
      "email": "john.doe@lending.com",
      "phone": "+1234567890",
      "status": "active",
      "specialization": "Trip Financing",
      "maxLoanAmount": 100000,
      "minLoanAmount": 1000
    },
    {
      "id": "officer-456",
      "name": "Jane Smith",
      "email": "jane.smith@lending.com",
      "phone": "+1234567891",
      "status": "active",
      "specialization": "Trip Financing",
      "maxLoanAmount": 50000,
      "minLoanAmount": 500
    }
  ]
}
```

**OR (alternative format - we accept both):**
```json
[
  {
    "id": "officer-123",
    "name": "John Doe",
    "email": "john.doe@lending.com",
    "phone": "+1234567890",
    "status": "active"
  }
]
```

### Required Fields

- `id` (string, required): Unique identifier for the loan officer
- `name` (string, required): Full name of the loan officer
- `email` (string, required): Email address
- `status` (string, required): "active", "inactive", or "busy"

### Optional Fields (but recommended)

- `phone` (string): Phone number
- `specialization` (string): Type of loans they handle
- `maxLoanAmount` (number): Maximum loan amount they can approve
- `minLoanAmount` (number): Minimum loan amount they handle
- `available` (boolean): Whether they're currently available

### Error Responses

**401 Unauthorized** (if API key is invalid):
```json
{
  "error": "Invalid API key",
  "message": "The provided API key is invalid or expired"
}
```

**500 Internal Server Error** (if something goes wrong):
```json
{
  "error": "Internal server error",
  "message": "Failed to fetch loan officers"
}
```

---

## Why This Is Critical

1. **Without this endpoint**, cargo owners cannot see or select loan officers from your system
2. **Without loan officer selection**, loan requests cannot be properly assigned
3. **Without proper assignment**, loan officers won't see requests in their portal

## Current Status

- ✅ We have implemented the code to call this endpoint
- ✅ We have configured lenders with API keys
- ❌ **Your endpoint returns 404 (Not Found)** - This means it's not implemented yet

## What Happens When You Implement It

1. UrutiX will call `GET /api/integration/loan-officers` with the API key
2. Your system returns the list of loan officers
3. Cargo owners see loan officers in the dropdown when selecting a lender
4. When a loan request is created, we send `loanOfficerId` to your system
5. The loan officer sees the request in their portal

---

## Also Required: Loan Officer Assignment in Application Endpoint

**Make sure your `POST /api/integration/applications` endpoint accepts `loanOfficerId`:**

```json
{
  "externalReferenceId": "loan-request-id",
  "loanProductCode": "PL-001",
  "requestedAmount": 50000,
  "loanOfficerId": "officer-123",  // ← MUST ACCEPT THIS FIELD
  "customer": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  ...
}
```

**When you receive `loanOfficerId`:**
- Assign the application to that specific loan officer
- Make it visible in their portal
- They should be able to approve/reject it

---

## Testing

Once you implement the endpoint, we can test it using:

```
GET /api/integration/loan-officers
Headers:
  X-API-Key: {test_api_key}
```

**Expected:** List of loan officers (even if empty array `[]` is fine for testing)

**Not Expected:** 404 Not Found

---

## Questions?

If you need clarification on:
- Response format
- Authentication
- Field requirements
- Testing

Please contact us immediately. We need this endpoint working to complete the integration.

---

## Summary

**Action Required:**
1. ✅ Implement `GET /api/integration/loan-officers` endpoint
2. ✅ Return list of loan officers with required fields (id, name, email, status)
3. ✅ Accept `loanOfficerId` in `POST /api/integration/applications`
4. ✅ Assign applications to the specified loan officer

**Timeline:** As soon as possible - this is blocking the integration.

**Contact:** [Your contact information]

---

**Full Technical Specification:** See `LENDING_SYSTEM_API_SPECIFICATION.md` for complete details.

