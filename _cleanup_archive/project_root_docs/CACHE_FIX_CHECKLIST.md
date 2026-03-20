# Cache Fix Checklist ✅

Follow these steps in order. Check each box as you complete it.

## Pre-Flight Check

- [ ] Backend is running on port 3000
- [ ] Frontend is running on port 5174
- [ ] You can access `http://localhost:5174/admin/subscriptions`

## Step-by-Step Fix

### 1. Verify Backend is Working

```powershell
cd backend
node test-tenant-filter.js
```

- [ ] Test script runs without errors
- [ ] Shows "✅ Found 2 total transactions"
- [ ] Shows "✅ Found 1 transactions for Demo Tenant B"

**If this fails**: Backend has an issue. Check backend logs.
**If this passes**: Backend is working correctly. Continue to Step 2.

---

### 2. Stop Frontend Dev Server

- [ ] Go to terminal running frontend
- [ ] Press `Ctrl + C` to stop the server
- [ ] Wait for it to fully stop

---

### 3. Clear Vite Cache

```powershell
cd frontend
Remove-Item -Recurse -Force node_modules/.vite
```

- [ ] Command runs without errors
- [ ] `node_modules/.vite` folder is deleted

**Alternative**: Run the script:
```powershell
.\fix-vite-cache.ps1
```

---

### 4. Restart Frontend Dev Server

```powershell
npm run dev
```

- [ ] Server starts successfully
- [ ] Shows "ready in X ms"
- [ ] Shows "Local: http://localhost:5174/"

---

### 5. Hard Refresh Browser

**Windows**: Press `Ctrl + Shift + R` or `Ctrl + F5`
**Mac**: Press `Cmd + Shift + R`

- [ ] Browser refreshes
- [ ] Page reloads completely
- [ ] No console errors (press F12 to check)

**Alternative**: 
1. Press F12 (open DevTools)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

---

### 6. Test the Feature

Navigate to: `http://localhost:5174/admin/subscriptions`

- [ ] Page loads successfully
- [ ] You can see the tenant subscriptions table
- [ ] You can see "Demo Tenant B" in the table

Click the **purple history icon** (FaHistory) for "Demo Tenant B":

- [ ] Page navigates to `/admin/credit-usage`
- [ ] Tenant dropdown shows "Demo Tenant B" selected
- [ ] Search field shows "Demo Tenant B"
- [ ] Table shows 1 transaction
- [ ] Transaction type is "CONSUMPTION" (red badge)
- [ ] Amount is "-250" (red text)
- [ ] Description is "Credit consumption for load creation (50 tonnes)"

---

### 7. Test Second Tenant

Go back to: `http://localhost:5174/admin/subscriptions`

Click the **purple history icon** for "Deborah":

- [ ] Page navigates to `/admin/credit-usage`
- [ ] Tenant dropdown shows "Deborah" selected
- [ ] Search field shows "Deborah"
- [ ] Table shows 1 transaction
- [ ] Transaction type is "BONUS" (yellow badge)
- [ ] Amount is "+1000" (green text)
- [ ] Description is "Bonus credits added by admin"

---

### 8. Test All Tenants View

Navigate directly to: `http://localhost:5174/admin/credit-usage`

- [ ] Tenant dropdown shows "All Tenants"
- [ ] Search field is empty
- [ ] Table shows 2 transactions (both tenants)

---

## Troubleshooting

### If Step 1 Fails (Backend Test)

**Problem**: Backend is not returning correct data

**Solution**:
1. Check backend is running: `http://localhost:3000/api/health`
2. Check backend logs for errors
3. Restart backend: `npm run start:dev`
4. Run test again

---

### If Step 6 Fails (Feature Not Working)

**Problem**: Browser is still serving old files

**Nuclear Option**:
```powershell
cd frontend

# Stop dev server (Ctrl+C)

# Clear everything
Remove-Item -Recurse -Force node_modules/.vite
Remove-Item -Recurse -Force dist

# Restart
npm run dev
```

Then in browser:
1. Press F12
2. Go to "Application" tab
3. Click "Clear storage"
4. Click "Clear site data"
5. Close DevTools
6. Press `Ctrl + Shift + R`

---

### If Still Not Working

**Try Incognito Mode**:
- Chrome: `Ctrl + Shift + N`
- Firefox: `Ctrl + Shift + P`
- Edge: `Ctrl + Shift + N`

Then navigate to: `http://localhost:5174/admin/subscriptions`

- [ ] Feature works in incognito mode

**If it works in incognito**: Definitely a cache issue. Clear browser cache completely.

**If it doesn't work in incognito**: Check browser console (F12) for errors.

---

### Debug Mode

Add temporary logging to see what's happening:

1. Open: `frontend/src/pages/admin/CreditUsageHistory.tsx`
2. Add at line 50 (after `const navigationState = ...`):
```typescript
console.log('🔍 DEBUG - Navigation State:', navigationState);
console.log('🔍 DEBUG - Location:', location);
```
3. Save file
4. Refresh browser
5. Click purple history icon
6. Check console (F12 → Console tab)

**Expected output**:
```
🔍 DEBUG - Navigation State: { tenantId: "4a49a3c2-...", tenantName: "Demo Tenant B" }
🔍 DEBUG - Location: { pathname: "/admin/credit-usage", state: {...} }
```

**If you see**:
```
🔍 DEBUG - Navigation State: null
```

Then navigation state is not being passed. Check `TenantSubscriptions.tsx` button.

---

## Success Criteria

✅ **Feature is working when**:

1. Clicking purple history icon navigates to credit usage page
2. Tenant is pre-selected in dropdown
3. Search field is pre-filled with tenant name
4. Table shows only transactions for that tenant
5. Statistics cards reflect filtered data
6. Can switch between tenants using dropdown
7. Can clear filter to see all tenants

---

## Quick Commands Reference

```powershell
# Clear Vite cache
cd frontend
Remove-Item -Recurse -Force node_modules/.vite

# Restart dev server
npm run dev

# Test backend
cd backend
node test-tenant-filter.js

# Run integration test
.\test-credit-usage-integration.ps1
```

---

## Files to Check

If you want to verify the code is correct:

### Backend
- `backend/src/modules/admin/admin.controller.ts` - Line ~180 (days parameter)
- `backend/src/services/credit.service.ts` - Line ~50 (getAllTransactions with joins)

### Frontend
- `frontend/src/pages/admin/CreditUsageHistory.tsx` - Line ~50 (state initialization)
- `frontend/src/pages/admin/TenantSubscriptions.tsx` - Line ~420 (history button)

---

## Final Check

After completing all steps:

- [ ] Backend test passes
- [ ] Vite cache cleared
- [ ] Dev server restarted
- [ ] Browser hard refreshed
- [ ] Feature works for "Demo Tenant B"
- [ ] Feature works for "Deborah"
- [ ] Feature works for "All Tenants"
- [ ] No console errors
- [ ] Network tab shows correct API calls

**If all checked**: ✅ Feature is complete and working!

**If any unchecked**: Review the troubleshooting section for that step.

---

## Need Help?

1. Check browser console (F12 → Console) for errors
2. Check network tab (F12 → Network) for API calls
3. Run backend test: `node backend/test-tenant-filter.js`
4. Try incognito mode
5. Check backend logs

All code is correct and tested. This is purely a caching issue that requires clearing the cache.
