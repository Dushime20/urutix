# Quick Diagnostic: Why Lenders Aren't Showing

## Quick Checks

### 1. Check if Any Lenders Exist

**API Call:**
```bash
GET /api/lending/tenant/lenders
Authorization: Bearer {your-cargo-owner-token}
```

**Expected:** Array of lenders (even if empty)

**If Error 403:** The endpoint permission fix might not be applied. Restart backend.

---

### 2. Check Your Tenant ID

**In Browser Console (when logged in as cargo owner):**
```javascript
// Check your user object
console.log(user.tenantId);
```

**Or check the JWT token payload:**
- Decode your JWT token at https://jwt.io
- Look for `tenantId` field

---

### 3. Check if Lenders Have Correct Tenant ID

**API Call (as admin):**
```bash
GET /api/admin/lenders
Authorization: Bearer {admin-token}
```

**Check each lender:**
- Does `tenant_id` match your cargo owner's `tenantId`?
- Is `status = 'active'`?
- Does `metadata.integrationType = 'uruti_lending_platform'` exist?

---

## Most Common Issues

### Issue 1: No Lenders Created
**Solution:** Create a lender first (see SETUP_EXTERNAL_LENDER.md)

### Issue 2: Lender Has Wrong Tenant ID
**Solution:** Update lender's `tenant_id` to match your tenant

**API Call:**
```bash
# First, get lender details
GET /api/admin/lenders/{lenderId}

# Then update (you may need to do this via database or add an update endpoint)
```

**Or via Database:**
```sql
UPDATE lenders 
SET tenant_id = 'your-tenant-id-here'
WHERE id = 'lender-id-here';
```

### Issue 3: Lender Not Configured for External System
**Solution:** Run the configure endpoint (see SETUP_EXTERNAL_LENDER.md Step 2)

### Issue 4: Lender Status is Not 'active'
**Solution:** Update lender status

**API Call:**
```bash
PUT /api/admin/lenders/{lenderId}/status
Authorization: Bearer {admin-token}
{
  "status": "active"
}
```

---

## Step-by-Step Fix

### Step 1: Create Lender (if doesn't exist)

```bash
POST /api/admin/lenders
{
  "name": "Uruti Lending Platform",
  "contact_email": "contact@urutilending.com",
  "callback_url": "https://api.urutilending.com"
}
```

**Save the returned `id`**

### Step 2: Update Tenant ID (if needed)

Check your tenant ID first, then:

**Via Database:**
```sql
UPDATE lenders 
SET tenant_id = 'YOUR-TENANT-ID'
WHERE id = 'LENDER-ID-FROM-STEP-1';
```

### Step 3: Configure External System

```bash
POST /api/admin/uruti-lending/configure
{
  "lenderId": "LENDER-ID-FROM-STEP-1",
  "baseUrl": "https://api.urutilending.com",
  "apiKey": "your-api-key",
  "webhookSecret": "your-webhook-secret",
  "loanProductCode": "PL-001"
}
```

### Step 4: Verify

```bash
# Check lender appears
GET /api/lending/tenant/lenders

# Should return lender with metadata.integrationType
```

---

## Testing in Browser

1. **Open Browser DevTools (F12)**
2. **Go to Network tab**
3. **Select "Loan Request" in payment modal**
4. **Look for request to `/lending/tenant/lenders`**
5. **Check:**
   - Status code (should be 200)
   - Response body (should have lenders array)
   - Request headers (should have Authorization)

---

## Still Not Working?

Check these in order:

1. ✅ Backend restarted after code changes?
2. ✅ Frontend restarted after code changes?
3. ✅ Lender exists in database?
4. ✅ Lender has correct `tenant_id`?
5. ✅ Lender `status = 'active'`?
6. ✅ Lender has `metadata.integrationType`?
7. ✅ API endpoint `/lending/tenant/lenders` returns 200?
8. ✅ Browser console shows no errors?
9. ✅ Network tab shows successful API call?

