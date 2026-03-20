# Reset Your Super Admin Password - Quick Guide

## Your Super Admin Accounts

You have **4 super admin accounts**:

1. **admin@urutix.com** (SUPER_ADMIN) ⭐ Primary
2. **superadmin@urutix.com** (SUPER_ADMIN)
3. **admin@test.com** (ADMIN)
4. **admin2@urutix.com** (ADMIN)

## Option 1: Quick Reset (Fastest) ⚡

Edit the configuration in the script and run:

### Step 1: Edit Configuration

Open `backend/reset-password-quick.js` and change these lines:

```javascript
const EMAIL_TO_RESET = 'admin@urutix.com';  // Your email
const NEW_PASSWORD = 'Admin@2026!';          // Your new password
```

### Step 2: Run Script

```powershell
cd backend
node reset-password-quick.js
```

Done! You can now login with your new password.

## Option 2: Interactive Reset

Run the interactive script:

```powershell
cd backend
node reset-super-admin-password.js
```

Follow the prompts:
1. Select user number (or press Enter for #1)
2. Enter new password (min 8 characters)
3. Confirm password

## Option 3: PowerShell Wrapper

```powershell
cd C:\Users\HP\Desktop\urutix\urutix
.\reset-super-admin-password.ps1
```

## Quick Test - Try These Passwords First

Before resetting, try logging in with these common passwords:

- `Admin@123`
- `admin123`
- `Admin123!`
- `password`
- `test123`

Login at: http://localhost:5173

## After Password Reset

1. Open browser: http://localhost:5173
2. Enter your email
3. Enter your new password
4. Click Login

## Recommended Password

Use a strong password like:
- `Admin@2026!`
- `SuperAdmin#2026`
- `Urutix@Admin2026`

## Troubleshooting

### Script won't run?

Install dependencies:
```powershell
cd backend
npm install
```

### Database connection error?

Check PostgreSQL is running:
```powershell
Get-Service postgresql*
```

### User not found?

Create super admin:
```powershell
cd backend
node seed-super-admin.js
```

## Security Tips

✅ Use a password manager
✅ Don't share your password
✅ Change default passwords immediately
✅ Use strong, unique passwords (8+ characters)
✅ Mix uppercase, lowercase, numbers, symbols

## Files Created

- ✅ `backend/reset-super-admin-password.js` - Interactive reset
- ✅ `backend/reset-password-quick.js` - Quick reset (edit config)
- ✅ `reset-super-admin-password.ps1` - PowerShell wrapper
- ✅ `RESET_SUPER_ADMIN_PASSWORD.md` - Detailed guide
- ✅ `RESET_PASSWORD_NOW.md` - This file

---

**Need immediate help?** Use Option 1 (Quick Reset) - it's the fastest!
