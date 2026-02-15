# Reset Super Admin Password

## Quick Reset (Recommended)

### Option 1: PowerShell Script (Easiest)

```powershell
cd C:\Users\HP\Desktop\urutix\urutix
.\reset-super-admin-password.ps1
```

### Option 2: Direct Node.js Script

```powershell
cd backend
node reset-super-admin-password.js
```

## What the Script Does

1. Shows all super admin users in your database
2. Lets you select which user to reset
3. Prompts for new password (minimum 8 characters)
4. Confirms password
5. Generates secure bcrypt hash
6. Updates database
7. Resets login attempts and unlocks account

## Your Super Admin Accounts

Based on your database, you have these super admin accounts:

1. **admin@urutix.com** (SUPER_ADMIN role) - Primary
2. **admin@test.com** (ADMIN role)
3. **admin2@urutix.com** (ADMIN role)

## Password Requirements

- Minimum 8 characters
- Recommended: Mix of uppercase, lowercase, numbers, and symbols
- Example: `Admin@2026!`

## After Reset

1. Go to: http://localhost:5173
2. Login with:
   - Email: (the email you selected)
   - Password: (the new password you set)

## Troubleshooting

### "Cannot find module 'bcryptjs'"

Install dependencies:
```powershell
cd backend
npm install
```

### "Connection refused"

Check your database is running:
```powershell
# Check PostgreSQL service
Get-Service postgresql*
```

### "No super admin users found"

Run the seed script:
```powershell
cd backend
node seed-super-admin.js
```

## Manual Reset (Advanced)

If you prefer to reset manually:

### Step 1: Generate Password Hash

```javascript
// In Node.js console or create a file
const bcrypt = require('bcryptjs');
bcrypt.hash('YourNewPassword', 14).then(hash => console.log(hash));
```

### Step 2: Update Database

```sql
UPDATE users 
SET "passwordHash" = '$2a$14$YOUR_HASH_HERE',
    "updatedAt" = NOW(),
    "loginAttempts" = 0,
    "lockedUntil" = NULL
WHERE email = 'admin@urutix.com';
```

## Security Best Practices

✅ Use strong, unique passwords
✅ Don't share credentials
✅ Change default passwords immediately
✅ Enable two-factor authentication (when available)
✅ Regularly rotate passwords
✅ Monitor activity logs for suspicious access

## Activity Logging

All login attempts are now tracked in the Activity Logs system:
- View at: `/admin/activity-logs`
- Monitor failed login attempts
- Track password changes
- Audit admin actions

## Need Help?

If you encounter issues:

1. Check backend is running: `npm run start:dev`
2. Verify database connection in `.env`
3. Check PostgreSQL is running
4. Review error messages carefully

---

**Created**: February 15, 2026
**Last Updated**: February 15, 2026
