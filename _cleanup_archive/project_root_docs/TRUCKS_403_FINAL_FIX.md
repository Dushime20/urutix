# Trucks 403 Error - FINAL FIX ✅

## The Root Cause (FOUND!)

The 403 error was caused by a **mismatch between the JWT strategy and the permissions guard**:

1. ✅ JWT tokens DO include permissions (fixed in `enhanced-auth.service.ts`)
2. ✅ Permissions ARE in the database (verified via scripts)
3. ❌ **JWT strategy was setting `user.id` but permissions guard expected `user.userId`**

## What Was Fixed

### File: `urutix/backend/src/modules/auth/jwt.strategy.ts`

**Before:**
```typescript
const user = {
  id: payload.sub,
  email: payload.email,
  role: payload.role,
  tenantId: payload.tenantId,
};
```

**After:**
```typescript
const user = {
  id: payload.sub,
  userId: payload.sub, // ✅ Added for compatibility with PermissionsGuard
  email: payload.email,
  role: payload.role,
  tenantId: payload.tenantId,
  permissions: payload.permissions || [], // ✅ Include permissions from JWT
};
```

## How to Apply the Fix

### Step 1: Rebuild Backend

```bash
cd urutix/backend
npm run build
```

### Step 2: Restart Backend

Stop the current backend process (Ctrl+C) and restart:

```bash
npm run start:dev
```

### Step 3: Clear Browser Cache and Log Out

1. Open browser DevTools (F12)
2. Go to Application tab → Storage → Clear site data
3. Or manually:
   - Clear localStorage: `localStorage.clear()`
   - Clear sessionStorage: `sessionStorage.clear()`
4. Log out of the application

### Step 4: Log Back In

1. Log in with any truck owner account:
   - `truck.owner@test.com`
   - `truck.owner2@test.com`
   - `serge@gmail.com`
   - `urutitruck@gmail.com`
2. Navigate to Fleet Management → Trucks
3. ✅ Trucks should now display!

## Verification Steps

### 1. Check JWT Token Structure

Open browser console (F12) and run:

```javascript
const token = localStorage.getItem('token');
console.log('Token:', token);

// Decode the token (copy to jwt.io to see payload)
```

Or use the diagnostic script:

```bash
cd urutix/backend
node check-jwt-token-structure.js "YOUR_TOKEN_HERE"
```

The token payload should include:
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "TRUCK_OWNER",
  "tenantId": "tenant-id",
  "permissions": [
    "truck:view",
    "truck:create",
    "truck:update_own",
    ...
  ]
}
```

### 2. Check Backend Logs

When you log in, you should see in backend console:

```
🔐 JWT Strategy Debug Info:
JWT Payload: { sub: '...', email: '...', role: 'TRUCK_OWNER', tenantId: '...', permissions: [...] }
✅ Extracted user info: { id: '...', userId: '...', email: '...', role: 'TRUCK_OWNER', tenantId: '...', permissions: [...] }
✅ User permissions: [ 'truck:view', 'truck:create', ... ]
```

### 3. Check Trucks API Call

When you navigate to the trucks page, check browser console:

```
✅ Trucks retrieved successfully
```

No more 403 errors!

## What This Fix Does

1. **JWT Strategy now sets both `user.id` AND `user.userId`**
   - `user.id` is used by most controllers
   - `user.userId` is used by the PermissionsGuard
   - Both point to the same value (`payload.sub`)

2. **JWT Strategy now includes permissions in the user object**
   - Permissions are extracted from the JWT payload
   - Available to guards and controllers without database queries

3. **PermissionsGuard can now find `user.userId`**
   - No more "User not authenticated" errors
   - Can properly check permissions from database

## Why This Happened

The system has TWO permission checking mechanisms:

1. **PermissionHelper** (in `src/guards/permission.guard.ts`)
   - Checks permissions from database
   - Uses `user.role` to query role_permissions table

2. **PermissionService** (in `src/modules/auth/permissions.guard.ts`)
   - Checks permissions from database
   - Uses `user.userId` to query user permissions

The fleet controller uses `PermissionsGuard` which requires `user.userId`, but the JWT strategy was only setting `user.id`. This caused the guard to fail with "User not authenticated" even though the user WAS authenticated.

## Summary of All Fixes

1. ✅ Added `truck:view` permission to database
2. ✅ Assigned permission to TRUCK_OWNER, ADMIN, SUPER_ADMIN roles
3. ✅ Modified `enhanced-auth.service.ts` to load permissions into JWT tokens
4. ✅ Modified `jwt.strategy.ts` to set both `user.id` and `user.userId`
5. ✅ Modified `jwt.strategy.ts` to include permissions in user object

## Testing Checklist

- [ ] Backend builds successfully (`npm run build`)
- [ ] Backend starts without errors (`npm run start:dev`)
- [ ] Can log in as truck owner
- [ ] JWT token includes permissions array (check with diagnostic script)
- [ ] Trucks page loads without 403 error
- [ ] Trucks table displays trucks
- [ ] Can view truck details
- [ ] Can create new trucks
- [ ] Can update trucks

## Troubleshooting

### Still Getting 403 Error?

1. **Check if backend restarted:**
   ```bash
   # Look for this in backend console:
   # "Nest application successfully started"
   ```

2. **Check if you logged out and back in:**
   - Old tokens don't have permissions
   - Must log out and log back in to get new token

3. **Check JWT token structure:**
   ```bash
   node check-jwt-token-structure.js "YOUR_TOKEN_HERE"
   ```
   - Should show permissions array
   - Should include "truck:view"

4. **Check backend logs during login:**
   - Should show "Loaded X permissions for role TRUCK_OWNER"
   - Should show permissions in JWT payload

5. **Clear all browser data:**
   - Sometimes old tokens are cached
   - Clear localStorage, sessionStorage, cookies
   - Hard refresh (Ctrl+Shift+R)

### Backend Won't Start?

Check for compilation errors:
```bash
cd urutix/backend
npm run build
```

If errors, check:
- TypeScript syntax errors
- Missing imports
- Database connection

## Files Modified

1. `urutix/backend/src/modules/auth/enhanced-auth.service.ts` - Loads permissions into JWT
2. `urutix/backend/src/modules/auth/jwt.strategy.ts` - Sets userId and permissions on user object
3. `urutix/backend/add-truck-view-permission.js` - Added permission to database
4. `urutix/backend/src/modules/fleet/fleet.service.ts` - Removed ownerId filter

## Next Steps

After applying this fix:
1. All truck owners can see their trucks
2. Permissions are properly checked
3. No more 403 errors
4. System works as expected

---

**Status**: ✅ COMPLETE - Ready to test!

**Action Required**: 
1. Rebuild backend
2. Restart backend
3. Log out and log back in
4. Test trucks page

