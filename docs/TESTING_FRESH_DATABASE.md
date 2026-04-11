# Testing Fresh Database - Complete Workflow

## Database Status
✅ Database has been reset and seeded with fresh test users
✅ All users belong to "Test Company" tenant
✅ No subscriptions exist yet (you'll create them manually)
✅ Credit balance corruption fix applied (using `update()` instead of `save()`)

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@test.com | SuperAdmin@123 |
| Tenant Admin | admin@test.com | Admin@123 |
| Truck Owner | truckowner@test.com | TruckOwner@123 |
| Cargo Owner | cargoowner@test.com | CargoOwner@123 |

## Step-by-Step Testing Workflow

### Step 1: Create Subscription Plans (Super Admin)
1. Login as **superadmin@test.com**
2. Navigate to subscription plans management
3. Create a plan (e.g., "Pro Plan"):
   - Name: Pro Plan
   - Credits: 5000
   - Price: $100
   - Credits per ton (Tenant): 2
   - Credits per ton (Truck Owner): 5
4. Save the plan

### Step 2: Purchase Subscriptions (Tenant Admin)
1. Login as **admin@test.com**
2. Navigate to subscription plans
3. Purchase 2 subscriptions of "Pro Plan"
4. Expected result: 10,000 credits total (2 × 5000)

### Step 3: Configure Credit Marketplace (Tenant Admin)
1. Still logged in as **admin@test.com**
2. Navigate to Credit Marketplace (tenant-admin/credit-marketplace)
3. Configure marketplace:
   - Enable marketplace: Yes
   - Minimum purchase: 100 credits
   - Maximum purchase: 5000 credits
   - Price per credit: $0.10
4. Save configuration

### Step 4: Buy Credits (Truck Owner)
1. Login as **truckowner@test.com**
2. Navigate to Buy Credits (dashboard/fleet/buy-credits)
3. Enter amount: 1000 credits
4. Complete payment (use test payment method)
5. Expected result:
   - Truck owner gets 1000 credits
   - Tenant admin balance reduced by 1000 credits (9000 remaining)
   - Revenue tracking updated

### Step 5: Create Cargo (Cargo Owner)
1. Login as **cargoowner@test.com**
2. Navigate to cargo creation
3. Create a cargo:
   - Weight: 4 tons
   - Pickup location: City A
   - Delivery location: City B
   - Other details as needed
4. Save cargo

### Step 6: Place Bid (Truck Owner)
1. Login as **truckowner@test.com**
2. Navigate to available cargo/auctions
3. Find the cargo created in Step 5
4. Place a bid (e.g., $500)
5. Expected result: Bid created successfully

### Step 7: Accept Bid (Tenant Admin)
1. Login as **admin@test.com**
2. Navigate to bidding management
3. Find the bid from truck owner
4. Accept the bid
5. Expected result:
   - **Tenant Admin**: 4 tons × 2 credits/ton = 8 credits deducted
   - **Truck Owner**: 4 tons × 5 credits/ton = 20 credits deducted
   - Bid status changed to ACCEPTED

### Step 8: Verify Credit Balances
1. Check tenant admin balance:
   - Started with: 10,000 credits
   - Sold to truck owner: -1,000 credits
   - Bid accepted: -8 credits
   - **Expected balance: 8,992 credits**

2. Check truck owner balance:
   - Purchased: 1,000 credits
   - Bid accepted: -20 credits
   - **Expected balance: 980 credits**

## Verification Endpoints

### Check Tenant Admin Balance
```
GET http://localhost:3005/api/credits/balance
Authorization: Bearer <tenant_admin_token>
```

### Check Truck Owner Balance
```
GET http://localhost:3005/api/credits/balance
Authorization: Bearer <truck_owner_token>
```

### Check Marketplace Stats
```
GET http://localhost:3005/api/credits/marketplace/stats
Authorization: Bearer <tenant_admin_token>
```

## Troubleshooting

### If balance shows wrong value:
1. Check the `/api/credits/balance` endpoint response
2. Verify `lifetimeSpent` matches sum of all deduction transactions
3. Verify `currentBalance = lifetimeEarned - lifetimeSpent`
4. If corrupted, the `deductCredits()` fix should prevent future corruption

### If marketplace purchase fails:
1. Verify tenant admin has enough credits available
2. Check marketplace is enabled
3. Verify purchase amount is within min/max limits
4. Check backend logs for detailed error

### If bid acceptance fails:
1. Verify both tenant admin and truck owner have sufficient credits
2. Check credit rates are configured in subscription plan
3. Verify cargo weight is set correctly
4. Check backend logs for detailed error

## Database Scripts

Reset and reseed if needed:
```bash
cd backend
node reset-database.js
node seed-users-only.js
```

Or combined:
```bash
cd backend
node reset-database.js; node seed-users-only.js
```

## Important Notes

- The `deductCredits()` method now uses `update()` instead of `save()` to prevent balance corruption
- Credit rates come from tenant admin's parent subscription plan
- Both tenant admin and truck owner lose credits when bid is accepted
- Marketplace allows flexible credit purchases (no fixed partner plans)
- All test users belong to the same tenant ("Test Company")
