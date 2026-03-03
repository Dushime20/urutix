# CORS Configuration Fixed

## Problem
Login was failing with CORS error:
```
Access to XMLHttpRequest at 'http://localhost:3000/api/auth/login' from origin 'http://localhost:5173' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause
The backend `main.ts` requires `ALLOWED_ORIGINS` environment variable to be set. If it's empty, CORS blocks all requests. The variable was missing from `backend/.env`.

## Solution Applied

### 1. Added ALLOWED_ORIGINS to backend/.env
```env
# CORS Configuration - Frontend origins allowed to access the API
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

This allows:
- `http://localhost:5173` - Default Vite dev server port
- `http://localhost:5174` - Alternate Vite port (if 5173 is busy)

### 2. Verified Frontend Configuration
Frontend `.env` already correctly configured:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_URL=http://localhost:3000
```

## How CORS Works in This App

From `backend/src/main.ts`:
```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

app.enableCors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-tenant-id',
    'X-Tenant-ID',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-Requested-With',
  ],
});
```

## Next Steps

### 1. Restart Backend Server
The backend needs to be restarted to pick up the new `ALLOWED_ORIGINS` environment variable:

```bash
cd backend
npm run start:dev
```

You should see in the console:
```
✅ CORS Allowed Origins: [ 'http://localhost:5173', 'http://localhost:5174' ]
```

### 2. Restart Frontend Server (if needed)
If frontend is not running:
```bash
cd frontend
npm run dev
```

### 3. Test Login
1. Navigate to `http://localhost:5173`
2. Login with super admin credentials:
   - Email: `superadmin@urutix.com`
   - Password: `SuperAdmin@123`
3. Check browser DevTools Network tab - you should see:
   - `Access-Control-Allow-Origin: http://localhost:5173` header in response
   - No CORS errors
   - Successful 200 response from `/api/auth/login`

## Production Configuration

For production deployment, update `ALLOWED_ORIGINS` in production environment:
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Troubleshooting

### Still seeing CORS errors?
1. Verify backend console shows: `✅ CORS Allowed Origins: [...]`
2. If it shows: `⚠️ WARNING: No ALLOWED_ORIGINS defined`, the .env wasn't loaded
3. Make sure you restarted the backend after changing .env
4. Check frontend is running on port 5173 (matches ALLOWED_ORIGINS)

### Frontend on different port?
If Vite starts on a different port (e.g., 5175), add it to ALLOWED_ORIGINS:
```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

## Files Modified
- `urutix/backend/.env` - Added ALLOWED_ORIGINS configuration

## Status
✅ CORS configuration complete - ready for testing after server restart
