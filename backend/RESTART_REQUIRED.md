# Backend Server Restart Required

## Issue
The database has been updated with the correct credit balance values, but the API endpoints are still returning old cached data.

## Database Status
✅ **Database has CORRECT values:**
- Current Balance: 9,976 credits
- Lifetime Earned: 10,000 credits
- Lifetime Spent: 24 credits
- Subscription Credits: 10,000 credits

## API Status
❌ **API returning OLD values:**
- `/api/credits/balance` returns: `currentBalance: 4976, lifetimeSpent: 5024`
- `/api/credits/marketplace/stats` returns: `currentBalance: 4976`

## Root Cause
The backend server process was started before the database fix was applied. TypeORM's entity manager has cached the old entity data in memory.

## Solution
**You need to restart the backend server:**

### Option 1: If running with npm/yarn
```bash
# Stop the server (Ctrl+C in the terminal where it's running)
# Then restart:
cd backend
npm run dev
# or
yarn dev
```

### Option 2: If running with PM2
```bash
pm2 restart all
# or
pm2 restart backend
```

### Option 3: Kill and restart manually
```bash
# Find the process
Get-Process node

# Kill the backend process (use the PID from above)
Stop-Process -Id <PID>

# Restart
cd backend
npm run dev
```

## Verification
After restarting, test the endpoints:

1. **Credit Balance:**
   ```
   GET http://localhost:3005/api/credits/balance
   ```
   Should return: `currentBalance: 9976, lifetimeSpent: 24`

2. **Marketplace Stats:**
   ```
   GET http://localhost:3005/api/credits/marketplace/stats
   ```
   Should return: `currentBalance: 9976`

3. **Frontend:**
   - Refresh the page at `dashboard/fleet/buy-credits`
   - Should now show "9,976 credits available" instead of "4,976"

## Quick Verification Script
Run this to verify database values:
```bash
cd backend
node verify-db-values.js
```

## What Was Fixed
- Corrected `lifetime_spent` from 5,024 to 24 credits
- Corrected `current_balance` from 4,976 to 9,976 credits
- Removed phantom 5,000 credit deduction from old partner plan system
