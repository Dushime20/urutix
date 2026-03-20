# Quick Fix: Trucks 403 Error

## The Problem
JWT strategy was setting `user.id` but permissions guard expected `user.userId`, causing authentication to fail.

## The Solution
Modified `jwt.strategy.ts` to set both `user.id` AND `user.userId`, plus include permissions from JWT payload.

## Apply the Fix (3 Steps)

### 1. Rebuild Backend
```bash
cd urutix/backend
npm run build
```

### 2. Restart Backend
```bash
# Stop current process (Ctrl+C)
npm run start:dev
```

### 3. Clear Cache & Re-login
1. Open browser console (F12)
2. Run: `localStorage.clear(); sessionStorage.clear();`
3. Log out
4. Log back in with truck owner account
5. Go to Fleet Management → Trucks
6. ✅ Should work now!

## Quick Test
```bash
# Run this script to build and get instructions
./fix-trucks-403-now.ps1
```

## Verify It Worked
- No 403 errors in console
- Trucks table displays data
- Can view/create/update trucks

## Still Not Working?
1. Check backend console for errors
2. Verify you logged out and back in
3. Check JWT token has permissions:
   ```bash
   node backend/check-jwt-token-structure.js "YOUR_TOKEN_HERE"
   ```

---

**Full details**: See `TRUCKS_403_FINAL_FIX.md`
