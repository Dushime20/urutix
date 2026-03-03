# Port Configuration Fixed

## Issue

Frontend was trying to connect to port **3002**, but backend runs on port **3000**.

Error: `ERR_CONNECTION_REFUSED` on `:3002/api/tenants/search`

## Root Cause

Frontend `.env` file had incorrect API URL:
```
VITE_API_BASE_URL=http://localhost:3002/api  ❌
```

Backend runs on port **3000** by default.

## Solution Applied

### 1. Updated Frontend Configuration

**File**: `frontend/.env`

**Changed from:**
```env
VITE_API_BASE_URL=http://localhost:3002/api
VITE_API_URL=http://localhost:3002
VITE_WEBSOCKET_URL=http://localhost:3002
```

**Changed to:**
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_URL=http://localhost:3000
VITE_WEBSOCKET_URL=http://localhost:3000
```

### 2. Updated Backend Configuration

**File**: `backend/.env`

**Added:**
```env
PORT=3000
```

This makes the port explicit and prevents confusion.

## How to Apply the Fix

### Step 1: Restart Frontend

The frontend needs to be restarted to pick up the new environment variables:

```bash
cd frontend

# Stop the current dev server (Ctrl+C)

# Restart
npm run dev
```

### Step 2: Verify Backend is Running

Make sure backend is running on port 3000:

```bash
cd backend
npm run start:dev
```

You should see:
```
[Nest] Application successfully started
Listening on port 3000
```

### Step 3: Test the Connection

Open browser and check:
- Frontend: `http://localhost:5173` (or whatever Vite uses)
- Backend API: `http://localhost:3000/api`

Try logging in with:
```
Email: superadmin@urutix.com
Password: SuperAdmin@123
```

## Verification

### Check Backend is Running

```bash
curl http://localhost:3000/api/health
```

Should return a health check response.

### Check Login Endpoint

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@urutix.com","password":"SuperAdmin@123"}'
```

Should return tokens and user info.

### Check Browser Console

After restarting frontend:
1. Open DevTools (F12)
2. Go to Network tab
3. Try to login
4. Verify requests go to `localhost:3000` (not 3002)

## Port Configuration Summary

| Service | Port | URL |
|---------|------|-----|
| Backend API | 3000 | http://localhost:3000/api |
| Frontend Dev | 5173 | http://localhost:5173 |
| Database | 5433 | postgresql://localhost:5433 |

## Common Port Issues

### Issue: Port Already in Use

If you see "Port 3000 is already in use":

**Find the process:**
```bash
# Windows
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

### Issue: Wrong Port in Code

If the `.env` changes don't work, check these files:

1. `frontend/src/services/api.ts` - Should use `import.meta.env.VITE_API_BASE_URL`
2. `backend/src/main.ts` - Should use `process.env.PORT || 3000`

### Issue: Environment Variables Not Loading

**Frontend**: Vite requires restart to pick up `.env` changes
**Backend**: NestJS requires restart to pick up `.env` changes

Always restart both after changing `.env` files!

## Files Modified

1. ✅ `frontend/.env` - Changed port from 3002 to 3000
2. ✅ `backend/.env` - Added explicit PORT=3000

## Next Steps

1. **Restart frontend** (required!)
   ```bash
   cd frontend
   # Ctrl+C to stop
   npm run dev
   ```

2. **Verify backend is running**
   ```bash
   cd backend
   npm run start:dev
   ```

3. **Try logging in again**
   - Email: `superadmin@urutix.com`
   - Password: `SuperAdmin@123`

4. **Check browser console** - Should see requests to port 3000

## Success Indicators

✅ No more `ERR_CONNECTION_REFUSED` errors
✅ Network requests go to `localhost:3000`
✅ Login works successfully
✅ Activity logs are created

## If Still Not Working

1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check both servers are running
4. Verify no firewall blocking port 3000
5. Try a different browser

The port mismatch is now fixed! Just restart the frontend and you should be able to login.
