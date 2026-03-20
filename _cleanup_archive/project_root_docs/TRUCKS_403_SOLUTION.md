# Trucks 403 Error - Complete Solution

## The Problem

ALL truck owners are getting 403 Forbidden errors when trying to view trucks because:

1. ✅ The `truck:view` permission exists in the database
2. ✅ The `TRUCK_OWNER` role has the `truck:view` permission
3. ❌ **Existing JWT tokens don't include the new permission**

## Why This Happens

JWT tokens are issued during login and include a snapshot of the user's permissions at that moment. When we added the `truck:view` permission to the database, all users who were already logged in still have old tokens without this permission.

## The Solution: Restart the Backend

Restarting the backend will:
- Invalidate all existing JWT tokens
- Force all users to log in again
- Issue new tokens with updated permissions

### Step 1: Restart the Backend

```bash
cd urutix/backend

# Stop the current backend (Ctrl+C if running in terminal)
# Then restart:
npm run start:dev
```

Or use the restart script:

```bash
cd urutix/backend
.\restart-backend.ps1
```

### Step 2: Clear Browser Cache (Important!)

After restarting the backend, users need to clear their browser cache:

1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. Close and reopen the browser

### Step 3: Log In Again

All users (truck owners, admins, etc.) need to:
1. Navigate to the login page
2. Enter their credentials
3. Log in to get a fresh JWT token

## Verification

After restarting and logging in, truck owners should be able to:
- ✅ Access the Fleet Management → Trucks page
- ✅ See their trucks without 403 errors
- ✅ View truck details, maintenance records, etc.

## Available Truck Owner Accounts

These accounts will work after the backend restart:

1. **truck.owner@test.com** - owns 10 trucks
2. **truck.owner2@test.com** - owns 1 truck  
3. **serge@gmail.com** - owns 2 trucks
4. **urutitruck@gmail.com** - owns 5 trucks

All these accounts have the `TRUCK_OWNER` role with `truck:view` permission.

## Technical Details

### What We Fixed

1. **Added `truck:view` permission** to the `permissions` table
2. **Assigned permission to roles** in the `role_permissions` table:
   - TRUCK_OWNER ✅
   - ADMIN ✅
   - SUPER_ADMIN ✅

### Why Restart is Needed

JWT tokens are stateless and self-contained. They include:
- User ID
- Role
- Permissions (array)
- Expiration time

Once issued, a JWT token cannot be updated. The only way to get updated permissions is to:
1. Log out (discard old token)
2. Log in again (get new token with current permissions)

OR

Restart the backend (invalidates all tokens, forces re-login)

### Alternative: Wait for Token Expiration

If you don't want to restart, you can wait for JWT tokens to expire naturally. However, this could take hours or days depending on your JWT_EXPIRATION setting.

## Status

✅ Permission added to database
✅ Permission assigned to TRUCK_OWNER role
⚠️ **ACTION REQUIRED**: Restart backend to invalidate old tokens

---

**Next Action**: Restart the backend server now!

```bash
cd urutix/backend
npm run start:dev
```

Then have all users log out and log back in (or just clear browser cache and refresh).
