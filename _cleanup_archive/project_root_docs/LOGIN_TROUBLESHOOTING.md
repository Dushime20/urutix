# Login Troubleshooting Guide

## Issue

Login fails with: "Please check your credentials and try again"

## Database Check Results ✅

All database checks passed:
- ✅ User exists in database
- ✅ Password hash is correct
- ✅ Password verification successful
- ✅ User status is ACTIVE
- ✅ Tenant exists and is ACTIVE
- ✅ Email is properly normalized

**Credentials are correct!** The issue is not with the database.

## Credentials to Use

```
Email: superadmin@urutix.com
Password: SuperAdmin@123
```

## Likely Causes

Since the database is correct, the issue is likely:

### 1. Backend Server Not Running

**Check if backend is running:**
```bash
# Check if process is running
netstat -ano | findstr :3000

# Or check task manager for node.exe
```

**Start the backend:**
```bash
cd backend
npm run start:dev
```

**Expected output:**
```
[Nest] Application successfully started
Listening on port 3000
```

### 2. Frontend API Configuration

**Check frontend API URL:**

File: `frontend/src/services/api.ts` or `frontend/.env`

Should be:
```
VITE_API_URL=http://localhost:3000/api
```

Or in the code:
```typescript
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});
```

### 3. CORS Issues

**Check backend CORS configuration:**

File: `backend/src/main.ts`

Should have:
```typescript
app.enableCors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
});
```

### 4. Login Endpoint Issues

**Test the API directly:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@urutix.com","password":"SuperAdmin@123"}'
```

**Expected response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "superadmin@urutix.com",
    "role": "SUPER_ADMIN"
  }
}
```

## Step-by-Step Troubleshooting

### Step 1: Verify Backend is Running

```bash
cd backend
npm run start:dev
```

Wait for: `Application successfully started`

### Step 2: Test API Endpoint

Open a new terminal:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"superadmin@urutix.com\",\"password\":\"SuperAdmin@123\"}"
```

**If this works**, the backend is fine. Issue is in frontend.

**If this fails**, check backend logs for errors.

### Step 3: Check Frontend Configuration

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to login
4. Look for the login request
5. Check:
   - Request URL (should be `http://localhost:3000/api/auth/login`)
   - Request payload (email and password)
   - Response status and body

### Step 4: Check Browser Console

Look for errors like:
- CORS errors
- Network errors
- 401 Unauthorized
- 404 Not Found

## Common Issues and Solutions

### Issue: "Network Error"

**Cause**: Backend not running or wrong URL

**Solution**:
```bash
# Start backend
cd backend
npm run start:dev

# Verify it's running
curl http://localhost:3000/api/health
```

### Issue: "CORS Error"

**Cause**: Frontend origin not allowed

**Solution**: Update `backend/src/main.ts`:
```typescript
app.enableCors({
  origin: true, // Allow all origins (development only!)
  credentials: true,
});
```

### Issue: "401 Unauthorized"

**Cause**: Wrong credentials or authentication logic issue

**Solution**: Check backend logs for authentication errors

### Issue: "404 Not Found"

**Cause**: Wrong API endpoint URL

**Solution**: Verify frontend is using `/api/auth/login`

## Quick Fixes

### Fix 1: Restart Everything

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Fix 2: Clear Browser Cache

1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### Fix 3: Try Different Browser

Sometimes browser extensions or cache cause issues.

### Fix 4: Check Environment Variables

**Backend `.env`:**
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
PORT=3000
```

**Frontend `.env`:**
```
VITE_API_URL=http://localhost:3000/api
```

## Verification Commands

```bash
# Check if user exists and password is correct
cd backend
node test-login.js

# Check all users
node check-all-users.js

# Check super admin users
node check-super-admin.js
```

## If All Else Fails

### Option 1: Try Another Admin Account

Try logging in with:
- `admin@urutix.com` (if you know the password)
- `admin@test.com` (if you know the password)

### Option 2: Reset Password

Create a script to update the password:

```javascript
// reset-password.js
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetPassword() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    
    const newPassword = 'NewPassword@123';
    const hash = await bcrypt.hash(newPassword, 14);
    
    await client.query(
        'UPDATE users SET "passwordHash" = $1 WHERE email = $2',
        [hash, 'superadmin@urutix.com']
    );
    
    console.log('Password reset to:', newPassword);
    await client.end();
}

resetPassword();
```

### Option 3: Check Backend Logs

Look for errors in the backend console when you try to login.

## Success Indicators

When login works, you should see:
1. ✅ Network request to `/api/auth/login` returns 200
2. ✅ Response contains `accessToken` and `refreshToken`
3. ✅ User is redirected to dashboard
4. ✅ Activity log entry created (check `/admin/activity-logs`)

## Need More Help?

Run these diagnostic commands:

```bash
cd backend

# Test login
node test-login.js

# Check users
node check-all-users.js

# Check backend is running
curl http://localhost:3000/api/health
```

Then share the output for further diagnosis.
