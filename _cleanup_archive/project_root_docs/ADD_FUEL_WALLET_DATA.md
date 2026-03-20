# How to Add Fuel Wallet Data

## Issue
Your fuel wallet system is working correctly, but you have no data in the database. The seeding script failed because it couldn't connect to your database (port 5433).

## Solution Options

### Option 1: Add Data via SQL (Easiest)

Run these SQL commands in your database tool (pgAdmin, DBeaver, etc.):

```sql
-- Step 1: Get your tenant ID
SELECT id, name FROM tenants LIMIT 5;
-- Copy the tenant ID you want to use

-- Step 2: Get some driver IDs (if you have drivers)
SELECT id, first_name, last_name FROM drivers WHERE tenant_id = 'YOUR_TENANT_ID' LIMIT 5;
-- Copy a driver ID

-- Step 3: Create fuel wallets
INSERT INTO fuel_wallets (tenant_id, driver_id, balance, total_credits, total_debits, status)
VALUES 
  ('YOUR_TENANT_ID', 'DRIVER_ID_1', 2500.00, 5000.00, 2500.00, 'ACTIVE'),
  ('YOUR_TENANT_ID', 'DRIVER_ID_2', 3200.00, 6000.00, 2800.00, 'ACTIVE'),
  ('YOUR_TENANT_ID', 'DRIVER_ID_3', 1800.00, 4000.00, 2200.00, 'ACTIVE');

-- Step 4: Get the wallet IDs
SELECT id, driver_id, balance FROM fuel_wallets WHERE tenant_id = 'YOUR_TENANT_ID';

-- Step 5: Add some transactions
INSERT INTO fuel_wallet_transactions (tenant_id, wallet_id, type, amount, description)
VALUES 
  ('YOUR_TENANT_ID', 'WALLET_ID_1', 'CREDIT', 5000.00, 'Initial credit allocation'),
  ('YOUR_TENANT_ID', 'WALLET_ID_1', 'DEBIT', 2500.00, 'Fuel purchase'),
  ('YOUR_TENANT_ID', 'WALLET_ID_2', 'CREDIT', 6000.00, 'Initial credit allocation'),
  ('YOUR_TENANT_ID', 'WALLET_ID_2', 'DEBIT', 2800.00, 'Fuel purchase');
```

### Option 2: Use the Frontend (After you have at least one wallet)

Once you have created at least one wallet using SQL:

1. Go to **Fuel Management** → **Fuel Wallets** tab
2. Enter a driver ID in the search box
3. Click **Search**
4. Use the **Add Credit** button to add more funds
5. The stats will update automatically

### Option 3: Fix the Seeding Script

Update the seeding script to use your correct database port:

```bash
# Edit the seed-fuel-wallets.js file
# Change line 4 from:
port: process.env.DB_PORT || 5432,
# To:
port: process.env.DB_PORT || 5433,

# Then run:
node seed-fuel-wallets.js
```

## Quick SQL Template

Replace these placeholders with your actual IDs:

```sql
-- Example with actual structure
INSERT INTO fuel_wallets (tenant_id, driver_id, balance, total_credits, total_debits, status)
VALUES 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'driver-uuid-here', 2500.00, 5000.00, 2500.00, 'ACTIVE');
```

## Verify It Worked

After adding data, refresh the Fuel Wallets page. You should see:
- **Total Wallet Balance**: Sum of all balances
- **Total Issued Credit**: Sum of all credits
- **Active Wallets**: Count of active wallets

## Get Your IDs

### Get Tenant ID:
```sql
SELECT id, name FROM tenants;
```

### Get Driver IDs:
```sql
SELECT id, first_name, last_name FROM drivers WHERE tenant_id = 'YOUR_TENANT_ID';
```

### If you don't have drivers, use truck IDs:
```sql
SELECT id, plate_number FROM trucks WHERE tenant_id = 'YOUR_TENANT_ID';

-- Then create wallet for truck:
INSERT INTO fuel_wallets (tenant_id, truck_id, balance, total_credits, total_debits, status)
VALUES ('YOUR_TENANT_ID', 'TRUCK_ID', 2500.00, 5000.00, 2500.00, 'ACTIVE');
```

## Summary

The fuel wallet system is working perfectly - you just need to add some data. Use SQL to quickly create a few wallets and transactions, then refresh your browser to see the stats!
