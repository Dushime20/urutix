# Subscription Plans Table Fix

## Issue
The endpoint `GET /api/admin/subscription-plans` was returning a 500 Internal Server Error.

**Error Details:**
```
Request URL: http://localhost:3005/api/admin/subscription-plans
Status Code: 500 Internal Server Error
Response: {"statusCode":500,"message":"Internal server error"}
```

## Root Cause
The `subscription_plans` table did not exist in the database. The migration file existed (`006_subscription_credit_system_simple.sql`) but had not been executed.

## Solution

### 1. Created Migration Runner Script
Created `backend/run-subscription-migration.js` to execute the subscription system migration.

### 2. Ran Migration
Executed the migration to create the following tables:
- `subscription_plans` - Stores available subscription tiers
- `tenant_subscriptions` - Tracks tenant subscription status
- `credit_accounts` - Manages credit balances
- `credit_transactions` - Records credit usage history

### 3. Created Seed Data Script
Created `backend/seed-subscription-plans.js` to populate the database with default subscription plans.

### 4. Seeded Default Plans
Added three default subscription plans:

#### Starter Plan ($49.99/month)
- 5 trucks, 3 users, 5 drivers
- 50 loads per month
- 100 included credits
- Basic features: Insurance tracking
- Storage: 5GB
- API calls: 10/minute

#### Professional Plan ($149.99/month) ⭐ Popular
- 25 trucks, 10 users, 25 drivers
- 500 loads per month
- 500 included credits
- Advanced features: AI matching, analytics, broker management, API access
- Storage: 50GB
- API calls: 100/minute

#### Enterprise Plan ($499.99/month)
- Unlimited trucks, users, drivers, loads
- 2000 included credits
- All features: White label, custom integrations, dedicated support, multi-region
- Unlimited storage and API calls

## Database Schema

### subscription_plans Table
```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  included_credits INTEGER NOT NULL DEFAULT 0,
  features JSONB DEFAULT '{}',
  limits JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Verification

### Check Table Exists
```bash
node backend/check-subscription-plans.js
```

Expected output:
```
Table exists: true
Row count: 3
```

### Test API Endpoint
```bash
curl http://localhost:3005/api/admin/subscription-plans
```

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Starter",
      "slug": "starter",
      "price_monthly": "49.99",
      ...
    },
    ...
  ]
}
```

## Files Created
1. `backend/run-subscription-migration.js` - Migration runner
2. `backend/seed-subscription-plans.js` - Seed data script
3. `backend/check-subscription-plans.js` - Verification script
4. `docs/SUBSCRIPTION_PLANS_TABLE_FIX.md` - This documentation

## Related Files
- `backend/migrations/006_subscription_credit_system_simple.sql` - Migration file
- `backend/src/entities/subscription-plan.entity.ts` - Entity definition
- `backend/src/services/subscription.service.ts` - Service implementation
- `backend/src/modules/admin/admin.controller.ts` - Admin endpoints

## Future Maintenance

### Adding New Plans
Use the seed script as a template or create plans via the admin API:
```bash
POST /api/admin/subscription-plans
```

### Updating Plans
```bash
PATCH /api/admin/subscription-plans/:id
```

### Deactivating Plans
```bash
PATCH /api/admin/subscription-plans/:id
Body: { "is_active": false }
```

## Testing Checklist
- [x] Migration executed successfully
- [x] Table created with correct schema
- [x] Seed data inserted (3 plans)
- [x] API endpoint returns 200 OK
- [x] Plans data structure matches entity definition
- [ ] Frontend displays plans correctly
- [ ] Subscription creation works end-to-end

## Date
April 9, 2026
