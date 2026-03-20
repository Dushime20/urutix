# Uruti Lending Platform Integration - Setup Guide

This guide explains how to set up and use the integration between UrutiX Cargo Management System and Uruti Lending Platform.

## 📋 Overview

The integration allows:
- **Cargo owners** to request loans through UrutiX
- **Loan requests** to be automatically sent to Uruti Lending Platform
- **Lenders** to process loans in Uruti Lending Platform
- **Status updates** to be synchronized back to UrutiX via webhooks

## 🔧 Setup Steps

### 1. Configure Lender in Uruti Lending Platform

First, you need to create a platform integration in Uruti Lending Platform:

```bash
# Login as admin
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "password"
}

# Create platform integration
POST /api/admin/integrations/platforms
{
  "name": "UrutiX Cargo Management",
  "code": "URUTIX-CARGO",
  "description": "Integration with UrutiX cargo management system",
  "webhookUrl": "https://your-urutix-domain.com/api/platform/v1/loan_status_update",
  "canCreateApplications": true,
  "canPostRepayments": true
}
```

**Response:**
```json
{
  "id": "platform-uuid",
  "apiKey": "your-api-key-here",
  "secret": "your-secret-here",
  "webhookUrl": "https://your-urutix-domain.com/api/platform/v1/loan_status_update"
}
```

**Save the `apiKey` and `secret` - you'll need them in the next step.**

### 2. Configure Integration in UrutiX

Configure the lender in UrutiX to use Uruti Lending Platform:

```bash
# As admin/tenant admin
POST /api/admin/uruti-lending/configure
Authorization: Bearer {your-jwt-token}
{
  "lenderId": "lender-uuid-in-urutix",
  "baseUrl": "https://api.urutilending.com",
  "apiKey": "your-api-key-from-step-1",
  "webhookSecret": "your-secret-from-step-1",
  "loanProductCode": "PL-001"
}
```

**Response:**
```json
{
  "lenderId": "lender-uuid",
  "baseUrl": "https://api.urutilending.com",
  "hasApiKey": true,
  "hasWebhookSecret": true,
  "loanProductCode": "PL-001",
  "webhookUrl": "https://your-urutix-domain.com/api/platform/v1/loan_status_update"
}
```

### 3. Verify Configuration

Check the configuration:

```bash
GET /api/admin/uruti-lending/config/{lenderId}
Authorization: Bearer {your-jwt-token}
```

## 🔄 How It Works

### Loan Request Flow

1. **Cargo Owner** creates a loan request in UrutiX:
   ```bash
   POST /api/lending/loan-requests
   {
     "tenant_id": "tenant-uuid",
     "cargo_id": "cargo-uuid",
     "trip_id": "trip-uuid",
     "requested_amount": 50000,
     "lender_id": "lender-uuid",
     "requested_split": [...],
     "created_by": "user-uuid"
   }
   ```

2. **UrutiX** automatically:
   - Detects that the lender uses Uruti Lending Platform
   - Sends the loan application to Uruti Lending Platform
   - Maps the data to the required format
   - Stores the external loan reference

3. **Uruti Lending Platform**:
   - Receives the application
   - Processes it through their workflow
   - Sends webhook updates back to UrutiX

### Webhook Flow

When status changes occur in Uruti Lending Platform, webhooks are sent to:

```
POST https://your-urutix-domain.com/api/platform/v1/loan_status_update
Headers:
  X-Webhook-Signature: {hmac-signature}
  X-Lender-Id: {lender-uuid} (optional)
Body:
{
  "event": "application.approved",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "externalReferenceId": "loan-request-id",
    "loanNumber": "LOAN-2025-000001",
    "status": "Approved",
    "approvedAmount": 50000
  }
}
```

UrutiX automatically:
- Verifies the webhook signature
- Updates the loan request status
- Syncs all relevant data

## 📊 Status Mapping

| UrutiX Status | Uruti Lending Platform Status |
|--------------|-------------------------------|
| `pending` | `Draft`, `Submitted`, `Under Review` |
| `approved` | `Approved` |
| `rejected` | `Rejected` |
| `disbursed` | `Disbursed`, `Active` |
| `repaid` | `Closed` |
| `defaulted` | `Written Off` |

## 🔔 Webhook Events

The integration handles these webhook events:

- `application.approved` - Application approved
- `application.rejected` - Application rejected
- `loan.status.updated` - Loan status changed
- `repayment.posted` - Repayment received

## 🛠️ API Endpoints

### Admin Endpoints

#### Configure Integration
```bash
POST /api/admin/uruti-lending/configure
```

#### Get Configuration
```bash
GET /api/admin/uruti-lending/config/{lenderId}
```

#### Test Webhook
```bash
POST /api/admin/uruti-lending/test-webhook
```

### Webhook Endpoint

#### Receive Status Updates
```bash
POST /api/platform/v1/loan_status_update
```

## 🔐 Security

- **API Key Authentication**: All requests to Uruti Lending Platform use API key in `X-API-Key` header
- **Webhook Signature Verification**: HMAC SHA-256 signature verification for webhooks
- **Encrypted Storage**: API keys and secrets are encrypted in the database

## 🐛 Troubleshooting

### Loan Request Not Sent

1. Check lender configuration:
   ```bash
   GET /api/admin/uruti-lending/config/{lenderId}
   ```

2. Verify lender has:
   - `callback_url` set
   - `outbound_api_key_encrypted` set
   - `metadata.integrationType` = `'uruti_lending_platform'`

3. Check logs for errors:
   - Look for "Failed to send loan request to Uruti Lending Platform"

### Webhooks Not Received

1. Verify webhook URL is correct in Uruti Lending Platform
2. Check webhook secret matches
3. Verify webhook signature in logs
4. Check firewall/network allows incoming webhooks

### Status Not Syncing

1. Check webhook is being received (check logs)
2. Verify webhook payload format matches expected structure
3. Check loan request exists with matching external reference

## 📝 Notes

- The integration automatically detects Uruti Lending Platform lenders by checking:
  - `metadata.integrationType === 'uruti_lending_platform'`
  - Callback URL contains `urutilending.com` or `localhost:3000`
  - Lender has `outbound_api_key_encrypted` configured

- Loan product codes must match between systems
- External reference IDs must be unique per platform
- All timestamps are in UTC

## 🔄 Testing

### Test Loan Request

1. Create a test loan request:
   ```bash
   POST /api/lending/loan-requests
   {
     "tenant_id": "test-tenant",
     "cargo_id": "test-cargo",
     "trip_id": "test-trip",
     "requested_amount": 1000,
     "lender_id": "configured-lender-id",
     "created_by": "test-user"
   }
   ```

2. Check application was created in Uruti Lending Platform
3. Process the application in Uruti Lending Platform
4. Verify webhook updates UrutiX status

## 📞 Support

For issues or questions:
- Check logs: `backend/logs/`
- Review Swagger docs: `/api-docs`
- Contact: support@urutilending.com

