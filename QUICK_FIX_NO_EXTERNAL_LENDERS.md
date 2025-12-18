# Quick Fix: "No external lending system lenders available"

## Problem
You're seeing "No external lending system lenders available" in the frontend.

## Quick Diagnosis

### Step 1: Check Backend Logs

After restarting your backend, when you try to fetch lenders, check the console. You should see logs like:

```
[getTenantLenders] Total active lenders (no tenant filter): X
[getTenantLenders] Lender: ... (details)
[getTenantLenders] Found X external system lenders
```

**If you see `Found 0 external system lenders`:**
- No lenders are configured for external system
- See Step 2 below

### Step 2: Check if Any External Lenders Exist

**API Call:**
```bash
GET /api/admin/uruti-lending/list-external-lenders
Authorization: Bearer {your-token}
```

**Expected Response:**
```json
{
  "total": 1,
  "lenders": [
    {
      "id": "...",
      "name": "Uruti Lending Platform",
      "hasApiKey": true,
      "integrationType": "uruti_lending_platform"
    }
  ]
}
```

**If `total: 0`:**
- No lenders are configured for external system
- You need to create and configure a lender (see Step 3)

### Step 3: Create and Configure External Lender

**Option A: Using API (Recommended)**

**Step 3a: Create Lender**
```bash
POST /api/admin/lenders
Authorization: Bearer {your-token}
Content-Type: application/json

{
  "name": "Uruti Lending Platform",
  "contact_email": "contact@urutilending.com",
  "callback_url": "https://api.urutilending.com"
}
```

**Save the `id` from the response!**

**Step 3b: Configure for External System**
```bash
POST /api/admin/uruti-lending/configure
Authorization: Bearer {your-token}
Content-Type: application/json

{
  "lenderId": "lender-id-from-step-3a",
  "baseUrl": "https://api.urutilending.com",
  "apiKey": "your-api-key-from-external-system",
  "webhookSecret": "your-webhook-secret",
  "loanProductCode": "PL-001"
}
```

**Option B: Check Existing Lender**

If you already have a lender, check its configuration:

```bash
GET /api/admin/uruti-lending/config/{lenderId}
Authorization: Bearer {your-token}
```

**If `hasApiKey: false`:**
- Lender is not configured
- Run Step 3b above

### Step 4: Verify Lender Status

**Check lender is active:**
```bash
GET /api/admin/lenders/{lenderId}
Authorization: Bearer {your-token}
```

**Ensure:**
- `status: "active"` (not "inactive" or "pending")

### Step 5: Test Again

1. **Restart backend** (to clear any caching)
2. **Refresh frontend**
3. **Try fetching lenders again**
4. **Check backend logs** for:
   - `[getTenantLenders] Found X external system lenders`
   - Should be > 0 if configured correctly

## Common Issues

### Issue 1: Lender Created But Not Configured

**Symptom:** Lender exists but doesn't appear in external list

**Fix:** Run Step 3b (configure endpoint)

### Issue 2: Lender Status is Not Active

**Symptom:** Lender configured but not showing

**Fix:** Update lender status to "active"

### Issue 3: Missing Metadata

**Symptom:** Lender has API key but no `integrationType` in metadata

**Fix:** The configure endpoint should set this automatically. If not, check:
- Did the configure endpoint return success?
- Check lender metadata: `GET /api/admin/lenders/{lenderId}`

## Quick Test Script

```bash
# 1. List all external lenders
curl -X GET "http://localhost:3002/api/admin/uruti-lending/list-external-lenders" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. If empty, create lender
curl -X POST "http://localhost:3002/api/admin/lenders" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Uruti Lending Platform",
    "contact_email": "test@example.com",
    "callback_url": "https://api.urutilending.com"
  }'

# 3. Configure it (use lender ID from step 2)
curl -X POST "http://localhost:3002/api/admin/uruti-lending/configure" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lenderId": "LENDER_ID_FROM_STEP_2",
    "baseUrl": "https://api.urutilending.com",
    "apiKey": "YOUR_API_KEY",
    "webhookSecret": "YOUR_SECRET",
    "loanProductCode": "PL-001"
  }'

# 4. Verify
curl -X GET "http://localhost:3002/api/admin/uruti-lending/list-external-lenders" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Still Not Working?

1. **Check backend logs** - Look for the detailed lender logs I added
2. **Verify lender metadata** - Should have `integrationType: 'uruti_lending_platform'`
3. **Check lender status** - Must be `'active'`
4. **Restart backend** - To ensure changes are loaded

