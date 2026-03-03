# 🔍 Fuel Wallet Shows Zeros Despite Having Data

## Problem
You have data in the `fuel_wallets` table, but the frontend still displays zeros.

## Most Likely Cause: Tenant Mismatch

The fuel wallet API filters data by `tenantId`. If your logged-in user belongs to a different tenant than the one that has the wallet data, you'll see zeros.

---

## Quick Diagnosis

Run this diagnostic script to identify the issue:

```powershell
cd urutix\backend
node diagnose-fuel-wallet-zeros.js
```

This will show you:
1. ✅ Total wallets in database
2. 🏢 Which tenants have wallets
3. 👤 Which users belong to which tenants
4. 🔍 Whether YOUR tenant has wallets

---

## Common Scenarios

### Scenario 1: Wrong Tenant
**Symptom:** Database has wallets, but for a different tenant than you're logged in as

**Solution:**
- Option A: Log in as a user from the tenant that has wallets
- Option B: Run seeding script to add wallets for YOUR tenant

### Scenario 2: Null Tenant ID
**Symptom:** Your user has `tenant_id = NULL` in the database

**Solution:** Fix the user's tenant association:
```sql
-- Find your user
SELECT id, email, tenant_id FROM users WHERE email = 'your@email.com';

-- Update to correct tenant
UPDATE users SET tenant_id = 'correct-tenant-uuid' WHERE email = 'your@email.com';
```

### Scenario 3: JWT Token Missing tenantId
**Symptom:** JWT token doesn't contain `tenantId` field

**Solution:** Log out and log back in to get a fresh token with correct fields

---

## Step-by-Step Troubleshooting

### Step 1: Check Database Data

```powershell
cd urutix\backend
node check-fuel-wallet-data.js
```

This shows:
- Total wallets in database
- Wallets grouped by tenant
- Sample wallet records

### Step 2: Check Your JWT Token

1. Open browser DevTools (F12)
2. Go to **Application** tab → **Local Storage**
3. Find `token` or `accessToken`
4. Copy the token value
5. Go to https://jwt.io
6. Paste the token
7. Look at the payload section

You should see:
```json
{
  "sub": "user-uuid",
  "email": "your@email.com",
  "role": "TRUCK_OWNER",
  "tenantId": "tenant-uuid",  ← This is important!
  "permissions": [...]
}
```

### Step 3: Match Tenant IDs

Compare:
- `tenantId` from your JWT token (Step 2)
- `tenant_id` values from database wallets (Step 1)

**If they match:** ✅ You should see data (check browser cache)  
**If they don't match:** ❌ This is your problem!

---

## Solutions

### Solution 1: Add Wallets for Your Tenant

If your tenant has no wallets:

```powershell
cd urutix\backend
node seed-fuel-wallets.js
```

This will:
- Detect your tenant automatically
- Create wallets for existing drivers/trucks
- Add realistic transaction data

### Solution 2: Log In as Different User

If another tenant has wallets, log in as a user from that tenant.

Check which tenants have wallets:
```powershell
node check-fuel-wallet-data.js
```

Then log in as a user from one of those tenants.

### Solution 3: Fix User-Tenant Association

If your user has wrong or null `tenant_id`:

```sql
-- Check current association
SELECT u.email, u.tenant_id, t.name as tenant_name
FROM users u
LEFT JOIN tenants t ON t.id = u.tenant_id
WHERE u.email = 'your@email.com';

-- Fix if needed
UPDATE users 
SET tenant_id = 'correct-tenant-uuid' 
WHERE email = 'your@email.com';
```

Then log out and log back in to get a fresh JWT token.

---

## How the System Works

### Backend Flow

1. **Request arrives** with JWT token in Authorization header
2. **JWT Strategy** extracts payload and creates `request.user` object:
   ```typescript
   {
     id: payload.sub,
     email: payload.email,
     role: payload.role,
     tenantId: payload.tenantId  ← From JWT
   }
   ```
3. **@GetTenant() decorator** extracts `tenantId` from `request.user`
4. **FuelWalletService.getWalletStats()** queries database:
   ```sql
   SELECT * FROM fuel_wallets WHERE tenant_id = 'extracted-tenant-id'
   ```
5. **Returns aggregated stats** for that tenant only

### Why You See Zeros

If the `tenantId` in your JWT doesn't match any `tenant_id` in the `fuel_wallets` table, the query returns zero results, which leads to:

```json
{
  "totalBalance": 0,
  "totalCredits": 0,
  "totalDebits": 0,
  "activeWallets": 0,
  "totalWallets": 0,
  "averageBalance": 0
}
```

This is **correct behavior** - it's working as designed for multi-tenant isolation!

---

## Verification After Fix

### 1. Check Database
```powershell
node check-fuel-wallet-data.js
```

Should show wallets for your tenant.

### 2. Check JWT Token
Verify `tenantId` in JWT matches your tenant.

### 3. Test API Directly
```powershell
# Get your token from browser
$token = "your-jwt-token-here"

# Test the endpoint
curl -H "Authorization: Bearer $token" http://localhost:3000/fuel/wallets/stats/overview
```

Should return non-zero values.

### 4. Check Frontend
1. Hard refresh browser (Ctrl+F5)
2. Navigate to Fuel Management → Fuel Wallets
3. Should display actual statistics

---

## Quick Reference

| Issue | Diagnostic | Solution |
|-------|-----------|----------|
| No data in DB | `node check-fuel-wallet-data.js` shows 0 | Run `node seed-fuel-wallets.js` |
| Wrong tenant | JWT tenantId ≠ wallet tenant_id | Log in as correct user OR seed for your tenant |
| Null tenant | User has no tenant_id | Fix user record in database |
| Stale token | JWT missing tenantId | Log out and log back in |
| Cache issue | Data exists but not showing | Hard refresh (Ctrl+F5) |

---

## Need More Help?

Run the comprehensive diagnostic:
```powershell
cd urutix\backend
node diagnose-fuel-wallet-zeros.js
```

This will analyze your entire setup and provide specific recommendations.

---

## Summary

The fuel wallet system is working correctly with proper tenant isolation. If you see zeros despite having data, it's because:

1. ✅ The data exists in the database
2. ✅ The API is working correctly
3. ❌ The data belongs to a different tenant than you're logged in as

**Fix:** Either log in as the correct tenant, or add wallet data for your current tenant.
