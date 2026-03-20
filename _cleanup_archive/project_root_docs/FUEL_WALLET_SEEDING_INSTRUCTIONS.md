# 💰 Fuel Wallet Data Seeding Instructions

## Current Situation

✅ **Backend route ordering bug FIXED**  
✅ **Backend has been restarted**  
✅ **API is working correctly**  
✅ **Frontend is displaying data from API**  

⚠️ **The API returns all zeros because there's NO DATA in the database yet**

## What You Need to Do

Add test data to your database so you can see actual fuel wallet statistics.

---

## Method 1: Automated Seeding Script (Recommended)

### Step 1: Run the PowerShell Script

```powershell
cd urutix\backend
.\seed-fuel-wallets.ps1
```

This script will:
- ✅ Install the `dotenv` package (needed to read .env file)
- ✅ Load your database configuration (port 5433, etc.)
- ✅ Create fuel wallets for existing drivers/trucks
- ✅ Add realistic transaction history
- ✅ Set random balances between 1,000 - 6,000 per wallet
- ✅ Provide clear success/error messages

### Step 2: Verify the Results

After successful seeding, you should see output like:
```
✅ Using tenant: [Your Tenant Name]
✅ Found 5 drivers
✅ Found 3 trucks

💰 Creating fuel wallets...

✅ Created wallet for driver: John Doe - Balance: 3450
✅ Created wallet for driver: Jane Smith - Balance: 5200
...

✅ FUEL WALLETS SEEDED SUCCESSFULLY
Created 5 fuel wallets
```

### Step 3: Refresh Your Browser

1. Go to your browser
2. Press `Ctrl+F5` (hard refresh)
3. Navigate to: **Fuel Management → Fuel Wallets tab**
4. You should now see actual statistics instead of zeros!

---

## Method 2: Manual Node Command

If the PowerShell script doesn't work:

```powershell
cd urutix\backend
npm install dotenv --save-dev
node seed-fuel-wallets.js
```

---

## Method 3: Manual SQL Commands

If you prefer to add data manually, see `ADD_FUEL_WALLET_DATA.md` for SQL commands.

---

## Troubleshooting

### Error: "ECONNREFUSED ::1:5432"

**Problem:** Script can't connect to database  
**Solution:** The script now loads from `.env` file automatically. Make sure:
1. You're running from the `backend` directory
2. The `.env` file exists and has correct settings
3. PostgreSQL is running on port 5433

### Error: "No tenants found"

**Problem:** Database has no tenant records  
**Solution:** You need to create a tenant first before adding fuel wallets

### Error: "No drivers or trucks found"

**Problem:** Database has no drivers or trucks for the tenant  
**Solution:** Create some drivers or trucks first, then run the seeding script

### Script runs but still shows zeros

**Problem:** Data was added for a different tenant  
**Solution:** 
1. Check which tenant you're logged in as
2. Verify the seeding script used the correct tenant
3. Check database: `SELECT * FROM fuel_wallets WHERE tenant_id = YOUR_TENANT_ID;`

---

## What the Seeding Script Creates

For each driver/truck in your database:
- ✅ One fuel wallet with status "ACTIVE"
- ✅ Random balance between 1,000 - 6,000
- ✅ One credit transaction (initial allocation)
- ✅ 1-3 debit transactions (fuel purchases)
- ✅ Proper tenant isolation (all records linked to your tenant)

---

## Expected Results After Seeding

### In the Database
```sql
-- Check wallets
SELECT COUNT(*) FROM fuel_wallets;  -- Should show 5+ wallets

-- Check transactions
SELECT COUNT(*) FROM fuel_wallet_transactions;  -- Should show 10+ transactions

-- Check balances
SELECT driver_id, balance, total_credits, total_debits 
FROM fuel_wallets 
WHERE tenant_id = YOUR_TENANT_ID;
```

### In the Frontend
The Fuel Wallets tab should display:
- **Total Wallet Balance:** 15,000 - 30,000 (sum of all balances)
- **Total Issued Credit:** 20,000 - 40,000 (sum of all credits)
- **Active Wallets:** 5+ (number of wallets created)
- **Average Balance:** 3,000 - 6,000 (average per wallet)

---

## Database Configuration

Your database settings (from `.env`):
```
Host: 127.0.0.1
Port: 5433 (NOT the default 5432)
Database: urutix
User: postgres
Password: 123
```

The seeding script now properly loads these settings using the `dotenv` package.

---

## Next Steps

1. ✅ Run the seeding script: `.\seed-fuel-wallets.ps1`
2. ✅ Wait for success message
3. ✅ Refresh browser (Ctrl+F5)
4. ✅ Check Fuel Wallets tab - should show actual data!

---

## Need More Help?

- **Technical details:** See `FUEL_WALLET_DISPLAY_FIX.md`
- **Troubleshooting:** See `FUEL_WALLET_TROUBLESHOOTING.md`
- **Manual SQL:** See `ADD_FUEL_WALLET_DATA.md`
- **Test endpoint:** Run `node test-fuel-wallet-endpoint.js`

---

## Summary

The fuel wallet system is **fully functional**. The API is working correctly and returning accurate data (zeros because there are no records yet). Simply run the seeding script to add test data, and you'll see the statistics populate immediately.
