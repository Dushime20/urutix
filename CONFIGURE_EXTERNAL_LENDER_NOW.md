# Configure External Lender - URGENT

## Problem
Your logs show **0 external system lenders** because none of your lenders are configured for external system integration.

## Quick Fix - Configure One of Your Existing Lenders

You have 5 active lenders. Let's configure one for external system:

### Option 1: Configure "Uruti Lender" (ID: 2d6a9dd1-7a81-4e5a-affe-289b2dea80f8)

**Step 1: Configure it for external system**

```bash
POST /api/admin/uruti-lending/configure
Authorization: Bearer {your-admin-token}
Content-Type: application/json

{
  "lenderId": "2d6a9dd1-7a81-4e5a-affe-289b2dea80f8",
  "baseUrl": "https://api.urutilending.com",
  "apiKey": "YOUR_API_KEY_FROM_EXTERNAL_SYSTEM",
  "webhookSecret": "YOUR_WEBHOOK_SECRET",
  "loanProductCode": "PL-001"
}
```

**Replace:**
- `YOUR_API_KEY_FROM_EXTERNAL_SYSTEM` - Get this from your external lending system
- `YOUR_WEBHOOK_SECRET` - Get this from your external lending system
- `https://api.urutilending.com` - Your external system's base URL

### Option 2: Use Any Other Lender

You can use any of these lender IDs:
- `2d6a9dd1-7a81-4e5a-affe-289b2dea80f8` - Uruti Lender
- `addedfac-bbd1-476f-907e-4e8defe336d6` - Debbie
- `5d8c6515-85fa-49b0-a5ba-e4ef70b994bf` - Alpha Capital Lending
- `3afcf554-9bfe-4cce-8bd4-05b52bfdff2e` - Beta Finance Solutions
- `4c2d19c9-c728-41f7-9422-f76ab9f3056d` - Gamma Investment Group

## What This Does

After configuration, the lender will have:
- ✅ `metadata.integrationType = 'uruti_lending_platform'`
- ✅ `callback_url = 'https://api.urutilending.com/api'`
- ✅ `outbound_api_key_encrypted` = (encrypted API key)
- ✅ `webhook_secret_encrypted` = (encrypted webhook secret)

## After Configuration

1. **Restart backend** (if needed)
2. **Try fetching lenders again**
3. **Check logs** - you should see:
   ```
   [getTenantLenders] Found 1 external system lenders
   [getTenantLenders] Fetching loan officers for lender...
   ```

## If You Don't Have API Key Yet

You need to:
1. Contact your external lending system team
2. Get API credentials (API key, webhook secret, base URL)
3. Then configure the lender using the endpoint above

## Test After Configuration

```bash
GET /api/admin/uruti-lending/list-external-lenders
Authorization: Bearer {your-token}
```

Should return your configured lender.

