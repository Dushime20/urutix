# 🔄 Backend Restart Instructions

**Issue:** Code changes not reflected in API responses  
**Reason:** Backend server needs to be restarted to pick up the changes  
**Date:** February 12, 2026

---

## ✅ Changes Made (Already Saved)

The following changes have been made to `backend/src/modules/users/users.controller.ts`:

### Added `tenantId` to response in these endpoints:
1. ✅ `GET /users/tenant/:tenantId` - Line 205
2. ✅ `GET /users/tenant/:tenantId/role/:role` - Line 240
3. ✅ `GET /users/:userId` - Line 280
4. ✅ `PUT /users/:userId` - Line 320
5. ✅ `PATCH /users/:userId/status` - Line 360
6. ✅ `PATCH /users/:userId/role` - Line 400

**Code is correct and saved!** ✅

---

## 🔄 How to Restart Backend

### Option 1: Using npm (Recommended)

#### Step 1: Stop the current server
Press `Ctrl + C` in the terminal where the backend is running

#### Step 2: Restart the server
```bash
cd backend
npm run start:dev
```

**OR** if using production mode:
```bash
cd backend
npm run start
```

---

### Option 2: Using PM2 (if installed)

```bash
pm2 restart backend
```

**OR**

```bash
pm2 restart all
```

---

### Option 3: Using nodemon (if configured)

If you're using nodemon, it should auto-restart. If not:

```bash
cd backend
npx nodemon
```

---

## ✅ Verify the Changes

After restarting, test the endpoint again:

### Using cURL:
```bash
curl -X GET \
  'http://localhost:3005/api/users/tenant/797356c8-dcb6-48ab-9969-e0b373dde1ae?page=1&limit=10' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Expected Response (with tenantId):
```json
{
  "success": true,
  "message": "Tenant users retrieved successfully",
  "data": [
    {
      "id": "634fd3fb-5899-4ea1-a20a-da03dd9bd16d",
      "tenantId": "797356c8-dcb6-48ab-9969-e0b373dde1ae",  ← SHOULD NOW APPEAR!
      "email": "cargo.owner2@test.com",
      "role": "CARGO_OWNER",
      "status": "ACTIVE",
      "profile": null
    }
  ],
  "total": 8
}
```

---

## 🔍 Troubleshooting

### If tenantId still doesn't appear:

#### 1. Check if server restarted successfully
Look for this in the terminal:
```
[Nest] 12345  - 02/12/2024, 3:45:00 PM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 02/12/2024, 3:45:01 PM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 02/12/2024, 3:45:01 PM     LOG [RoutesResolver] UsersController {/api/users}:
[Nest] 12345  - 02/12/2024, 3:45:01 PM     LOG [RouterExplorer] Mapped {/api/users/tenant/:tenantId, GET} route
```

#### 2. Check if TypeScript compiled
```bash
cd backend
npm run build
```

Look for any compilation errors.

#### 3. Clear cache and restart
```bash
cd backend
rm -rf dist
npm run build
npm run start:dev
```

#### 4. Check the actual file
```bash
cd backend
cat src/modules/users/users.controller.ts | grep -A 10 "getTenantUsers"
```

Should show `tenantId: user.tenantId,` in the response mapping.

---

## 📝 Quick Checklist

- [ ] Stop the backend server (Ctrl + C)
- [ ] Navigate to backend directory (`cd backend`)
- [ ] Start the server (`npm run start:dev`)
- [ ] Wait for "Application is running" message
- [ ] Test the endpoint again
- [ ] Verify `tenantId` appears in response

---

## 🎯 Summary

**Problem:** Backend server is running old code  
**Solution:** Restart the backend server  
**Command:** `cd backend && npm run start:dev`  
**Expected Result:** `tenantId` will appear in all user responses

---

**Document Version:** 1.0  
**Last Updated:** February 12, 2026  
**Status:** Ready to Restart ✅
