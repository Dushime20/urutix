# Credit Transactions Not Showing - Troubleshooting Guide

## Issue
Added 600 credits to a tenant via admin panel, but the transaction doesn't appear in the logs/history.

## Root Cause Analysis

### ✅ Database Check - PASSED
The transaction IS being created correctly in the database:
```
Tenant: Deborah
Type: BONUS
Amount: +600 credits
Balance After: 2600 credits
Description: test
Created: 13/02/2026, 17:38:56
```

### 🔍 Possible Issues

#### 1. User Logged In as Different Tenant
**Problem**: The transaction history endpoint `/api/credits/transactions` returns transactions for the LOGGED-IN tenant only.

**Solution**: Make sure you're logged in as the tenant "Deborah" (the one who received the 600 credits).

**How to Check**:
1. Open browser console (F12)
2. Look for API request logs showing:
   ```
   🔐 API Request Debug:
   URL: /credits/transactions
   Tenant ID: <should match the tenant who received credits>
   ```

#### 2. Wrong Page/Tab
**Problem**: Looking at Activity Logs instead of Credit Transaction History.

**Solution**: Navigate to the correct page:
1. Go to `/admin/billing` (Billing Dashboard)
2. Click on "Transaction History" tab
3. Transactions should appear there

**Note**: Activity Logs (`/admin/activity-logs`) shows USER ACTIONS, not credit transactions.

#### 3. API Endpoint Not Called
**Problem**: The Transaction History tab might not be loading data.

**Solution**: Check browser console for:
- API request to `/api/credits/transactions`
- Any error responses (401, 403, 500)
- Network tab in DevTools

---

## Quick Fix Steps

### Step 1: Verify Database
```bash
cd backend
node check-credit-transactions.js
```

Expected output:
```
✅ Found 1 transactions
1. Deborah
   Type: BONUS
   Amount: 600
   ...
```

### Step 2: Check Frontend
1. Login as the tenant who received credits (Deborah)
2. Navigate to: `/admin/billing`
3. Click "Transaction History" tab
4. Open browser console (F12)
5. Look for API requests and errors

### Step 3: Test API Directly
```bash
# Get tenant ID from database
psql $DATABASE_URL -c "SELECT id, name FROM tenants WHERE name = 'Deborah';"

# Test API with curl (replace <token> and <tenant-id>)
curl -X GET http://localhost:3002/api/credits/transactions \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>"
```

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "type": "BONUS",
      "amount": 600,
      "balanceAfter": 2600,
      "description": "test",
      "createdAt": "2026-02-13T15:38:56.226Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

---

## Common Mistakes

### ❌ Wrong: Looking at Activity Logs
```
/admin/activity-logs  ← This shows USER ACTIONS (login, logout, etc.)
```

### ✅ Correct: Looking at Credit Transaction History
```
/admin/billing → Transaction History tab  ← This shows CREDIT TRANSACTIONS
```

### ❌ Wrong: Logged in as different tenant
```
Logged in as: Admin User
Looking for transactions of: Deborah
Result: No transactions (because admin ≠ Deborah)
```

### ✅ Correct: Logged in as the tenant
```
Logged in as: Deborah
Looking for transactions of: Deborah
Result: Shows 600 credit transaction
```

---

## Verification Checklist

- [ ] Transaction exists in database (run `check-credit-transactions.js`)
- [ ] Logged in as the correct tenant
- [ ] On the correct page (`/admin/billing`, not `/admin/activity-logs`)
- [ ] On the "Transaction History" tab
- [ ] Browser console shows no API errors
- [ ] API request includes correct Authorization header
- [ ] API request includes correct X-Tenant-ID header

---

## Debug Commands

### Check all transactions in database
```bash
cd backend
node check-credit-transactions.js
```

### Test API endpoint
```bash
node test-transactions-api.js
```

### Check which tenant has transactions
```sql
SELECT 
  t.name as tenant_name,
  COUNT(ct.id) as transaction_count
FROM tenants t
LEFT JOIN credit_transactions ct ON ct.tenant_id = t.id
GROUP BY t.id, t.name
ORDER BY transaction_count DESC;
```

---

## Solution Summary

The transaction IS being created correctly. The issue is likely:

1. **User is logged in as a different tenant** - Login as "Deborah" to see the transaction
2. **Looking at wrong page** - Go to `/admin/billing` → "Transaction History" tab
3. **API authentication issue** - Check browser console for errors

The system is working correctly! Just need to view it from the right tenant account and page.
