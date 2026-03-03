# Quick Start: Forgot Password Feature

## ✅ Implementation Complete

The forgot password feature is now fully functional on the frontend!

## How to Use (As Super Admin)

### Option 1: Use the Frontend UI (Recommended)

1. **Start the backend:**
   ```powershell
   cd backend
   npm run start:dev
   ```

2. **Start the frontend:**
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Navigate to login page:**
   - Open browser: `http://localhost:5173/auth`

4. **Click "Forgot password?" link**
   - Located below the password field

5. **Enter your email:**
   - Example: `admin@urutix.com`
   - Click "Send reset link"

6. **Check for reset email:**
   - If SMTP is configured: Check your email inbox
   - If SMTP not configured: Check backend console logs for the reset link

7. **Click the reset link or copy the token:**
   - Link format: `http://localhost:5173/reset-password?token=YOUR_TOKEN`
   - Or manually navigate to the URL with the token

8. **Enter new password:**
   - Must meet all requirements:
     - At least 8 characters
     - One uppercase letter
     - One lowercase letter  
     - One number
     - One special character
   - Confirm the password

9. **Click "Reset password"**
   - You'll see a success message
   - Auto-redirects to login after 3 seconds

10. **Login with new password**
    - Use your new password to login

### Option 2: Use Backend Script (Alternative)

If you prefer command-line:

```powershell
cd backend
node reset-super-admin-password.js
```

Follow the interactive prompts.

## Available Super Admin Accounts

You can reset password for any of these accounts:

1. `admin@urutix.com` (SUPER_ADMIN) - Primary
2. `superadmin@urutix.com` (SUPER_ADMIN)
3. `admin@test.com` (ADMIN)
4. `admin2@urutix.com` (ADMIN)

## Features

### Frontend Pages
- **Forgot Password Page** (`/forgot-password`)
  - Clean email input form
  - Security-conscious messaging
  - Success confirmation

- **Reset Password Page** (`/reset-password?token=...`)
  - Real-time password validation
  - Visual strength indicators
  - Show/hide password toggles
  - Auto-redirect after success

### Security
- Token-based reset (secure, time-limited)
- Strong password requirements
- No user enumeration (doesn't reveal if email exists)
- Backend validation

## Troubleshooting

### "Invalid or expired reset token"
- Token may have expired (check backend token expiry settings)
- Request a new reset link

### "Email not received"
- Check backend console logs for the reset link
- Verify SMTP configuration in backend `.env`
- Check spam folder

### "Password doesn't meet requirements"
- Ensure password has:
  - Minimum 8 characters
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character (!@#$%^&*)

## Email Configuration (Optional)

To receive actual emails, configure SMTP in `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@urutix.com
```

Without SMTP configuration, the reset link will appear in backend console logs.

## Next Steps

After resetting your password:
1. Login with new credentials
2. Access your dashboard
3. Manage your account settings

## Support

If you encounter issues:
1. Check backend logs for errors
2. Verify backend is running on port 3000
3. Verify frontend is running on port 5173
4. Clear browser cache if needed

## Files Created
- `frontend/src/pages/ForgotPassword.tsx`
- `frontend/src/pages/ResetPassword.tsx`

## Files Modified
- `frontend/src/pages/Auth.tsx` (added forgot password link)
- `frontend/src/services/api.ts` (added API methods)
- `frontend/src/App.tsx` (added routes)

---

**Status:** ✅ Ready to use!
