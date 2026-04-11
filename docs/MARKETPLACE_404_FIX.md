# Fix: 404 Error on Marketplace Configure Endpoint

## Error
```json
{
  "message": "Cannot POST /api/credits/marketplace/configure",
  "error": "Not Found",
  "statusCode": 404
}
```

## Root Cause
The credit marketplace routes are not registered because either:
1. The backend server hasn't been restarted after adding the module
2. The database migration hasn't been run
3. There's a module registration issue

## Solution Steps

### Step 1: Run Database Migration
```bash
cd backend
npm run migration:run
```

This will create the `credit_marketplace_settings` table.

### Step 2: Restart Backend Server
If the backend is running, stop it (Ctrl+C) and restart:

```bash
# Stop the current server (Ctrl+C)

# Then restart
npm run start:dev
```

### Step 3: Verify Module Registration
Check that `CreditMarketplaceModule` is in `backend/src/app.module.ts`:

```typescript
imports: [
  // ... other modules
  SubscriptionModule,
  CreditMarketplaceModule,  // ← Should be here
  AnalyticsModule,
  // ... other modules
]
```

### Step 4: Test the Endpoint
Run the test script:

```bash
cd backend
node test-marketplace-setup.js
```

Or test manually with curl:

```bash
# Get settings (should return 200 or empty data)
curl -X GET http://localhost:3000/credits/marketplace/settings \
  -H "Authorization: Bearer YOUR_TOKEN"

# Configure marketplace
curl -X POST http://localhost:3000/credits/marketplace/configure \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "minPurchaseAmount": 500,
    "maxPurchaseAmount": 10000,
    "pricePerCredit": 1.0,
    "isEnabled": true
  }'
```

## Verification Checklist

- [ ] Migration 036 has been run
- [ ] `credit_marketplace_settings` table exists in database
- [ ] Backend server has been restarted
- [ ] `CreditMarketplaceModule` is in `app.module.ts` imports
- [ ] GET `/credits/marketplace/settings` returns 200
- [ ] POST `/credits/marketplace/configure` returns 200

## Common Issues

### Issue 1: Migration Not Run
**Symptom**: 404 error or database errors
**Fix**: Run `npm run migration:run` in backend folder

### Issue 2: Server Not Restarted
**Symptom**: 404 error even after migration
**Fix**: Stop and restart the backend server

### Issue 3: Wrong API URL
**Symptom**: 404 error
**Fix**: Check if backend is running on port 3000 or 3005
- Frontend uses: `http://localhost:3005/api/credits/marketplace/configure`
- Backend should be: `http://localhost:3000` (without /api prefix)
- Check `frontend/src/services/api.ts` for base URL configuration

### Issue 4: Module Not Registered
**Symptom**: 404 error after restart
**Fix**: Verify `CreditMarketplaceModule` is imported in `app.module.ts`

## Quick Debug Commands

### Check if table exists
```sql
SELECT * FROM credit_marketplace_settings;
```

### Check backend logs
Look for:
```
[Nest] INFO [RoutesResolver] CreditMarketplaceController {/credits/marketplace}:
[Nest] INFO [RouterExplorer] Mapped {/credits/marketplace/configure, POST} route
[Nest] INFO [RouterExplorer] Mapped {/credits/marketplace/settings, GET} route
```

### Check running migrations
```sql
SELECT * FROM migrations ORDER BY id DESC LIMIT 5;
```

## Expected Behavior After Fix

### GET /credits/marketplace/settings
```json
{
  "success": true,
  "data": null  // or marketplace settings if configured
}
```

### POST /credits/marketplace/configure
```json
{
  "success": true,
  "message": "Marketplace configured successfully",
  "data": {
    "id": "...",
    "tenantId": "...",
    "minPurchaseAmount": 500,
    "maxPurchaseAmount": 10000,
    "pricePerCredit": "1.00",
    "isEnabled": true
  }
}
```

## Still Not Working?

If you still get 404 errors after following all steps:

1. **Check backend console** for any startup errors
2. **Verify port**: Backend should be on 3000, not 3005
3. **Check API base URL** in `frontend/src/services/api.ts`
4. **Rebuild backend**: `npm run build` then restart
5. **Check for TypeScript errors**: `npm run build` should complete without errors

---

**Status**: Troubleshooting Guide  
**Last Updated**: April 11, 2026
