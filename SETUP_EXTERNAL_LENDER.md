# How to Set Up External Lending System Lender in UrutiX

## Problem
Lenders from your external lending system (Uruti Lending Platform) don't automatically appear in UrutiX. You need to create a lender record in UrutiX and configure it to use the external system.

## Solution: Two-Step Process

### Step 1: Create Lender in UrutiX

First, create a lender entity in UrutiX. This represents your external lending system.

**Option A: Using Admin API**
```bash
POST /api/admin/lenders
Authorization: Bearer {your-jwt-token}
Content-Type: application/json

{
  "name": "Uruti Lending Platform",
  "contact_email": "contact@urutilending.com",
  "callback_url": "https://api.urutilending.com"
}
```

**Option B: Using Frontend (if you have admin UI)**
- Navigate to Admin → Lenders
- Click "Create New Lender"
- Fill in:
  - Name: "Uruti Lending Platform"
  - Email: Your contact email
  - Callback URL: `https://api.urutilending.com` (optional for now)

**Response:**
```json
{
  "id": "lender-uuid-here",
  "api_key": "generated-api-key"
}
```

**Save the lender ID** - you'll need it for Step 2.

---

### Step 2: Configure External System Integration

Now configure this lender to use your external lending system:

```bash
POST /api/admin/uruti-lending/configure
Authorization: Bearer {your-jwt-token}
Content-Type: application/json

{
  "lenderId": "lender-uuid-from-step-1",
  "baseUrl": "https://api.urutilending.com",
  "apiKey": "your-api-key-from-external-system",
  "webhookSecret": "your-webhook-secret-from-external-system",
  "loanProductCode": "PL-001"
}
```

**Where to get these values:**
- `baseUrl`: Your external lending system's API base URL
- `apiKey`: API key from your external lending system (generated when you set up the integration)
- `webhookSecret`: Webhook secret from your external lending system
- `loanProductCode`: Product code for loans (e.g., "PL-001")

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

---

## What This Does

After configuration, the lender will have:
- `metadata.integrationType = 'uruti_lending_platform'`
- `callback_url` set to external system URL
- `outbound_api_key_encrypted` with API key
- `webhook_secret_encrypted` with webhook secret

This tells UrutiX:
1. This lender uses an external system
2. When selected, fetch loan officers from external system
3. Send loan applications to external system
4. Receive webhooks from external system

---

## Verify Setup

### Check if Lender is Configured

```bash
GET /api/admin/uruti-lending/config/{lenderId}
Authorization: Bearer {your-jwt-token}
```

Should return configuration details.

### Check if Lender Appears for Cargo Owners

1. Log in as cargo owner
2. Go to Payment Management
3. Select a cargo and choose "Loan Request"
4. You should see "Uruti Lending Platform" in the lenders list
5. It should have an "External System" badge
6. When selected, loan officers should appear

---

## Troubleshooting

### Lender Not Appearing

**Check 1: Lender exists and is active**
```bash
GET /api/lending/tenant/lenders
Authorization: Bearer {cargo-owner-token}
```

**Check 2: Lender has correct tenant_id**
- Lender's `tenant_id` must match cargo owner's `tenantId`
- If lender was created by SUPER_ADMIN, `tenant_id` might be null
- Update lender's `tenant_id` to match your tenant

**Check 3: Lender status is 'active'**
- Lender must have `status = 'active'`
- Check: `GET /api/admin/lenders/{lenderId}`

**Check 4: Lender has metadata.integrationType**
```bash
GET /api/admin/lenders/{lenderId}
```
Look for `metadata.integrationType = 'uruti_lending_platform'`

### Loan Officers Not Appearing

**Check 1: External system endpoint exists**
- Verify `GET /api/integration/loan-officers` exists in external system
- Test with API key authentication

**Check 2: API key is correct**
- Verify API key in lender configuration
- Test API key with external system

**Check 3: Check browser console**
- Open browser DevTools → Console
- Look for errors when selecting lender
- Check Network tab for API calls

---

## Quick Setup Script

If you have access to the database, you can also set this up directly:

```sql
-- 1. Create lender (replace values)
INSERT INTO lenders (id, name, contact_email, status, tenant_id, api_key_hash, metadata)
VALUES (
  gen_random_uuid(),
  'Uruti Lending Platform',
  'contact@urutilending.com',
  'active',
  'your-tenant-id-here',  -- IMPORTANT: Set your tenant ID
  '$2b$10$placeholder',  -- Will be updated by configure endpoint
  '{"integrationType": "uruti_lending_platform"}'::jsonb
)
RETURNING id;

-- 2. Then use the configure endpoint with the returned ID
```

---

## Important Notes

1. **Tenant ID is Critical**: The lender's `tenant_id` must match the cargo owner's `tenantId` for it to appear.

2. **One Lender = One External System**: Each lender entity in UrutiX represents one external lending system connection.

3. **Multiple Lenders**: You can create multiple lenders if you have multiple external systems or want different configurations.

4. **Status Must Be Active**: Only lenders with `status = 'active'` appear for cargo owners.

---

## Next Steps

After setup:
1. ✅ Lender appears in cargo owner's lender list
2. ✅ Selecting lender shows loan officers from external system
3. ✅ Loan requests are sent to external system
4. ✅ Webhooks update loan status in UrutiX

