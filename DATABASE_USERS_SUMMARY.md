# Database Users Summary

## Overview

**Total Users**: 36

## Users by Role

| Role | Count |
|------|-------|
| CARGO_OWNER | 7 |
| BROKER | 7 |
| DRIVER | 6 |
| TENANT_ADMIN | 4 |
| TRUCK_OWNER | 4 |
| LENDER | 2 |
| SUPER_ADMIN | 2 |
| ADMIN | 2 |
| AGENT | 1 |
| CARGO_RECEIVER | 1 |

## Users by Status

| Status | Count |
|--------|-------|
| ACTIVE | 30 |
| PENDING_VERIFICATION | 6 |

## Admin Users (8 total)

### Super Admins (2)

1. **admin@urutix.com** (SUPER_ADMIN)
   - Status: ACTIVE
   - Tenant: Gasa
   - Verified: ✅ Yes
   - Created: 27/11/2025

2. **superadmin@urutix.com** (SUPER_ADMIN) ⭐ NEW
   - Status: ACTIVE
   - Tenant: System
   - Verified: ✅ Yes
   - Created: 13/02/2026
   - Password: `SuperAdmin@123`

### Admins (2)

3. **admin@test.com** (ADMIN)
   - Status: ACTIVE
   - Tenant: Gasa
   - Verified: ❌ No
   - Created: 11/11/2025

4. **admin2@urutix.com** (ADMIN)
   - Status: ACTIVE
   - Tenant: Gasa
   - Verified: ✅ Yes
   - Created: 27/11/2025

### Tenant Admins (4)

5. **tenant.admin@test.com** (TENANT_ADMIN)
   - Tenant: Gasa
   - Verified: ✅ Yes

6. **solo@gmail.com** (TENANT_ADMIN)
   - Tenant: Solo
   - Verified: ✅ Yes

7. **isdeborah47@gmail.com** (TENANT_ADMIN)
   - Tenant: Deborah
   - Verified: ✅ Yes

8. **dkubui@gmail.com** (TENANT_ADMIN)
   - Tenant: David
   - Verified: ✅ Yes

## Users by Tenant

| Tenant | User Count |
|--------|------------|
| Gasa | 24 |
| Deborah Rutagengwa | 6 |
| Solo | 3 |
| David | 1 |
| System | 1 |
| Deborah | 1 |

## Email Verification Status

- **Verified**: 15 users (42%)
- **Unverified**: 21 users (58%)

## Two-Factor Authentication

- **Enabled**: 0 users
- **Disabled**: 36 users

⚠️ **Security Recommendation**: Enable 2FA for all admin accounts!

## Recent Users (Last 10)

1. superadmin@urutix.com (SUPER_ADMIN) - Just created! ⭐
2. admin12@urutix.com (AGENT)
3. broker7@test.com (BROKER)
4. broker6@test.com (BROKER)
5. broker5@test.com (BROKER)
6. broker4@test.com (BROKER)
7. broker3@test.com (BROKER)
8. broker2@test.com (BROKER)
9. broker1@test.com (BROKER)
10. manzidom@gmail.com (CARGO_RECEIVER)

## Login Credentials

### Known Credentials

**New Super Admin** (Just created):
```
Email: superadmin@urutix.com
Password: SuperAdmin@123
```

### Existing Admins

For other admin accounts, you'll need to:
1. Use password reset flow
2. Contact the account owner
3. Reset via database (development only)

## Check Users Anytime

Run this script to see all users:

```bash
cd backend
node check-all-users.js
```

Or check just admin users:

```bash
node check-super-admin.js
```

## Database Queries

### Find a specific user
```sql
SELECT * FROM users WHERE email ILIKE '%search%';
```

### Find users by role
```sql
SELECT * FROM users WHERE role = 'CARGO_OWNER';
```

### Find users by tenant
```sql
SELECT u.*, t.name as tenant_name 
FROM users u 
LEFT JOIN tenants t ON t.id = u."tenantId"
WHERE t.name = 'Gasa';
```

### Find unverified users
```sql
SELECT * FROM users WHERE "emailVerifiedAt" IS NULL;
```

### Find active admins
```sql
SELECT * FROM users 
WHERE role IN ('SUPER_ADMIN', 'ADMIN') 
AND status = 'ACTIVE';
```

## Security Recommendations

1. ✅ **Change default password** for superadmin@urutix.com
2. ⚠️ **Enable 2FA** for all admin accounts
3. ⚠️ **Verify emails** for unverified users (21 pending)
4. ✅ **Monitor activity logs** at `/admin/activity-logs`
5. ⚠️ **Review inactive accounts** and deactivate if needed
6. ✅ **Use strong passwords** for all accounts
7. ⚠️ **Regular password rotation** for admin accounts

## Next Steps

1. Login with: `superadmin@urutix.com` / `SuperAdmin@123`
2. Change the password immediately
3. Enable 2FA for your account
4. Review other admin accounts
5. Verify pending email addresses
6. Monitor activity logs for suspicious behavior

## Files Available

- `check-all-users.js` - Check all users with detailed stats
- `check-super-admin.js` - Check admin users only
- `seed-super-admin.js` - Create new super admin user

All scripts are in the `backend/` directory.
