# Fuel Wallet Not Displaying Data - Troubleshooting Guide

## Issue
Fuel wallet data is not displaying in the frontend despite having records in the database.

## Root Cause Identified
**Route ordering issue in the backend controller** - The generic route `@Get('wallets/:id')` was matching before the specific route `@Get('wallets/stats/overview')`.

## Fix Applied
✅ Reordered routes in `urutix/backend/src/modules/fuel/fuel.controller.ts`

## CRITICAL: Backend Must Be Restarted

The fix will NOT take effect until the backend is restarted. The route changes are only loaded when the NestJS application starts.

### How to Restart Backend

**Option 1: Using npm (Recommended)**
```bash
cd urutix/backend
npm run start:dev
```

**Option 2: Using PowerShell script**
```powershell
.\urutix\backend\restart-backend.ps1
```

**Option 3: Manual restart**
1. Stop the current backend process (Ctrl+C in the terminal)
2. Navigate to backend directory: `cd urutix/backend`
3. Start backend: `npm run start:dev`

## Verification Steps

### 1. Check Backend is Running
```bash
curl http://localhost:3000
```

### 2. Test Wallet Stats Endpoint Directly

**Using curl:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3000/fuel/wallets/stats/overview
```

**Using the test script:**
```bash
cd urutix/backend
node test-fuel-wallet-endpoint.js
```
(Update the JWT token in the script first)

### 3. Check Browser Console

Open browser DevTools (F12) and check:
- Network tab for API calls to `/fuel/wallets/stats/overview`
- Console tab for any JavaScript errors
- Look for the response from the stats endpoint

### 4. Verify Frontend Display

1. Navigate to Fuel Management page
2. Click on "Fuel Wallets" tab
3. Check if statistics display:
   - Total Wallet Balance
   - Total Issued Credit
   - Active Wallets

## Common Issues & Solutions

### Issue 1: Backend Not Restarted
**Symptom:** Still seeing old behavior
**Solution:** Restart the backend server

### Issue 2: No Data in Database
**Symptom:** Stats show 0 values even after fix
**Solution:** Check if fuel_wallets table has data
```sql
SELECT COUNT(*) FROM fuel_wallets;
SELECT * FROM fuel_wallets LIMIT 5;
```

### Issue 3: Tenant Filtering
**Symptom:** Stats show 0 but data exists in database
**Solution:** Verify the JWT token has correct tenantId
- Check the token payload in jwt.io
- Ensure wallets in database match the tenantId

### Issue 4: CORS or Network Errors
**Symptom:** API calls fail in browser
**Solution:** 
- Check backend CORS configuration
- Verify API_URL in frontend .env file
- Check browser console for CORS errors

### Issue 5: Authentication Issues
**Symptom:** 401 Unauthorized errors
**Solution:**
- Verify JWT token is valid and not expired
- Check Authorization header is being sent
- Ensure user is logged in

## Database Verification

Check if you have fuel wallet data:

```sql
-- Check wallet count
SELECT COUNT(*) as wallet_count FROM fuel_wallets;

-- Check wallet data by tenant
SELECT 
    tenant_id,
    COUNT(*) as wallet_count,
    SUM(balance) as total_balance,
    SUM(total_credits) as total_credits
FROM fuel_wallets
GROUP BY tenant_id;

-- Check sample wallets
SELECT 
    id,
    tenant_id,
    driver_id,
    truck_id,
    balance,
    status,
    created_at
FROM fuel_wallets
LIMIT 10;

-- Check transactions
SELECT COUNT(*) as transaction_count FROM fuel_wallet_transactions;
```

## Frontend Debugging

Add console logs to `FuelWalletTab.tsx`:

```typescript
const loadStats = async () => {
    try {
        console.log('Loading wallet stats...');
        const data = await fuelApi.getWalletStats();
        console.log('Wallet stats received:', data);
        setStats(data);
    } catch (error: any) {
        console.error('Failed to load wallet stats', error);
        console.error('Error response:', error.response?.data);
    }
};
```

## Backend Debugging

Add logging to `fuel-wallet.service.ts`:

```typescript
async getWalletStats(tenantId: string): Promise<any> {
    console.log('Getting wallet stats for tenant:', tenantId);
    
    const wallets = await this.walletRepository.find({
        where: { tenantId },
    });
    
    console.log('Found wallets:', wallets.length);
    
    // ... rest of the method
}
```

## Expected API Response

When working correctly, `/fuel/wallets/stats/overview` should return:

```json
{
  "success": true,
  "data": {
    "totalBalance": 5000.00,
    "totalCredits": 10000.00,
    "totalDebits": 5000.00,
    "activeWallets": 5,
    "totalWallets": 5,
    "averageBalance": 1000.00
  }
}
```

## Next Steps

1. ✅ **RESTART BACKEND** (Most important!)
2. Test the stats endpoint directly
3. Check browser console for errors
4. Verify data exists in database
5. Check tenant filtering is working
6. Clear browser cache if needed

## Files Modified
- `urutix/backend/src/modules/fuel/fuel.controller.ts` - Route ordering fixed

## Related Documentation
- `FUEL_WALLET_DISPLAY_FIX.md` - Detailed explanation of the fix
- `FUEL_FEATURES_API_REFERENCE.md` - API documentation
- `FUEL_FEATURES_QUICK_START.md` - Quick start guide
