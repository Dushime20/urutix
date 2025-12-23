# Port Configuration Summary

## Current Port Configuration

### Backend (NestJS)
- **Port**: `3002` (default, can be overridden with `PORT` env variable)
- **API Base URL**: `http://localhost:3002/api`
- **WebSocket**: `ws://localhost:3002`
- **Swagger Docs**: `http://localhost:3002/api/docs`

### Frontend (Vite)
- **Port**: `5173` (configured in `vite.config.ts`)
- **API Base URL**: `http://localhost:3002/api` (configured in `environment.ts`)
- **WebSocket**: `ws://localhost:3002` (fixed to match backend)
- **Vite Proxy**: Proxies `/api` requests to `http://localhost:3002`

## CORS Configuration

Backend allows requests from:
- `http://localhost:5173` (Frontend)
- `http://localhost:3002` (Backend itself)
- `http://localhost:5713` (Alternative frontend port)

## Port Verification Checklist

✅ **Backend Port**: 3002
✅ **Frontend Port**: 5173
✅ **API Base URL**: http://localhost:3002/api
✅ **WebSocket URL**: ws://localhost:3002 (FIXED)
✅ **CORS**: Allows localhost:5173
✅ **Vite Proxy**: Configured correctly

## Common Issues

### Issue 1: Port Already in Use
If you see "Port 3002 already in use":
```bash
# Windows: Find and kill process on port 3002
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# Or change backend port in .env
PORT=3003
```

### Issue 2: CORS Errors
If you see CORS errors in browser console:
- Check that frontend is running on port 5173
- Verify backend CORS allows `http://localhost:5173`
- Check browser console for exact error

### Issue 3: API Connection Failed
If API calls fail:
- Verify backend is running: `http://localhost:3002/api/docs`
- Check frontend API base URL in `environment.ts`
- Verify Vite proxy configuration in `vite.config.ts`

### Issue 4: WebSocket Connection Failed
If WebSocket fails:
- Verify WebSocket URL matches backend port (3002)
- Check that backend WebSocket is enabled
- Check browser console for WebSocket errors

## Testing Ports

### Test Backend
```bash
# Check if backend is running
curl http://localhost:3002/api/docs

# Or open in browser
http://localhost:3002/api/docs
```

### Test Frontend
```bash
# Check if frontend is running
curl http://localhost:5173

# Or open in browser
http://localhost:5173
```

### Test API Connection
```bash
# Test login endpoint (should return 400/401 without credentials, not connection error)
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

## Environment Variables

### Backend (.env)
```env
PORT=3002
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5713
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3002/api
VITE_WEBSOCKET_URL=ws://localhost:3002
```

