# Subscription Entity Registration Fix

## Issue
Backend was throwing error:
```
EntityMetadataNotFoundError: No metadata for "TenantSubscription" was found.
```

## Root Cause
The subscription entities were created and imported in the AdminModule, but they were not registered in the main database configuration file (`database.config.ts`).

TypeORM requires entities to be registered in two places:
1. In the module's `TypeOrmModule.forFeature([...])` array (✅ Already done)
2. In the main database configuration entities array (❌ Was missing)

## Solution

### Files Modified
- `backend/src/config/database.config.ts`

### Changes Made

#### 1. Added Subscription Entity Imports
```typescript
// Subscription entities
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { TenantSubscription } from '../entities/tenant-subscription.entity';
import { SubscriptionPayment } from '../entities/subscription-payment.entity';
import { CreditAccount } from '../entities/credit-account.entity';
import { CreditTransaction } from '../entities/credit-transaction.entity';
import { CreditPackage } from '../entities/credit-package.entity';
import { FeatureCreditCost } from '../entities/feature-credit-cost.entity';
```

#### 2. Added Entities to Main Config
```typescript
export const databaseConfig: TypeOrmModuleOptions = {
  // ... other config
  entities: [
    // ... existing entities
    // Subscription entities
    SubscriptionPlan,
    TenantSubscription,
    SubscriptionPayment,
    CreditAccount,
    CreditTransaction,
    CreditPackage,
    FeatureCreditCost,
  ],
  // ... rest of config
};
```

#### 3. Added Entities to Test Config
Same entities added to `testDatabaseConfig` for consistency.

## Entities Registered (7)
1. ✅ SubscriptionPlan
2. ✅ TenantSubscription
3. ✅ SubscriptionPayment
4. ✅ CreditAccount
5. ✅ CreditTransaction
6. ✅ CreditPackage
7. ✅ FeatureCreditCost

## Verification

### Before Fix
```bash
GET /api/admin/subscriptions? 500 52 - 3.695 ms
EntityMetadataNotFoundError: No metadata for "TenantSubscription" was found.
```

### After Fix
Restart the backend and test:
```bash
# Restart backend
npm run start:dev

# Test endpoint
curl http://localhost:3002/api/subscriptions/plans
```

Expected: 200 OK with subscription plans data

## Why This Happened

When we created the subscription system, we:
1. ✅ Created entity files
2. ✅ Added entities to AdminModule's TypeOrmModule.forFeature()
3. ❌ Forgot to add entities to the main database config

TypeORM needs entities in the main config to:
- Generate metadata for repositories
- Enable query builders
- Support relations
- Enable migrations

## Prevention

When adding new entities in the future:
1. Create the entity file
2. Add to module's TypeOrmModule.forFeature([...])
3. **Add to database.config.ts entities array** ⚠️
4. Add to testDatabaseConfig entities array (if testing)

## Next Steps

1. Restart the backend server
2. Test the subscription endpoints
3. Verify admin subscription page works

## Testing

```bash
# Test subscription plans endpoint
curl http://localhost:3002/api/subscriptions/plans

# Test credit packages endpoint
curl http://localhost:3002/api/credits/packages

# Test admin subscriptions endpoint (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3002/api/admin/subscriptions
```

## Related Files
- `backend/src/config/database.config.ts` - Main database configuration
- `backend/src/modules/admin/admin.module.ts` - Admin module with entity imports
- `backend/src/entities/tenant-subscription.entity.ts` - TenantSubscription entity
- All other subscription entity files in `backend/src/entities/`

---

**Status**: ✅ Fixed

**Action Required**: Restart backend server to apply changes

```bash
cd backend
npm run start:dev
```
