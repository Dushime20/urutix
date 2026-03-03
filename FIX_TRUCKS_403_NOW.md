# ⚠️ IMMEDIATE FIX: Trucks 403 Error

## The Problem
You're getting this error:
```
Missing required permissions: truck:view
Status: 403 Forbidden
```

## Why This Happens
Your current JWT token was issued BEFORE we added the `truck:view` permission to the database. JWT tokens contain a snapshot of permissions at login time and cannot be updated while you're logged in.

## The Fix (Choose ONE)

### Option 1: Log Out and Log Back In (FASTEST)

1. **Click your profile icon** in the top right
2. **Click "Logout"**
3. **Log back in** with your credentials
4. **Navigate to Fleet → Trucks**
5. ✅ Trucks should now display without 403 error

### Option 2: Clear Browser Storage (If logout doesn't work)

1. **Open Developer Tools** (F12)
2. **Go to Application tab** (Chrome) or Storage tab (Firefox)
3. **Clear all**:
   - Local Storage
   - Session Storage
   - Cookies
4. **Refresh the page** (Ctrl + F5)
5. **Log back in**
6. ✅ Trucks should now display

### Option 3: Hard Refresh (Simplest)

1. **Press Ctrl + Shift + Delete**
2. **Select "Cookies and other site data"**
3. **Click "Clear data"**
4. **Close and reopen browser**
5. **Log back in**
6. ✅ Trucks should now display

## What We Fixed

✅ Added `truck:view` permission to database
✅ Assigned permission to TRUCK_OWNER role
✅ Assigned permission to ADMIN role
✅ Assigned permission to SUPER_ADMIN role

## Verification

After logging back in, your new JWT token will include:
- All your previous permissions
- **PLUS** the new `truck:view` permission

You can verify this by checking the browser console - the 403 error should be gone.

## For ALL Users

This fix applies to ALL users (truck owners, admins, etc.). Everyone needs to log out and log back in to get the updated permissions in their JWT tokens.

## If It Still Doesn't Work

If you still get 403 after logging out/in:

1. **Check which user you're logged in as**:
   - Open browser console (F12)
   - Type: `localStorage.getItem('user')`
   - Verify the role is TRUCK_OWNER, ADMIN, or SUPER_ADMIN

2. **Verify backend is running**:
   - Check if `http://localhost:3000/api` is accessible
   - Backend should be running on port 3000

3. **Restart backend** (last resort):
   ```bash
   cd urutix/backend
   # Stop current process (Ctrl+C)
   npm run start:dev
   ```

## Status

✅ Permission configured in database
✅ Permission assigned to roles
⚠️ **ACTION REQUIRED**: Log out and log back in

---

**DO THIS NOW**: Log out and log back in to get a fresh JWT token with the updated permissions!
