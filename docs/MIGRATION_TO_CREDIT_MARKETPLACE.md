# Migration Guide: Partner Plans → Credit Marketplace

## Overview
This guide explains how to migrate from the old partner plan system to the new credit marketplace system.

---

## Changes Made

### Backend

#### 1. New Files Created
- ✅ `backend/migrations/036_create_credit_marketplace_settings.sql` - Database schema
- ✅ `backend/src/entities/credit-marketplace-settings.entity.ts` - Entity
- ✅ `backend/src/services/credit-marketplace.service.ts` - Business logic
- ✅ `backend/src/modules/credit-marketplace/credit-marketplace.controller.ts` - API endpoints
- ✅ `backend/src/modules/credit-marketplace/credit-marketplace.module.ts` - Module

#### 2. Modified Files
- ✅ `backend/src/app.module.ts` - Added CreditMarketplaceModule import and registration

### Frontend

#### 1. New Files Created
- ✅ `frontend/src/pages/tenant-admin/CreditMarketplace.tsx` - Tenant admin marketplace page
- ✅ `frontend/src/pages/truck-owner/BuyCredits.tsx` - Truck owner purchase page

#### 2. Modified Files
- ✅ `frontend/src/App.tsx` - Updated routes:
  - Removed: `/tenant-admin/partner-plans` → `PartnerPlans` component
  - Added: `/tenant-admin/credit-marketplace` → `CreditMarketplace` component
  - Removed: `/dashboard/fleet/partner-plans` → `TruckOwnerPartnerPlans` component
  - Added: `/dashboard/fleet/buy-credits` → `BuyCredits` component

#### 3. Old Files (Can be archived/removed after testing)
- `frontend/src/pages/tenant-admin/PartnerPlans.tsx` - Old tenant admin partner plans page
- `frontend/src/pages/truck-owner/PartnerPlans.tsx` - Old truck owner partner plans page
- `frontend/src/pages/subscription/_PartnerPlansTab.tsx` - Old partner plans tab component

---

## Migration Steps

### Step 1: Run Database Migration

```bash
cd backend

# Run the migration
npm run migration:run

# Or manually run the SQL file
psql -U postgres -d urutix -f migrations/036_create_credit_marketplace_settings.sql
```

**What this does:**
- Creates `credit_marketplace_settings` table
- Adds marketplace revenue tracking columns to `credit_accounts`
- Sets up indexes and constraints

### Step 2: Verify Backend Module Registration

Check that `backend/src/app.module.ts` includes:

```typescript
import { CreditMarketplaceModule } from './modules/credit-marketplace/credit-marketplace.module';

@Module({
  imports: [
    // ... other modules
    SubscriptionModule,
    CreditMarketplaceModule, // ✅ Added
    AnalyticsModule,
    // ... other modules
  ],
})
```

### Step 3: Restart Backend Server

```bash
cd backend
npm run start:dev
```

Verify the new endpoints are available:
- `POST /api/credits/marketplace/configure`
- `GET /api/credits/marketplace/settings`
- `GET /api/credits/marketplace/availability`
- `POST /api/credits/marketplace/purchase`
- `GET /api/credits/marketplace/stats`
- `GET /api/credits/marketplace/purchase-history`

### Step 4: Update Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 5: Restart Frontend Server

```bash
cd frontend
npm run dev
```

### Step 6: Update Navigation Links

Update sidebar navigation to point to new routes:

**Tenant Admin Sidebar:**
```typescript
// OLD
<NavLink to="/tenant-admin/partner-plans">Partner Plans</NavLink>

// NEW
<NavLink to="/tenant-admin/credit-marketplace">Credit Marketplace</NavLink>
```

**Truck Owner Sidebar:**
```typescript
// OLD
<NavLink to="/dashboard/fleet/partner-plans">Partner Plans</NavLink>

// NEW
<NavLink to="/dashboard/fleet/buy-credits">Buy Credits</NavLink>
```

---

## Testing Checklist

### Backend Testing

- [ ] Migration runs successfully
- [ ] New tables and columns created
- [ ] API endpoints respond correctly
- [ ] Marketplace configuration works
- [ ] Credit purchase flow works
- [ ] Revenue tracking updates correctly
- [ ] Purchase history retrieves correctly

### Frontend Testing

#### Tenant Admin
- [ ] Can access `/tenant-admin/credit-marketplace`
- [ ] Can configure marketplace settings
- [ ] Can view sales statistics
- [ ] Can see available credits
- [ ] Can enable/disable marketplace
- [ ] Stats update in real-time

#### Truck Owner
- [ ] Can access `/dashboard/fleet/buy-credits`
- [ ] Can view available credits and pricing
- [ ] Can enter custom credit amount
- [ ] Validation works (min/max/available)
- [ ] Quick select buttons work
- [ ] Payment modal opens correctly
- [ ] Can complete purchase
- [ ] Credits added to account
- [ ] Purchase history displays

### Integration Testing
- [ ] End-to-end purchase flow works
- [ ] Credits transfer correctly
- [ ] Balances update for both parties
- [ ] Revenue tracking accurate
- [ ] Concurrent purchases handled
- [ ] Marketplace disable prevents purchases
- [ ] Error handling works properly

---

## Rollback Plan

If issues arise, you can rollback:

### 1. Revert Frontend Routes

```typescript
// In frontend/src/App.tsx

// Restore old imports
const PartnerPlans = lazy(() => import('./pages/tenant-admin/PartnerPlans'));
const TruckOwnerPartnerPlans = lazy(() => import('./pages/truck-owner/PartnerPlans'));

// Restore old routes
<Route path="partner-plans" element={<PartnerPlans />} />
<Route path="partner-plans" element={<TruckOwnerPartnerPlans />} />
```

### 2. Remove Backend Module

```typescript
// In backend/src/app.module.ts
// Comment out or remove:
// import { CreditMarketplaceModule } from './modules/credit-marketplace/credit-marketplace.module';
// CreditMarketplaceModule, // Remove from imports array
```

### 3. Rollback Database (if needed)

```sql
-- Drop new tables
DROP TABLE IF EXISTS credit_marketplace_settings CASCADE;

-- Remove new columns from credit_accounts
ALTER TABLE credit_accounts 
DROP COLUMN IF EXISTS revenue_from_marketplace_sales,
DROP COLUMN IF EXISTS total_credits_sold_marketplace,
DROP COLUMN IF EXISTS total_marketplace_transactions;
```

---

## Data Migration (Optional)

If you want to migrate existing partner plans to marketplace settings:

```sql
-- For each tenant admin with partner plans, create marketplace settings
INSERT INTO credit_marketplace_settings (
  tenant_id,
  tenant_admin_user_id,
  min_purchase_amount,
  max_purchase_amount,
  price_per_credit,
  is_enabled
)
SELECT DISTINCT
  ts.tenant_id,
  ts.user_id,
  500, -- Default minimum
  NULL, -- No maximum
  sp.price_per_credit,
  true
FROM tenant_subscriptions ts
INNER JOIN subscription_plans sp ON ts.plan_id = sp.id
WHERE ts.user_id IS NOT NULL
  AND ts.status = 'active'
  AND EXISTS (
    SELECT 1 FROM subscription_plans child
    WHERE child.parent_subscription_id = ts.id
  )
ON CONFLICT (tenant_id) DO NOTHING;
```

---

## Post-Migration Tasks

### 1. Update Documentation
- [ ] Update user guides
- [ ] Update API documentation
- [ ] Update training materials

### 2. Notify Users
- [ ] Send email to tenant admins about new marketplace
- [ ] Send email to truck owners about new purchase flow
- [ ] Provide migration guide links

### 3. Monitor System
- [ ] Monitor error logs
- [ ] Track marketplace usage
- [ ] Collect user feedback
- [ ] Monitor performance metrics

### 4. Archive Old Code (After 30 days)
- [ ] Move old partner plan pages to `/archive` folder
- [ ] Update git history
- [ ] Document archived components

---

## Support

If you encounter issues during migration:

1. Check backend logs: `backend/logs/`
2. Check browser console for frontend errors
3. Verify database migration completed
4. Ensure all environment variables are set
5. Restart both backend and frontend servers

---

## Benefits After Migration

✅ **Simplified Management** - One configuration vs multiple plans
✅ **Increased Flexibility** - Truck owners buy any amount
✅ **Better Scalability** - No slot limitations
✅ **Improved UX** - Cleaner, more intuitive interface
✅ **Accurate Tracking** - Better revenue and sales analytics
✅ **Reduced Overhead** - Less administrative work

---

*Migration Guide Version: 1.0*
*Last Updated: April 11, 2026*
