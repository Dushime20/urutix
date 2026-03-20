# 🔐 Reset Your Password in 3 Steps

## Step 1: Edit the Script

Open this file: `backend/reset-password-quick.js`

Find these lines (around line 5-6):

```javascript
const EMAIL_TO_RESET = 'admin@urutix.com';  // Change this to your email
const NEW_PASSWORD = 'Admin@2026!';          // Change this to your desired password
```

Change them to:

```javascript
const EMAIL_TO_RESET = 'admin@urutix.com';  // Your email (or pick another)
const NEW_PASSWORD = 'YourNewPassword123!';  // Your new password (min 8 chars)
```

## Step 2: Run the Script

Open PowerShell and run:

```powershell
cd C:\Users\HP\Desktop\urutix\urutix\backend
node reset-password-quick.js
```

## Step 3: Login

1. Open browser: http://localhost:5173
2. Email: `admin@urutix.com` (or the email you chose)
3. Password: `YourNewPassword123!` (or the password you set)
4. Click Login

## That's It! ✅

You should now be logged in as super admin.

---

## Available Emails to Choose From

Pick any of these for `EMAIL_TO_RESET`:

- `admin@urutix.com` (SUPER_ADMIN) ⭐ Recommended
- `superadmin@urutix.com` (SUPER_ADMIN)
- `admin@test.com` (ADMIN)
- `admin2@urutix.com` (ADMIN)

## Password Suggestions

Pick a strong password for `NEW_PASSWORD`:

- `Admin@2026!`
- `SuperAdmin#2026`
- `Urutix@Admin2026`
- `MySecurePass123!`

**Requirements**: Minimum 8 characters

---

## Example

Here's a complete example:

### 1. Edit `backend/reset-password-quick.js`:

```javascript
const EMAIL_TO_RESET = 'admin@urutix.com';
const NEW_PASSWORD = 'Admin@2026!';
```

### 2. Run:

```powershell
cd backend
node reset-password-quick.js
```

### 3. Output:

```
============================================================
QUICK PASSWORD RESET
============================================================

Looking for user: admin@urutix.com...
✓ Found: admin@urutix.com (SUPER_ADMIN)

⏳ Generating secure password hash...
⏳ Updating password in database...

============================================================
✅ PASSWORD RESET SUCCESSFUL!
============================================================

Login Details:
  Email: admin@urutix.com
  Password: Admin@2026!
  Role: SUPER_ADMIN

Login at: http://localhost:5173
```

### 4. Login:

- Go to: http://localhost:5173
- Email: `admin@urutix.com`
- Password: `Admin@2026!`

Done! 🎉

---

## Need Help?

If you get errors:

1. **"Cannot find module"**: Run `npm install` in backend folder
2. **"Connection refused"**: Start PostgreSQL database
3. **"User not found"**: Check the email is correct

---

**Quick Tip**: Save your new password in a password manager!
