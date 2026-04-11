# Test Account Credentials

## Fresh Database - Seeded Users

All users belong to **Test Company** tenant.

### 👑 Super Admin
- **Email**: superadmin@test.com
- **Password**: SuperAdmin@123
- **Role**: System administrator
- **Purpose**: Create subscription plans, manage system

### 👤 Tenant Admin
- **Email**: admin@test.com
- **Password**: Admin@123
- **Role**: Tenant administrator
- **Tenant**: Test Company
- **Purpose**: Purchase subscriptions, configure marketplace, manage tenant

### 🚛 Truck Owner
- **Email**: truckowner@test.com
- **Password**: TruckOwner@123
- **Role**: Truck owner
- **Tenant**: Test Company
- **Purpose**: Buy credits from marketplace, place bids

### 📦 Cargo Owner
- **Email**: cargoowner@test.com
- **Password**: CargoOwner@123
- **Role**: Cargo owner
- **Tenant**: Test Company
- **Purpose**: Create cargo, accept bids

---

## Testing Workflow

1. **Login as Super Admin** → Create subscription plans (e.g., 5000 credits for $100)
2. **Login as Tenant Admin** → Purchase 2 subscriptions (10,000 credits total) ⚠️ **REQUIRED BEFORE BIDDING**
3. **Login as Tenant Admin** → Configure credit marketplace (min purchase, price per credit)
4. **Login as Truck Owner** → Buy credits from marketplace
5. **Login as Cargo Owner** → Create cargo
6. **Login as Truck Owner** → Place bid on cargo
7. **Login as Tenant Admin** → Accept bid (credits deducted from both tenant admin and truck owner)

⚠️ **IMPORTANT**: Tenant admin MUST purchase at least one subscription before truck owners can place bids. The subscription provides the credit rates (creditsPerTonTenant and creditsPerTonTruckOwner) used for all bidding calculations.

---

## Database Scripts

- **Complete Reset (ALL 105 tables)**: `node backend/reset-database-complete.js`
- **Seed Users**: `node backend/seed-users-only.js`
- **Both**: `node backend/reset-database-complete.js; node backend/seed-users-only.js`
- **List All Tables**: `node backend/list-all-tables.js`

---

## Notes

- Database has been completely reset
- No subscriptions created yet (you'll create them manually via UI)
- No credit accounts exist yet (created automatically when subscriptions are purchased)
- All users are ACTIVE status
- Tenant is ACTIVE status
