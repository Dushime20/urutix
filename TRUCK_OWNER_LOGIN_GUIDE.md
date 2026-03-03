# Truck Owner Login Guide

## Available Truck Owner Accounts

You have 4 TRUCK_OWNER users in the database. Here are their details:

### 1. serge@gmail.com
- **Email**: `serge@gmail.com`
- **Role**: TRUCK_OWNER
- **Tenant ID**: `590798ae-c8de-401a-9422-b6ed54f16733`
- **Owns**: 2 trucks
- **Total trucks in tenant**: 2
- **Has truck:view permission**: ✅ Yes

### 2. truck.owner@test.com (RECOMMENDED)
- **Email**: `truck.owner@test.com`
- **Role**: TRUCK_OWNER
- **Tenant ID**: `f31e73f2-2c65-4b6c-b6f1-f9d11550012d` (same as admin@test.com)
- **Owns**: 10 trucks
- **Total trucks in tenant**: 12
- **Has truck:view permission**: ✅ Yes

### 3. truck.owner2@test.com
- **Email**: `truck.owner2@test.com`
- **Role**: TRUCK_OWNER
- **Tenant ID**: `f31e73f2-2c65-4b6c-b6f1-f9d11550012d` (same as admin@test.com)
- **Owns**: 1 truck
- **Total trucks in tenant**: 12
- **Has truck:view permission**: ✅ Yes

### 4. urutitruck@gmail.com
- **Email**: `urutitruck@gmail.com`
- **Role**: TRUCK_OWNER
- **Tenant ID**: `b7d244e3-9a1a-4686-a22f-3fe18468500e`
- **Owns**: 5 trucks
- **Total trucks in tenant**: 5
- **Has truck:view permission**: ✅ Yes

## Recommended Account

Use **truck.owner@test.com** because:
- It's in the same tenant as your admin account
- It owns 10 trucks (good amount for testing)
- It's a test account (not a real user)

## Current Issue

⚠️ **IMPORTANT**: The fleet service currently shows ALL trucks in the tenant to ALL users, regardless of role. This means:

- When you log in as `truck.owner@test.com`, you'll see all 12 trucks in the tenant (not just your 10)
- When you log in as `truck.owner2@test.com`, you'll see all 12 trucks in the tenant (not just your 1)

This is because the `ownerId` filter is commented out in the fleet service (line 332 in `fleet.service.ts`).

## What Should Happen

For proper multi-tenancy and security:
- **TRUCK_OWNER** users should only see their own trucks (filtered by `ownerId`)
- **ADMIN** users should see all trucks in their tenant
- **SUPER_ADMIN** users should see all trucks across all tenants

## How to Test

1. **Log out** of your current session (if logged in as admin)

2. **Log in as a truck owner**:
   - Email: `truck.owner@test.com`
   - Password: (you'll need to know or reset this password)

3. **Navigate to Fleet Management → Trucks**

4. **Expected behavior** (with current code):
   - You'll see all 12 trucks in the tenant
   - No 403 error (because TRUCK_OWNER role has `truck:view` permission)

5. **Desired behavior** (after fixing the service):
   - You should only see your 10 trucks
   - Other truck owners' trucks should be hidden

## Password Reset (If Needed)

If you don't know the password for `truck.owner@test.com`, you can reset it:

```bash
cd urutix/backend
node reset-password-quick.js
```

Then enter:
- Email: `truck.owner@test.com`
- New password: (your choice)

## Next Steps

After you confirm you can log in as a truck owner and see the trucks page:

1. We need to fix the fleet service to filter by `ownerId` for TRUCK_OWNER users
2. We need to check the user's role in the service before deciding whether to apply the owner filter
3. We need to ensure ADMIN users can still see all trucks in their tenant

## Status

✅ TRUCK_OWNER role has `truck:view` permission
✅ Multiple truck owner accounts available for testing
⚠️ Fleet service shows all trucks to all users (needs role-based filtering)
❓ Need to verify truck owner password and test login

---

**Next Action**: Try logging in as `truck.owner@test.com` and let me know if you need the password reset.
