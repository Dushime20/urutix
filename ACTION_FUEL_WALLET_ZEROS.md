# ⚠️ ACTION: Fuel Wallet Shows Zeros Despite Having Data

## Quick Fix

Run this diagnostic to identify the exact issue:

```powershell
cd urutix\backend
.\diagnose-fuel-zeros.ps1
```

The script will tell you exactly what's wrong and how to fix it.

---

## Most Likely Issue: Tenant Mismatch

You have wallet data in the database, but it belongs to a different tenant than you're logged in as.

### How the System Works

1. You log in → JWT token contains your `tenantId`
2. API receives request → Extracts `tenantId` from token
3. Database query → `SELECT * FROM fuel_wallets WHERE tenant_id = YOUR_TENANT_ID`
4. Returns results → Only wallets for YOUR tenant

**If your tenant has no wallets → You see zeros (correct behavior!)**

---

## Solution Options

### Option 1: Add Wallets for Your Tenant (Recommended)

```powershell
cd urutix\backend
.\seed-fuel-wallets.ps1
```

This will:
- Detect YOUR tenant automatically
- Create wallets for your drivers/trucks
- Add realistic transaction data
- Take ~10 seconds

Then:
1. Refresh browser (Ctrl+F5)
2. Check Fuel Wallets tab
3. Should show actual data!

### Option 2: Log In as Different Tenant

If another tenant has wallets, log in as a user from that tenant.

To see which tenants have wallets:
```powershell
cd urutix\backend
node check-fuel-wallet-data.js
```

---

## Verification Steps

### 1. Check Your JWT Token

1. Open browser DevTools (F12)
2. Application tab → Local Storage
3. Find "token" or "accessToken"
4. Copy the value
5. Go to https://jwt.io
6. Paste the token
7. Look for `tenantId` in the payload

Example:
```json
{
  "sub": "user-uuid",
  "email": "your@email.com",
  "tenantId": "abc-123-def-456",  ← This is YOUR tenant
  ...
}
```

### 2. Check Database Wallets

```powershell
cd urutix\backend
node check-fuel-wallet-data.js
```

Look for wallets with `tenant_id` matching your JWT `tenantId`.

### 3. Compare

- **If they match:** ✅ You should see data (try hard refresh)
- **If they don't match:** ❌ This is the problem!

---

## Why This Happens

### Scenario A: Fresh Installation
- You created a tenant and user
- But never added fuel wallet data
- **Fix:** Run seeding script

### Scenario B: Multiple Tenants
- Database has wallets for Tenant A
- You're logged in as Tenant B
- **Fix:** Either log in as Tenant A, or seed wallets for Tenant B

### Scenario C: Wrong User Association
- Your user has wrong `tenant_id` in database
- **Fix:** Update user record or log in as correct user

---

## Quick Commands Reference

```powershell
# Diagnose the issue
cd urutix\backend
.\diagnose-fuel-zeros.ps1

# Check database data
node check-fuel-wallet-data.js

# Add wallets for your tenant
.\seed-fuel-wallets.ps1

# Test API directly (replace TOKEN with your JWT)
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/fuel/wallets/stats/overview
```

---

## Expected Results After Fix

### API Response
```json
{
  "success": true,
  "data": {
    "totalBalance": 18500.00,
    "totalCredits": 25000.00,
    "totalDebits": 6500.00,
    "activeWallets": 5,
    "totalWallets": 5,
    "averageBalance": 3700.00
  }
}
```

### Frontend Display
- Total Wallet Balance: 18,500.00
- Total Issued Credit: 25,000.00
- Active Wallets: 5
- Average Balance: 3,700.00

---

## Still Not Working?

### Check Backend Logs

Look for these console messages when you access the page:
```
🔐 JWT Strategy Debug Info:
JWT Payload: { sub: '...', tenantId: '...', ... }
✅ Extracted user info: { id: '...', tenantId: '...', ... }
```

The `tenantId` here should match the `tenant_id` in your database wallets.

### Check Frontend Console

Look for:
```
✅ Wallet stats received: { totalBalance: 0, ... }
```

If you see this, the API is working but returning zeros (tenant mismatch).

### Run Full Diagnostic

```powershell
cd urutix\backend
node diagnose-fuel-wallet-zeros.js
```

This provides a comprehensive analysis with specific recommendations.

---

## Documentation

- **Detailed explanation:** `FUEL_WALLET_ZEROS_DESPITE_DATA.md`
- **Quick start:** `QUICK_START_FUEL_WALLETS.md`
- **Seeding instructions:** `FUEL_WALLET_SEEDING_INSTRUCTIONS.md`
- **Troubleshooting:** `FUEL_WALLET_TROUBLESHOOTING.md`

---

## Summary

✅ System is working correctly  
✅ API is functioning properly  
✅ Tenant isolation is working as designed  
⚠️ Your tenant just needs wallet data  

**Next Step:** Run `.\diagnose-fuel-zeros.ps1` to identify your specific issue!
