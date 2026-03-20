# Quick Start: Add to Wallet Feature

## 🚀 Deploy in 3 Steps

### Step 1: Run Migration (30 seconds)
```powershell
cd urutix/backend
node run-fuel-wallet-owner-migration.js
```

### Step 2: Restart Backend (1 minute)
```bash
# Press Ctrl+C to stop current backend
npm run start:dev
```

### Step 3: Test (2 minutes)
1. Login as truck owner
2. Go to: Fleet Dashboard → Fuel Wallets
3. Click "Add to Wallet" button
4. Fill form and submit
5. ✅ Done!

---

## 📋 What You'll See

### On Fuel Wallets Page
- Your wallet balance displayed prominently
- **"Add to Wallet"** button (gradient indigo-purple)
- Transaction history table with petrol station column

### When You Click the Button
- Beautiful modal opens
- Form with 3 color-coded sections:
  - 💙 **Transaction Amount** (Indigo)
  - 💚 **Petrol Station Info** (Emerald)
  - 💛 **Transaction Details** (Amber)

### Form Fields
- Petrol Station Name ✅
- Station Location ✅
- Receipt Number ✅
- Transaction Date ✅
- Fuel Type (dropdown) ✅
- Payment Method (dropdown) ✅
- Liters
- Price per Liter
- Total Amount (auto-calculated!)

---

## 🎯 Key Features

1. **Auto-Calculation**: Enter liters and price → amount calculates automatically
2. **Validation**: Required fields are enforced
3. **Owner-Based**: Wallet belongs to you (truck owner), not drivers
4. **Complete Details**: All fuel purchase info stored
5. **Transaction History**: See all your fuel purchases with station names

---

## 🐛 Troubleshooting

### Button Not Showing?
- Ensure backend restarted after migration
- Check you're logged in as truck owner
- Clear browser cache

### Modal Not Opening?
- Check browser console for errors
- Verify frontend is running
- Try refreshing the page

### Form Not Submitting?
- Fill all required fields (marked with *)
- Check backend is running
- Look for error messages in toast notifications

---

## 📁 Files Changed

### Backend (3 files)
- `src/entities/fuel-wallet.entity.ts` - Added ownerId
- `src/modules/fuel/fuel.controller.ts` - Added /my-wallet endpoint
- `src/modules/fuel/fuel-wallet.service.ts` - Added getOrCreateWalletForOwner

### Frontend (2 files)
- `components/FleetDashboard/Fuel/FuelWalletTab.tsx` - Added button & modal
- `components/FleetDashboard/Fuel/AddToWalletModal.tsx` - New modal component

### Database (1 migration)
- `migrations/016_add_owner_id_to_fuel_wallets.sql` - Added owner_id column

---

## ✅ Success Indicators

After deployment, you should see:
- ✅ Migration completes without errors
- ✅ Backend starts successfully
- ✅ "Add to Wallet" button visible on page
- ✅ Modal opens with styled form
- ✅ Form submits and wallet updates
- ✅ Transaction appears in history

---

**Ready to deploy?** Run the migration script now! 🚀
