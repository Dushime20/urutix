# 🚀 Quick Start: Fuel Wallets

## TL;DR

Your fuel wallet system is working perfectly. If you see zeros despite having data in the database, it's a **tenant mismatch issue**.

---

## Quick Diagnosis

```powershell
cd urutix\backend
.\diagnose-fuel-zeros.ps1
```

This will tell you exactly what's wrong and how to fix it.

---

## Most Common Issue: Tenant Mismatch

**Problem:** Database has wallet data, but for a different tenant than you're logged in as.

**How to check:**
1. Run diagnostic script (above)
2. Look for your email in the user list
3. Check if your tenant has wallets

**Solutions:**
- **Option A:** Log in as a user whose tenant has wallets
- **Option B:** Add wallets for your current tenant (see below)

---

## Add Wallets for Your Tenant

```powershell
cd urutix\backend
.\seed-fuel-wallets.ps1
```

Then refresh your browser (Ctrl+F5) and check the Fuel Wallets tab.

---

## What This Does

1. Installs `dotenv` package (reads .env file)
2. Connects to your database (port 5433)
3. Detects YOUR tenant automatically
4. Creates 5+ fuel wallets with realistic data
5. Adds transaction history
6. Sets balances between 1,000 - 6,000 per wallet

---

## Expected Output

```
✅ Found .env file
📦 Installing dotenv package...
🚀 Running seeding script...

✅ Using tenant: [Your Tenant]
✅ Found 5 drivers
✅ Found 3 trucks

💰 Creating fuel wallets...

✅ Created wallet for driver: John Doe - Balance: 3450
✅ Created wallet for driver: Jane Smith - Balance: 5200
...

✅ FUEL WALLETS SEEDED SUCCESSFULLY
Created 5 fuel wallets
```

---

## After Seeding

### In Browser
Navigate to: **Fuel Management → Fuel Wallets**

You should see:
- **Total Wallet Balance:** ~20,000 (instead of 0)
- **Total Issued Credit:** ~30,000 (instead of 0)
- **Active Wallets:** 5+ (instead of 0)
- **Average Balance:** ~4,000 (instead of 0)

---

## Troubleshooting

### Still seeing zeros after seeding?

**Check your JWT token:**
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Find "token" or "accessToken"
4. Copy and paste at https://jwt.io
5. Look for `tenantId` in the payload

**Compare tenant IDs:**
- JWT token `tenantId` should match
- Database wallet `tenant_id`

If they don't match, you're logged in as the wrong tenant!

### Error: "ECONNREFUSED"
**Fix:** Make sure PostgreSQL is running on port 5433

### Error: "No tenants found"
**Fix:** Create a tenant first

### Error: "No drivers or trucks found"
**Fix:** Create some drivers/trucks first

---

## Alternative Methods

### Method 2: Direct Node Command
```powershell
cd urutix\backend
npm install dotenv --save-dev
node seed-fuel-wallets.js
```

### Method 3: Manual SQL
See `ADD_FUEL_WALLET_DATA.md` for SQL commands

---

## More Information

- **Tenant mismatch issue:** `FUEL_WALLET_ZEROS_DESPITE_DATA.md`
- **Full instructions:** `FUEL_WALLET_SEEDING_INSTRUCTIONS.md`
- **Status report:** `FUEL_WALLET_FINAL_STATUS.md`
- **Troubleshooting:** `FUEL_WALLET_TROUBLESHOOTING.md`

---

## Understanding Tenant Isolation

The system is designed for multi-tenant isolation:
- Each wallet belongs to ONE tenant
- API only returns wallets for YOUR tenant
- If you're logged in as Tenant A, you can't see Tenant B's wallets

This is **correct behavior** for security and data isolation!

---

**That's it! Run the diagnostic script to identify your specific issue.** 🎉
