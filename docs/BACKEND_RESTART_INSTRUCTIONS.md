# Backend Server Restart Instructions

## Current Situation

✅ **Database is CORRECT:**
- Tenant admin has 9,976 credits available
- Lifetime spent: 24 credits
- Current balance: 9,976 credits

❌ **API is returning OLD data:**
- `/api/credits/marketplace/availability` returns: `availableCredits: 4,976`
- Frontend shows: "Available: 4,976"

## Why This Is Happening

The backend server process was started BEFORE we fixed the database. TypeORM (the ORM library) has cached the old entity data in memory. Even though the database has the correct values, the running server process is returning the cached data.

## Solution: Restart the Backend Server

### Step 1: Find the Backend Server Process

Open the terminal where your backend server is running. You should see output like:
```
[Nest] 19584  - 04/11/2026, 10:13:22 AM   LOG [NestApplication] Nest application successfully started
```

### Step 2: Stop the Server

Press `Ctrl + C` in that terminal to stop the server.

### Step 3: Restart the Server

```bash
cd backend
npm run dev
```

Or if you're using yarn:
```bash
cd backend
yarn dev
```

### Step 4: Verify the Fix

1. **Check the API endpoint:**
   - Open: `http://localhost:3005/api/credits/marketplace/availability`
   - Should show: `"availableCredits": 9976` (not 4976)

2. **Check the frontend:**
   - Refresh the page: `http://localhost:3000/dashboard/fleet/buy-credits`
   - Should show: "Available: 9,976" (not 4,976)

3. **Try to purchase credits:**
   - Enter an amount like 1000 credits
   - Should NOT show error "Only 4,976 credits available"
   - Should allow purchase up to 9,976 credits

## Alternative: Force Clear TypeORM Cache

If restarting doesn't work, you can add this to force TypeORM to reload:

```typescript
// In credit-marketplace.service.ts, modify getMarketplaceAvailability:
const creditAccount = await this.creditService['creditAccountRepository']
  .createQueryBuilder('account')
  .where('account.tenantId = :tenantId', { tenantId })
  .andWhere('account.userId = :userId', { userId: settings.tenantAdminUserId })
  .getOne();
```

But **restarting the server is the simplest and recommended solution**.

## What Changed in the Database

We fixed a bug where 5,000 phantom credits were incorrectly deducted from the tenant admin's balance:

**Before:**
- Lifetime Earned: 10,000
- Lifetime Spent: 5,024 (WRONG - included phantom deduction)
- Current Balance: 4,976 (WRONG)

**After:**
- Lifetime Earned: 10,000
- Lifetime Spent: 24 (CORRECT - only actual consumption)
- Current Balance: 9,976 (CORRECT)

The phantom 5,000 credits were from the old partner plan system that incorrectly "allocated" credits. In the new marketplace system, credits should NOT be deducted until they're actually sold.
