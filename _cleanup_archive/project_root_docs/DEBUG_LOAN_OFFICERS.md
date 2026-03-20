# Debug: Why Loan Officers Aren't Appearing

## Quick Diagnostic Steps

### Step 1: Check Backend Logs

After restarting your backend, when you fetch lenders, check the console output. You should see logs like:

```
[getTenantLenders] Found X external system lenders
[getTenantLenders] Fetching loan officers for lender {id} ({name})
[getTenantLenders] Found X loan officers for lender {id}
[getTenantLenders] Returning X regular lenders and X loan officers
```

**If you see:**
- `Found 0 external system lenders` → No lenders are configured for external system
- `Failed to fetch loan officers` → External system endpoint might not exist or API key is wrong
- No logs at all → Backend might not be restarted or code not updated

### Step 2: Check if External System Lender Exists

**API Call:**
```bash
GET /api/admin/lenders
Authorization: Bearer {admin-token}
```

**Look for lenders with:**
- `metadata.integrationType = 'uruti_lending_platform'`
- `callback_url` contains `urutilending.com` or `localhost:3000`
- `outbound_api_key_encrypted` is set (not null)

### Step 3: Test Loan Officers Endpoint Directly

**API Call:**
```bash
GET /api/admin/uruti-lending/loan-officers/{lenderId}
Authorization: Bearer {admin-token}
```

**Expected Results:**

**If endpoint exists in external system:**
```json
[
  {
    "id": "officer-123",
    "name": "John Doe",
    "email": "john@lending.com",
    "status": "active"
  }
]
```

**If endpoint doesn't exist (404):**
```json
{
  "statusCode": 404,
  "message": "Not Found"
}
```

**If API key is wrong (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Step 4: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Select "Loan Request" in payment modal
4. Look for logs starting with `[fetchLenders]`

**You should see:**
```
[fetchLenders] Fetching lenders from /lending/tenant/lenders
[fetchLenders] Received lenders data: [...]
[fetchLenders] Processing lender: ...
[fetchLenders] Found X loan officers in the list
```

### Step 5: Check Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Select "Loan Request"
4. Find request to `/lending/tenant/lenders`
5. Click on it and check:
   - **Status**: Should be 200
   - **Response**: Should include lenders array
   - Look for items with `metadata.isLoanOfficer = true`

---

## Common Issues & Solutions

### Issue 1: No External System Lenders Found

**Symptom:** Backend logs show `Found 0 external system lenders`

**Solution:**
1. Create a lender in UrutiX
2. Configure it for external system:
   ```bash
   POST /api/admin/uruti-lending/configure
   {
     "lenderId": "your-lender-id",
     "baseUrl": "https://api.urutilending.com",
     "apiKey": "your-api-key",
     "webhookSecret": "your-secret"
   }
   ```

### Issue 2: External System Endpoint Doesn't Exist

**Symptom:** Backend logs show `Failed to fetch loan officers` with 404 error

**Solution:**
- The external system needs to implement `GET /api/integration/loan-officers`
- This is mentioned in the integration checklist as "TO BE IMPLEMENTED"
- Contact your external lending system team to implement this endpoint

### Issue 3: API Key Authentication Fails

**Symptom:** Backend logs show 401 Unauthorized error

**Solution:**
1. Verify API key is correct
2. Re-configure the lender:
   ```bash
   POST /api/admin/uruti-lending/configure
   {
     "lenderId": "your-lender-id",
     "apiKey": "correct-api-key",
     ...
   }
   ```

### Issue 4: Loan Officers Return Empty Array

**Symptom:** Backend logs show `Found 0 loan officers`

**Solution:**
- External system might not have any loan officers
- Or loan officers endpoint returns empty array
- Check external system to ensure loan officers exist

### Issue 5: Frontend Not Showing Loan Officers

**Symptom:** Backend returns loan officers but frontend doesn't show them

**Check:**
1. Browser console for `[fetchLenders]` logs
2. Network tab - check response includes loan officers
3. Verify `metadata.isLoanOfficer` is being set correctly

---

## Manual Test

### Test 1: Check Lender Configuration

```bash
GET /api/admin/uruti-lending/config/{lenderId}
```

Should return:
```json
{
  "lenderId": "...",
  "baseUrl": "https://api.urutilending.com",
  "hasApiKey": true,
  "hasWebhookSecret": true
}
```

### Test 2: Test Loan Officers Endpoint

```bash
GET /api/admin/uruti-lending/loan-officers/{lenderId}
```

**If this works**, loan officers should appear in the lender list.

**If this fails**, the issue is with:
- External system endpoint not implemented
- API key incorrect
- External system not accessible

---

## Quick Fix: Test with Mock Data

If external system endpoint doesn't exist yet, you can temporarily test by modifying the backend to return mock data:

**In `uruti-lending-integration.service.ts`:**

```typescript
async getLoanOfficers(lenderId: string): Promise<any[]> {
  try {
    // ... existing code ...
  } catch (error) {
    // TEMPORARY: Return mock data for testing
    if (error.response?.status === 404) {
      this.logger.warn('Loan officers endpoint not implemented, returning mock data');
      return [
        {
          id: 'mock-officer-1',
          name: 'John Doe (Mock)',
          email: 'john@lending.com',
          status: 'active',
          specialization: 'Trip Financing'
        },
        {
          id: 'mock-officer-2',
          name: 'Jane Smith (Mock)',
          email: 'jane@lending.com',
          status: 'active',
          specialization: 'Trip Financing'
        }
      ];
    }
    throw error;
  }
}
```

**This is only for testing!** Remove after external system implements the endpoint.

---

## Next Steps

1. **Check backend logs** when fetching lenders
2. **Check browser console** for frontend logs
3. **Test loan officers endpoint directly** to see if it exists
4. **Verify lender configuration** is correct
5. **Contact external system team** if endpoint doesn't exist

---

## Expected Behavior

When everything works:
1. Backend fetches all active external system lenders
2. For each lender, calls `GET /api/integration/loan-officers`
3. Converts loan officers to lender format
4. Returns combined list: regular lenders + loan officers
5. Frontend displays all with appropriate badges
6. Loan officers have "Loan Officer" badge
7. Regular external lenders have "External System" badge

