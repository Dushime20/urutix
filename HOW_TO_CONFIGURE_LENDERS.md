# How to Configure Lenders for External Lending System

## 📋 Prerequisites

Before configuring, you need:
1. ✅ A lender created in UrutiX
2. ✅ API credentials from your external lending system (Uruti Lending Platform)
3. ✅ Admin or Tenant Admin access in UrutiX

---

## 🔍 Step 1: Get Your Lender ID

### Option A: List All Lenders

```bash
GET /api/admin/lenders
Authorization: Bearer {your-admin-token}
```

**Response:**
```json
[
  {
    "id": "lender-uuid-123",
    "name": "My Lender",
    "contact_email": "lender@example.com",
    "status": "active"
  }
]
```

**Copy the `id` of the lender you want to configure.**

### Option B: Create a New Lender (if needed)

```bash
POST /api/admin/lenders
Authorization: Bearer {your-admin-token}
Content-Type: application/json

{
  "name": "Uruti Lending Platform",
  "contact_email": "contact@urutilending.com",
  "callback_url": "https://api.urutilending.com"
}
```

**Response:**
```json
{
  "id": "new-lender-uuid",
  "api_key": "generated-api-key"
}
```

**Save the `id` - you'll need it for configuration.**

---

## 🔑 Step 2: Get API Credentials from External System

You need to get these from your **Uruti Lending Platform**:

1. **API Key** - For authenticating API requests
2. **Webhook Secret** - For verifying webhook signatures
3. **Base URL** - Your external system's API URL (e.g., `https://api.urutilending.com`)

### How to Get Credentials from Uruti Lending Platform

**In your Uruti Lending Platform:**

1. Login as admin
2. Go to Admin → Integrations → Platforms
3. Create a new platform integration:
   ```json
   POST /api/admin/integrations/platforms
   {
     "name": "UrutiX Cargo Management",
     "code": "URUTIX-CARGO",
     "webhookUrl": "https://your-urutix-domain.com/api/platform/v1/loan_status_update"
   }
   ```
4. **Save the response:**
   ```json
   {
     "id": "platform-uuid",
     "apiKey": "your-api-key-here",  // ← Save this
     "secret": "your-secret-here",    // ← Save this
     "webhookUrl": "..."
   }
   ```

---

## ⚙️ Step 3: Configure the Lender

Use the configuration endpoint to link your UrutiX lender to the external system:

```bash
POST /api/admin/uruti-lending/configure
Authorization: Bearer {your-admin-token}
Content-Type: application/json

{
  "lenderId": "lender-uuid-from-step-1",
  "baseUrl": "https://api.urutilending.com",
  "apiKey": "your-api-key-from-step-2",
  "webhookSecret": "your-secret-from-step-2",
  "loanProductCode": "PL-001"
}
```

### Request Body Details

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `lenderId` | ✅ Yes | UUID of the lender in UrutiX | `"123e4567-e89b-12d3-a456-426614174000"` |
| `baseUrl` | ✅ Yes | Base URL of external system (without `/api`) | `"https://api.urutilending.com"` |
| `apiKey` | ✅ Yes | API key from external system | `"sk_live_abc123..."` |
| `webhookSecret` | ⚠️ Optional | Webhook secret for signature verification | `"whsec_xyz789..."` |
| `loanProductCode` | ⚠️ Optional | Default loan product code | `"PL-001"` |

### Example Request (cURL)

```bash
curl -X POST http://localhost:3002/api/admin/uruti-lending/configure \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lenderId": "123e4567-e89b-12d3-a456-426614174000",
    "baseUrl": "https://api.urutilending.com",
    "apiKey": "sk_live_abc123xyz",
    "webhookSecret": "whsec_xyz789abc",
    "loanProductCode": "PL-001"
  }'
```

### Example Request (JavaScript/Fetch)

```javascript
const response = await fetch('http://localhost:3002/api/admin/uruti-lending/configure', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${yourJwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    lenderId: '123e4567-e89b-12d3-a456-426614174000',
    baseUrl: 'https://api.urutilending.com',
    apiKey: 'sk_live_abc123xyz',
    webhookSecret: 'whsec_xyz789abc',
    loanProductCode: 'PL-001'
  })
});

const result = await response.json();
console.log('Configuration result:', result);
```

### Success Response

```json
{
  "lenderId": "123e4567-e89b-12d3-a456-426614174000",
  "baseUrl": "https://api.urutilending.com",
  "hasApiKey": true,
  "hasWebhookSecret": true,
  "loanProductCode": "PL-001",
  "webhookUrl": "https://your-urutix-domain.com/api/platform/v1/loan_status_update"
}
```

**Important:** Save the `webhookUrl` - you'll need to configure this in your external system.

---

## ✅ Step 4: Verify Configuration

### Check Configuration

```bash
GET /api/admin/uruti-lending/config/{lenderId}
Authorization: Bearer {your-admin-token}
```

**Should return:**
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

### Check Lender Details

```bash
GET /api/admin/lenders/{lenderId}
Authorization: Bearer {your-admin-token}
```

**Check that:**
- `metadata.integrationType = 'uruti_lending_platform'` ✅
- `callback_url` is set ✅
- `status = 'active'` ✅

---

## 🔧 Step 5: Set Correct Tenant ID (Important!)

**Critical:** The lender must have the same `tenant_id` as your cargo owners for it to appear.

### Check Your Tenant ID

**As cargo owner, check your tenant ID:**
- Look at your JWT token payload (decode at https://jwt.io)
- Or check user profile: `GET /api/users/me`

### Update Lender's Tenant ID

**Option A: Via Database (if you have access)**

```sql
UPDATE lenders 
SET tenant_id = 'your-tenant-id-here'
WHERE id = 'lender-id-here';
```

**Option B: Via API (if update endpoint exists)**

Check if there's an update endpoint, or you may need to add one.

**Option C: Recreate Lender with Tenant ID**

If you're a TENANT_ADMIN, create the lender using:

```bash
POST /api/tenant/lenders
Authorization: Bearer {tenant-admin-token}

{
  "name": "Uruti Lending Platform",
  "contact_email": "contact@urutilending.com"
}
```

This automatically sets the `tenant_id` to your tenant.

---

## 🧪 Step 6: Test the Integration

### Test 1: Check Lender Appears for Cargo Owners

1. Log in as cargo owner
2. Go to Payment Management
3. Select a cargo → "Loan Request"
4. **You should see your lender** with "External System" badge

### Test 2: Check Loan Officers Load

1. Select the configured lender
2. **Loan officers should automatically appear** from external system
3. If no loan officers appear, check:
   - External system has `GET /api/integration/loan-officers` endpoint
   - API key is correct
   - External system is accessible

### Test 3: Create Loan Request

1. Select lender
2. Select loan officer
3. Submit loan request
4. Check external system - loan should appear in loan officer's portal

---

## 🔄 Step 7: Configure Webhook in External System

**Important:** Configure the webhook URL in your external system:

1. Go to your Uruti Lending Platform admin
2. Update the platform integration:
   ```json
   PUT /api/admin/integrations/platforms/{platformId}
   {
     "webhookUrl": "https://your-urutix-domain.com/api/platform/v1/loan_status_update"
   }
   ```

This allows external system to send status updates back to UrutiX.

---

## 📝 Complete Example

Here's a complete example from start to finish:

### 1. Create Lender

```bash
POST /api/admin/lenders
{
  "name": "Uruti Lending Platform",
  "contact_email": "contact@urutilending.com"
}

# Response: { "id": "abc-123", ... }
```

### 2. Get Credentials from External System

```bash
# In Uruti Lending Platform
POST /api/admin/integrations/platforms
{
  "name": "UrutiX Integration",
  "webhookUrl": "https://your-urutix.com/api/platform/v1/loan_status_update"
}

# Response: { "apiKey": "sk_...", "secret": "whsec_...", ... }
```

### 3. Configure Lender

```bash
POST /api/admin/uruti-lending/configure
{
  "lenderId": "abc-123",
  "baseUrl": "https://api.urutilending.com",
  "apiKey": "sk_live_...",
  "webhookSecret": "whsec_...",
  "loanProductCode": "PL-001"
}
```

### 4. Verify

```bash
GET /api/admin/uruti-lending/config/abc-123
# Should return configuration details
```

### 5. Test

- Log in as cargo owner
- Create loan request
- Select lender
- Loan officers should appear
- Submit request
- Check external system

---

## 🐛 Troubleshooting

### Issue: Lender Not Appearing

**Check:**
- ✅ Lender exists: `GET /api/admin/lenders`
- ✅ Lender has correct `tenant_id`
- ✅ Lender `status = 'active'`
- ✅ Lender has `metadata.integrationType`

### Issue: Loan Officers Not Loading

**Check:**
- ✅ External system endpoint exists: `GET /api/integration/loan-officers`
- ✅ API key is correct
- ✅ External system is accessible
- ✅ Browser console for errors

### Issue: Configuration Not Saving

**Check:**
- ✅ You have ADMIN or TENANT_ADMIN role
- ✅ Lender ID is correct
- ✅ Base URL is valid (no trailing slash)
- ✅ API key format is correct

---

## 📞 Need Help?

If you encounter issues:

1. Check backend logs for errors
2. Verify API credentials are correct
3. Test external system endpoints directly
4. Check browser console for frontend errors
5. Verify tenant IDs match

---

## ✅ Checklist

- [ ] Lender created in UrutiX
- [ ] Lender has correct `tenant_id`
- [ ] API credentials obtained from external system
- [ ] Configuration endpoint called successfully
- [ ] Configuration verified
- [ ] Webhook URL configured in external system
- [ ] Lender appears for cargo owners
- [ ] Loan officers load when lender selected
- [ ] Loan requests work end-to-end

---

**That's it!** Your lender should now be configured to use the external lending system.

