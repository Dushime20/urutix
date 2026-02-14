# Super Admin Credentials

## Found Super Admin Users

Your database has **3 super admin users**:

### 1. Primary Super Admin (SUPER_ADMIN role)
- **Email**: `admin@urutix.com`
- **Role**: SUPER_ADMIN
- **Status**: ACTIVE
- **Tenant**: Gasa
- **Created**: 27/11/2025

### 2. Admin User
- **Email**: `admin@test.com`
- **Role**: ADMIN
- **Status**: ACTIVE
- **Tenant**: Gasa
- **Created**: 11/11/2025

### 3. Secondary Admin
- **Email**: `admin2@urutix.com`
- **Role**: ADMIN
- **Status**: ACTIVE
- **Tenant**: Gasa
- **Created**: 27/11/2025

## How to Login

Use any of the emails above with your password. If you don't remember the password, you'll need to:

1. **Use password reset flow** (if configured)
2. **Reset via database** (development only)

## Common Default Passwords to Try

If these are test accounts, common passwords might be:
- `Admin@123`
- `admin123`
- `password`
- `Admin123!`
- `test123`

## Check Script

To check super admin credentials anytime:

```bash
cd backend
node check-super-admin.js
```

## Database Stats

- **Total users**: 35
- **Super admins**: 3
- **Other admin emails**: 2 (tenant admins and agents)

## Password Reset (Development Only)

If you need to reset a password for development, you can update the database directly:

```sql
-- Generate a bcrypt hash for your new password first
-- Then update the user:
UPDATE users 
SET "passwordHash" = '$2a$14$YOUR_BCRYPT_HASH_HERE'
WHERE email = 'admin@urutix.com';
```

Or use a Node.js script to generate the hash:

```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('YourNewPassword', 14);
console.log(hash);
```

## Security Note

⚠️ **Never share these credentials publicly or commit them to version control!**

These credentials should only be used for:
- Development and testing
- Initial system setup
- Emergency access

For production, always use:
- Strong, unique passwords
- Two-factor authentication
- Regular password rotation
- Audit logging (now enabled via Activity Logs!)

## Activity Logging

Now that the Activity Logging system is active, all login attempts and admin actions will be tracked at `/admin/activity-logs`.
