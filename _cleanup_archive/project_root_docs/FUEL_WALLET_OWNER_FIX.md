# 🔧 Fuel Wallet Owner-Based Filtering - FIXED

## The Real Issue

You were absolutely right! Fuel wallets should be filtered by **truck owner** (the logged-in user), not just by tenant.

### Previous Behavior (WRONG)
```typescript
// Old code - filtered only by tenant
async getWalletStats(tenantId: string) {
  const wallets = await this.walletRepository.find({
    where: { tenantId },  // ❌ Shows ALL wallets in tenant
  });
}
```

This meant:
- All truck owners in the same tenant saw the SAME wallet stats
- No user-specific filtering
- Privacy issue - users could see other users' wallet data

### New Behavior (CORRECT)
```typescript
// New code - filters by truck owner
async getWalletStats(tenantId: string, userId?: string) {
  if (userId) {
    // Get wallets for trucks owned by THIS user
    wallets = await this.walletRepository
      .createQueryBuilder('wallet')
      .leftJoin('trucks', 'truck', 'truck.id = wallet.truck_id')
      .where('wallet.tenant_id = :tenantId', { tenantId })
      .andWhere('truck.ownerId = :userId', { userId })  // ✅ Filter by owner
      .getMany();
  } else {
    // Admin view - all wallets
    wallets = await this.walletRepository.find({ where: { tenantId } });
  }
}
```

This means:
- Truck owners see ONLY their own trucks' wallets
- Admins see ALL wallets for the tenant
- Proper data isolation and privacy

---

## How It Works

### Data Relationship
```
User (Truck Owner)
  └─> owns Trucks (via truck.ownerId)
       └─> have Fuel Wallets (via wallet.truck_id)
```

### Query Flow
1. User logs in → JWT contains `userId` and `role`
2. API receives request → Extracts `userId` from JWT
3. If role is `TRUCK_OWNER`:
   - Query: `SELECT wallets WHERE truck.ownerId = userId`
   - Returns: Only wallets for trucks owned by this user
4. If role is `ADMIN` or `SUPER_ADMIN`:
   - Query: `SELECT wallets WHERE tenant_id = tenantId`
   - Returns: All wallets for the tenant

---

## Files Modified

### 1. Backend Service
**File:** `backend/src/modules/fuel/fuel-wallet.service.ts`

**Changes:**
- Added `userId` parameter to `getWalletStats()`
- Added conditional logic to filter by truck owner
- Uses JOIN query to link wallets → trucks → owner

### 2. Backend Controller
**File:** `backend/src/modules/fuel/fuel.controller.ts`

**Changes:**
- Extracts `userId` and `role` from request
- Passes `userId` to service if user is a truck owner
- Passes `undefined` for admins (shows all wallets)

---

## Testing the Fix

### Step 1: Check Ownership Relationships

```powershell
cd urutix\backend
node check-fuel-wallet-ownership.js
```

This shows:
- Which truck owners exist
- How many trucks each owner has
- How many wallets each owner has
- The wallet → truck → owner relationships

### Step 2: Restart Backend

```powershell
cd urutix\backend
npm run start:dev
```

The changes require a backend restart to take effect.

### Step 3: Test as Truck Owner

1. Log in as a truck owner user
2. Navigate to Fuel Management → Fuel Wallets
3. You should see ONLY wallets for YOUR trucks

### Step 4: Test as Admin

1. Log in as an admin user
2. Navigate to Fuel Management → Fuel Wallets
3. You should see ALL wallets for the tenant

---

## Expected Results

### For Truck Owner "john@example.com"
- Owns 3 trucks
- Has 3 fuel wallets (one per truck)
- Sees stats:
  ```json
  {
    "totalBalance": 12500.00,
    "totalCredits": 18000.00,
    "totalDebits": 5500.00,
    "activeWallets": 3,
    "totalWallets": 3,
    "averageBalance": 4166.67
  }
  ```

### For Truck Owner "jane@example.com"
- Owns 2 trucks
- Has 2 fuel wallets
- Sees DIFFERENT stats:
  ```json
  {
    "totalBalance": 8300.00,
    "totalCredits": 12000.00,
    "totalDebits": 3700.00,
    "activeWallets": 2,
    "totalWallets": 2,
    "averageBalance": 4150.00
  }
  ```

### For Admin
- Sees ALL 5 wallets (3 + 2)
- Sees combined stats:
  ```json
  {
    "totalBalance": 20800.00,
    "totalCredits": 30000.00,
    "totalDebits": 9200.00,
    "activeWallets": 5,
    "totalWallets": 5,
    "averageBalance": 4160.00
  }
  ```

---

## Why You Were Seeing Zeros

### Scenario 1: No Wallets for Your Trucks
- You have trucks in the database
- But those trucks don't have fuel wallets yet
- **Solution:** Run seeding script

### Scenario 2: Wallets Exist for Other Owners
- Database has wallets
- But they belong to trucks owned by OTHER users
- With the old code, you'd see all wallets (wrong!)
- With the new code, you correctly see zero (you have no wallets)
- **Solution:** Create wallets for YOUR trucks

### Scenario 3: No Trucks Owned
- Your user account has no trucks
- Therefore no wallets
- **Solution:** Assign trucks to your user, then create wallets

---

## Seeding Script Update

The seeding script already creates wallets correctly:
- Finds trucks in the database
- Creates one wallet per truck
- Links wallet to truck via `truck_id`
- The truck's `ownerId` determines who sees the wallet

```powershell
cd urutix\backend
node seed-fuel-wallets.js
```

---

## Verification Checklist

- [ ] Backend restarted after code changes
- [ ] Logged in as a truck owner user
- [ ] User has trucks in database (check with ownership script)
- [ ] Trucks have fuel wallets (check with ownership script)
- [ ] Browser hard refreshed (Ctrl+F5)
- [ ] Fuel Wallets tab shows correct data for THIS user only

---

## Database Query Examples

### Check Your Trucks
```sql
SELECT id, plate_number, "ownerId"
FROM trucks
WHERE "ownerId" = 'your-user-id';
```

### Check Your Wallets
```sql
SELECT fw.id, fw.balance, fw.truck_id, t.plate_number
FROM fuel_wallets fw
JOIN trucks t ON t.id = fw.truck_id
WHERE t."ownerId" = 'your-user-id';
```

### Check All Owner-Wallet Relationships
```sql
SELECT 
  u.email as owner,
  COUNT(DISTINCT t.id) as trucks,
  COUNT(DISTINCT fw.id) as wallets,
  SUM(fw.balance) as total_balance
FROM users u
LEFT JOIN trucks t ON t."ownerId" = u.id
LEFT JOIN fuel_wallets fw ON fw.truck_id = t.id
WHERE u.role_id IN (SELECT id FROM roles WHERE name = 'TRUCK_OWNER')
GROUP BY u.email;
```

---

## Summary

✅ **Fixed:** Fuel wallets now filter by truck owner (user)  
✅ **Privacy:** Users only see their own trucks' wallets  
✅ **Admin View:** Admins still see all wallets for tenant  
⚠️ **Action Required:** Restart backend for changes to take effect  

**Next Steps:**
1. Restart backend
2. Run ownership diagnostic: `node check-fuel-wallet-ownership.js`
3. Verify your user has trucks with wallets
4. Test in browser

The system now correctly implements owner-based wallet filtering!
