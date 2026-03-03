# Tenant Dashboard Module Error Fix

## Error

```
Uncaught TypeError: Failed to fetch dynamically imported module: 
http://localhost:5174/src/pages/TenantDashboard.tsx
```

## Root Cause

This is a Vite caching issue. The module exists but Vite's cache is stale or corrupted.

## Quick Fix

### Option 1: Automated Script (Recommended)
```powershell
.\fix-frontend-cache.ps1
```

### Option 2: Manual Steps

1. **Stop Frontend**
   ```powershell
   # Press Ctrl+C in the terminal running frontend
   ```

2. **Clear Vite Cache**
   ```powershell
   cd frontend
   Remove-Item -Recurse -Force node_modules/.vite
   Remove-Item -Recurse -Force .vite
   Remove-Item -Recurse -Force dist
   ```

3. **Clear Browser Cache**
   - Press `Ctrl + Shift + Delete`
   - Select "Cached images and files"
   - Click "Clear data"
   
   OR
   
   - Press `Ctrl + Shift + R` for hard refresh

4. **Restart Frontend**
   ```powershell
   npm run dev
   ```

5. **Hard Refresh Browser**
   - Press `Ctrl + Shift + R`
   - Or `Ctrl + F5`

## Verification

1. Open browser console (F12)
2. Navigate to the page that was showing the error
3. Check that no module errors appear
4. Page should load successfully

## If Issue Persists

### Check File Exists
```powershell
cd frontend
Test-Path src/pages/TenantDashboard.tsx
```

Should return: `True`

### Check Import in App.tsx
```typescript
const TenantDashboardPage = lazy(() => import('./pages/TenantDashboard'));
```

Should be present and not duplicated.

### Restart Both Frontend and Backend
```powershell
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Clear All Caches
```powershell
# Frontend
cd frontend
Remove-Item -Recurse -Force node_modules/.vite
Remove-Item -Recurse -Force .vite
Remove-Item -Recurse -Force dist
Remove-Item -Recurse -Force node_modules/.cache

# Browser
# Open DevTools (F12)
# Right-click refresh button
# Select "Empty Cache and Hard Reload"
```

## Prevention

To avoid this issue in the future:

1. **Always hard refresh** after code changes: `Ctrl + Shift + R`
2. **Clear Vite cache** when switching branches
3. **Restart dev server** after major changes
4. **Use incognito mode** for testing to avoid cache issues

## Related Files

- `frontend/src/pages/TenantDashboard.tsx` - Main file
- `frontend/src/components/TenantDashboard/TenantDashboard.tsx` - Component
- `frontend/src/App.tsx` - Route configuration
- `fix-frontend-cache.ps1` - Automated fix script

---

**Status**: Common Vite caching issue
**Fix Time**: 1-2 minutes
**Solution**: Clear cache and hard refresh
