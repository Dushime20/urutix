# Testing Guide - Recent Changes

## Test 1: Cargo Owner Password Setup Route ✅

**What was fixed**: Added missing route for cargo owner password setup

**How to test**:
1. Start local development:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. Navigate to the password setup URL (replace TOKEN with actual token):
   ```
   http://localhost:5173/cargo-owner/setup-password?token=YOUR_TOKEN_HERE
   ```

3. **Expected result**: 
   - ✅ Password setup page loads with Package icon
   - ✅ "Set Up Your Password" heading visible
   - ✅ Password and Confirm Password fields present
   - ✅ Password criteria checklist shows
   - ❌ NO "No routes matched location" error

---

## Test 2: Admin KPI Endpoint Shows All Users ✅

**What was fixed**: ADMIN role now sees all users (not just their own)

**How to test**:

### Step 1: Restart Backend
```bash
docker-compose -f docker-compose.dev.yml restart backend
```

### Step 2: Login as Admin
- URL: `http://localhost:5173/auth`
- Email: `admin@urutix.com`
- Password: `Admin@123456`

### Step 3: Check KPI Endpoint
Open browser DevTools (F12) → Network tab, then navigate to admin dashboard.

Look for request to:
```
GET http://localhost:3005/api/admin/kpi
```

**Expected response**:
```json
{
  "users": 3,  // ✅ Should show actual count (3+), not just 1
  "activeTrips": 0,
  "revenue": 0,
  "engagement": 2,
  "alerts": 0
}
```

**Before fix**: `"users": 1` (only showed admin's own count)  
**After fix**: `"users": 3` (shows all users in system)

### Alternative: Test via curl
```bash
# First, get auth token by logging in
curl -X POST http://localhost:3005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@urutix.com","password":"Admin@123456"}'

# Use the token from response
curl -X GET http://localhost:3005/api/admin/kpi \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Test 3: Docker Compose Version Warning Fixed ✅

**What was fixed**: Removed obsolete `version: '3.8'` from docker-compose files

**How to test**:
```bash
docker-compose -f docker-compose.dev.yml restart backend
```

**Expected result**:
- ✅ NO warning about "version is obsolete"
- ✅ Clean restart output
- ❌ NO message: "the attribute `version` is obsolete"

**Before fix**:
```
time="2026-05-04T09:40:12+02:00" level=warning msg="docker-compose.dev.yml: the attribute `version` is obsolete"
```

**After fix**:
```
[+] restart 1/1
✔ Container urutix_backend_dev Restarted
```

---

## Test 4: All Admin Endpoints Work for ADMIN Role ✅

**What was fixed**: 7 admin endpoints now recognize ADMIN role as global admin

**Endpoints to test** (all should return global data, not tenant-scoped):

1. **KPI Endpoint**:
   ```
   GET /api/admin/kpi
   ```

2. **Analytics Overview**:
   ```
   GET /api/admin/analytics/overview
   ```

3. **Cargo Analytics**:
   ```
   GET /api/admin/analytics/cargo
   ```

4. **Fleet Analytics**:
   ```
   GET /api/admin/analytics/fleet
   ```

5. **General Analytics**:
   ```
   GET /api/admin/analytics
   ```

6. **Financials**:
   ```
   GET /api/admin/financials
   ```

7. **Escrow**:
   ```
   GET /api/admin/escrow
   ```

**How to test all at once**:
1. Login as admin@urutix.com
2. Open browser DevTools → Network tab
3. Navigate through admin dashboard sections
4. Check that all API responses show global data (not filtered by tenant)

---

## Quick Verification Checklist

- [ ] Cargo owner password setup route loads without 404
- [ ] Admin KPI shows correct user count (3+, not 1)
- [ ] No docker-compose version warning appears
- [ ] Backend restarts successfully
- [ ] All admin analytics endpoints return global data
- [ ] No TypeScript/compilation errors in frontend
- [ ] No NestJS errors in backend logs

---

## Troubleshooting

### Issue: "No routes matched location"
**Solution**: Make sure frontend container is rebuilt:
```bash
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d --build
```

### Issue: Still seeing "users": 1 in KPI
**Solution**: Backend needs restart to load new code:
```bash
docker-compose -f docker-compose.dev.yml restart backend
# Wait 10 seconds for backend to fully restart
docker-compose -f docker-compose.dev.yml logs -f backend
```

### Issue: Changes not reflecting
**Solution**: Clear browser cache and hard reload:
- Chrome/Edge: `Ctrl + Shift + R`
- Firefox: `Ctrl + F5`

---

## Production Deployment

After testing locally, deploy to production:

```bash
# On production server (38.242.224.199)
cd ~/urutix-smart-logistics
git pull origin YOUR_BRANCH
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build

# Verify backend is running
docker-compose -f docker-compose.production.yml logs -f backend
```

**Expected**: Backend starts without errors, all 108 tables exist in database.
