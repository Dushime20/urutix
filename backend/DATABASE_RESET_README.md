# Database Reset and Seed Scripts

## Overview

These scripts will clean your database and create fresh test data to verify the credit marketplace functionality works correctly.

## Scripts

### 1. `reset-database.js`
Deletes ALL data from the database (keeps table structure).

### 2. `seed-database.js`
Creates fresh test data including:
- 1 Tenant
- 1 Subscription Plan (5000 credits)
- 1 Tenant Admin with 2 active subscriptions (10,000 total credits)
- 1 Truck Owner with 0 credits
- Credit Marketplace configuration

### 3. `reset-and-seed.js`
Runs both scripts in sequence (recommended).

## Usage

### Quick Start (Recommended)

```bash
cd backend
node reset-and-seed.js
```

### Step by Step

```bash
cd backend

# Step 1: Delete all data
node reset-database.js

# Step 2: Create fresh test data
node seed-database.js
```

## Test Accounts

After seeding, you'll have these accounts:

### Tenant Admin
- **Email:** `admin@test.com`
- **Password:** `Admin@123`
- **Credits:** 10,000 (from 2 active subscriptions × 5,000)
- **Role:** Can sell credits via marketplace

### Truck Owner
- **Email:** `truckowner@test.com`
- **Password:** `TruckOwner@123`
- **Credits:** 0
- **Role:** Can buy credits from marketplace

## Testing the Marketplace

1. **Reset and seed the database:**
   ```bash
   node reset-and-seed.js
   ```

2. **Restart the backend server:**
   ```bash
   npm run dev
   ```

3. **Login as Truck Owner:**
   - Email: `truckowner@test.com`
   - Password: `TruckOwner@123`

4. **Navigate to Buy Credits:**
   - Go to: `http://localhost:3000/dashboard/fleet/buy-credits`

5. **Purchase Credits:**
   - You should see: "Available: 10,000"
   - Enter amount: 1000 credits
   - Complete purchase

6. **Verify:**
   - Truck owner balance should increase by 1000
   - Tenant admin balance should decrease by 1000
   - Check `/api/credits/balance` for both users

## Expected Results

### Before Purchase
- Tenant Admin: 10,000 credits
- Truck Owner: 0 credits

### After Purchasing 1000 Credits
- Tenant Admin: 9,000 credits (10,000 - 1,000)
- Truck Owner: 1,000 credits (0 + 1,000)

### Database Verification

Check the database directly:

```bash
node -e "const {DataSource}=require('typeorm');require('dotenv').config();const ds=new DataSource({type:'postgres',host:process.env.DB_HOST,port:parseInt(process.env.DB_PORT),username:process.env.DB_USERNAME,password:process.env.DB_PASSWORD,database:process.env.DB_NAME});ds.initialize().then(async()=>{const r=await ds.query('SELECT u.email, ca.current_balance, ca.lifetime_earned, ca.lifetime_spent FROM credit_accounts ca JOIN users u ON ca.user_id = u.id ORDER BY u.email');console.table(r);await ds.destroy();})"
```

## Troubleshooting

### If marketplace still shows wrong balance:

1. **Check database values:**
   ```bash
   node test-fresh-query.js
   ```

2. **Restart backend server** (important!)

3. **Clear browser cache** and refresh

### If purchase fails:

1. Check backend console for errors
2. Verify marketplace is enabled
3. Check tenant admin has sufficient credits

## What Gets Reset

✅ All users and profiles
✅ All subscriptions
✅ All credit accounts and transactions
✅ All marketplace settings
✅ All cargo, trucks, bids, auctions

⚠️ **WARNING:** This deletes ALL data! Only use in development/testing.

## What Stays

✅ Database schema (tables, columns)
✅ Migrations history
✅ Subscription plans structure

## Notes

- The seed script creates realistic test data
- All passwords are hashed with bcrypt
- Credit transactions are properly recorded
- Marketplace is pre-configured and enabled
- Both subscriptions are active (not cancelled)
